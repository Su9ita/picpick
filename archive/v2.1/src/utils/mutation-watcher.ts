/**
 * 動的に追加される画像を監視
 */
export class MutationWatcher {
  private observer: MutationObserver | null = null;
  private callback: (addedImages: HTMLImageElement[]) => void;
  private debug = true;

  constructor(callback: (addedImages: HTMLImageElement[]) => void) {
    this.callback = callback;
  }

  start(): void {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      const addedImages: HTMLImageElement[] = [];

      for (const mutation of mutations) {
        // 追加されたノードをチェック
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLImageElement) {
            addedImages.push(node);
          } else if (node instanceof Element) {
            // 子孫のimg要素も収集
            const imgs = node.querySelectorAll<HTMLImageElement>('img');
            addedImages.push(...imgs);
          }
        }

        // 属性変更（src, data-src等）をチェック
        if (
          mutation.type === 'attributes' &&
          mutation.target instanceof HTMLImageElement
        ) {
          const attr = mutation.attributeName;
          if (attr === 'src' || attr?.startsWith('data-')) {
            addedImages.push(mutation.target);
          }
        }
      }

      if (addedImages.length > 0) {
        this.log(`新規画像検出: ${addedImages.length}件`);
        this.callback(addedImages);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'data-src', 'data-lazy-src', 'data-original'],
    });

    this.log('MutationObserver開始');
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.log('MutationObserver停止');
    }
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`[PicPick] ${message}`);
    }
  }
}
