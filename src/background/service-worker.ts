import { DownloadImagesMessage, XTweetMedia } from '../types/messages';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { generateFilename, generateBasePrefix, findNextIndex, applyDatePolicyToTemplate } from '../utils/filename-template';
import { getSelectedDownloadFolder, getSelectedFilenamePreset, normalizeSettings } from '../utils/settings-normalizer';

// メッセージリスナー
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_IMAGES') {
    handleDownload(message as DownloadImagesMessage)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    getSettings()
      .then((settings) => sendResponse(settings))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === 'GET_X_TWEET_MEDIA') {
    getXTweetMedia(message.postId)
      .then((media) => sendResponse({ media }))
      .catch((error) => sendResponse({ error: error.message, media: [] }));
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

async function handleDownload(message: DownloadImagesMessage): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const { images, customName, saveAs } = message;
  const settings = normalizeSettings(message.settings);
  const waitForCompletion = message.waitForCompletion !== false;
  const interDownloadDelayMs = message.interDownloadDelayMs ?? (waitForCompletion ? 500 : 0);
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  const startIndexes = new Map<string, number>();
  const attemptedCounts = new Map<string, number>();
  const activeRuleId = settings.activeRuleId || 'generic';
  const downloadFolder = getSelectedDownloadFolder(settings);

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    let basePrefix: string;
    let filename: string;

    const selectedFilenamePreset = getSelectedFilenamePreset(settings, activeRuleId);
    const template = applyDatePolicyToTemplate(
      selectedFilenamePreset.template,
      settings.includeDateInFilename !== false,
      activeRuleId
    );

    basePrefix = generateBasePrefix(template, image, customName || '');
    const nextIndex = await getNextBatchIndex(basePrefix, downloadFolder, startIndexes, attemptedCounts);
    filename = generateFilename(template, image, nextIndex, customName || '');

    attemptedCounts.set(basePrefix, (attemptedCounts.get(basePrefix) || 0) + 1);

    try {
      const downloadPath = !saveAs && downloadFolder
          ? `${downloadFolder}/${filename}`
          : filename;

      if (image.blobData) {
        const dataUrl = arrayBufferToDataUrl(image.blobData, image.blobMimeType || 'application/octet-stream');
        await downloadFile(dataUrl, downloadPath, saveAs === true, true);
      } else if (isPixivImageUrl(image.url)) {
        const dataUrl = await fetchImageAsDataUrl(image.url, image.downloadReferrer || 'https://www.pixiv.net/');
        await downloadFile(dataUrl, downloadPath, saveAs === true, true);
      } else {
        await downloadFileWithRetry(image.url, downloadPath, saveAs === true, waitForCompletion);
      }
      success++;

      // 進捗通知
      notifyProgress(i + 1, images.length);

      // レート制限対策
      if (interDownloadDelayMs > 0 && i < images.length - 1) {
        await sleep(interDownloadDelayMs);
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
  saveAs = false,
  waitForCompletion = true,
  retries = 2
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await downloadFile(url, filename, saveAs, waitForCompletion);
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

function downloadFile(url: string, filename: string, saveAs: boolean, waitForCompletion: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url,
        filename,
        conflictAction: 'uniquify',
        saveAs,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (downloadId === undefined) {
          reject(new Error('Download failed'));
        } else {
          if (!waitForCompletion) {
            resolve();
            return;
          }

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

function isPixivImageUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'i.pximg.net';
  } catch {
    return false;
  }
}

async function fetchImageAsDataUrl(url: string, referrer: string): Promise<string> {
  const response = await fetch(url, {
    credentials: 'omit',
    cache: 'no-store',
    referrer,
    referrerPolicy: 'strict-origin-when-cross-origin',
  });

  if (!response.ok) {
    throw new Error(`pixiv image fetch failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const data = await response.arrayBuffer();
  if (!isValidImageResponse(contentType, data)) {
    throw new Error(`pixiv image fetch returned non-image content: ${contentType || 'unknown'}`);
  }

  return arrayBufferToDataUrl(data, contentType || 'image/jpeg');
}

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return `data:${mimeType};base64,${btoa(binary)}`;
}

function isValidImageResponse(contentType: string, buffer: ArrayBuffer): boolean {
  if (contentType.toLowerCase().startsWith('image/')) return true;

  const bytes = new Uint8Array(buffer.slice(0, 12));
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  const isWebp =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  return isJpeg || isPng || isGif || isWebp;
}

async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('settings', (result) => {
      if (result.settings) {
        resolve(normalizeSettings(result.settings));
      } else {
        resolve(normalizeSettings(DEFAULT_SETTINGS));
      }
    });
  });
}

async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ settings: normalizeSettings(settings) }, () => {
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

interface SyndicationVariant {
  bitrate?: number;
  content_type?: string;
  type?: string;
  url?: string;
  src?: string;
}

interface SyndicationMediaDetail {
  type?: string;
  media_url_https?: string;
  original_info?: {
    width?: number;
    height?: number;
  };
  video_info?: {
    variants?: SyndicationVariant[];
  };
}

interface SyndicationTweet {
  mediaDetails?: SyndicationMediaDetail[];
  video?: {
    variants?: SyndicationVariant[];
    poster?: string;
  };
}

function generateSyndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
}

async function getXTweetMedia(postId: string): Promise<XTweetMedia[]> {
  if (!/^\d+$/.test(postId)) {
    throw new Error('Invalid tweet ID');
  }

  const token = generateSyndicationToken(postId);
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${encodeURIComponent(postId)}&lang=ja&token=${token}`;
  const response = await fetch(url, {
    credentials: 'omit',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`X media lookup failed: ${response.status}`);
  }

  const tweet = await response.json() as SyndicationTweet;
  return extractVideoMedia(tweet, postId);
}

function extractVideoMedia(tweet: SyndicationTweet, postId: string): XTweetMedia[] {
  const results: XTweetMedia[] = [];
  const seen = new Set<string>();

  for (const detail of tweet.mediaDetails || []) {
    if (detail.type !== 'video' && detail.type !== 'animated_gif') continue;

    const variant = selectBestMp4Variant(detail.video_info?.variants || []);
    if (!variant) continue;

    const mediaId = extractVideoMediaId(variant.url);
    if (seen.has(mediaId)) continue;
    seen.add(mediaId);

    results.push({
      url: variant.url,
      originalUrl: variant.url,
      width: detail.original_info?.width || extractVideoWidth(variant.url),
      height: detail.original_info?.height || extractVideoHeight(variant.url),
      mediaType: detail.type,
      originalFilename: `${postId}_${mediaId}.${getExtensionFromUrl(variant.url) || 'mp4'}`,
    });
  }

  if (results.length === 0 && tweet.video?.variants) {
    const variant = selectBestMp4Variant(tweet.video.variants);
    if (variant) {
      const mediaId = extractVideoMediaId(variant.url);
      results.push({
        url: variant.url,
        originalUrl: variant.url,
        width: extractVideoWidth(variant.url),
        height: extractVideoHeight(variant.url),
        mediaType: 'video',
        originalFilename: `${postId}_${mediaId}.${getExtensionFromUrl(variant.url) || 'mp4'}`,
      });
    }
  }

  return results;
}

function selectBestMp4Variant(variants: SyndicationVariant[]): { url: string; bitrate: number } | null {
  const mp4Variants = variants
    .map((variant) => ({
      url: variant.url || variant.src || '',
      bitrate: variant.bitrate || 0,
      contentType: variant.content_type || variant.type || '',
    }))
    .filter((variant) => variant.url && variant.contentType === 'video/mp4');

  if (mp4Variants.length === 0) return null;

  return mp4Variants.sort((a, b) => b.bitrate - a.bitrate)[0];
}

function extractVideoMediaId(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return parts.find((part) => /^\d{8,}$/.test(part)) || lastPart?.replace(/\.[^.]+$/, '') || 'video';
  } catch {
    return 'video';
  }
}

function getExtensionFromUrl(url: string): string {
  try {
    const match = new URL(url).pathname.match(/\.([^.?/]+)$/);
    return match ? match[1].toLowerCase() : '';
  } catch {
    return '';
  }
}

function extractVideoWidth(url: string): number | null {
  const match = url.match(/\/(\d+)x(\d+)\//);
  return match ? parseInt(match[1], 10) : null;
}

function extractVideoHeight(url: string): number | null {
  const match = url.match(/\/(\d+)x(\d+)\//);
  return match ? parseInt(match[2], 10) : null;
}
