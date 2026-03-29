import { ImageInfo } from '../types/image-info';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';

let currentImages: ImageInfo[] = [];
let currentSettings: Settings = { ...DEFAULT_SETTINGS };

// DOM要素
const scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
const scanResult = document.getElementById('scan-result') as HTMLDivElement;
const imageCount = document.getElementById('image-count') as HTMLSpanElement;
const filteredCount = document.getElementById('filtered-count') as HTMLSpanElement;
const errorMsg = document.getElementById('error-msg') as HTMLParagraphElement;
const downloadSection = document.getElementById('download-section') as HTMLElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
const progress = document.getElementById('progress') as HTMLDivElement;
const progressFill = document.getElementById('progress-fill') as HTMLDivElement;
const progressText = document.getElementById('progress-text') as HTMLParagraphElement;
const downloadResult = document.getElementById('download-result') as HTMLParagraphElement;
const siteInfo = document.getElementById('site-info') as HTMLParagraphElement;
const status = document.getElementById('status') as HTMLParagraphElement;

// 設定要素
const filenameTemplateInput = document.getElementById('filename-template') as HTMLInputElement;
const minWidthInput = document.getElementById('min-width') as HTMLInputElement;
const minHeightInput = document.getElementById('min-height') as HTMLInputElement;
const downloadFolderInput = document.getElementById('download-folder') as HTMLInputElement;
const saveSettingsBtn = document.getElementById('save-settings') as HTMLButtonElement;
const resetSettingsBtn = document.getElementById('reset-settings') as HTMLButtonElement;

// クリエイターリスト要素
const creatorListDiv = document.getElementById('creator-list') as HTMLDivElement;
const newCreatorInput = document.getElementById('new-creator') as HTMLInputElement;
const addCreatorBtn = document.getElementById('add-creator') as HTMLButtonElement;
const creatorSelect = document.getElementById('creator-select') as HTMLSelectElement;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  updateSiteInfo();
});

// 設定を読み込み
async function loadSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response && !response.error) {
        currentSettings = {
          ...DEFAULT_SETTINGS,
          ...response,
          creatorList: response.creatorList || [],
          lastSelectedCreator: response.lastSelectedCreator || '',
        };
        filenameTemplateInput.value = currentSettings.filenameTemplate;
        minWidthInput.value = String(currentSettings.minWidth);
        minHeightInput.value = String(currentSettings.minHeight);
        downloadFolderInput.value = currentSettings.downloadFolder;
        renderCreatorList();
        updateCreatorSelect();
      }
      resolve();
    });
  });
}

// クリエイターリストを描画
function renderCreatorList(): void {
  creatorListDiv.innerHTML = '';

  if (currentSettings.creatorList.length === 0) {
    creatorListDiv.innerHTML = '<p style="font-size: 11px; color: #9ca3af;">登録なし</p>';
    return;
  }

  for (let i = 0; i < currentSettings.creatorList.length; i++) {
    const name = currentSettings.creatorList[i];
    const item = document.createElement('div');
    item.className = 'creator-item';
    item.innerHTML = `
      <span class="name">${escapeHtml(name)}</span>
      <button class="delete-btn" data-index="${i}">×</button>
    `;
    creatorListDiv.appendChild(item);
  }

  // 削除ボタンにイベントを設定
  creatorListDiv.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
      deleteCreator(index);
    });
  });
}

// クリエイター選択プルダウンを更新
function updateCreatorSelect(): void {
  // 既存のオプションをクリア（最初の「選択しない」以外）
  while (creatorSelect.options.length > 1) {
    creatorSelect.remove(1);
  }

  // クリエイターを追加
  for (const name of currentSettings.creatorList) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    creatorSelect.appendChild(option);
  }

  // 前回選択したクリエイターを選択
  if (currentSettings.lastSelectedCreator &&
      currentSettings.creatorList.includes(currentSettings.lastSelectedCreator)) {
    creatorSelect.value = currentSettings.lastSelectedCreator;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c] || c));
}

// クリエイターを追加
function addCreator(): void {
  const name = newCreatorInput.value.trim();

  if (!name || currentSettings.creatorList.includes(name)) {
    return;
  }

  currentSettings.creatorList.push(name);
  newCreatorInput.value = '';
  renderCreatorList();
  updateCreatorSelect();
}

// クリエイターを削除
function deleteCreator(index: number): void {
  currentSettings.creatorList.splice(index, 1);
  renderCreatorList();
  updateCreatorSelect();
}

// 現在のサイト情報を表示
async function updateSiteInfo(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    const url = new URL(tab.url);
    siteInfo.textContent = url.hostname;
  }
}

