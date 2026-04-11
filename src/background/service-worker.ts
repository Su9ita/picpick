import { DownloadImagesMessage } from '../types/messages';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { generateFilename, generateBasePrefix, generateCustomFilename, generateCustomBasePrefix, findNextIndex } from '../utils/filename-template';

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
  const { images, settings, customName } = message;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    let basePrefix: string;
    let filename: string;

    // カスタム名モードとテンプレートモードで分岐
    if (settings.namingMode === 'custom' && customName) {
      // カスタム名モード: {date}_{customName}_{index}.{ext}
      basePrefix = generateCustomBasePrefix(customName, image);
      const nextIndex = await findNextIndex(basePrefix, settings.downloadFolder);
      filename = generateCustomFilename(customName, image, nextIndex);
    } else {
      // テンプレートモード: 従来の処理
      basePrefix = generateBasePrefix(settings.filenameTemplate, image);
      const nextIndex = await findNextIndex(basePrefix, settings.downloadFolder);
      filename = generateFilename(settings.filenameTemplate, image, nextIndex);
    }

    try {
      const downloadPath = settings.downloadFolder
        ? `${settings.downloadFolder}/${filename}`
        : filename;

      await downloadFile(image.url, downloadPath);
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
          // ダウンロード完了を待つ
          const listener = (delta: chrome.downloads.DownloadDelta) => {
            if (delta.id === downloadId && delta.state) {
              if (delta.state.current === 'complete') {
                chrome.downloads.onChanged.removeListener(listener);
                resolve();
              } else if (delta.state.current === 'interrupted') {
                chrome.downloads.onChanged.removeListener(listener);
                reject(new Error(delta.error?.current || 'Download interrupted'));
              }
            }
          };
          chrome.downloads.onChanged.addListener(listener);
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
