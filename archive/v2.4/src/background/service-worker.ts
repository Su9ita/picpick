import { DownloadImagesMessage, FetchImageUrlsMessage } from '../types/messages';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { generateFilename, generateBasePrefix, generateCustomFilename, generateCustomBasePrefix, findNextIndex } from '../utils/filename-template';

interface NetworkCapture {
  urls: Set<string>;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface DebuggerCapture {
  urls: Set<string>;
  imageRequestInfo: Map<string, { url: string; mimeType: string }>;
  responseRequestIds: Set<string>;
  pendingBodyReads: Promise<void>[];
  attached: boolean;
}

interface CapturedImage {
  dataUrl: string;
  originalUrl: string;
  mimeType: string;
}

interface DebuggerResponseBody {
  body: string;
  base64Encoded: boolean;
}

interface RenderedImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const networkCaptures = new Map<number, NetworkCapture>();
const debuggerCaptures = new Map<number, DebuggerCapture>();
const capturedImages = new Map<string, CapturedImage>();
let capturedImageSequence = 0;
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
      startNetworkCapture(tabId)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ error: error.message }));
    }
    return true;
  }

  if (message.type === 'STOP_NETWORK_CAPTURE') {
    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      sendResponse({ urls: [] });
    } else {
      stopNetworkCapture(tabId)
        .then((urls) => sendResponse({ urls }))
        .catch((error) => sendResponse({ error: error.message, urls: [] }));
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

chrome.debugger.onEvent.addListener((source, method, params) => {
  if (source.tabId === undefined) return;

  const capture = debuggerCaptures.get(source.tabId);
  if (!capture) return;

  if (method === 'Network.responseReceived') {
    const responseParams = params as {
      requestId?: string;
      type?: string;
      response?: {
        url?: string;
        mimeType?: string;
      };
    };
    const url = responseParams.response?.url || '';
    const mimeType = responseParams.response?.mimeType || '';

    if (mimeType.startsWith('image/') || responseParams.type === 'Image') {
      if (responseParams.requestId) {
        capture.imageRequestInfo.set(responseParams.requestId, { url, mimeType });
        capture.responseRequestIds.add(responseParams.requestId);
      } else {
        addCapturedUrl(capture.urls, url);
      }
    }

    if (
      responseParams.requestId &&
      (responseParams.type === 'Fetch' ||
        responseParams.type === 'XHR' ||
        /(?:json|javascript|text|html)/i.test(mimeType))
    ) {
      capture.responseRequestIds.add(responseParams.requestId);
    }
  }

  if (method === 'Network.loadingFinished') {
    const finishedParams = params as { requestId?: string };
    if (!finishedParams.requestId || !capture.responseRequestIds.has(finishedParams.requestId)) return;

    const read = readDebuggerResponseBody(source.tabId, finishedParams.requestId)
      .then((responseBody) => {
        if (!responseBody?.body) return;

        const imageInfo = capture.imageRequestInfo.get(finishedParams.requestId!);
        if (imageInfo) {
          const cachedUrl = cacheCapturedImage(responseBody.body, imageInfo.mimeType, imageInfo.url, responseBody.base64Encoded);
          if (cachedUrl) {
            addCapturedUrl(capture.urls, cachedUrl);
            return;
          }
        }

        const text = responseBody.base64Encoded ? decodeBase64Text(responseBody.body) : responseBody.body;
        if (!text) return;

        for (const imageUrl of extractImageUrlsFromText(text, 'https://example.invalid/')) {
          addCapturedUrl(capture.urls, imageUrl);
        }
      })
      .catch(() => {});

    capture.pendingBodyReads.push(read);
  }
});

chrome.debugger.onDetach.addListener((source) => {
  if (source.tabId !== undefined) {
    debuggerCaptures.delete(source.tabId);
  }
});

async function startNetworkCapture(tabId: number): Promise<void> {
  await stopNetworkCapture(tabId);

  const timeoutId = setTimeout(() => {
    stopNetworkCapture(tabId).catch(() => {});
  }, 180000);

  networkCaptures.set(tabId, {
    urls: new Set<string>(),
    timeoutId,
  });

  await startDebuggerCapture(tabId).catch(() => {
    // Chrome can deny debugger attach on internal pages or when another debugger is attached.
    // webRequest capture remains active in those cases.
  });
}

async function stopNetworkCapture(tabId: number): Promise<string[]> {
  const capture = networkCaptures.get(tabId);
  const urls = new Set<string>();

  if (capture) {
    clearTimeout(capture.timeoutId);
    networkCaptures.delete(tabId);
    for (const url of capture.urls) addCapturedUrl(urls, url);
  }

  const debuggerUrls = await stopDebuggerCapture(tabId);
  for (const url of debuggerUrls) addCapturedUrl(urls, url);

  return Array.from(urls);
}

function looksLikeImageUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.svg')) return false;
  return IMAGE_URL_PATTERN.test(lowerUrl) || /[?&](format|type)=webp(?:&|$)/i.test(lowerUrl);
}

