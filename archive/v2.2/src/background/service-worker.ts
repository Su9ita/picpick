import { DownloadImagesMessage, FetchImageUrlsMessage } from '../types/messages';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { generateFilename, generateBasePrefix, generateCustomFilename, generateCustomBasePrefix, findNextIndex } from '../utils/filename-template';

interface NetworkCapture {
  urls: Set<string>;
  timeoutId: ReturnType<typeof setTimeout>;
}

const networkCaptures = new Map<number, NetworkCapture>();
const IMAGE_URL_PATTERN = /\.(jpe?g|png|gif|webp|avif|bmp)(?:[?#].*)?$/i;

// メッセージリスナー
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_IMAGES') {
    handleDownload(message as DownloadImagesMessage)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === 'START_NETWORK_CAPTURE') {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      sendResponse({ error: 'No active tab' });
    } else {
      startNetworkCapture(tabId);
      sendResponse({ success: true });
    }
    return true;
  }

  if (message.type === 'STOP_NETWORK_CAPTURE') {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      sendResponse({ urls: [] });
    } else {
      sendResponse({ urls: stopNetworkCapture(tabId) });
    }
    return true;
  }

  if (message.type === 'FETCH_IMAGE_URLS') {
    fetchImageUrls(message as FetchImageUrlsMessage)
      .then((urls) => sendResponse({ urls }))
      .catch((error) => sendResponse({ error: error.message, urls: [] }));
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    getSettings()
      .then((settings) => sendResponse(settings))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === 'SAVE_SETTINGS') {
    saveSettings(message.settings)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === 'RESET_SETTINGS') {
    resetSettings()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }
});

chrome.webRequest.onCompleted.addListener(
  (details) => {
    const capture = networkCaptures.get(details.tabId);
    if (!capture) return;

    if (details.type === 'image' || looksLikeImageUrl(details.url)) {
      capture.urls.add(details.url);
    }
  },
  { urls: ['<all_urls>'] }
);

function startNetworkCapture(tabId: number): void {
  stopNetworkCapture(tabId);

  const timeoutId = setTimeout(() => {
    stopNetworkCapture(tabId);
  }, 180000);

  networkCaptures.set(tabId, {
    urls: new Set<string>(),
    timeoutId,
  });
}

function stopNetworkCapture(tabId: number): string[] {
  const capture = networkCaptures.get(tabId);
  if (!capture) return [];

  clearTimeout(capture.timeoutId);
  networkCaptures.delete(tabId);
  return Array.from(capture.urls).filter(looksLikeImageUrl);
}

function looksLikeImageUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.svg')) return false;
  return IMAGE_URL_PATTERN.test(lowerUrl) || /[?&](format|type)=webp(?:&|$)/i.test(lowerUrl);
}

async function fetchImageUrls(message: FetchImageUrlsMessage): Promise<string[]> {
  const urls = new Set<string>();

  for (const request of message.ajaxRequests || []) {
    try {
      const ajaxUrl = await resolveAjaxUrl(request.url, request.body);
      if (ajaxUrl) {
        urls.add(ajaxUrl);
      }
    } catch {
      // Ignore unavailable reader servers and keep the other candidates.
    }
  }

  for (const url of message.urls || []) {
    urls.add(url);
  }

  const imageUrls = new Set<string>();

  for (const url of urls) {
    if (looksLikeImageUrl(url)) {
      imageUrls.add(url);
      continue;
    }

    try {
      const html = await fetchText(url);
      for (const imageUrl of extractImageUrlsFromText(html, url)) {
        imageUrls.add(imageUrl);
      }
    } catch {
      // Some reader links are short-lived or require interaction; skip them.
    }
  }

  if (imageUrls.size === 0 && urls.size > 0) {
    for (const imageUrl of await captureImagesFromReaderTabs(Array.from(urls))) {
      imageUrls.add(imageUrl);
    }
  }

  return Array.from(imageUrls);
}

