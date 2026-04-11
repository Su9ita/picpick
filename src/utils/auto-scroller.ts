/**
 * 自動スクロールでLazy Loadを発火させる
 */
export async function autoScrollToLoadAll(
  options: {
    scrollDelay?: number;
    scrollStep?: number;
    maxScrolls?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<void> {
  const {
    scrollDelay = 300,
    scrollStep = window.innerHeight * 0.8,
    maxScrolls = 100,
    onProgress,
  } = options;

  const originalPosition = window.scrollY;
  const documentHeight = document.documentElement.scrollHeight;
  let currentScroll = 0;
  let scrollCount = 0;
  let lastHeight = documentHeight;

  console.log('[PicPick] 自動スクロール開始');

  while (scrollCount < maxScrolls) {
    // 下にスクロール
    currentScroll += scrollStep;
    window.scrollTo({ top: currentScroll, behavior: 'smooth' });

    await sleep(scrollDelay);

    // 新しい要素が追加されてページ高さが変わったかチェック
    const newHeight = document.documentElement.scrollHeight;

    // 進捗通知
    if (onProgress) {
      const progress = Math.min(currentScroll / newHeight, 1);
      onProgress(Math.round(progress * 100), 100);
    }

    // ページ末尾に到達したかチェック
    if (currentScroll >= newHeight - window.innerHeight) {
      // ページ高さが増えなくなったら終了
      if (newHeight === lastHeight) {
        console.log('[PicPick] ページ末尾到達');
        break;
      }
      lastHeight = newHeight;
    }

    scrollCount++;
  }

  // 元の位置に戻る
  window.scrollTo({ top: originalPosition, behavior: 'smooth' });
  console.log('[PicPick] 自動スクロール完了');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
