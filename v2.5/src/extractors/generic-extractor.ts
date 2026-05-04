import { BaseExtractor } from './base-extractor';
import { ImageInfo, ImageMetadata } from '../types/image-info';

/**
 * 汎用画像抽出器
 * 任意のWebサイトからimg要素とbackground-imageを抽出
 */
export class GenericExtractor extends BaseExtractor {
  constructor() {
    super({
      urlPatterns: [/.*/], // 全てのURLにマッチ（フォールバック用）
      selectors: {
        images: 'img',
      },
    });
  }

  async extractImages(): Promise<ImageInfo[]> {
    const images: ImageInfo[] = [];
    const metadata = this.extractMetadata();
    const seen = new Set<string>();

    // 1. 全てのimg要素を取得
    await this.extractFromImgElements(images, metadata, seen);

    // 2. picture要素内のsourceを取得
    await this.extractFromPictureElements(images, metadata, seen);

    // 3. background-imageを取得
    await this.extractFromBackgroundImages(images, metadata, seen);

    // 4. リンク先の画像を取得
    await this.extractFromImageLinks(images, metadata, seen);

    return images;
  }

  private async extractFromImgElements(
    images: ImageInfo[],
    metadata: ImageMetadata,
    seen: Set<string>
  ): Promise<void> {
    const imgElements = document.querySelectorAll<HTMLImageElement>('img');

    for (const img of imgElements) {
      const url = this.getBestImageUrl(img);
      if (!url || seen.has(url)) continue;
      if (this.isLikelyIcon(img)) continue;

      seen.add(url);

      let width: number | null = img.naturalWidth || null;
      let height: number | null = img.naturalHeight || null;

      // srcsetから最大幅を取得
      if (img.srcset) {
        const maxWidth = this.getMaxWidthFromSrcset(img.srcset);
        if (maxWidth) width = maxWidth;
      }

      const dimensions = await this.resolveImageDimensions(url, width, height);

      images.push({
        url,
        originalUrl: img.src,
        width: dimensions.width,
        height: dimensions.height,
        index: images.length + 1,
        metadata: {
          ...metadata,
          originalFilename: this.extractFilenameFromUrl(url),
        },
      });
    }
  }

  private async extractFromPictureElements(
    images: ImageInfo[],
    metadata: ImageMetadata,
    seen: Set<string>
  ): Promise<void> {
    const pictures = document.querySelectorAll('picture');

    for (const picture of pictures) {
      // sourceタグから最高品質の画像を取得
      const sources = picture.querySelectorAll<HTMLSourceElement>('source');
      let bestUrl: string | null = null;
      let bestWidth = 0;

      for (const source of sources) {
        if (source.srcset) {
          const urls = this.parseSrcset(source.srcset);
          for (const { url, width } of urls) {
            if (width > bestWidth) {
              bestWidth = width;
              bestUrl = url;
            }
          }
        }
      }

      // fallback img
      const img = picture.querySelector<HTMLImageElement>('img');
      if (img && !bestUrl) {
        bestUrl = this.getBestImageUrl(img);
      }

      if (!bestUrl || seen.has(bestUrl)) continue;
      seen.add(bestUrl);

      const resolvedBestUrl = this.resolveUrl(bestUrl);
      const dimensions = await this.resolveImageDimensions(resolvedBestUrl, bestWidth || null, null);

      images.push({
        url: resolvedBestUrl,
        originalUrl: bestUrl,
        width: dimensions.width,
        height: dimensions.height,
        index: images.length + 1,
        metadata: {
          ...metadata,
          originalFilename: this.extractFilenameFromUrl(bestUrl),
        },
      });
    }
  }

