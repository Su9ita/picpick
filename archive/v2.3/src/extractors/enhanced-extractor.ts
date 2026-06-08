import { ImageInfo, ImageMetadata } from '../types/image-info';

// Lazy Load で使われるdata属性の候補
const LAZY_LOAD_ATTRS = [
  'data-src',
  'data-lazy-src',
  'data-original',
  'data-echo',
  'data-lazyload',
  'data-srcset',
  'data-lazy',
  'data-url',
  'data-image',
  'data-bg',
  'data-background',
  'data-hi-res-src',
];

// 除外キーワード（アイコン・ロゴ等）
const EXCLUDE_KEYWORDS = [
  'icon',
  'logo',
  'avatar',
  'favicon',
  'emoji',
  'badge',
  'button',
  'sprite',
  'loading',
  'placeholder',
  'thumbnail',
  'ad',
  'banner',
  'promo',
];

export interface ImageCandidate {
  url: string;
  source:
    | 'img-src'
    | 'img-currentsrc'
    | 'img-srcset'
    | 'data-attr'
    | 'picture'
    | 'background'
    | 'canvas'
    | 'shadow-dom'
    | 'link';
  element: Element | null;
  width: number | null;
  height: number | null;
  score: number;
  rect: DOMRect | null;
}

export class EnhancedExtractor {
  private seen = new Set<string>();
  private candidates: ImageCandidate[] = [];
  private debug = true;

  async extractAll(): Promise<ImageCandidate[]> {
    this.seen.clear();
    this.candidates = [];

    this.log('=== 画像抽出開始 ===');

    // Phase 1-3: img要素
    await this.extractFromAllImgElements(document);

    // Phase 4: picture要素
    await this.extractFromPictureElements(document);

    // Phase 5: background-image
    await this.extractFromBackgroundImages(document);

    // Phase 6: canvas
    await this.extractFromCanvasElements(document);

    // Phase 7: Shadow DOM
    await this.extractFromShadowRoots(document.body);

    // Phase 8: リンク先画像
    await this.extractFromImageLinks(document);

    this.log(`=== 抽出完了: ${this.candidates.length}件 ===`);

    // スコアリング & ソート
    this.scoreAndSort();

    return this.candidates;
  }

  private async extractFromAllImgElements(
    root: Document | ShadowRoot | Element
  ): Promise<void> {
    const imgs = root.querySelectorAll<HTMLImageElement>('img');
    this.log(`img要素: ${imgs.length}件`);

    for (const img of imgs) {
      // currentSrc（実際に表示中のURL）を優先
      if (img.currentSrc && !this.isExcluded(img.currentSrc)) {
        this.addCandidate(img.currentSrc, 'img-currentsrc', img);
      }

      // srcset から最大解像度を取得
      if (img.srcset) {
        const bestUrl = this.getBestFromSrcset(img.srcset);
        if (bestUrl) {
          this.addCandidate(bestUrl, 'img-srcset', img);
        }
      }

      // 通常の src
      if (img.src && !this.isDataUrl(img.src) && !this.isExcluded(img.src)) {
        this.addCandidate(img.src, 'img-src', img);
      }

      // Lazy Load 用 data-* 属性
      for (const attr of LAZY_LOAD_ATTRS) {
        const value = img.getAttribute(attr);
        if (value && this.looksLikeUrl(value) && !this.isExcluded(value)) {
          this.addCandidate(this.resolveUrl(value), 'data-attr', img);
        }
      }
    }
  }

  private async extractFromPictureElements(
    root: Document | ShadowRoot | Element
  ): Promise<void> {
    const pictures = root.querySelectorAll('picture');
    this.log(`picture要素: ${pictures.length}件`);

    for (const picture of pictures) {
      const sources = picture.querySelectorAll<HTMLSourceElement>('source');
      let bestUrl: string | null = null;
      let bestWidth = 0;

      for (const source of sources) {
        if (source.srcset) {
          const parsed = this.parseSrcset(source.srcset);
          for (const { url, width } of parsed) {
            if (width > bestWidth) {
              bestWidth = width;
              bestUrl = url;
            }
          }
        }
      }

      if (bestUrl) {
        this.addCandidate(this.resolveUrl(bestUrl), 'picture', picture);
      }
    }
  }