async function captureImagesFromReaderTabs(urls: string[]): Promise<string[]> {
  const imageUrls = new Set<string>();

  for (const url of urls.slice(0, 3)) {
    const tab = await createInactiveTab(url);
    if (tab.id === undefined) continue;

    startNetworkCapture(tab.id);

    try {
      await waitForTabLoad(tab.id, 20000);
      await scrollTab(tab.id);
      await sleep(3000);

      for (const imageUrl of stopNetworkCapture(tab.id)) {
        imageUrls.add(imageUrl);
      }

      const htmlImageUrls = await collectImageUrlsFromTab(tab.id);
      for (const imageUrl of htmlImageUrls) {
        imageUrls.add(imageUrl);
      }
    } catch {
      stopNetworkCapture(tab.id);
    } finally {
      chrome.tabs.remove(tab.id).catch(() => {});
    }
  }

  return Array.from(imageUrls);
}

function createInactiveTab(url: string): Promise<chrome.tabs.Tab> {
  return chrome.tabs.create({ url, active: false });
}

function waitForTabLoad(tabId: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, timeoutMs);

    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeoutId);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function scrollTab(tabId: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: async () => {
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const maxScrolls = 80;
      const step = Math.max(window.innerHeight * 0.9, 600);
      let y = 0;

      for (let i = 0; i < maxScrolls; i++) {
        y += step;
        window.scrollTo(0, y);
        await sleep(250);

        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 20) {
          await sleep(500);
          if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 20) break;
        }
      }
    },
  });
}

async function collectImageUrlsFromTab(tabId: number): Promise<string[]> {
  const results = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: () => {
      const urls = new Set<string>();
      const attrs = ['src', 'currentSrc', 'href', 'data-src', 'data-lazy-src', 'data-original', 'data-url'];
      const imagePattern = /\.(jpe?g|png|gif|webp|avif|bmp)(?:[?#].*)?$/i;

      const add = (value: string | null | undefined) => {
        if (!value || value.startsWith('data:') || value.startsWith('blob:')) return;
        try {
          const url = new URL(value, location.href).href;
          if (imagePattern.test(url)) urls.add(url);
        } catch {
          // Ignore malformed candidates.
        }
      };

      document.querySelectorAll('*').forEach((element) => {
        for (const attr of attrs) {
          if (attr === 'currentSrc' && element instanceof HTMLImageElement) {
            add(element.currentSrc);
          } else {
            add(element.getAttribute(attr));
          }
        }
      });

      return Array.from(urls);
    },
  });

  return results.flatMap((result) => result.result || []);
}

async function resolveAjaxUrl(url: string, body: Record<string, string>): Promise<string | null> {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    form.set(key, value);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: form.toString(),
    credentials: 'include',
  });

  if (!response.ok) return null;

  const data = await response.json();
  const resolved = data?.url || data?.data?.url;
  return typeof resolved === 'string' && resolved ? resolved : null;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }

  return response.text();
}

function extractImageUrlsFromText(text: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  const patterns = [
    /https?:\\?\/\\?\/[^"'<>)\s]+?\.(?:jpe?g|png|gif|webp|avif|bmp)(?:[?#][^"'<>)\s]*)?/gi,
    /(?:src|data-src|data-lazy-src|data-original|href)=["']([^"']+\.(?:jpe?g|png|gif|webp|avif|bmp)(?:[?#][^"']*)?)["']/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const rawUrl = (match[1] || match[0]).replace(/\\\//g, '/');
      try {
        const absoluteUrl = new URL(rawUrl, baseUrl).href;
        if (looksLikeImageUrl(absoluteUrl)) {
          urls.add(absoluteUrl);
        }
      } catch {
        // Ignore malformed candidates.
      }
    }
  }

  return Array.from(urls);
}

