import { BaseExtractor } from './base-extractor';
import { ImageInfo, ImageMetadata } from '../types/image-info';

/**
 * Pixiv FANBOX 専用 extractor
 *
 * FANBOX は SPA のため、記事間をクリック移動しても og:title や
 * meta タグが古い別記事のまま残り、汎用 extractor では誤ったタイトルを
 * 拾ってしまう。そのため必ず公式 API
 *   https://api.fanbox.cc/post.info?postId={id}
 * からメタデータ（タイトル・クリエイター名・投稿日）を取得する。
 *
 * 画像も API の imageMap / images から originalUrl（原寸）を取得する。
 * API が画像を返さない場合のみ DOM 抽出にフォールバックする。
 */

const FANBOX_REFERRER = 'https://www.fanbox.cc/';

interface FanboxImageItem {
  id?: string;
  extension?: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

interface FanboxPostInfoResponse {
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

export class FanboxExtractor extends BaseExtractor {
  private cachedMetadata: ImageMetadata | null = null;

  constructor() {
    super({
      urlPatterns: [
        // creator.fanbox.cc/posts/123
        /^https:\/\/[\w-]+\.fanbox\.cc\/posts\/\d+/,
        // www.fanbox.cc/@creator/posts/123
        /^https:\/\/www\.fanbox\.cc\/@[\w-]+\/posts\/\d+/,
      ],
      selectors: {
        images: 'img',
      },
    });
  }

  async extractImages(): Promise<ImageInfo[]> {
    const postId = this.extractPostId();
    const data = await this.fetchPostInfo(postId);

    const metadata = data ? this.buildMetadata(data, postId) : this.extractMetadata();
    this.cachedMetadata = metadata;

    // API から画像を取得（原寸）。
    // width/height も API 値を引き継ぐ（サイズフィルターで弾かれないように）。
    const apiImages = data ? this.collectApiImages(data) : [];
    if (apiImages.length > 0) {
      return apiImages.map((item, index) => {
        const url = item.originalUrl || item.thumbnailUrl || '';
        return {
          url,
          originalUrl: url,
          width: item.width ?? null,
          height: item.height ?? null,
          index: index + 1,
          downloadReferrer: FANBOX_REFERRER,
          metadata: {
            ...metadata,
            originalFilename: this.extractFilenameFromUrl(url),
          },
        };
      });
    }

    // フォールバック: DOM から FANBOX 画像を抽出（メタデータは API のものを使用）
    return this.extractImagesFromDom(metadata);
  }

  extractMetadata(): ImageMetadata {
    if (this.cachedMetadata) return this.cachedMetadata;

    // API 取得前の同期フォールバック。
    // og:title は SPA で古くなるため使わず、DOM の h1 / 投稿日要素から取得する。
    const postId = this.extractPostId();
    const h1 = document.querySelector('h1')?.textContent?.trim();
    const title = h1 || document.title || 'untitled';
    const creator = this.extractCreatorIdFromUrl();
    const timeEl = document.querySelector<HTMLTimeElement>('time[datetime]');
    const dateStr = timeEl?.getAttribute('datetime') || '';

    return {
      creator: this.sanitizeTitle(creator),
      postId,
      postTitle: this.sanitizeTitle(title),
      postDate: dateStr ? this.parseDate(dateStr) : new Date(),
      originalFilename: '',
    };
  }

  private async fetchPostInfo(postId: string): Promise<FanboxPostInfoResponse | null> {
    if (!postId || postId === 'unknown') return null;

    try {
      // api.fanbox.cc は *.fanbox.cc オリジンからの credentialed リクエストを許可。
      // content script は fanbox.cc 上で動作するため Origin が自動付与される。
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

  private buildMetadata(data: FanboxPostInfoResponse, fallbackId: string): ImageMetadata {
    const body = data.body!;
    const dateStr = body.publishedDatetime || body.updatedDatetime || '';

    return {
      // ファイル名のクリエイターは表示名（例: 黒木雄心）。無ければ creatorId。
      creator: this.sanitizeTitle(body.user?.name || body.creatorId || ''),
      postId: body.id || fallbackId,
      postTitle: this.sanitizeTitle(body.title || 'untitled'),
      postDate: dateStr ? this.parseDate(dateStr) : new Date(),
      originalFilename: '',
    };
  }

  /**
   * API レスポンスから原寸画像アイテム（URL + width/height）を表示順に収集する。
   * - article 形式: body.blocks の順に imageMap を解決
   * - image 形式:   body.images の配列順
   */
  private collectApiImages(data: FanboxPostInfoResponse): FanboxImageItem[] {
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

  /**
   * フォールバック: DOM 上の FANBOX 画像（downloads.fanbox.cc / pximg）を抽出。
   * API が使えない場合でも従来どおり保存できるようにする。
   */
  private extractImagesFromDom(metadata: ImageMetadata): ImageInfo[] {
    const images: ImageInfo[] = [];
    const seen = new Set<string>();
    const imgs = document.querySelectorAll<HTMLImageElement>('img');

    for (const img of imgs) {
      const url = img.currentSrc || img.src;
      if (!url || seen.has(url)) continue;
      if (!this.isFanboxContentImage(url)) continue;

      seen.add(url);
      images.push({
        url,
        originalUrl: url,
        width: img.naturalWidth || null,
        height: img.naturalHeight || null,
        index: images.length + 1,
        downloadReferrer: FANBOX_REFERRER,
        metadata: {
          ...metadata,
          originalFilename: this.extractFilenameFromUrl(url),
        },
      });
    }

    return images;
  }

  private isFanboxContentImage(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      // 投稿本文画像のCDN。アイコン等の小さい画像は除外しきれないが
      // フォールバック用途なので許容する。
      return (
        host === 'downloads.fanbox.cc' ||
        host.endsWith('.pximg.net') ||
        host.endsWith('.fanbox.cc')
      );
    } catch {
      return false;
    }
  }

  private extractPostId(): string {
    const match = window.location.pathname.match(/\/posts\/(\d+)/);
    return match?.[1] || 'unknown';
  }

  private extractCreatorIdFromUrl(): string {
    // www.fanbox.cc/@creator/posts/...
    const atMatch = window.location.pathname.match(/\/@([\w-]+)/);
    if (atMatch) return atMatch[1];

    // creator.fanbox.cc
    const host = window.location.hostname;
    const sub = host.replace(/\.fanbox\.cc$/, '');
    return sub && sub !== 'www' ? sub : '';
  }

  private sanitizeTitle(title: string): string {
    return title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  }
}
