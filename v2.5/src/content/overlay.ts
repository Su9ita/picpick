// オーバーレイUIを作成・管理
import { getExtractor, detectSite } from '../extractors';
import { filterImages } from '../utils/image-filter';
import { autoScrollToLoadAll } from '../utils/auto-scroller';
import { Settings, DEFAULT_SETTINGS, SizePreset, DEFAULT_SIZE_PRESETS, RuleSessionSettings } from '../types/settings';
import { ImageInfo } from '../types/image-info';

let overlayContainer: HTMLDivElement | null = null;
let isDownloading = false;
let scannedImages: ImageInfo[] = [];
let currentSettings: Settings = { ...DEFAULT_SETTINGS };
let suppressNextOverlayClick = false;

const OVERLAY_POSITION_KEY = 'picpickOverlayPosition';

// 対応サイトかチェックしてオーバーレイを表示
export async function initOverlay(): Promise<void> {
  const url = window.location.href;
  const extractor = getExtractor(url);

  if (!extractor) return; // 非対応サイトでは何もしない

  // 設定を取得してオーバーレイを表示するかチェック
  try {
    const settings = await getSettings();
    if (settings.overlayEnabled === false) {
      return; // オーバーレイが無効なら表示しない
    }
  } catch {
    // 設定取得に失敗した場合はデフォルトで表示
  }

  createOverlay();
  setupOverlayToggleListener();
}

