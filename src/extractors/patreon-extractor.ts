import { BaseExtractor } from './base-extractor';
import { ImageInfo, ImageMetadata } from '../types/image-info';

interface PatreonApiResource {
  id?: string;
  type?: string;
  attributes?: {
    name?: string;
    full_name?: string;
    vanity?: string;
    title?: string;
    published_at?: string;
  };
}

interface PatreonPostResponse {
  data?: PatreonApiResource;
  included?: PatreonApiResource[];
}

export class PatreonExtractor extends BaseExtractor {
  private cachedMetadata: ImageMetadata | null = null;

  constructor() {
    super({
      urlPatterns: [
        /^https:\/\/www\.patreon\.com\/posts\//,
        /^https:\/\/www\.patreon\.com\/[^/]+\/posts\//,
        /^https:\/\/www\.patreon\.com\/[^/]+$/,
      ],
      selectors: {
        images: 'img[src*="patreonusercontent.com"]',
        creator: '[data-tag="creator-name"]',
        postTitle: '[data-tag="post-title"], h1[data-tag="post-title"]',
        postDate: 'time[datetime], [data-tag="post-published-at"]',
      },
    });
  }

  async extractImages(): Promise<ImageInfo[]> {
    const images: ImageInfo[] = [];
    // メタデータは公式APIを最優先で取得（クリエイター名・タイトル・投稿日）。
    // 取得できなければ DOM ベースのフォールバックを使う。
    const apiMetadata = await this.fetchPostMetadata();
    const metadata = apiMetadata || this.extractMetadata();
    this.cachedMetadata = metadata;
    const seen = new Set<string>();

    const imgElements = document.querySelectorAll<HTMLImageElement>(
      this.config.selectors.images
    );

    for (const img of imgElements) {
      const url = this.getBestImageUrl(img);
      if (!url || seen.has(url)) continue;
      if (this.isLikelyIcon(img)) continue;

      seen.add(url);

      let width: number | null = img.naturalWidth || null;
      let height: number | null = img.naturalHeight || null;

      if (img.srcset) {
        const widths = img.srcset
          .split(',')
          .map((s) => {
            const parts = s.trim().split(' ');
            return parts[1] ? parseInt(parts[1].replace('w', '')) : 0;
          })
          .filter((w) => w > 0);
        if (widths.length > 0) {
          width = Math.max(...widths);
        }
      }

      images.push({
        url,
        originalUrl: img.src,
        width,
        height,
        index: images.length + 1,
        metadata: {
          ...metadata,
          originalFilename: this.extractFilenameFromUrl(url),
        },
      });
    }

    await this.extractFromLinks(images, metadata, seen);
    await this.extractFromDataAttributes(images, metadata, seen);

    return images;
  }

  private getBestImageUrl(img: HTMLImageElement): string | null {
    if (img.srcset) {
      const sources = img.srcset
        .split(',')
        .map((s) => {
          const parts = s.trim().split(' ');
          const url = parts[0];
          const width = parts[1] ? parseInt(parts[1].replace('w', '')) : 0;
          return { url, width };
        })
        .filter((s) => s.url.includes('patreonusercontent.com'));

      sources.sort((a, b) => b.width - a.width);
      if (sources.length > 0) {
        return sources[0].url;
      }
    }

    if (img.src && img.src.includes('patreonusercontent.com')) {
      return img.src;
    }

    return null;
  }

  private isLikelyIcon(img: HTMLImageElement): boolean {
    const rect = img.getBoundingClientRect();
    if (rect.width < 100 && rect.height < 100) {
      return true;
    }

    const url = img.src.toLowerCase();
    if (url.includes('avatar') || url.includes('icon')) {
      return true;
    }

    return false;
  }

  private async extractFromLinks(
    images: ImageInfo[],
    metadata: ImageMetadata,
    seen: Set<string>
  ): Promise<void> {
    const links = document.querySelectorAll<HTMLAnchorElement>(
      'a[href*="patreonusercontent.com"]'
    );

    for (const link of links) {
      const url = link.href;
      if (seen.has(url)) continue;
      seen.add(url);

      images.push({
        url,
        originalUrl: url,
        width: null,
        height: null,
        index: images.length + 1,
        metadata: {
          ...metadata,
          originalFilename: this.extractFilenameFromUrl(url),
        },
      });
    }
  }