  private async extractFromBackgroundImages(
    root: Document | ShadowRoot | Element
  ): Promise<void> {
    const elements = root.querySelectorAll('*');
    let count = 0;

    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;

      if (bgImage && bgImage !== 'none') {
        const urls = this.extractUrlsFromCss(bgImage);
        for (const url of urls) {
          if (!this.isExcluded(url) && !this.isTinyImage(url)) {
            this.addCandidate(this.resolveUrl(url), 'background', el);
            count++;
          }
        }
      }
    }

    this.log(`background-image: ${count}件`);
  }

  private async extractFromCanvasElements(
    root: Document | ShadowRoot | Element
  ): Promise<void> {
    const canvases = root.querySelectorAll<HTMLCanvasElement>('canvas');
    this.log(`canvas要素: ${canvases.length}件`);

    for (const canvas of canvases) {
      // 小さすぎるcanvasは除外
      if (canvas.width < 100 || canvas.height < 100) continue;

      try {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png');
        });

        if (blob && blob.size > 1000) {
          // 1KB以上
          const blobUrl = URL.createObjectURL(blob);
          this.addCandidate(blobUrl, 'canvas', canvas, canvas.width, canvas.height);
        }
      } catch (e) {
        // tainted canvas は toBlob できない
        this.log(`canvas toBlob失敗: ${e}`);
      }
    }
  }

  private async extractFromShadowRoots(root: Element): Promise<void> {
    // 自分のshadowRootを探索
    if (root.shadowRoot) {
      this.log('Shadow DOM検出');
      await this.extractFromAllImgElements(root.shadowRoot);
      await this.extractFromPictureElements(root.shadowRoot);
      await this.extractFromBackgroundImages(root.shadowRoot);
      await this.extractFromCanvasElements(root.shadowRoot);

      // 子要素も再帰探索
      const children = root.shadowRoot.querySelectorAll('*');
      for (const child of children) {
        await this.extractFromShadowRoots(child);
      }
    }

    // 通常の子要素も探索
    for (const child of root.children) {
      await this.extractFromShadowRoots(child);
    }
  }

  private async extractFromImageLinks(
    root: Document | ShadowRoot | Element
  ): Promise<void> {
    const imageExtensions = /\.(jpe?g|png|gif|webp|avif|bmp)(\?.*)?$/i;
    const links = root.querySelectorAll<HTMLAnchorElement>('a[href]');
    let count = 0;

    for (const link of links) {
      const url = link.href;
      if (url && imageExtensions.test(url) && !this.isExcluded(url)) {
        this.addCandidate(url, 'link', link);
        count++;
      }
    }

    this.log(`画像リンク: ${count}件`);
  }

  private addCandidate(
    url: string,
    source: ImageCandidate['source'],
    element: Element | null,
    width: number | null = null,
    height: number | null = null
  ): void {
    if (this.seen.has(url)) return;
    this.seen.add(url);

    let rect: DOMRect | null = null;
    if (element) {
      rect = element.getBoundingClientRect();
      if (!width && element instanceof HTMLImageElement) {
        width = element.naturalWidth || null;
        height = element.naturalHeight || null;
      }
    }

    this.candidates.push({
      url,
      source,
      element,
      width,
      height,
      score: 0, // 後でスコアリング
      rect,
    });
  }

  private scoreAndSort(): void {
    const viewportWidth = window.innerWidth;

    for (const candidate of this.candidates) {
      let score = 0;

      // サイズスコア（大きいほど高得点）
      if (candidate.width && candidate.height) {
        const area = candidate.width * candidate.height;
        score += Math.min(area / 10000, 100); // 最大100点

        // 縦長画像（漫画ページらしい）にボーナス
        const aspectRatio = candidate.height / candidate.width;
        if (aspectRatio > 1.2 && aspectRatio < 2.5) {
          score += 30;
        }

        // ビューポート幅に近い画像にボーナス
        if (candidate.width > viewportWidth * 0.5) {
          score += 20;
        }
      }

      // 表示位置スコア
      if (candidate.rect) {
        // 画面中央付近にある画像にボーナス
        const centerX = candidate.rect.left + candidate.rect.width / 2;
        const distanceFromCenter = Math.abs(centerX - viewportWidth / 2);
        if (distanceFromCenter < viewportWidth * 0.3) {
          score += 15;
        }
      }

      // ソースタイプによるスコア調整
      switch (candidate.source) {
        case 'canvas':
          score += 25; // 漫画ビューアでよく使われる
          break;
        case 'img-currentsrc':
        case 'img-srcset':
          score += 10;
          break;
        case 'background':
          score -= 10; // 背景画像は通常コンテンツではない
          break;
      }

      candidate.score = score;
    }

    // スコア降順でソート
    this.candidates.sort((a, b) => b.score - a.score);
  }

  // ヘルパーメソッド
  private getBestFromSrcset(srcset: string): string | null {
    const parsed = this.parseSrcset(srcset);
    if (parsed.length === 0) return null;
    parsed.sort((a, b) => b.width - a.width);
    return this.resolveUrl(parsed[0].url);
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

  private extractUrlsFromCss(cssValue: string): string[] {
    const urls: string[] = [];
    const regex = /url\(["']?([^"')]+)["']?\)/g;
    let match;
    while ((match = regex.exec(cssValue)) !== null) {
      const url = match[1];
      if (!this.isDataUrl(url) && !this.isSvgUrl(url)) {
        urls.push(url);
      }
    }
    return urls;
  }

  private resolveUrl(url: string): string {
    try {
      return new URL(url, window.location.href).href;
    } catch {
      return url;
    }
  }

  private isDataUrl(url: string): boolean {
    return url.startsWith('data:');
  }

  private isSvgUrl(url: string): boolean {
    return url.endsWith('.svg') || url.includes('.svg?');
  }

  private isTinyImage(url: string): boolean {
    // 1x1 ピクセル画像（トラッキングピクセル）を除外
    return /[?&](w|width|h|height)=1(&|$)/i.test(url);
  }

  private isExcluded(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return EXCLUDE_KEYWORDS.some((kw) => lowerUrl.includes(kw));
  }

  private looksLikeUrl(value: string): boolean {
    return (
      value.startsWith('http') ||
      value.startsWith('//') ||
      value.startsWith('/') ||
      /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(value)
    );
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`[PicPick] ${message}`);
    }
  }

  // ImageInfo形式に変換
  toImageInfoArray(metadata?: Partial<ImageMetadata>): ImageInfo[] {
    return this.candidates.map((c, i) => ({
      url: c.url,
      originalUrl: c.url,
      width: c.width,
      height: c.height,
      index: i + 1,
      metadata: {
        creator: metadata?.creator || '',
        postId: metadata?.postId || this.generatePostId(),
        postTitle: metadata?.postTitle || this.extractPostTitle(),
        postDate: metadata?.postDate || new Date(),
        originalFilename: this.extractFilenameFromUrl(c.url),
      },
    }));
  }

  private generatePostId(): string {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'page';
  }

  private extractPostTitle(): string {
    const ogTitle = document.querySelector<HTMLMetaElement>(
      'meta[property="og:title"]'
    )?.content;
    const h1 = document.querySelector('h1')?.textContent?.trim();
    const pageTitle = document.title;

    const title = ogTitle || h1 || pageTitle || 'untitled';
    return title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  }

  private extractFilenameFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop() || 'image';
    } catch {
      return 'image';
    }
  }
}