function createOverlay(): void {
  if (overlayContainer) return;

  overlayContainer = document.createElement('div');
  overlayContainer.id = 'picpick-overlay';
  overlayContainer.innerHTML = `
    <style>
      #picpick-overlay {
        position: fixed;
        top: 20px;
        right: 10px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #picpick-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border: none;
        cursor: grab;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        touch-action: none;
        user-select: none;
      }
      #picpick-btn.picpick-dragging {
        cursor: grabbing;
        transform: scale(1.05);
      }
      #picpick-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
      }
      #picpick-btn.picpick-dragging:hover {
        transform: scale(1.05);
      }
      #picpick-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
        transform: none;
      }
      #picpick-btn svg {
        width: 22px;
        height: 22px;
        fill: white;
      }
      #picpick-status {
        position: absolute;
        right: 0;
        top: 52px;
        background: white;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 13px;
        min-width: 180px;
        display: none;
      }
      #picpick-status.show {
        display: block;
      }
      .picpick-progress {
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
      }
      .picpick-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
        transition: width 0.3s ease;
      }
      @keyframes picpick-press {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(4px); }
      }
      .picpick-loading {
        animation: picpick-press 0.6s ease-in-out infinite;
        box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3) !important;
      }
      /* 確認ダイアログ */
      #picpick-confirm-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999999;
      }
      #picpick-confirm-dialog.show {
        display: flex;
      }
      .picpick-dialog-content {
        background: white;
        border-radius: 12px;
        padding: 24px;
        width: 320px;
        max-width: 90vw;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      }
      .picpick-dialog-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #1f2937;
      }
      .picpick-dialog-info {
        font-size: 14px;
        color: #4b5563;
        margin-bottom: 16px;
      }
      .picpick-dialog-info strong {
        color: #6366f1;
      }
      .picpick-preset-select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        margin-bottom: 8px;
        background: white;
        cursor: pointer;
      }
      .picpick-preset-select:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
      .picpick-size-inputs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }
      .picpick-size-input {
        flex: 1;
      }
      .picpick-size-input label {
        display: block;
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }
      .picpick-size-input input {
        width: 100%;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        box-sizing: border-box;
      }
      .picpick-size-input input:focus {
        outline: none;
        border-color: #6366f1;
      }
      .picpick-image-list {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 12px;
        padding: 8px;
        background: #f9fafb;
        border-radius: 6px;
        max-height: 120px;
        overflow-y: auto;
      }
      .picpick-image-item {
        padding: 4px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .picpick-image-item:last-child {
        border-bottom: none;
      }
      .picpick-image-size {
        color: #6366f1;
        font-weight: 500;
      }
      .picpick-dialog-buttons {
        display: flex;
        gap: 8px;
      }
      .picpick-dialog-btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      .picpick-dialog-btn-cancel {
        background: #f3f4f6;
        color: #4b5563;
      }
      .picpick-dialog-btn-cancel:hover {
        background: #e5e7eb;
      }
      .picpick-dialog-btn-confirm {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
      }
      .picpick-dialog-btn-confirm:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      }
      .picpick-dialog-btn-rescan {
        width: 100%;
        background: #e0e7ff;
        color: #4f46e5;
        margin-bottom: 8px;
        flex: none;
      }
      .picpick-dialog-btn-rescan:hover {
        background: #c7d2fe;
      }
      .picpick-dialog-btn-rescan:disabled {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
      }

      /* カスタム名モード */
      .picpick-naming-section {
        margin-bottom: 16px;
      }
      .picpick-mode-toggle {
        display: flex;
        gap: 16px;
        margin-bottom: 8px;
      }
      .picpick-toggle-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        cursor: pointer;
        color: #374151;
      }
      .picpick-toggle-label input[type="radio"] {
        width: auto;
        margin: 0;
      }
      .picpick-custom-name-section {
        margin-top: 8px;
      }
      .picpick-custom-name-row {
        display: flex;
        gap: 8px;
        margin-bottom: 4px;
      }
      .picpick-template-dropdown {
        flex: 0 0 35%;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 13px;
        background: white;
      }
      .picpick-custom-input {
        flex: 1;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        box-sizing: border-box;
      }
      .picpick-custom-input:focus,
      .picpick-template-dropdown:focus {
        outline: none;
        border-color: #6366f1;
      }
      .picpick-preview {
        font-size: 11px;
        color: #6b7280;
        margin-top: 4px;
      }
      .picpick-preview span {
        color: #6366f1;
        font-family: monospace;
      }
      /* 設定パネル */
      .picpick-settings-panel {
        margin-top: 12px;
        margin-bottom: 12px;
        border-top: 1px solid #e5e7eb;
        padding-top: 12px;
      }
      .picpick-settings-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #6b7280;
        cursor: pointer;
        list-style: none;
      }
      .picpick-settings-toggle::-webkit-details-marker {
        display: none;
      }
      .picpick-settings-toggle:hover {
        color: #4b5563;
      }
      .picpick-settings-toggle svg {
        width: 16px;
        height: 16px;
      }
      .picpick-settings-content {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f3f4f6;
      }
      .picpick-setting-item {
        margin-bottom: 12px;
      }
      .picpick-setting-item label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 4px;
      }
      .picpick-setting-item input {
        width: 100%;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 13px;
        box-sizing: border-box;
      }
      .picpick-setting-item input:focus {
        outline: none;
        border-color: #6366f1;
      }
      .picpick-template-list {
        max-height: 80px;
        overflow-y: auto;
        margin: 6px 0;
      }
      .picpick-template-item {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        background: #f3f4f6;
        border-radius: 4px;
        margin-bottom: 4px;
        font-size: 12px;
      }
      .picpick-template-item span {
        flex: 1;
        color: #6366f1;
      }
      .picpick-template-item button {
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 14px;
      }
      .picpick-template-item button:hover {
        color: #dc2626;
      }
      .picpick-template-add {
        display: flex;
        gap: 6px;
      }
      .picpick-template-add input {
        flex: 1;
        padding: 6px 8px;
      }
      .picpick-btn-small {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        background: #e0e7ff;
        color: #4f46e5;
        cursor: pointer;
      }
      .picpick-btn-small:hover {
        background: #c7d2fe;
      }
      .picpick-dialog-btn-save {
        width: 100%;
        background: #10b981;
        color: white;
        margin-top: 8px;
      }
      .picpick-dialog-btn-save:hover {
        background: #059669;
      }
    </style>
    <button id="picpick-btn" title="画像をスキャン / ドラッグで移動">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
    </button>
    <div id="picpick-status">
      <div id="picpick-status-text">準備中...</div>
      <div class="picpick-progress">
        <div class="picpick-progress-bar" id="picpick-progress-bar" style="width: 0%"></div>
      </div>
    </div>
    <div id="picpick-confirm-dialog">
      <div class="picpick-dialog-content">
        <div class="picpick-dialog-title">画像を保存</div>
        <div class="picpick-dialog-info">
          <strong id="picpick-dialog-count">0</strong> 枚の画像が見つかりました
          <span id="picpick-dialog-scanned" style="font-size: 12px; color: #9ca3af; margin-left: 8px;"></span>
        </div>
        <div id="picpick-image-list" class="picpick-image-list" style="display: none;"></div>

        <!-- サイトルール選択 (第1選択) -->
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; font-weight: 500; color: #374151; margin-bottom: 4px;">サイトルール</label>
          <select id="picpick-rule-select" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;">
            <option value="">-- 選択 --</option>
          </select>
        </div>

        <!-- カスタム名モード -->
        <div class="picpick-naming-section">
          <div class="picpick-mode-toggle">
            <label class="picpick-toggle-label">
              <input type="radio" name="picpick-naming-mode" value="custom" id="picpick-mode-custom" checked>
              <span>カスタム名</span>
            </label>
            <label class="picpick-toggle-label">
              <input type="radio" name="picpick-naming-mode" value="template" id="picpick-mode-template">
              <span>テンプレート</span>
            </label>
          </div>
          <div id="picpick-custom-name-section" class="picpick-custom-name-section">
            <div class="picpick-custom-name-row">
              <select id="picpick-custom-template-select" class="picpick-template-dropdown">
                <option value="">-- 選択 --</option>
              </select>
              <input type="text" id="picpick-custom-name" placeholder="ファイル名を入力" class="picpick-custom-input">
            </div>
            <div class="picpick-preview">
              出力: <span id="picpick-filename-preview">2026-04-08_name_01.jpg</span>
            </div>
          </div>
        </div>
        <select id="picpick-preset-select" class="picpick-preset-select">
          <option value="">カスタム</option>
        </select>
        <div class="picpick-size-inputs">
          <div class="picpick-size-input">
            <label>最小幅 (px)</label>
            <input type="number" id="picpick-min-width" min="0" value="400">
          </div>
          <div class="picpick-size-input">
            <label>最小高さ (px)</label>
            <input type="number" id="picpick-min-height" min="0" value="400">
          </div>
        </div>
        <button class="picpick-dialog-btn picpick-dialog-btn-rescan" id="picpick-rescan-btn">再スキャン</button>
        <!-- 設定パネル -->
        <details class="picpick-settings-panel">
          <summary class="picpick-settings-toggle">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
            設定
          </summary>
          <div class="picpick-settings-content">
            <div class="picpick-setting-item">
              <label>ファイル名テンプレート</label>
              <input type="text" id="picpick-filename-template" value="{date}_{title}_{index}">
            </div>
            <div class="picpick-setting-item">
              <label>保存フォルダ</label>
              <input type="text" id="picpick-download-folder" value="PicPick">
            </div>
            <div class="picpick-setting-item">
              <label>カスタム名テンプレート</label>
              <div id="picpick-custom-template-list" class="picpick-template-list"></div>
              <div class="picpick-template-add">
                <input type="text" id="picpick-new-template" placeholder="テンプレート名">
                <button id="picpick-add-template" class="picpick-btn-small">追加</button>
              </div>
            </div>
            <button id="picpick-save-settings" class="picpick-dialog-btn picpick-dialog-btn-save">設定を保存</button>
          </div>
        </details>
        
        <div class="picpick-dialog-buttons">
          <button class="picpick-dialog-btn picpick-dialog-btn-cancel" id="picpick-cancel-btn">キャンセル</button>
          <button class="picpick-dialog-btn picpick-dialog-btn-confirm" id="picpick-confirm-btn">保存する</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlayContainer);
  restoreOverlayPosition();

  const btn = document.getElementById('picpick-btn');
  if (btn) {
    setupDraggableOverlay(btn);
    btn.addEventListener('click', (event) => {
      if (suppressNextOverlayClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressNextOverlayClick = false;
        return;
      }
      handleScanClick();
    });
  }

  // 確認ダイアログのイベント
  const cancelBtn = document.getElementById('picpick-cancel-btn');
  const confirmBtn = document.getElementById('picpick-confirm-btn');
  const presetSelect = document.getElementById('picpick-preset-select') as HTMLSelectElement;
  const minWidthInput = document.getElementById('picpick-min-width') as HTMLInputElement;
  const minHeightInput = document.getElementById('picpick-min-height') as HTMLInputElement;

  const rescanBtn = document.getElementById('picpick-rescan-btn');

  cancelBtn?.addEventListener('click', hideConfirmDialog);
  confirmBtn?.addEventListener('click', handleConfirmDownload);
  rescanBtn?.addEventListener('click', handleRescan);

  presetSelect?.addEventListener('change', () => {
    const selectedPreset = currentSettings.sizePresets.find(p => p.name === presetSelect.value);
    if (selectedPreset) {
      minWidthInput.value = String(selectedPreset.minWidth);
      minHeightInput.value = String(selectedPreset.minHeight);
    }
    updateFilteredCount();
  });

  minWidthInput?.addEventListener('input', () => {
    presetSelect.value = '';
    updateFilteredCount();
  });

  minHeightInput?.addEventListener('input', () => {
    presetSelect.value = '';
    updateFilteredCount();
  });

  // カスタム名モードのイベント
  const modeCustomRadio = document.getElementById('picpick-mode-custom') as HTMLInputElement;
  const modeTemplateRadio = document.getElementById('picpick-mode-template') as HTMLInputElement;
  const customNameSection = document.getElementById('picpick-custom-name-section') as HTMLDivElement;
  const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
  const customTemplateSelect = document.getElementById('picpick-custom-template-select') as HTMLSelectElement;
  const filenamePreview = document.getElementById('picpick-filename-preview') as HTMLSpanElement;

  // 設定パネルのイベント
  const filenameTemplateInput = document.getElementById('picpick-filename-template') as HTMLInputElement;
  const downloadFolderInput = document.getElementById('picpick-download-folder') as HTMLInputElement;
  const customTemplateList = document.getElementById('picpick-custom-template-list') as HTMLDivElement;
  const newTemplateInput = document.getElementById('picpick-new-template') as HTMLInputElement;
  const addTemplateBtn = document.getElementById('picpick-add-template') as HTMLButtonElement;
  const saveSettingsBtn = document.getElementById('picpick-save-settings') as HTMLButtonElement;

  // モード切替
  modeCustomRadio?.addEventListener('change', () => {
    customNameSection.style.display = 'block';
    currentSettings.namingMode = 'custom';
  });

  modeTemplateRadio?.addEventListener('change', () => {
    customNameSection.style.display = 'none';
    currentSettings.namingMode = 'template';
  });

  // テンプレート選択
  customTemplateSelect?.addEventListener('change', () => {
    if (customTemplateSelect.value) {
      customNameInput.value = customTemplateSelect.value;
      updateOverlayFilenamePreview();
    }
  });

  // カスタム名入力
  customNameInput?.addEventListener('input', updateOverlayFilenamePreview);

  // テンプレート追加
  addTemplateBtn?.addEventListener('click', () => {
    const name = newTemplateInput?.value.trim();
    if (name && !currentSettings.customNameTemplates.includes(name)) {
      currentSettings.customNameTemplates.push(name);
      newTemplateInput.value = '';
      renderOverlayCustomTemplates();
      updateOverlayCustomTemplateSelect();
    }
  });

  // 設定保存
  saveSettingsBtn?.addEventListener('click', async () => {
    currentSettings.filenameTemplate = filenameTemplateInput?.value || currentSettings.filenameTemplate;
    currentSettings.downloadFolder = downloadFolderInput?.value || currentSettings.downloadFolder;

    if (isExtensionContextValid()) {
      try {
        await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: currentSettings });
        saveSettingsBtn.textContent = '保存しました!';
        setTimeout(() => {
          saveSettingsBtn.textContent = '設定を保存';
        }, 1500);
      } catch (e) {
        console.error('Settings save failed:', e);
      }
    }
  });

}

// スキャンボタンクリック（確認ダイアログを表示）
async function handleScanClick(): Promise<void> {
  if (isDownloading) return;

  const btn = document.getElementById('picpick-btn') as HTMLButtonElement;
  const status = document.getElementById('picpick-status');
  const statusText = document.getElementById('picpick-status-text');

  if (!btn || !status || !statusText) return;

  btn.disabled = true;
  btn.classList.add('picpick-loading');
  status.classList.add('show');
  statusText.textContent = 'スキャン中...';

  try {
    const url = window.location.href;
    const extractor = getExtractor(url);
    if (!extractor) throw new Error('非対応サイト');

    currentSettings = await getSettings();
    await scrollBeforeScanIfEnabled(currentSettings, (current, total) => {
      statusText.textContent = `スクロール中... ${current}/${total}`;
    });

    // 画像を抽出
    scannedImages = await extractor.extractImages();

    if (scannedImages.length === 0) {
      statusText.textContent = '画像が見つかりませんでした';
      setTimeout(() => status.classList.remove('show'), 2000);
      return;
    }

    status.classList.remove('show');
    showConfirmDialog();

  } catch (error) {
    statusText.textContent = `エラー: ${(error as Error).message}`;
    setTimeout(() => status.classList.remove('show'), 3000);
  } finally {
    btn.disabled = false;
    btn.classList.remove('picpick-loading');
  }
}

// 再スキャン（ダイアログ内から）
async function handleRescan(): Promise<void> {
  if (isDownloading) return;

  const rescanBtn = document.getElementById('picpick-rescan-btn') as HTMLButtonElement;
  if (!rescanBtn) return;

  rescanBtn.disabled = true;
  rescanBtn.textContent = 'スキャン中...';

  try {
    const url = window.location.href;
    const extractor = getExtractor(url);
    if (!extractor) throw new Error('非対応サイト');

    currentSettings = await getSettings();
    await scrollBeforeScanIfEnabled(currentSettings);
    scannedImages = await extractor.extractImages();
    updateFilteredCount();

  } catch (error) {
    console.error('Rescan error:', error);
  } finally {
    rescanBtn.disabled = false;
    rescanBtn.textContent = '再スキャン';
  }
}

function setupDraggableOverlay(btn: HTMLElement): void {
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let hasMoved = false;

  btn.addEventListener('pointerdown', (event) => {
    if (!overlayContainer || event.button !== 0 || isDownloading) return;

    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;

    const rect = overlayContainer.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    hasMoved = false;

    btn.classList.add('picpick-dragging');
    btn.setPointerCapture(pointerId);
  });

  btn.addEventListener('pointermove', (event) => {
    if (!overlayContainer || pointerId !== event.pointerId) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!hasMoved && Math.hypot(deltaX, deltaY) < 4) return;
    hasMoved = true;
    suppressNextOverlayClick = true;

    const position = clampOverlayPosition(startLeft + deltaX, startTop + deltaY);
    applyOverlayPosition(position.left, position.top);
  });

  btn.addEventListener('pointerup', (event) => {
    if (pointerId !== event.pointerId) return;

    btn.classList.remove('picpick-dragging');
    if (hasMoved && overlayContainer) {
      const rect = overlayContainer.getBoundingClientRect();
      saveOverlayPosition(rect.left, rect.top);
    }
    pointerId = null;
  });

  btn.addEventListener('pointercancel', (event) => {
    if (pointerId !== event.pointerId) return;
    btn.classList.remove('picpick-dragging');
    pointerId = null;
  });
}

function clampOverlayPosition(left: number, top: number): { left: number; top: number } {
  const margin = 8;
  const overlayWidth = overlayContainer?.offsetWidth || 44;
  const overlayHeight = overlayContainer?.offsetHeight || 44;
  const maxLeft = Math.max(margin, window.innerWidth - overlayWidth - margin);
  const maxTop = Math.max(margin, window.innerHeight - overlayHeight - margin);

  return {
    left: Math.min(Math.max(left, margin), maxLeft),
    top: Math.min(Math.max(top, margin), maxTop),
  };
}

function applyOverlayPosition(left: number, top: number): void {
  if (!overlayContainer) return;

  const position = clampOverlayPosition(left, top);
  overlayContainer.style.left = `${position.left}px`;
  overlayContainer.style.top = `${position.top}px`;
  overlayContainer.style.right = 'auto';
}

function restoreOverlayPosition(): void {
  if (!isExtensionContextValid()) return;

  try {
    chrome.storage.sync.get(OVERLAY_POSITION_KEY, (result) => {
      const position = result?.[OVERLAY_POSITION_KEY];
      if (
        position &&
        typeof position.left === 'number' &&
        typeof position.top === 'number'
      ) {
        applyOverlayPosition(position.left, position.top);
      }
    });
  } catch {
    // 位置の復元に失敗した場合はデフォルト位置を使う
  }
}

function saveOverlayPosition(left: number, top: number): void {
  if (!isExtensionContextValid()) return;

  const position = clampOverlayPosition(left, top);
  try {
    chrome.storage.sync.set({
      [OVERLAY_POSITION_KEY]: position,
    });
  } catch {
    // 位置保存に失敗してもスキャン機能には影響させない
  }
}

async function scrollBeforeScanIfEnabled(
  settings: Settings,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (settings.scanScrollEnabled !== true) return;

  await autoScrollToLoadAll({
    scrollDelay: 350,
    scrollStep: Math.max(window.innerHeight * 0.85, 600),
    maxScrolls: 40,
    onProgress,
  });
}

// 確認ダイアログを表示
function showConfirmDialog(): void {
  const dialog = document.getElementById('picpick-confirm-dialog');
  const countEl = document.getElementById('picpick-dialog-count');
  const presetSelect = document.getElementById('picpick-preset-select') as HTMLSelectElement;
  const minWidthInput = document.getElementById('picpick-min-width') as HTMLInputElement;
  const minHeightInput = document.getElementById('picpick-min-height') as HTMLInputElement;
  const ruleSelect = document.getElementById('picpick-rule-select') as HTMLSelectElement;

  if (!dialog || !countEl || !presetSelect || !minWidthInput || !minHeightInput) return;

  // 【新規】サイトルール選択肢を初期化
  if (ruleSelect) {
    ruleSelect.innerHTML = '';
    if (currentSettings.siteRules) {
      for (const rule of currentSettings.siteRules) {
        const option = document.createElement('option');
        option.value = rule.siteId;
        option.textContent = rule.label;
        ruleSelect.appendChild(option);
      }
    }
    // 前回選んだルールをデフォルト値として設定
    ruleSelect.value = currentSettings.activeRuleId || 'generic';

    // ルール選択時のイベントリスナー
    ruleSelect.addEventListener('change', () => {
      const selectedRuleId = ruleSelect.value;
      if (selectedRuleId) {
        switchRule(selectedRuleId);
      }
    });
  }

  // プリセット選択肢を更新（ルール別プリセット含む）
  updatePresetDropdown();

  // 現在の設定を反映
  if (currentSettings.selectedPreset) {
    presetSelect.value = currentSettings.selectedPreset;
  }
  minWidthInput.value = String(currentSettings.minWidth);
  minHeightInput.value = String(currentSettings.minHeight);

  updateFilteredCount();
  initOverlayNamingMode();
  dialog.classList.add('show');
}

// プリセットドロップダウンを更新（ルール別プリセット含む）
function updatePresetDropdown(): void {
  const presetSelect = document.getElementById('picpick-preset-select') as HTMLSelectElement;
  if (!presetSelect) return;

  // 既存オプションをクリア
  presetSelect.innerHTML = '<option value="">-- カスタム --</option>';

  // グローバルプリセット
  for (const preset of currentSettings.sizePresets || []) {
    const option = document.createElement('option');
    option.value = preset.name;
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  }

  // ルール別プリセット
  const ruleId = currentSettings.activeRuleId || 'generic';
  const rulePresets = currentSettings.ruleSpecificPresets?.[ruleId] || [];
  if (rulePresets.length > 0) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = `── ${ruleId} 専用 ──`;
    for (const preset of rulePresets) {
      const option = document.createElement('option');
      option.value = preset.name;
      option.textContent = preset.name;
      optgroup.appendChild(option);
    }
    presetSelect.appendChild(optgroup);
  }
}

// ルール切り替え時に設定を復元
function switchRule(ruleId: string): void {
  // 前のルール設定を保存
  if (currentSettings.activeRuleId && currentSettings.ruleSessionSettings) {
    const customName = (document.getElementById('picpick-custom-name') as HTMLInputElement)?.value || '';
    const presetSelect = document.getElementById('picpick-preset-select') as HTMLSelectElement;
    const selectedPreset = presetSelect?.value || '';
    const namingMode = (document.querySelector('input[name="picpick-naming-mode"]:checked') as HTMLInputElement)?.value || 'custom';

    if (!currentSettings.ruleSessionSettings[currentSettings.activeRuleId]) {
      currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {} as RuleSessionSettings;
    }
    currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {
      customName,
      selectedPreset,
      namingMode: namingMode as 'custom' | 'template',
    };
  }

  // 新しいルールに切り替え
  currentSettings.activeRuleId = ruleId;

  // プリセットドロップダウンを更新
  updatePresetDropdown();

  // 新しいルールの設定を復元
  const ruleSetting = currentSettings.ruleSessionSettings?.[ruleId];
  if (ruleSetting) {
    const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
    const presetSelect = document.getElementById('picpick-preset-select') as HTMLSelectElement;
    const modeCustom = document.getElementById('picpick-mode-custom') as HTMLInputElement;
    const modeTemplate = document.getElementById('picpick-mode-template') as HTMLInputElement;

    if (customNameInput) customNameInput.value = ruleSetting.customName;
    if (presetSelect) presetSelect.value = ruleSetting.selectedPreset;
    if (modeCustom && modeTemplate) {
      if (ruleSetting.namingMode === 'custom') {
        modeCustom.checked = true;
      } else {
        modeTemplate.checked = true;
      }
    }

    // UIを更新
    updateFilteredCount();
    initOverlayNamingMode();
  }
}

// 確認ダイアログを非表示
function hideConfirmDialog(): void {
  const dialog = document.getElementById('picpick-confirm-dialog');
  dialog?.classList.remove('show');
}

// フィルター後の枚数を更新
function updateFilteredCount(): void {
  const minWidthInput = document.getElementById('picpick-min-width') as HTMLInputElement;
  const minHeightInput = document.getElementById('picpick-min-height') as HTMLInputElement;
  const countEl = document.getElementById('picpick-dialog-count');
  const scannedEl = document.getElementById('picpick-dialog-scanned');
  const imageListEl = document.getElementById('picpick-image-list');

  if (!minWidthInput || !minHeightInput || !countEl || !scannedEl || !imageListEl) return;

  const tempSettings: Settings = {
    ...currentSettings,
    minWidth: parseInt(minWidthInput.value) || 0,
    minHeight: parseInt(minHeightInput.value) || 0,
  };

  const filterResult = filterImages(scannedImages, tempSettings);
  const filteredImages = filterResult.passed;

  // メイン表示: フィルタリング後の枚数
  countEl.textContent = String(filteredImages.length);
  // サブ表示: フィルター前の枚数
  scannedEl.textContent = `(フィルター前: ${scannedImages.length}枚)`;

  // フィルタリング後の画像リストを表示（5枚以下の場合のみ）
  const MAX_DISPLAY_IMAGES = 5;
  if (filteredImages.length > 0 && filteredImages.length <= MAX_DISPLAY_IMAGES) {
    imageListEl.style.display = 'block';
    imageListEl.innerHTML = filteredImages
      .map((img, i) => {
        const sizeText = img.width && img.height
          ? `<span class="picpick-image-size">${img.width} × ${img.height}</span>`
          : '<span style="color: #9ca3af;">サイズ不明</span>';
        return `<div class="picpick-image-item">${i + 1}. ${sizeText}</div>`;
      })
      .join('');
  } else {
    imageListEl.style.display = 'none';
  }
}



// オーバーレイのファイル名プレビューを更新
function updateOverlayFilenamePreview(): void {
  const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
  const previewEl = document.getElementById('picpick-filename-preview');
  if (!previewEl) return;

  const name = customNameInput?.value.trim() || 'name';
  const date = new Date().toISOString().split('T')[0];
  previewEl.textContent = date + '_' + name + '_01.jpg';
}

// オーバーレイのカスタム名テンプレートリストを描画
function renderOverlayCustomTemplates(): void {
  const list = document.getElementById('picpick-custom-template-list');
  if (!list) return;

  if (currentSettings.customNameTemplates.length === 0) {
    list.innerHTML = '<p style="font-size: 11px; color: #9ca3af;">登録なし</p>';
    return;
  }

  list.innerHTML = currentSettings.customNameTemplates
    .map((name, i) => '<div class="picpick-template-item"><span>' + name + '</span><button data-index="' + i + '">×</button></div>')
    .join('');

  list.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.target as HTMLElement).dataset.index || '0');
      currentSettings.customNameTemplates.splice(index, 1);
      renderOverlayCustomTemplates();
      updateOverlayCustomTemplateSelect();
    });
  });
}

// オーバーレイのカスタム名テンプレート選択を更新
function updateOverlayCustomTemplateSelect(): void {
  const select = document.getElementById('picpick-custom-template-select') as HTMLSelectElement;
  if (!select) return;

  select.innerHTML = '<option value="">-- 選択 --</option>';
  currentSettings.customNameTemplates.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

// オーバーレイのカスタム名モードを初期化
function initOverlayNamingMode(): void {
  const modeCustomRadio = document.getElementById('picpick-mode-custom') as HTMLInputElement;
  const modeTemplateRadio = document.getElementById('picpick-mode-template') as HTMLInputElement;
  const customNameSection = document.getElementById('picpick-custom-name-section') as HTMLDivElement;
  const filenameTemplateInput = document.getElementById('picpick-filename-template') as HTMLInputElement;
  const downloadFolderInput = document.getElementById('picpick-download-folder') as HTMLInputElement;

  if (currentSettings.namingMode === 'template') {
    if (modeTemplateRadio) modeTemplateRadio.checked = true;
    if (customNameSection) customNameSection.style.display = 'none';
  } else {
    if (modeCustomRadio) modeCustomRadio.checked = true;
    if (customNameSection) customNameSection.style.display = 'block';
  }

  if (filenameTemplateInput) filenameTemplateInput.value = currentSettings.filenameTemplate;
  if (downloadFolderInput) downloadFolderInput.value = currentSettings.downloadFolder;

  renderOverlayCustomTemplates();
  updateOverlayCustomTemplateSelect();
  updateOverlayFilenamePreview();
}

// 保存確認
async function handleConfirmDownload(): Promise<void> {
  if (isDownloading) return;

  const btn = document.getElementById('picpick-btn') as HTMLButtonElement;
  const status = document.getElementById('picpick-status');
  const statusText = document.getElementById('picpick-status-text');
  const progressBar = document.getElementById('picpick-progress-bar');
  const presetSelect = document.getElementById('picpick-preset-select') as HTMLSelectElement;
  const minWidthInput = document.getElementById('picpick-min-width') as HTMLInputElement;
  const minHeightInput = document.getElementById('picpick-min-height') as HTMLInputElement;

  if (!btn || !status || !statusText || !progressBar || !minWidthInput || !minHeightInput) return;

  // 【新規】ダウンロード前にルール設定を保存
  if (currentSettings.activeRuleId && currentSettings.ruleSessionSettings) {
    const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
    const customName = customNameInput?.value || '';
    const selectedPreset = presetSelect?.value || '';
    const namingMode = (document.querySelector('input[name="picpick-naming-mode"]:checked') as HTMLInputElement)?.value || 'custom';

    if (!currentSettings.ruleSessionSettings[currentSettings.activeRuleId]) {
      currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {} as RuleSessionSettings;
    }
    currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {
      customName,
      selectedPreset,
      namingMode: namingMode as 'custom' | 'template',
    };
  }

  hideConfirmDialog();

  isDownloading = true;
  btn.disabled = true;
  btn.classList.add('picpick-loading');
  status.classList.add('show');

  // 設定を更新
  const settings: Settings = {
    ...currentSettings,
    minWidth: parseInt(minWidthInput.value) || 0,
    minHeight: parseInt(minHeightInput.value) || 0,
    selectedPreset: presetSelect?.value || '',
  };

  // 設定を保存（エラーは無視）
  if (isExtensionContextValid()) {
    try {
      chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings });
    } catch {
      // 無視
    }
  }

  try {
    // フィルタリング
    const filterResult = filterImages(scannedImages, settings);
    const filteredImages = filterResult.passed;

    if (filteredImages.length === 0) {
      statusText.textContent = '保存する画像がありません';
      setTimeout(() => status.classList.remove('show'), 2000);
      return;
    }

    statusText.textContent = `${filteredImages.length}枚をダウンロード中...`;

    // ダウンロード実行
    if (!isExtensionContextValid()) {
      throw new Error('拡張機能が更新されました。ページを再読み込みしてください。');
    }

    const result = await new Promise<{ error?: string; success?: number; failed?: number }>((resolve, reject) => {
      try {
        // カスタム名モードの場合はcustomNameを送信
        const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
        const customName = settings.namingMode === 'custom'
          ? customNameInput?.value.trim()
          : undefined;

        chrome.runtime.sendMessage({
          type: 'DOWNLOAD_IMAGES',
          images: filteredImages,
          settings,
          customName,
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error('拡張機能が更新されました。ページを再読み込みしてください。'));
            return;
          }
          resolve(response);
        });
      } catch {
        reject(new Error('拡張機能が更新されました。ページを再読み込みしてください。'));
      }
    });

    if (result.error) {
      statusText.textContent = `エラー: ${result.error}`;
    } else {
      const { success, failed } = result;
      statusText.textContent = failed! > 0
        ? `完了: ${success}枚成功, ${failed}枚失敗`
        : `${success}枚のダウンロード完了!`;
      progressBar.style.width = '100%';
    }

    setTimeout(() => {
      status.classList.remove('show');
      progressBar.style.width = '0%';
    }, 3000);

  } catch (error) {
    statusText.textContent = `エラー: ${(error as Error).message}`;
    setTimeout(() => status.classList.remove('show'), 3000);
  } finally {
    isDownloading = false;
    btn.disabled = false;
    btn.classList.remove('picpick-loading');
  }
}

// 拡張機能コンテキストが有効かチェック
function isExtensionContextValid(): boolean {
  try {
    return chrome.runtime?.id !== undefined;
  } catch {
    return false;
  }
}

// エラー表示
function showError(message: string): void {
  const status = document.getElementById('picpick-status');
  const statusText = document.getElementById('picpick-status-text');
  if (status && statusText) {
    status.classList.add('show');
    statusText.textContent = message;
    setTimeout(() => status.classList.remove('show'), 5000);
  }
}

async function getSettings(): Promise<Settings> {
  if (!isExtensionContextValid()) {
    showError('拡張機能が更新されました。ページを再読み込みしてください。');
    throw new Error('Extension context invalidated');
  }

  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        if (chrome.runtime.lastError) {
          showError('拡張機能が更新されました。ページを再読み込みしてください。');
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && !response.error) {
          // 保存されたプリセットがある場合、それをベースにする
          const savedPresets = response.sizePresets || [];
          // デフォルトプリセットのうち、保存されていないものを追加
          const savedPresetNames = new Set(savedPresets.map((p: SizePreset) => p.name));
          const newPresets = DEFAULT_SIZE_PRESETS.filter((p: SizePreset) => !savedPresetNames.has(p.name));
          const mergedPresets = [...savedPresets, ...newPresets];

          const mergedSettings: Settings = {
            ...DEFAULT_SETTINGS,
            ...response,
            sizePresets: mergedPresets,
          };
          resolve(mergedSettings);
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      });
    } catch (error) {
      showError('拡張機能が更新されました。ページを再読み込みしてください。');
      reject(error);
    }
  });
}

// 進捗更新リスナー
try {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'DOWNLOAD_PROGRESS') {
      const progressBar = document.getElementById('picpick-progress-bar');
      const statusText = document.getElementById('picpick-status-text');
      if (progressBar && statusText) {
        const percent = (message.current / message.total) * 100;
        progressBar.style.width = `${percent}%`;
        statusText.textContent = `ダウンロード中... ${message.current}/${message.total}`;
      }
    }
  });
} catch {
  // 拡張機能コンテキストが無効な場合は無視
}

// オーバーレイ表示/非表示のトグルリスナーを設定
function setupOverlayToggleListener(): void {
  try {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'TOGGLE_OVERLAY') {
        if (message.enabled) {
          showOverlay();
        } else {
          hideOverlay();
        }
      }
    });
  } catch {
    // 拡張機能コンテキストが無効な場合は無視
  }
}

// オーバーレイを表示
function showOverlay(): void {
  if (!overlayContainer) {
    createOverlay();
  } else {
    overlayContainer.style.display = 'block';
  }
}

// オーバーレイを非表示
function hideOverlay(): void {
  if (overlayContainer) {
    overlayContainer.style.display = 'none';
  }
}
