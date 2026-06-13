import { BaseExtractor } from './base-extractor';
import { ImageInfo, ImageMetadata } from '../types/image-info';
import {
  FANBOX_REFERRER,
  FanboxPostInfoResponse,
  buildFanboxMetadata,
  collectFanboxApiImages,
  fanboxItemsToImageInfo,
  fetchFanboxPostInfo,
  sanitizeFanboxTitle,
} from './fanbox-api';

/**
 * Pixiv FANBOX 専用 extractor（単一投稿ページ用）
 *
 * FANBOX は SPA のため、記事間をクリック移動しても og:title や
 * meta タグが古い別記事のまま残り、汎用 extractor では誤ったタイトルを
 * 拾ってしまう。そのため必ず公式 API（api.fanbox.cc/post.info）から
 * メタデータと原寸画像を取得する。API/パースの実体は fanbox-api に集約し、
 * クリエイター一括保存（fanbox-crawler）と共有する。
 */

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
    const data = await fetchFanboxPostInfo(postId);

    const metadata = data ? buildFanboxMetadata(data, postId) : this.extractMetadata();
    this.cachedMetadata = metadata;

    // API から画像を取得（原寸）。
    const apiImages = data ? collectFanboxApiImages(data) : [];
    if (apiImages.length > 0) {
      return fanboxItemsToImageInfo(apiImages, metadata);
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
      creator: sanitizeFanboxTitle(creator),
      postId,
      postTitle: sanitizeFanboxTitle(title),
      postDate: dateStr ? this.parseDate(dateStr) : new Date(),
      originalFilename: '',
    };
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
}

// 型の再エクスポート（既存 import 互換のため）
export type { FanboxPostInfoResponse };