async function handleDownload(message: DownloadImagesMessage): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const { images, settings, customName } = message;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  const startIndexes = new Map<string, number>();
  const attemptedCounts = new Map<string, number>();

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    let basePrefix: string;
    let filename: string;

    // カスタム名モードとテンプレートモードで分岐
    if (settings.namingMode === 'custom' && customName) {
      // カスタム名モード: {date}_{customName}_{index}.{ext}
      basePrefix = generateCustomBasePrefix(customName, image);
      const nextIndex = await getNextBatchIndex(basePrefix, settings.downloadFolder, startIndexes, attemptedCounts);
      filename = generateCustomFilename(customName, image, nextIndex);
    } else {
      // テンプレートモード: 従来の処理
      basePrefix = generateBasePrefix(settings.filenameTemplate, image);
      const nextIndex = await getNextBatchIndex(basePrefix, settings.downloadFolder, startIndexes, attemptedCounts);
      filename = generateFilename(settings.filenameTemplate, image, nextIndex);
    }

    attemptedCounts.set(basePrefix, (attemptedCounts.get(basePrefix) || 0) + 1);

    try {
      const downloadPath = settings.downloadFolder
        ? `${settings.downloadFolder}/${filename}`
        : filename;

      await downloadFileWithRetry(image.url, downloadPath);
      success++;

      // 進捗通知
      notifyProgress(i + 1, images.length);

      // レート制限対策
      if (i < images.length - 1) {
        await sleep(500);
      }
    } catch (error) {
      failed++;
      errors.push(`${filename}: ${(error as Error).message}`);
    }
  }

  return { success, failed, errors };
}

async function getNextBatchIndex(
  basePrefix: string,
  downloadFolder: string,
  startIndexes: Map<string, number>,
  attemptedCounts: Map<string, number>
): Promise<number> {
  if (!startIndexes.has(basePrefix)) {
    startIndexes.set(basePrefix, await findNextIndex(basePrefix, downloadFolder));
  }

  return startIndexes.get(basePrefix)! + (attemptedCounts.get(basePrefix) || 0);
}

async function downloadFileWithRetry(
  url: string,
  filename: string,
  retries = 2
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await downloadFile(url, filename);
      return;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        await sleep(1000 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Download failed');
}

function downloadFile(url: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url,
        filename,
        saveAs: false,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (downloadId === undefined) {
          reject(new Error('Download failed'));
        } else {
          let settled = false;

          const cleanup = () => {
            chrome.downloads.onChanged.removeListener(listener);
            clearTimeout(timeoutId);
          };

          const finish = (error?: Error) => {
            if (settled) return;
            settled = true;
            cleanup();
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          };

          // ダウンロード完了を待つ
          const listener = (delta: chrome.downloads.DownloadDelta) => {
            if (delta.id === downloadId && delta.state) {
              if (delta.state.current === 'complete') {
                finish();
              } else if (delta.state.current === 'interrupted') {
                finish(new Error(delta.error?.current || 'Download interrupted'));
              }
            }
          };

          const timeoutId = setTimeout(() => {
            finish(new Error('Download timed out'));
          }, 120000);

          chrome.downloads.onChanged.addListener(listener);

          chrome.downloads.search({ id: downloadId }, (items) => {
            const item = items?.[0];
            if (!item) return;

            if (item.state === 'complete') {
              finish();
            } else if (item.state === 'interrupted') {
              finish(new Error(item.error || 'Download interrupted'));
            }
          });
        }
      }
    );
  });
}

function notifyProgress(current: number, total: number): void {
  // 全てのタブに進捗を通知（Content Scriptへ）
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'DOWNLOAD_PROGRESS',
          current,
          total,
        }).catch(() => { /* リスナーがないタブは無視 */ });
      }
    }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('settings', (result) => {
      if (result.settings) {
        resolve({ ...DEFAULT_SETTINGS, ...result.settings });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  });
}

async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ settings }, () => {
      resolve();
    });
  });
}

async function resetSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.remove('settings', () => {
      resolve();
    });
  });
}
