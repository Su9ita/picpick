import { ImageInfo, ImageMetadata } from '../types/image-info';

export interface ExtractorConfig {
  urlPatterns: RegExp[];
  selectors: {
    images: string;
    lightbox?: string;
    creator?: string;
    postTitle?: string;
    postDate?: string;
  };
}

export abstract class BaseExtractor {
  protected config: ExtractorConfig;

  constructor(config: ExtractorConfig) {
    this.config = config;
  }

  canHandle(url: string): boolean {
    return this.config.urlPatterns.some((pattern) => pattern.test(url));
  }

  abstract extractImages(): Promise<ImageInfo[]>;
  abstract extractMetadata(): ImageMetadata;

  protected async getImageDimensions(
    url: string,
    timeoutMs = 3000
  ): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const cleanup = () => {
        clearTimeout(timeoutId);
        img.onload = null;
        img.onerror = null;
      };
      const timeoutId = window.setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeoutMs);

      img.onload = () => {
        cleanup();
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        cleanup();
        resolve(null);
      };
      img.src = url;
    });
  }

  protected parseDate(dateStr: string): Date | null {
    try {
      return new Date(dateStr);
    } catch {
      return null;
    }
  }

  protected extractFilenameFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop() || 'image';
    } catch {
      return 'image';
    }
  }
}