  private async extractFromBackgroundImages(
    images: ImageInfo[],
    metadata: ImageMetadata,
    seen: Set<string>
  ): Promise<void> {
    const allElements = document.querySelectorAll('*');

    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;

      if (bgImage && bgImage !== 'none') {
        const urls = bgImage.match(/url\(["']?([^"')]+)["']?\)/g);
        if (urls) {
          for (const urlMatch of urls) {
            const url = urlMatch.replace(/url\(["']?|["']?\)/g, '');
            if (!url || seen.has(url)) continue;
            if (this.isDataUrl(url) || this.isSvgUrl(url)) continue;

            seen.add(url);
            const resolvedUrl = this.resolveUrl(url);
            const dimensions = await this.resolveImageDimensions(resolvedUrl, null, null);

            images.push({
              url: resolvedUrl,
              originalUrl: url,
              width: dimensions.width,
              height: dimensions.height,
              index: images.length + 1,
              metadata: {
                ...metadata,
                originalFilename: this.extractFilenameFromUrl(url),
              },
            });
          }
        }
      }
    }
  }

  private async extractFromImageLinks(
    images: ImageInfo[],
    metadata: ImageMetadata,
    seen: Set<string>
  ): Promise<void> {
    // 画像拡張子を持つリンクを取得
    const imageExtensions = /\.(jpe?g|png|gif|webp|avif|bmp)(\?.*)?$/i;
    const links = document.querySelectorAll<HTMLAnchorElement>('a[href]');

    for (const link of links) {
      const url = link.href;
      if (!url || !imageExtensions.test(url)) continue;
      if (seen.has(url)) continue;

      seen.add(url);
      const dimensions = await this.resolveImageDimensions(url, null, null);

      images.push({
        url,
        originalUrl: url,
        width: dimensions.width,
        height: dimensions.height,
        index: images.length + 1,
        metadata: {
          ...metadata,
          originalFilename: this.extractFilenameFromUrl(url),
        },
      });
    }
  }

  private getBestImageUrl(img: HTMLImageElement): string | null {
    // srcsetがある場合は最大サイズを選択
    if (img.srcset) {
      const sources = this.parseSrcset(img.srcset);
      sources.sort((a, b) => b.width - a.width);
      if (sources.length > 0 && sources[0].url) {
        return this.resolveUrl(sources[0].url);
      }
    }

    // data-srcをチェック（遅延読み込み対応）
    const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    if (dataSrc && !this.isDataUrl(dataSrc)) {
      return this.resolveUrl(dataSrc);
    }

    // 通常のsrc
    if (img.src && !this.isDataUrl(img.src)) {
      return img.src;
    }

    return null;
  }

  private parseSrcset(srcset: string): Array<{ url: string; width: number }> {
    return srcset
      .split(',')
      .map((s) => {
        const parts = s.trim().split(/\s+/);
        const url = parts[0];
        let width = 0;
        if (parts[1]) {
          const match = parts[1].match(/(\d+)w/);
          if (match) width = parseInt(match[1]);
        }
        return { url, width };
      })
      .filter((s) => s.url);
  }

  private async resolveImageDimensions(
    url: string,
    width: number | null,
    height: number | null
  ): Promise<{ width: number | null; height: number | null }> {
    if (width !== null && height !== null) {
      return { width, height };
    }

    const dimensions = await this.getImageDimensions(url);
    if (!dimensions) {
      return { width, height };
    }

    return {
      width: dimensions.width || width,
      height: dimensions.height || height,
    };
  }

  private getMaxWidthFromSrcset(srcset: string): number | null {
    const widths = this.parseSrcset(srcset)
      .map((s) => s.width)
      .filter((w) => w > 0);
    return widths.length > 0 ? Math.max(...widths) : null;
  }

  private isLikelyIcon(img: HTMLImageElement): boolean {
    // 表示サイズが小さい
    const rect = img.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && rect.width < 50 && rect.height < 50) {
      return true;
    }

    // URLにアイコン系キーワード
    const url = (img.src || '').toLowerCase();
    const iconKeywords = ['icon', 'avatar', 'logo', 'favicon', 'emoji', 'badge', 'button'];
    if (iconKeywords.some((kw) => url.includes(kw))) {
      return true;
    }

    // alt属性にアイコン系キーワード
    const alt = (img.alt || '').toLowerCase();
    if (iconKeywords.some((kw) => alt.includes(kw))) {
      return true;
    }

    return false;
  }

  private isDataUrl(url: string): boolean {
    return url.startsWith('data:');
  }

  private isSvgUrl(url: string): boolean {
    return url.endsWith('.svg') || url.includes('.svg?');
  }

  private resolveUrl(url: string): string {
    try {
      return new URL(url, window.location.href).href;
    } catch {
      return url;
    }
  }

  extractMetadata(): ImageMetadata {
    // ページタイトルから取得
    const pageTitle = document.title || 'untitled';

    // og:titleやh1も試す
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content;
    const h1 = document.querySelector('h1')?.textContent?.trim();

    const postTitle = ogTitle || h1 || pageTitle;

    return {
      creator: '',
      postId: this.generatePostId(),
      postTitle: this.sanitizeTitle(postTitle),
      postDate: new Date(),
      originalFilename: '',
    };
  }

  private generatePostId(): string {
    // URLからIDを生成（パスの最後の部分）
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'page';
  }

  private sanitizeTitle(title: string): string {
    // ファイル名に使えない文字を除去
    return title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  }
}
