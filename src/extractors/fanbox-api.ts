import { ImageInfo, ImageMetadata } from '../types/image-info';

/**
 * FANBOX 公式 API (api.fanbox.cc) との通信・パースを担う共通モジュール。
 *
 * 単一投稿ページ用の FanboxExtractor と、クリエイター一括保存用の
 * fanbox-crawler の両方が、ここの純関数を使って同一の ImageInfo を生成する。
 * （ファイル名・重複判定キーを両経路で一致させるため、ロジックは一本化する）
 */

export const FANBOX_REFERRER = 'https://www.fanbox.cc/';

export interface FanboxImageItem {
  id?: string;
  extension?: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface FanboxPostInfoResponse {
  error?: boolean;
  body?: {
    id?: string;
    title?: string;
    creatorId?: string;
    publishedDatetime?: string;
    updatedDatetime?: string;
    user?: {
      userId?: string;
      name?: string;
    };
    body?: {
      blocks?: Array<{ type?: string; imageId?: string }>;
      imageMap?: Record<string, FanboxImageItem>;
      images?: FanboxImageItem[];
    };
  };
}

/**
 * 投稿メタデータ＋画像を API から取得する。
 * api.fanbox.cc は *.fanbox.cc オリジンからの credentialed リクエストを許可するため、
 * content script（fanbox.cc 上で動作）からは Origin が自動付与される。
 */
export async function fetchFanboxPostInfo(postId: string): Promise<FanboxPostInfoResponse | null> {
  if (!postId || postId === 'unknown') return null;

  try {
    const response = await fetch(
      `https://api.fanbox.cc/post.info?postId=${encodeURIComponent(postId)}`,
      {
        credentials: 'include',
        cache: 'no-store',
      }
    );
    if (!response.ok) return null;

    const json = (await response.json()) as FanboxPostInfoResponse;
    if (json.error || !json.body) return null;
    return json;
  } catch {
    return null;
  }
}

export function sanitizeFanboxTitle(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export function buildFanboxMetadata(data: FanboxPostInfoResponse, fallbackId: string): ImageMetadata {
  const body = data.body!;
  const dateStr = body.publishedDatetime || body.updatedDatetime || '';

  return {
    // ファイル名のクリエイターは表示名（例: 黒木雄心）。無ければ creatorId。
    creator: sanitizeFanboxTitle(body.user?.name || body.creatorId || ''),
    postId: body.id || fallbackId,
    postTitle: sanitizeFanboxTitle(body.title || 'untitled'),
    postDate: dateStr ? new Date(dateStr) : new Date(),
    originalFilename: '',
  };
}

/**
 * API レスポンスから原寸画像アイテム（URL + width/height + id）を表示順に収集する。
 * - article 形式: body.blocks の順に imageMap を解決
 * - image 形式:   body.images の配列順
 */
export function collectFanboxApiImages(data: FanboxPostInfoResponse): FanboxImageItem[] {
  const postBody = data.body?.body;
  if (!postBody) return [];

  const items: FanboxImageItem[] = [];
  const seen = new Set<string>();

  const pushItem = (item?: FanboxImageItem) => {
    const url = item?.originalUrl || item?.thumbnailUrl;
    if (item && url && !seen.has(url)) {
      seen.add(url);
      items.push(item);
    }
  };

  // article 形式: blocks の順序を尊重
  if (Array.isArray(postBody.blocks) && postBody.imageMap) {
    for (const block of postBody.blocks) {
      if (block.type === 'image' && block.imageId) {
        pushItem(postBody.imageMap[block.imageId]);
      }
    }
  }

  // image 形式
  if (items.length === 0 && Array.isArray(postBody.images)) {
    for (const img of postBody.images) {
      pushItem(img);
    }
  }

  // 取りこぼし対策: imageMap 全件
  if (items.length === 0 && postBody.imageMap) {
    for (const img of Object.values(postBody.imageMap)) {
      pushItem(img);
    }
  }

  return items;
}

export function fanboxFilenameFromUrl(url: string): string {
  try {
    return new URL(url).pathname.split('/').pop() || 'image';
  } catch {
    return 'image';
  }
}

/**
 * 重複判定に使う安定キー。FANBOX は画像ごとに id を持つのでそれを優先し、
 * 無ければ URL のファイル名（拡張子除く）にフォールバックする。
 */
export function fanboxImageId(item: FanboxImageItem, url: string): string {
  if (item.id) return item.id;
  const name = fanboxFilenameFromUrl(url);
  return name.replace(/\.[^.]+$/, '') || url;
}

export function fanboxItemUrl(item: FanboxImageItem): string {
  return item.originalUrl || item.thumbnailUrl || '';
}

/** FanboxImageItem 配列を、保存パイプラインが扱う ImageInfo 配列へ変換する。 */
export function fanboxItemsToImageInfo(items: FanboxImageItem[], metadata: ImageMetadata): ImageInfo[] {
  return items.map((item, index) => {
    const url = fanboxItemUrl(item);
    return {
      url,
      originalUrl: url,
      width: item.width ?? null,
      height: item.height ?? null,
      index: index + 1,
      downloadReferrer: FANBOX_REFERRER,
      metadata: {
        ...metadata,
        originalFilename: fanboxFilenameFromUrl(url),
      },
    };
  });
}