// スキャンボタン
scanBtn.addEventListener('click', async () => {
  scanBtn.disabled = true;
  scanBtn.textContent = 'スキャン中...';
  scanResult.classList.add('hidden');
  errorMsg.classList.add('hidden');
  downloadSection.classList.add('hidden');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error('タブが見つかりません');
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_IMAGES' });

    if (response.error) {
      errorMsg.textContent = response.error;
      errorMsg.classList.remove('hidden');
    } else if (response.images && response.images.length > 0) {
      currentImages = response.images;
      imageCount.textContent = String(response.images.length);
      filteredCount.textContent = String(response.filteredCount || 0);
      scanResult.classList.remove('hidden');
      downloadSection.classList.remove('hidden');

      if (response.siteInfo) {
        siteInfo.textContent = `${response.siteInfo.site} - ${response.siteInfo.creator}`;
      }
    } else {
      errorMsg.textContent = '画像が見つかりませんでした';
      errorMsg.classList.remove('hidden');
    }
  } catch (error) {
    errorMsg.textContent = (error as Error).message || 'スキャンに失敗しました';
    errorMsg.classList.remove('hidden');
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = '画像をスキャン';
  }
});

// ダウンロードボタン
downloadBtn.addEventListener('click', async () => {
  if (currentImages.length === 0) return;

  downloadBtn.disabled = true;
  downloadBtn.textContent = 'ダウンロード中...';
  progress.classList.remove('hidden');
  downloadResult.classList.add('hidden');
  progressFill.style.width = '0%';
  progressText.textContent = `0 / ${currentImages.length}`;

  // 選択されたクリエイター名を取得
  const selectedCreator = creatorSelect.value;

  // 前回選択を記憶
  currentSettings.lastSelectedCreator = selectedCreator;
  chrome.runtime.sendMessage({
    type: 'SAVE_SETTINGS',
    settings: currentSettings,
  });

  // 画像のメタデータにクリエイター名をセット
  const imagesWithCreator = currentImages.map((img) => ({
    ...img,
    metadata: {
      ...img.metadata,
      creator: selectedCreator || '',  // 空なら{creator}が空文字になる
    },
  }));

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_IMAGES',
      images: imagesWithCreator,
      settings: currentSettings,
    });

    if (response.error) {
      downloadResult.textContent = `エラー: ${response.error}`;
      downloadResult.className = 'result-text error';
    } else {
      const { success, failed } = response;
      if (failed > 0) {
        downloadResult.textContent = `完了: ${success}枚成功, ${failed}枚失敗`;
        downloadResult.className = 'result-text';
      } else {
        downloadResult.textContent = `${success}枚のダウンロードが完了しました`;
        downloadResult.className = 'result-text success';
      }
    }
    downloadResult.classList.remove('hidden');
  } catch (error) {
    downloadResult.textContent = `エラー: ${(error as Error).message}`;
    downloadResult.className = 'result-text error';
    downloadResult.classList.remove('hidden');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = '一括ダウンロード';
  }
});

// 進捗更新リスナー
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'DOWNLOAD_PROGRESS') {
    const { current, total } = message;
    const percent = (current / total) * 100;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${current} / ${total}`;
  }
});

// クリエイター追加ボタン
addCreatorBtn.addEventListener('click', addCreator);

// Enterキーでも追加できるように
newCreatorInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addCreator();
  }
});

// 設定保存
saveSettingsBtn.addEventListener('click', async () => {
  currentSettings = {
    filenameTemplate: filenameTemplateInput.value || DEFAULT_SETTINGS.filenameTemplate,
    minWidth: parseInt(minWidthInput.value) || 0,
    minHeight: parseInt(minHeightInput.value) || 0,
    enabledExtensions: DEFAULT_SETTINGS.enabledExtensions,
    downloadFolder: downloadFolderInput.value || DEFAULT_SETTINGS.downloadFolder,
    skipDuplicates: true,
    creatorList: currentSettings.creatorList,
    lastSelectedCreator: currentSettings.lastSelectedCreator,
  };

  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings: currentSettings,
    });
    status.textContent = '設定を保存しました';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  } catch (error) {
    status.textContent = '保存に失敗しました';
  }
});

// 設定リセット
resetSettingsBtn.addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({
      type: 'RESET_SETTINGS',
    });
    // UIをデフォルト値に戻す
    filenameTemplateInput.value = DEFAULT_SETTINGS.filenameTemplate;
    minWidthInput.value = String(DEFAULT_SETTINGS.minWidth);
    minHeightInput.value = String(DEFAULT_SETTINGS.minHeight);
    downloadFolderInput.value = DEFAULT_SETTINGS.downloadFolder;
    currentSettings = { ...DEFAULT_SETTINGS };
    renderCreatorList();
    updateCreatorSelect();
    status.textContent = '設定をリセットしました';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  } catch (error) {
    status.textContent = 'リセットに失敗しました';
  }
});
