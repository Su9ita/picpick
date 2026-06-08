import { BaseExtractor } from './base-extractor';
import { ImageInfo, ImageMetadata } from '../types/image-info';

export class XExtractor extends BaseExtractor {
  constructor() {
    super({
      urlPatterns: [
        /^https:\/\/x\.com\/[^/]+\/status\/\d+/,
        /^https:\/\/twitter\.com\/[^/]+\/status\/\d+/,
      ],
      selectors: {
        images: 'img[src*="pbs.twimg.com/media"]',
        postDate: 'article time[datetime]',
      },
    });
  }

  async extractImages(): Promise<ImageInfo[]> {
    const images: ImageInfo[] = [];
    const metadata = this.extractMetadata();
    const seen = new Set<string>();

    // メインツイートのarticle要素を取得（最初のarticleがメインツイート）
    const articles = document.querySelectorAll('article');
    const mainArticle = articles[0];

    if (!mainArticle) {
      return images;
    }

    // メインツイート内の画像のみを取得
    const imgElements = mainArticle.querySelectorAll<HTMLImageElement>(
      this.config.selectors.images
    );

    for (const img of imgElements) {
      const originalUrl = img.src;
      if (!originalUrl || seen.has(originalUrl)) continue;

      // アイコンやプロフィール画像を除外
      if (this.isLikelyIcon(img)) continue;

      const url = this.getBestImageUrl(originalUrl);
      if (seen.has(url)) continue;

      seen.add(url);
      seen.add(originalUrl);

      images.push({
        url,
        originalUrl,
        width: img.naturalWidth || null,
        height: img.naturalHeight || null,
        index: images.length + 1,
        metadata: {
          ...metadata,
          originalFilename: this.extractFilenameFromUrl(url),
        },
      });
    }

    return images;
  }

  private getBestImageUrl(url: string): string {
    // X/Twitterの画像URLのnameパラメータをorigに変更してオリジナルサイズを取得
    // 例: ?format=jpg&name=small → ?format=jpg&name=orig
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'pbs.twimg.com') {
        urlObj.searchParams.set('name', 'orig');
        return urlObj.toString();
      }
    } catch {
      // URLパースに失敗した場合は元のURLを返す
    }
    return url;
  }

  private isLikelyIcon(img: HTMLImageElement): boolean {
    const rect = img.getBoundingClientRect();
    // 小さい画像はアイコンの可能性が高い
    if (rect.width < 100 && rect.height < 100) {
      return true;
    }

    // プロフィール画像のURLパターンを除外
    const url = img.src.toLowerCase();
    if (
      url.includes('profile_images') ||
      url.includes('default_profile') ||
      url.includes('avatar')
    ) {
      return true;
    }

    return false;
  }

  extractMetadata(): ImageMetadata {
    const postDate = this.extractDateFromPage();

    return {
      creator: this.extractUsernameFromUrl(),
      postId: this.extractTweetIdFromUrl(),
      postTitle: '', // Xにはポストタイトルがない
      postDate,
      originalFilename: '',
    };
  }

  private extractUsernameFromUrl(): string {
    // URLから@なしのユーザー名を抽出
    // 例: https://x.com/username/status/123 → username
    const match = window.location.pathname.match(/^\/([^/]+)\/status\//);
    return match ? match[1] : 'unknown';
  }

  private extractTweetIdFromUrl(): string {
    // URLからツイートIDを抽出
    // 例: https://x.com/username/status/123456789 → 123456789
    const match = window.location.pathname.match(/\/status\/(\d+)/);
    return match ? match[1] : 'unknown';
  }

  private extractDateFromPage(): Date | null {
    // メインツイートのarticle内のtime要素から日時を取得
    const articles = document.querySelectorAll('article');
    const mainArticle = articles[0];

    if (mainArticle) {
      const timeEl = mainArticle.querySelector<HTMLTimeElement>(
        this.config.selectors.postDate!
      );
      if (timeEl) {
        const datetime = timeEl.getAttribute('datetime');
        if (datetime) {
          return this.parseDate(datetime);
        }
      }
    }

    return null;
  }
}