function addCapturedUrl(urls: Set<string>, url: string): void {
  if (!url || url.startsWith('blob:')) return;
  if (url.toLowerCase().includes('.svg')) return;
  urls.add(url);
}

function cacheCapturedImage(body: string, mimeType: string, originalUrl: string, base64Encoded: boolean): string | null {
  if (!body || !mimeType.startsWith('image/')) return null;

  const ext = extensionFromMimeType(mimeType);
  const id = `${Date.now()}-${++capturedImageSequence}`;
  const cacheUrl = `picpick-captured://image/${id}.${ext}`;
  const base64Body = base64Encoded ? body : encodeBase64Text(body);
  if (!base64Body) return null;

  capturedImages.set(cacheUrl, {
    dataUrl: `data:${mimeType};base64,${base64Body}`,
    originalUrl,
    mimeType,
  });

  return cacheUrl;
}

function extensionFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  if (normalized === 'image/jpeg') return 'jpg';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/gif') return 'gif';
  if (normalized === 'image/avif') return 'avif';
  if (normalized === 'image/bmp') return 'bmp';
  return 'jpg';
}

function decodeBase64Text(value: string): string | null {
  try {
    return atob(value);
  } catch {
    return null;
  }
}

function encodeBase64Text(value: string): string | null {
  try {
    return btoa(value);
  } catch {
    return null;
  }
}

async function startDebuggerCapture(tabId: number): Promise<void> {
  await attachDebugger(tabId);
  debuggerCaptures.set(tabId, {
    urls: new Set<string>(),
    imageRequestInfo: new Map<string, { url: string; mimeType: string }>(),
    responseRequestIds: new Set<string>(),
    pendingBodyReads: [],
    attached: true,
  });
  await sendDebuggerCommand(tabId, 'Network.enable', {
    maxTotalBufferSize: 100000000,
    maxResourceBufferSize: 10000000,
  });
  await sendDebuggerCommand(tabId, 'Page.enable').catch(() => {});
}

async function stopDebuggerCapture(tabId: number): Promise<string[]> {
  const capture = debuggerCaptures.get(tabId);
  if (!capture) return [];

  debuggerCaptures.delete(tabId);
  await Promise.allSettled(capture.pendingBodyReads);

  if (capture.attached) {
    await detachDebugger(tabId).catch(() => {});
  }

  return Array.from(capture.urls);
}

function attachDebugger(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId }, '1.3', () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
      } else {
        resolve();
      }
    });
  });
}

function detachDebugger(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.debugger.detach({ tabId }, () => {
      resolve();
    });
  });
}

function sendDebuggerCommand(
  tabId: number,
  method: string,
  commandParams?: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, method, commandParams, (result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
      } else {
        resolve(result);
      }
    });
  });
}

async function readDebuggerResponseBody(tabId: number, requestId: string): Promise<DebuggerResponseBody | null> {
  const result = await sendDebuggerCommand(tabId, 'Network.getResponseBody', { requestId }) as {
    body?: string;
    base64Encoded?: boolean;
  };

  if (!result?.body) return null;
  return {
    body: result.body,
    base64Encoded: Boolean(result.base64Encoded),
  };
}

function resolveDownloadUrl(url: string): string {
  return capturedImages.get(url)?.dataUrl || url;
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
    const tab = await createInactiveTab();
    if (tab.id === undefined) continue;

    await startNetworkCapture(tab.id);

    try {
      await updateTabUrl(tab.id, url);
      await waitForTabLoad(tab.id, 20000);
      await scrollTab(tab.id);
      await sleep(3000);

      for (const imageUrl of await captureRenderedImagesFromTab(tab.id)) {
        imageUrls.add(imageUrl);
      }

      for (const imageUrl of await stopNetworkCapture(tab.id)) {
        imageUrls.add(imageUrl);
      }

      const htmlImageUrls = await collectImageUrlsFromTab(tab.id);
      for (const imageUrl of htmlImageUrls) {
        imageUrls.add(imageUrl);
      }
    } catch {
      await stopNetworkCapture(tab.id).catch(() => {});
    } finally {
      chrome.tabs.remove(tab.id).catch(() => {});
    }
  }

  return Array.from(imageUrls);
}

function createInactiveTab(): Promise<chrome.tabs.Tab> {
  return chrome.tabs.create({ url: 'about:blank', active: false });
}

