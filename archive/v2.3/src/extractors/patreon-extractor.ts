import { BaseExtractor } from './base-extractor';
import { ImageInfo, ImageMetadata } from '../types/image-info';

export class PatreonExtractor extends BaseExtractor {
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
    const metadata = this.extractMetadata();
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

  extractMetadata(): ImageMetadata {
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
      creator: '', // クリエイター名はポップアップで選択
      postId,
      postTitle,
      postDate,
      originalFilename: '',
    };
  }

  private extractPostIdFromUrl(): string {
    const match = window.location.pathname.match(/\/posts\/([^/?]+)/);
    return match ? match[1] : 'unknown';
  }
}