  private async extractFromDataAttributes(
    images: ImageInfo[],
    metadata: ImageMetadata,
    seen: Set<string>
  ): Promise<void> {
    const mediaElements = document.querySelectorAll('[data-media-id]');

    for (const el of mediaElements) {
      const img = el.querySelector<HTMLImageElement>('img');
      if (!img) continue;

      const url = this.getBestImageUrl(img);
      if (!url || seen.has(url)) continue;
      seen.add(url);

      let width: number | null = img.naturalWidth || null;
      let height: number | null = img.naturalHeight || null;

      if (img.srcset) {
        const widths = img.srcset
          .split(',')
          .map((s) => {
            const parts = s.trim().split(' ');
            return parts[1] ? parseInt(parts[1].replace('w', '')) : 0;
          })
          .filter((w) => w > 0);
        if (widths.length > 0) {
          width = Math.max(...widths);
        }
      }

      images.push({
        url,
        originalUrl: img.src,
        width,
        height,
        index: images.length + 1,
        metadata: {
          ...metadata,
          originalFilename: this.extractFilenameFromUrl(url),
        },
      });
    }
  }

  /**
   * 公式 API からメタデータを取得する。
   * 投稿ページは www.patreon.com 上で動作するため、同一オリジンの
   * /api/posts/{id} を cookie 付きで呼べる（ページ自身と同じ経路）。
   * クリエイター名は campaign.name（表示名）を最優先で使う。
   */
  private async fetchPostMetadata(): Promise<ImageMetadata | null> {
    const numericId = this.extractPostNumericId();
    if (!numericId) return null;

    try {
      const url =
        `https://www.patreon.com/api/posts/${encodeURIComponent(numericId)}` +
        `?json-api-version=1.0&include=campaign,user`;
      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return null;

      const json = (await response.json()) as PatreonPostResponse;
      const data = json.data;
      if (!data) return null;

      const included = json.included || [];
      const campaign = included.find((r) => r.type === 'campaign');
      const user = included.find((r) => r.type === 'user');
      const creator =
        campaign?.attributes?.name || user?.attributes?.full_name || '';

      const title = data.attributes?.title?.trim() || 'untitled';
      const published = data.attributes?.published_at || '';

      if (!creator && title === 'untitled') return null;

      return {
        creator: this.sanitizeName(creator),
        postId: data.id || numericId,
        postTitle: title,
        postDate: published ? this.parseDate(published) : null,
        originalFilename: '',
      };
    } catch {
      return null;
    }
  }

  extractMetadata(): ImageMetadata {
    if (this.cachedMetadata) return this.cachedMetadata;

    const titleEl = document.querySelector(this.config.selectors.postTitle!);
    const postTitle = titleEl?.textContent?.trim() || 'untitled';

    const dateEl = document.querySelector<HTMLTimeElement>(
      this.config.selectors.postDate!
    );
    const postDate = dateEl?.getAttribute('datetime')
      ? this.parseDate(dateEl.getAttribute('datetime')!)
      : null;

    const postId = this.extractPostIdFromUrl();

    return {
      creator: this.sanitizeName(this.extractCreator()),
      postId,
      postTitle,
      postDate,
      originalFilename: '',
    };
  }

  /**
   * クリエイター名を複数ソースから取得する。
   * Patreon の投稿ページはクリエイターが一意に定まるため、
   * 表示中のクリエイター名要素 → ヘッダーのリンク → bootstrap JSON の順に試す。
   */
  private extractCreator(): string {
    // 1. data-tag で明示されたクリエイター名要素
    const selector = this.config.selectors.creator;
    if (selector) {
      const el = document.querySelector(selector);
      const name = el?.textContent?.trim();
      if (name) return name;
    }

    // 2. 投稿ヘッダーのクリエイターリンク（プロフィールへのリンク）
    const linkSelectors = [
      'a[data-tag="post-creator-name"]',
      'a[data-tag="creator-name"]',
      '[data-tag="post-header"] a[href*="patreon.com"]',
    ];
    for (const sel of linkSelectors) {
      const el = document.querySelector(sel);
      const name = el?.textContent?.trim();
      if (name) return name;
    }

    // 3. bootstrap JSON 内の campaign.name
    const fromBootstrap = this.extractCreatorFromBootstrap();
    if (fromBootstrap) return fromBootstrap;

    return '';
  }

  private extractCreatorFromBootstrap(): string {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const text = script.textContent;
      if (!text || !text.includes('campaign')) continue;

      // "name":"..." を campaign 文脈付近で素朴に拾う
      const match = text.match(/"campaign"\s*:\s*\{[^}]*?"name"\s*:\s*"([^"]+)"/);
      if (match?.[1]) {
        try {
          return JSON.parse(`"${match[1]}"`);
        } catch {
          return match[1];
        }
      }
    }
    return '';
  }

  private sanitizeName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  }

  private extractPostIdFromUrl(): string {
    const match = window.location.pathname.match(/\/posts\/([^/?]+)/);
    return match ? match[1] : 'unknown';
  }

  // 投稿スラッグ末尾の数値IDを取り出す（例: bun-76-104857623 → 104857623）
  private extractPostNumericId(): string {
    const slug = this.extractPostIdFromUrl();
    const match = slug.match(/(\d+)$/);
    return match ? match[1] : '';
  }
}