function updateTabUrl(tabId: number, url: string): Promise<chrome.tabs.Tab> {
  return chrome.tabs.update(tabId, { url });
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
      const excludedPattern = /\.svg(?:[?#]|$)|avatar|badge|button|emoji|favicon|icon|logo|placeholder|profile|sprite|thumbnail/i;

      const add = (value: string | null | undefined, trustedImage = false) => {
        if (!value || value.startsWith('data:') || value.startsWith('blob:')) return;
        try {
          const url = new URL(value, location.href).href;
          if (excludedPattern.test(url)) return;
          if (trustedImage || imagePattern.test(url)) urls.add(url);
        } catch {
          // Ignore malformed candidates.
        }
      };

      document.querySelectorAll('*').forEach((element) => {
        for (const attr of attrs) {
          if (attr === 'currentSrc' && element instanceof HTMLImageElement) {
            add(element.currentSrc, true);
          } else if (element instanceof HTMLImageElement && attr === 'src') {
            add(element.src, true);
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

async function captureRenderedImagesFromTab(tabId: number): Promise<string[]> {
  const rects = await collectRenderedImageRects(tabId);
  const urls: string[] = [];

  for (const rect of rects.slice(0, 80)) {
    try {
      const result = await sendDebuggerCommand(tabId, 'Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: true,
        clip: {
          x: Math.max(0, rect.x),
          y: Math.max(0, rect.y),
          width: Math.max(1, rect.width),
          height: Math.max(1, rect.height),
          scale: 1,
        },
      }) as { data?: string };

      if (!result.data) continue;

      const cachedUrl = cacheCapturedImage(result.data, 'image/png', `rendered:${tabId}:${urls.length + 1}`, true);
      if (cachedUrl) {
        urls.push(cachedUrl);
      }
    } catch {
      // Some pages block or detach during capture. Keep already captured pages.
    }
  }

  return urls;
}

async function collectRenderedImageRects(tabId: number): Promise<RenderedImageRect[]> {
  const results = await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: () => {
      type Candidate = {
        x: number;
        y: number;
        width: number;
        height: number;
        score: number;
      };

      const candidates: Candidate[] = [];
      const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const pageHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const selector = [
        'canvas',
        'img',
        'picture',
        '[style*="background"]',
        '[class*="page" i]',
        '[class*="image" i]',
        '[class*="manga" i]',
        '[class*="comic" i]',
        '[class*="viewer" i]',
        '[class*="reader" i]',
        '[id*="page" i]',
        '[id*="image" i]',
        '[id*="manga" i]',
        '[id*="comic" i]',
        '[id*="viewer" i]',
        '[id*="reader" i]',
      ].join(',');

      const isVisible = (style: CSSStyleDeclaration, rect: DOMRect) => {
        return style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number(style.opacity || '1') > 0.05 &&
          rect.width >= 300 &&
          rect.height >= 300;
      };

      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (element === document.body || element === document.documentElement) return;

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        if (!isVisible(style, rect)) return;

        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        if (width > viewportWidth * 1.4 || height > pageHeight * 0.9) return;

        const tag = element.tagName.toLowerCase();
        const background = style.backgroundImage && style.backgroundImage !== 'none';
        const classOrId = `${element.className || ''} ${element.id || ''}`;
        const readerish = /page|image|manga|comic|viewer|reader/i.test(classOrId);
        const directImage = tag === 'canvas' || tag === 'img' || tag === 'picture';
        const containsImage = Boolean(element.querySelector('canvas,img,picture'));

        if (!directImage && !background && !readerish && !containsImage) return;

        const aspectRatio = height / width;
        const mangaShapeBonus = aspectRatio > 1.1 ? 3000 : 0;
        const score = (width * height) + mangaShapeBonus + (directImage ? 2000 : 0) + (readerish ? 1000 : 0);

        candidates.push({
          x: Math.max(0, Math.round(rect.left + window.scrollX)),
          y: Math.max(0, Math.round(rect.top + window.scrollY)),
          width,
          height,
          score,
        });
      });

      candidates.sort((a, b) => b.score - a.score);

      const selected: Candidate[] = [];
      const overlaps = (a: Candidate, b: Candidate) => {
        const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
        const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        const intersection = x * y;
        const smaller = Math.min(a.width * a.height, b.width * b.height);
        return smaller > 0 && intersection / smaller > 0.75;
      };

      for (const candidate of candidates) {
        if (selected.some((existing) => overlaps(existing, candidate))) continue;
        selected.push(candidate);
        if (selected.length >= 80) break;
      }

      return selected
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map(({ x, y, width, height }) => ({ x, y, width, height }));
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
  const trustedImagePatterns = [
    /<img\b[^>]*\s(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["'][^>]*>/gi,
    /<source\b[^>]*\s(?:srcset|data-srcset)=["']([^"']+)["'][^>]*>/gi,
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

  for (const pattern of trustedImagePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const rawValue = (match[1] || '').replace(/\\\//g, '/');
      for (const rawUrl of rawValue.split(',')) {
        const candidate = rawUrl.trim().split(/\s+/)[0];
        if (!candidate) continue;

        try {
          const absoluteUrl = new URL(candidate, baseUrl).href;
          if (!absoluteUrl.startsWith('blob:') && !absoluteUrl.toLowerCase().includes('.svg')) {
            urls.add(absoluteUrl);
          }
        } catch {
          // Ignore malformed candidates.
        }
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

      await downloadFileWithRetry(resolveDownloadUrl(image.url), downloadPath);
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
