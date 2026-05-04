import { DownloadImagesMessage } from '../types/messages';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { generateFilename, generateBasePrefix, findNextIndex } from '../utils/filename-template';
import { getSelectedFilenamePreset, normalizeSettings } from '../utils/settings-normalizer';

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
  const { images, customName } = message;
  const settings = normalizeSettings(message.settings);
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  const startIndexes = new Map<string, number>();
  const attemptedCounts = new Map<string, number>();

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    let basePrefix: string;
    let filename: string;

    const activeRuleId = settings.activeRuleId || 'generic';
    const selectedFilenamePreset = getSelectedFilenamePreset(settings, activeRuleId);

    basePrefix = generateBasePrefix(selectedFilenamePreset.template, image, customName || '');
    const nextIndex = await getNextBatchIndex(basePrefix, settings.downloadFolder, startIndexes, attemptedCounts);
    filename = generateFilename(selectedFilenamePreset.template, image, nextIndex, customName || '');

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
