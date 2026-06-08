import { BaseExtractor } from './base-extractor';
import { ImageInfo, ImageMetadata } from '../types/image-info';

interface PixivPageResponse {
  error?: boolean;
  body?: Array<{
    urls?: {
      original?: string;
      regular?: string;
    };
    width?: number;
    height?: number;
  }>;
}

interface PixivIllustResponse {
  error?: boolean;
  body?: {
    id?: string;
    title?: string;
    userName?: string;
    createDate?: string;
    uploadDate?: string;
    urls?: {
      original?: string;
      regular?: string;
    };
    width?: number;
    height?: number;
    pageCount?: number;
  };
}

export class PixivExtractor extends BaseExtractor {
  private cachedMetadata: ImageMetadata | null = null;

  constructor() {
    super({
      urlPatterns: [/^https?:\/\/www\.pixiv\.net\/(?:en\/)?artworks\/\d+/],
      selectors: {
        images: 'img',
      },
    });
  }

  async extractImages(): Promise<ImageInfo[]> {
    const fallbackMetadata = this.extractMetadata();
    const illustId = fallbackMetadata.postId;
    const [detailMetadata, pages] = await Promise.all([
      this.fetchPixivMetadata(illustId),
      this.fetchPixivPages(illustId),
    ]);
    const metadata = detailMetadata || fallbackMetadata;
    this.cachedMetadata = metadata;

    if (pages.length > 0) {
      return pages.map((page, index) => {
        const url = page.urls?.original || page.urls?.regular || '';
        return {
          url,
          originalUrl: url,
          width: page.width || null,
          height: page.height || null,
          index: index + 1,
          downloadReferrer: 'https://www.pixiv.net/',
          metadata: {
            ...metadata,
            originalFilename: this.extractFilenameFromUrl(url),
          },
        };
      }).filter((image) => image.url.includes('i.pximg.net'));
    }

    return this.extractImagesFromPreloadData(metadata);
  }

  extractMetadata(): ImageMetadata {
    if (this.cachedMetadata) return this.cachedMetadata;

    const illustId = this.extractIllustId();
    const preloadIllust = this.getPreloadIllust(illustId);
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content || '';
    const fallbackTitle = this.parseOgTitle(ogTitle);

    const title = preloadIllust?.title || fallbackTitle.title || document.title || 'untitled';
    const creator = preloadIllust?.userName || fallbackTitle.creator || '';
    const date = preloadIllust?.createDate || preloadIllust?.uploadDate || '';

    return {
      creator: this.sanitizeTitle(creator),
      postId: illustId,
      postTitle: this.sanitizeTitle(title),
      postDate: date ? this.parseDate(date) : new Date(),
      originalFilename: '',
    };
  }

  private async fetchPixivMetadata(illustId: string): Promise<ImageMetadata | null> {
    if (!illustId || illustId === 'unknown') return null;

    try {
      const response = await fetch(`/ajax/illust/${encodeURIComponent(illustId)}?lang=ja`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) return null;

      const json = await response.json() as PixivIllustResponse;
      if (json.error || !json.body) return null;

      return this.buildMetadata(json.body, illustId);
    } catch {
      return null;
    }
  }

  private async fetchPixivPages(illustId: string): Promise<NonNullable<PixivPageResponse['body']>> {
    if (!illustId || illustId === 'unknown') return [];

    try {
      const response = await fetch(`/ajax/illust/${encodeURIComponent(illustId)}/pages?lang=ja`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) return [];

      const json = await response.json() as PixivPageResponse;
      if (json.error || !Array.isArray(json.body)) return [];
      return json.body;
    } catch {
      return [];
    }
  }

  private extractImagesFromPreloadData(metadata: ImageMetadata): ImageInfo[] {
    const illust = this.getPreloadIllust(metadata.postId);
    const original = illust?.urls?.original || illust?.urls?.regular;
    if (!original || !original.includes('i.pximg.net')) return [];

    const pageCount = Math.max(illust?.pageCount || 1, 1);
    const images: ImageInfo[] = [];

    for (let i = 0; i < pageCount; i++) {
      const url = original.replace(/_p\d+([._])/, `_p${i}$1`);
      images.push({
        url,
        originalUrl: url,
        width: illust?.width || null,
        height: illust?.height || null,
        index: i + 1,
        downloadReferrer: 'https://www.pixiv.net/',
        metadata: {
          ...metadata,
          originalFilename: this.extractFilenameFromUrl(url),
        },
      });
    }

    return images;
  }

  private getPreloadIllust(illustId: string): PixivIllustResponse['body'] | null {
    const preload = document.querySelector<HTMLMetaElement>('meta[name="preload-data"]')?.content;
    if (preload) {
      try {
        const data = JSON.parse(preload);
        const illust = data?.illust?.[illustId];
        if (illust) return illust;
      } catch {
        // Ignore malformed preload data and use other sources.
      }
    }

    const nextData = document.getElementById('__NEXT_DATA__')?.textContent;
    if (nextData) {
      try {
        return this.findIllustInObject(JSON.parse(nextData), illustId);
      } catch {
        return null;
      }
    }

    return null;
  }

  private buildMetadata(illust: PixivIllustResponse['body'], fallbackId: string): ImageMetadata {
    const date = illust?.createDate || illust?.uploadDate || '';

    return {
      creator: this.sanitizeTitle(illust?.userName || ''),
      postId: illust?.id || fallbackId,
      postTitle: this.sanitizeTitle(illust?.title || 'untitled'),
      postDate: date ? this.parseDate(date) : new Date(),
      originalFilename: '',
    };
  }

  private findIllustInObject(value: unknown, illustId: string): PixivIllustResponse['body'] | null {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;

    if ((record.id === illustId || record.illustId === illustId) && record.urls && record.title) {
      return record as PixivIllustResponse['body'];
    }

    for (const child of Object.values(record)) {
      if (!child || typeof child !== 'object') continue;
      const found = this.findIllustInObject(child, illustId);
      if (found) return found;
    }

    return null;
  }

  private extractIllustId(): string {
    const match = window.location.pathname.match(/\/artworks\/(\d+)/);
    return match?.[1] || 'unknown';
  }

  private parseOgTitle(ogTitle: string): { title: string; creator: string } {
    const titleParts = ogTitle.split(' - ');
    const title = this.stripLeadingHashtags(titleParts[0] || '');
    const creator = this.stripPixivCreatorSuffix(titleParts[1] || '');

    return { title, creator };
  }

  private stripPixivCreatorSuffix(creator: string): string {
    return creator.replace(/のイラスト$/, '').trim();
  }

  private stripLeadingHashtags(title: string): string {
    return title.replace(/^(?:#[^\s#　]+[\s　]*)+/u, '').trim();
  }

  private sanitizeTitle(title: string): string {
    return title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  }
}
