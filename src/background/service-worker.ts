import { DownloadImagesMessage, XTweetMedia } from '../types/messages';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { generateFilename, generateBasePrefix, findNextIndex } from '../utils/filename-template';
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

    basePrefix = generateBasePrefix(selectedFilenamePreset.template, image, customName || '');
    const nextIndex = await getNextBatchIndex(basePrefix, downloadFolder, startIndexes, attemptedCounts);
    filename = generateFilename(selectedFilenamePreset.template, image, nextIndex, customName || '');

    attemptedCounts.set(basePrefix, (attemptedCounts.get(basePrefix) || 0) + 1);

    try {
      const downloadPath = !saveAs && downloadFolder
          ? `${downloadFolder}/${filename}`
          : filename;

      await downloadFileWithRetry(image.url, downloadPath, saveAs === true);
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
  saveAs = false,
  retries = 2
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await downloadFile(url, filename, saveAs);
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

function downloadFile(url: string, filename: string, saveAs: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    let downloadIdForFilename: number | null = null;

    const filenameListener = (
      item: chrome.downloads.DownloadItem,
      suggest: (suggestion?: chrome.downloads.DownloadFilenameSuggestion) => void
    ) => {
      if (
        (downloadIdForFilename !== null && item.id !== downloadIdForFilename) ||
        !isSameDownloadUrl(item.url, url)
      ) {
        return;
      }

      suggest({
        filename,
        conflictAction: 'uniquify',
      });
    };

    chrome.downloads.onDeterminingFilename.addListener(filenameListener);

    chrome.downloads.download(
      {
        url,
        filename,
        saveAs,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          chrome.downloads.onDeterminingFilename.removeListener(filenameListener);
          reject(new Error(chrome.runtime.lastError.message));
        } else if (downloadId === undefined) {
          chrome.downloads.onDeterminingFilename.removeListener(filenameListener);
          reject(new Error('Download failed'));
        } else {
          downloadIdForFilename = downloadId;
          let settled = false;

          const cleanup = () => {
            chrome.downloads.onDeterminingFilename.removeListener(filenameListener);
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

function isSameDownloadUrl(downloadUrl: string | undefined, requestedUrl: string): boolean {
  if (!downloadUrl) return false;
  if (downloadUrl === requestedUrl) return true;

  try {
    const download = new URL(downloadUrl);
    const requested = new URL(requestedUrl);
    return download.origin === requested.origin
      && download.pathname === requested.pathname
      && download.searchParams.get('format') === requested.searchParams.get('format')
      && download.searchParams.get('name') === requested.searchParams.get('name');
  } catch {
    return false;
  }
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
