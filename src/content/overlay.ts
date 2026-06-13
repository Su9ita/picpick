// オーバーレイUIを作成・管理
import { getExtractor, detectSite } from '../extractors';
import { filterImages, filterNearDuplicateImages } from '../utils/image-filter';
import { autoScrollToLoadAll } from '../utils/auto-scroller';
import { Settings, DEFAULT_SETTINGS, SizePreset, RuleSessionSettings } from '../types/settings';
import { ImageInfo } from '../types/image-info';
import { getRuleFilenamePresets, getSelectedFilenamePreset, normalizeSettings } from '../utils/settings-normalizer';
import { generateFilename, applyDateToTemplate } from '../utils/filename-template';

let overlayContainer: HTMLDivElement | null = null;
let isDownloading = false;
let scannedImages: ImageInfo[] = [];
let currentSettings: Settings = { ...DEFAULT_SETTINGS };
let suppressNextOverlayClick = false;
let overlayGhosted = false;

const OVERLAY_POSITION_KEY = 'picpickOverlayPosition';
const RULE_TAB_ORDER = ['x', 'patreon', 'pixiv_fanbox', 'generic'];

function getRuleIdForCurrentPage(url: string): string {
  const site = detectSite(url);
  if (site === 'pixiv' || site === 'fanbox') return 'pixiv_fanbox';
  return site === 'unknown' ? 'generic' : site;
}

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
      #picpick-btn.picpick-ghosted {
        opacity: 0.14;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.18);
      }
      #picpick-btn.picpick-ghosted:hover {
        opacity: 0.24;
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
        width: 460px;
        max-width: 90vw;
        max-height: min(760px, calc(100vh - 40px));
        overflow-y: auto;
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
      .picpick-save-destination {
        margin-bottom: 8px;
      }
      .picpick-save-destination label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 4px;
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
      .picpick-rule-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 10px;
      }
      .picpick-rule-tab {
        height: 38px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #ffffff;
        color: #4b5563;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, color 0.16s ease;
      }
      .picpick-rule-tab:hover {
        border-color: #a5b4fc;
        background: #f8fafc;
      }
      .picpick-rule-tab.active {
        border-color: #6366f1;
        color: #4f46e5;
        background: #eef2ff;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      }
      .picpick-rule-tab svg {
        width: 22px;
        height: 22px;
        fill: currentColor;
      }
      .picpick-rule-tab .picpick-icon-stroke {
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .picpick-visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
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
        font-size: 12px;
        color: #6b7280;
        margin-top: 8px;
        padding: 8px;
        background: #f9fafb;
        border-radius: 6px;
        overflow-wrap: anywhere;
      }
      .picpick-preview span {
        color: #6366f1;
        font-family: monospace;
      }
      .picpick-include-date-row {
        margin: 14px 0 16px;
        padding: 10px 0;
      }
      .picpick-include-date-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #374151;
        cursor: pointer;
      }
      .picpick-include-date-label input[type="checkbox"] {
        flex: 0 0 auto;
        width: auto;
        margin: 0;
        cursor: pointer;
      }
      .picpick-filter-section {
        margin: 0 0 14px;
        padding: 10px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }
      .picpick-filter-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #374151;
        cursor: pointer;
      }
      .picpick-filter-row input[type="checkbox"] {
        width: auto;
        margin: 0;
      }
      .picpick-filter-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 8px;
      }
      .picpick-filter-field label {
        display: block;
        font-size: 11px;
        color: #6b7280;
        margin-bottom: 3px;
      }
      .picpick-filter-field input {
        width: 100%;
        padding: 6px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        box-sizing: border-box;
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

        <!-- サイトルール選択 -->
        <div style="margin-bottom: 10px;">
          <div id="picpick-rule-tabs" class="picpick-rule-tabs" role="tablist" aria-label="サイトルール"></div>
          <select id="picpick-rule-select" class="picpick-visually-hidden" aria-hidden="true" tabindex="-1">
            <option value="generic"></option>
          </select>
        </div>

        <div class="picpick-include-date-row">
          <label class="picpick-include-date-label">
            <input type="checkbox" id="picpick-include-date">
            <span>日付をいれる</span>
          </label>
        </div>

        <!-- 保存名プリセット -->
        <div class="picpick-naming-section">
          <div style="margin-bottom: 8px;">
            <label style="display: block; font-size: 12px; font-weight: 500; color: #374151; margin-bottom: 4px;">保存名プリセット</label>
            <select id="picpick-filename-preset-select" class="picpick-preset-select"></select>
          </div>
          <div id="picpick-custom-name-section" class="picpick-custom-name-section">
            <div class="picpick-custom-name-row">
              <input type="text" id="picpick-custom-name" placeholder="ファイル名を入力" class="picpick-custom-input">
            </div>
          </div>
          <div class="picpick-preview">
            保存結果: <span id="picpick-filename-preview">2026-04-08_name_01.jpg</span>
          </div>
        </div>
        <select id="picpick-preset-select" class="picpick-preset-select">
          <option value="">カスタム</option>
        </select>
        <div class="picpick-size-inputs">
          <div class="picpick-size-input">
            <label>最小横幅 (px)</label>
            <input type="number" id="picpick-min-width" min="0" value="800">
          </div>
        </div>
        <div class="picpick-filter-section">
          <label class="picpick-filter-row">
            <input type="checkbox" id="picpick-advanced-filters">
            <span>ルールフィルタ</span>
          </label>
          <div class="picpick-filter-grid">
            <div class="picpick-filter-field">
              <label>横長上限</label>
              <input type="number" id="picpick-max-aspect" min="0.1" step="0.1">
            </div>
            <div class="picpick-filter-field">
              <label>pHash距離</label>
              <input type="number" id="picpick-phash-threshold" min="0" max="32" step="1">
            </div>
          </div>
        </div>
        <div class="picpick-save-destination">
          <label>保存先</label>
          <select id="picpick-save-destination-select" class="picpick-preset-select">
            <option value="default">デフォルト</option>
            <option value="choose">保存場所を選択</option>
          </select>
        </div>
        <button class="picpick-dialog-btn picpick-dialog-btn-rescan" id="picpick-rescan-btn">再スキャン</button>
        
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
    btn.addEventListener('mousedown', (event) => {
      if (event.button === 1) {
        event.preventDefault();
      }
    });
    btn.addEventListener('auxclick', (event) => {
      if (event.button !== 1) return;
      event.preventDefault();
      event.stopPropagation();
      toggleOverlayGhosted();
    });
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
  const advancedFiltersInput = document.getElementById('picpick-advanced-filters') as HTMLInputElement;
  const maxAspectInput = document.getElementById('picpick-max-aspect') as HTMLInputElement;
  const pHashThresholdInput = document.getElementById('picpick-phash-threshold') as HTMLInputElement;

  const rescanBtn = document.getElementById('picpick-rescan-btn');

  cancelBtn?.addEventListener('click', hideConfirmDialog);
  confirmBtn?.addEventListener('click', handleConfirmDownload);
  rescanBtn?.addEventListener('click', handleRescan);

  presetSelect?.addEventListener('change', () => {
    const selectedPreset = currentSettings.sizePresets.find(p => p.name === presetSelect.value);
    if (selectedPreset) {
      minWidthInput.value = String(selectedPreset.minWidth);
    }
    updateFilteredCount();
  });

  minWidthInput?.addEventListener('input', () => {
    presetSelect.value = '';
    updateFilteredCount();
  });
  advancedFiltersInput?.addEventListener('change', updateFilteredCount);
  maxAspectInput?.addEventListener('input', updateFilteredCount);
  pHashThresholdInput?.addEventListener('input', updateFilteredCount);

  // カスタム名モードのイベント
  const customNameSection = document.getElementById('picpick-custom-name-section') as HTMLDivElement;
  const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
  const filenamePresetSelect = document.getElementById('picpick-filename-preset-select') as HTMLSelectElement;
  const saveDestinationSelect = document.getElementById('picpick-save-destination-select') as HTMLSelectElement;

  filenamePresetSelect?.addEventListener('change', () => {
    const ruleId = currentSettings.activeRuleId || 'generic';
    if (!currentSettings.ruleSessionSettings) currentSettings.ruleSessionSettings = {};
    if (!currentSettings.ruleSessionSettings[ruleId]) {
      currentSettings.ruleSessionSettings[ruleId] = {} as RuleSessionSettings;
    }
    currentSettings.ruleSessionSettings[ruleId] = {
      ...currentSettings.ruleSessionSettings[ruleId],
      selectedFilenamePresetId: filenamePresetSelect.value,
      namingMode: getSelectedFilenamePreset(currentSettings, ruleId).template.includes('{custom}') ? 'custom' : 'template',
      customName: customNameInput?.value || '',
      selectedPreset: (document.getElementById('picpick-preset-select') as HTMLSelectElement)?.value || '',
    };
    currentSettings.namingMode = currentSettings.ruleSessionSettings[ruleId]!.namingMode;
    updateCustomNameVisibility();
    updateOverlayFilenamePreview();
  });

  // カスタム名入力
  customNameInput?.addEventListener('input', () => {
    updateFilenamePresetDropdown(false);
    updateOverlayFilenamePreview();
  });

  saveDestinationSelect?.addEventListener('change', async () => {
    currentSettings.selectedDownloadFolderPresetId = saveDestinationSelect.value;
  });

  const includeDateCheckbox = document.getElementById('picpick-include-date') as HTMLInputElement;
  includeDateCheckbox?.addEventListener('change', () => {
    currentSettings.includeDateInFilename = includeDateCheckbox.checked;
    updateFilenamePresetDropdown(false);
    updateOverlayFilenamePreview();
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
    currentSettings.activeRuleId = getRuleIdForCurrentPage(url);
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
    currentSettings.activeRuleId = getRuleIdForCurrentPage(url);
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

function toggleOverlayGhosted(): void {
  const btn = document.getElementById('picpick-btn');
  if (!btn) return;

  overlayGhosted = !overlayGhosted;
  btn.classList.toggle('picpick-ghosted', overlayGhosted);
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
  const overlayWidth = overlayContainer.offsetWidth || 44;
  const fromRight = window.innerWidth - position.left - overlayWidth;
  overlayContainer.style.right = `${fromRight}px`;
  overlayContainer.style.top = `${position.top}px`;
  overlayContainer.style.left = 'auto';
}

function restoreOverlayPosition(): void {
  if (!isExtensionContextValid()) return;

  try {
    chrome.storage.sync.get(OVERLAY_POSITION_KEY, (result) => {
      const position = result?.[OVERLAY_POSITION_KEY];
      if (!position || typeof position.top !== 'number') return;

      if (typeof position.fromRight === 'number' && overlayContainer) {
        // 新フォーマット: 右端からの距離で復元（ウィンドウサイズ変化に追従）
        overlayContainer.style.right = `${position.fromRight}px`;
        overlayContainer.style.top = `${position.top}px`;
        overlayContainer.style.left = 'auto';
      } else if (typeof position.left === 'number') {
        // 旧フォーマット: 互換性のため一度だけ変換して適用
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
  const overlayWidth = overlayContainer?.offsetWidth || 44;
  const fromRight = window.innerWidth - position.left - overlayWidth;
  try {
    chrome.storage.sync.set({
      [OVERLAY_POSITION_KEY]: { fromRight, top: position.top },
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
  const ruleSelect = document.getElementById('picpick-rule-select') as HTMLSelectElement;
  const advancedFiltersInput = document.getElementById('picpick-advanced-filters') as HTMLInputElement;
  const maxAspectInput = document.getElementById('picpick-max-aspect') as HTMLInputElement;
  const pHashThresholdInput = document.getElementById('picpick-phash-threshold') as HTMLInputElement;

  if (!dialog || !countEl || !presetSelect || !minWidthInput) return;

  // サイトルール選択肢を初期化
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
  }
  renderRuleTabs();

  // プリセット選択肢を更新（ルール別プリセット含む）
  updatePresetDropdown();

  // 現在の設定を反映
  if (currentSettings.selectedPreset) {
    presetSelect.value = currentSettings.selectedPreset;
  }
  minWidthInput.value = String(currentSettings.minWidth);
  if (advancedFiltersInput) advancedFiltersInput.checked = currentSettings.advancedImageFiltersEnabled !== false;
  if (maxAspectInput) maxAspectInput.value = String(currentSettings.maxAspectRatio ?? DEFAULT_SETTINGS.maxAspectRatio);
  if (pHashThresholdInput) pHashThresholdInput.value = String(currentSettings.pHashDistanceThreshold ?? DEFAULT_SETTINGS.pHashDistanceThreshold);

  // 日付チェックボックスの初期値を設定
  const includeDateCheckbox = document.getElementById('picpick-include-date') as HTMLInputElement;
  if (includeDateCheckbox) {
    includeDateCheckbox.checked = currentSettings.includeDateInFilename !== false;
  }

  updateFilteredCount();
  initOverlayNamingMode();
  updateSaveDestinationDropdown();
  dialog.classList.add('show');
}

function renderRuleTabs(): void {
  const tabs = document.getElementById('picpick-rule-tabs');
  const ruleSelect = document.getElementById('picpick-rule-select') as HTMLSelectElement;
  if (!tabs) return;

  const rules = currentSettings.siteRules || [];
  const orderedRules = [
    ...RULE_TAB_ORDER
      .map((ruleId) => rules.find((rule) => rule.siteId === ruleId))
      .filter((rule): rule is NonNullable<typeof rule> => Boolean(rule)),
    ...rules.filter((rule) => !RULE_TAB_ORDER.includes(rule.siteId)),
  ];

  tabs.innerHTML = '';
  for (const rule of orderedRules) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'picpick-rule-tab';
    button.dataset.ruleId = rule.siteId;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-label', rule.label);
    button.innerHTML = getRuleIconSvg(rule.siteId);
    button.addEventListener('click', () => {
      if (ruleSelect) ruleSelect.value = rule.siteId;
      switchRule(rule.siteId);
    });
    tabs.appendChild(button);
  }

  updateRuleTabsActive();
}

function updateRuleTabsActive(): void {
  const activeRuleId = currentSettings.activeRuleId || 'generic';
  document.querySelectorAll<HTMLButtonElement>('.picpick-rule-tab').forEach((tab) => {
    const isActive = tab.dataset.ruleId === activeRuleId;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
}

function getRuleIconSvg(ruleId: string): string {
  if (ruleId === 'x') {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h4.7l4.8 6.5L18.1 3H21l-7.1 8.2L21.4 21h-4.7l-5.1-6.9L5.7 21H2.8l7.4-8.6L3 3zm3.1 1.8 11.5 14.4h1.7L7.8 4.8H6.1z"/></svg>`;
  }
  if (ruleId === 'patreon') {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h4v18H4V3zm8 0h2.7a5.7 5.7 0 1 1 0 11.4H12V3z"/></svg>`;
  }
  if (ruleId === 'pixiv_fanbox') {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5V4zm3 3v10h2.2v-3.6h3.6v-2H10.2V9.1h5.2V7H8z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="picpick-icon-stroke" d="M12 3v18M3 12h18M5.6 5.6c3.5 2 9.3 2 12.8 0M5.6 18.4c3.5-2 9.3-2 12.8 0"/><circle class="picpick-icon-stroke" cx="12" cy="12" r="9"/></svg>`;
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
    option.textContent = `${preset.minWidth}px`;
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
      option.textContent = `${preset.minWidth}px`;
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
    const filenamePresetSelect = document.getElementById('picpick-filename-preset-select') as HTMLSelectElement;
    const selectedFilenamePresetId = filenamePresetSelect?.value;
    const selectedFilenamePreset = getRuleFilenamePresets(currentSettings, currentSettings.activeRuleId)
      .find((preset) => preset.id === selectedFilenamePresetId);
    const namingMode = selectedFilenamePreset?.template.includes('{custom}') ? 'custom' : 'template';

    if (!currentSettings.ruleSessionSettings[currentSettings.activeRuleId]) {
      currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {} as RuleSessionSettings;
    }
    currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {
      customName,
      selectedPreset,
      namingMode,
      selectedFilenamePresetId,
    };
  }

  // 新しいルールに切り替え
  currentSettings.activeRuleId = ruleId;
  const ruleSelect = document.getElementById('picpick-rule-select') as HTMLSelectElement;
  if (ruleSelect) ruleSelect.value = ruleId;
  updateRuleTabsActive();

  // プリセットドロップダウンを更新
  updatePresetDropdown();
  updateFilenamePresetDropdown();
  updateSaveDestinationDropdown();

  // 新しいルールの設定を復元
  const ruleSetting = currentSettings.ruleSessionSettings?.[ruleId];
  if (ruleSetting) {
    const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
    const presetSelect = document.getElementById('picpick-preset-select') as HTMLSelectElement;

    if (customNameInput) customNameInput.value = ruleSetting.customName;
    if (presetSelect) presetSelect.value = ruleSetting.selectedPreset;

    // UIを更新
    updateFilteredCount();
    initOverlayNamingMode();
  }

  updateFilteredCount();
  updateCustomNameVisibility();
  updateOverlayFilenamePreview();
}

// 確認ダイアログを非表示
function hideConfirmDialog(): void {
  const dialog = document.getElementById('picpick-confirm-dialog');
  dialog?.classList.remove('show');
}

// フィルター後の枚数を更新
function updateFilteredCount(): void {
  const minWidthInput = document.getElementById('picpick-min-width') as HTMLInputElement;
  const countEl = document.getElementById('picpick-dialog-count');
  const scannedEl = document.getElementById('picpick-dialog-scanned');
  const imageListEl = document.getElementById('picpick-image-list');

  if (!minWidthInput || !countEl || !scannedEl || !imageListEl) return;

  const tempSettings: Settings = {
    ...currentSettings,
    minWidth: parseInt(minWidthInput.value) || 0,
    minHeight: 0,
    ...readAdvancedFilterInputs(),
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

function readAdvancedFilterInputs(): Partial<Settings> {
  const advancedFiltersInput = document.getElementById('picpick-advanced-filters') as HTMLInputElement;
  const maxAspectInput = document.getElementById('picpick-max-aspect') as HTMLInputElement;
  const pHashThresholdInput = document.getElementById('picpick-phash-threshold') as HTMLInputElement;

  return {
    advancedImageFiltersEnabled: advancedFiltersInput ? advancedFiltersInput.checked : currentSettings.advancedImageFiltersEnabled,
    aspectRatioFilterEnabled: true,
    maxAspectRatio: parseFloat(maxAspectInput?.value || '') || DEFAULT_SETTINGS.maxAspectRatio,
    pHashDistanceThreshold: parseInt(pHashThresholdInput?.value || '', 10) || DEFAULT_SETTINGS.pHashDistanceThreshold,
    keywordFilterEnabled: true,
    positionHeuristicFilterEnabled: true,
    pHashDuplicateFilterEnabled: true,
  };
}



// オーバーレイのファイル名プレビューを更新
function updateOverlayFilenamePreview(): void {
  const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
  const includeDateCheckbox = document.getElementById('picpick-include-date') as HTMLInputElement;
  const previewEl = document.getElementById('picpick-filename-preview');
  if (!previewEl) return;

  const name = customNameInput?.value.trim() || 'name';
  const ruleId = currentSettings.activeRuleId || 'generic';
  const preset = getSelectedFilenamePreset(currentSettings, ruleId);
  const includeDate = includeDateCheckbox ? includeDateCheckbox.checked : (currentSettings.includeDateInFilename !== false);
  const template = applyDateToTemplate(preset.template, includeDate);
  const previewImage = scannedImages[0] || createPreviewImageInfo();
  previewEl.textContent = generateFilename(template, previewImage, 1, name);
}

function createPreviewImageInfo(): ImageInfo {
  return {
    url: 'https://example.invalid/image.jpg',
    originalUrl: 'https://example.invalid/image.jpg',
    width: 1200,
    height: 1600,
    index: 1,
    metadata: {
      creator: 'creator',
      postTitle: 'title',
      postId: 'post',
      postDate: new Date(),
      originalFilename: 'image.jpg',
    },
  };
}

function updateFilenamePresetDropdown(resetToSaved: boolean = true): void {
  const select = document.getElementById('picpick-filename-preset-select') as HTMLSelectElement;
  if (!select) return;

  const ruleId = currentSettings.activeRuleId || 'generic';
  const presets = getRuleFilenamePresets(currentSettings, ruleId);
  const selectedId = resetToSaved
    ? currentSettings.ruleSessionSettings?.[ruleId]?.selectedFilenamePresetId || presets[0]?.id || ''
    : select.value || currentSettings.ruleSessionSettings?.[ruleId]?.selectedFilenamePresetId || presets[0]?.id || '';

  select.innerHTML = '';
  presets.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = `${getFilenamePresetDisplayLabel(preset.label, preset.template)}: ${getFilenamePresetPreview(preset.template)}`;
    select.appendChild(option);
  });

  select.value = selectedId;
  if (!select.value && presets[0]) {
    select.value = presets[0].id;
  }
  updateCustomNameVisibility();
}

function getFilenamePresetDisplayLabel(label: string, template: string): string {
  if (template.includes('{custom}')) {
    return label.includes('連番') ? 'カスタム + 連番' : 'カスタム';
  }
  return label.replace(/\s*標準$/, ' 標準');
}

function getFilenamePresetPreview(template: string): string {
  const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
  const includeDateCheckbox = document.getElementById('picpick-include-date') as HTMLInputElement;
  const includeDate = includeDateCheckbox ? includeDateCheckbox.checked : (currentSettings.includeDateInFilename !== false);
  const resolvedTemplate = applyDateToTemplate(template, includeDate);
  const previewImage = scannedImages[0] || createPreviewImageInfo();
  const customName = customNameInput?.value.trim() || 'name';
  return generateFilename(resolvedTemplate, previewImage, 1, customName);
}

function updateSaveDestinationDropdown(): void {
  const select = document.getElementById('picpick-save-destination-select') as HTMLSelectElement;
  if (!select) return;

  const selectedId = currentSettings.selectedDownloadFolderPresetId || 'downloads';
  select.innerHTML = '';

  const downloadsOption = document.createElement('option');
  downloadsOption.value = 'downloads';
  downloadsOption.textContent = 'ダウンロードフォルダ';
  select.appendChild(downloadsOption);

  for (const preset of currentSettings.downloadFolderPresets || []) {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.label || preset.folder;
    select.appendChild(option);
  }

  select.value = Array.from(select.options).some((option) => option.value === selectedId)
    ? selectedId
    : 'downloads';
  currentSettings.selectedDownloadFolderPresetId = select.value;
}

function updateCustomNameVisibility(): void {
  const customNameSection = document.getElementById('picpick-custom-name-section') as HTMLDivElement;
  const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
  const ruleId = currentSettings.activeRuleId || 'generic';
  const preset = getSelectedFilenamePreset(currentSettings, ruleId);
  if (customNameSection) {
    customNameSection.style.display = preset.template.includes('{custom}') ? 'block' : 'none';
  }
  if (customNameInput) {
    customNameInput.placeholder = preset.template.includes('第{custom}話')
      ? '例: 015'
      : 'ファイル名を入力';
  }
}

// オーバーレイのカスタム名モードを初期化
function initOverlayNamingMode(): void {
  updateCustomNameVisibility();

  updateFilenamePresetDropdown();
  updateSaveDestinationDropdown();
  updateOverlayFilenamePreview();
}

// 保存確認
async function handleConfirmDownload(): Promise<void> {
  if (isDownloading) return;

  // クリック直後に確認ボタンを即座に無効化して二重クリックを防止
  const confirmBtnEl = document.getElementById('picpick-confirm-btn') as HTMLButtonElement;
  if (confirmBtnEl) confirmBtnEl.disabled = true;

  const btn = document.getElementById('picpick-btn') as HTMLButtonElement;
  const status = document.getElementById('picpick-status');
  const statusText = document.getElementById('picpick-status-text');
  const progressBar = document.getElementById('picpick-progress-bar');
  const presetSelect = document.getElementById('picpick-preset-select') as HTMLSelectElement;
  const minWidthInput = document.getElementById('picpick-min-width') as HTMLInputElement;

  if (!btn || !status || !statusText || !progressBar || !minWidthInput) {
    if (confirmBtnEl) confirmBtnEl.disabled = false;
    return;
  }

  // 【新規】ダウンロード前にルール設定を保存
  if (currentSettings.activeRuleId && currentSettings.ruleSessionSettings) {
    const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
    const filenamePresetSelect = document.getElementById('picpick-filename-preset-select') as HTMLSelectElement;
    const customName = customNameInput?.value || '';
    const selectedPreset = presetSelect?.value || '';
    const selectedFilenamePresetId = filenamePresetSelect?.value;
    const selectedFilenamePreset = getRuleFilenamePresets(currentSettings, currentSettings.activeRuleId)
      .find((preset) => preset.id === selectedFilenamePresetId);
    const namingMode = selectedFilenamePreset?.template.includes('{custom}') ? 'custom' : 'template';

    if (!currentSettings.ruleSessionSettings[currentSettings.activeRuleId]) {
      currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {} as RuleSessionSettings;
    }
    currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {
      customName,
      selectedPreset,
      namingMode,
      selectedFilenamePresetId,
    };
    currentSettings.namingMode = namingMode;
  }

  // 日付チェックボックスの状態を settings に反映
  const includeDateCheckboxFinal = document.getElementById('picpick-include-date') as HTMLInputElement;
  if (includeDateCheckboxFinal) {
    currentSettings.includeDateInFilename = includeDateCheckboxFinal.checked;
  }

  hideConfirmDialog();

  isDownloading = true;
  btn.disabled = true;
  btn.classList.add('picpick-loading');
  status.classList.add('show');

  // 設定を更新
  const settings: Settings = normalizeSettings({
    ...currentSettings,
    minWidth: parseInt(minWidthInput.value) || 0,
    minHeight: 0,
    selectedPreset: presetSelect?.value || '',
    ...readAdvancedFilterInputs(),
  });

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

    // pixiv CDN 画像はコンテンツスクリプト経由でプリフェッチ
    // (service worker から直接 fetch しても Referer が設定されないため)
    let imagesToDownload = await prefetchPixivImages(filteredImages, (current, total) => {
      statusText.textContent = `画像を取得中... ${current}/${total}`;
    });

    // FANBOX 画像も同様にプリフェッチ（Referer + Cookie が必要）
    imagesToDownload = await prefetchFanboxImages(imagesToDownload, (current, total) => {
      statusText.textContent = `画像を取得中... ${current}/${total}`;
    });

    const pHashResult = await filterNearDuplicateImages(imagesToDownload, settings);
    imagesToDownload = pHashResult.passed;

    if (imagesToDownload.length === 0) {
      statusText.textContent = '近似重複フィルタ後に保存対象がありません';
      setTimeout(() => status.classList.remove('show'), 2000);
      return;
    }

    // ダウンロード実行
    if (!isExtensionContextValid()) {
      throw new Error('拡張機能が更新されました。ページを再読み込みしてください。');
    }

    const customNameInput = document.getElementById('picpick-custom-name') as HTMLInputElement;
    const customName = customNameInput?.value.trim() || undefined;

    const sendMsgPromise = new Promise<{ error?: string; success?: number; failed?: number }>((resolve, reject) => {
      try {
        chrome.runtime.sendMessage({
          type: 'DOWNLOAD_IMAGES',
          images: imagesToDownload,
          settings,
          customName,
          saveAs: false,
          waitForCompletion: false,
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
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('タイムアウトしました。ページを再読み込みしてください。')), 15000)
    );
    const result = await Promise.race([sendMsgPromise, timeoutPromise]);

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
    const confirmBtnFinal = document.getElementById('picpick-confirm-btn') as HTMLButtonElement;
    if (confirmBtnFinal) confirmBtnFinal.disabled = false;
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
          resolve(normalizeSettings(response));
        } else {
          resolve(normalizeSettings(DEFAULT_SETTINGS));
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

// pixiv CDN 画像をコンテンツスクリプト経由でプリフェッチする
// コンテンツスクリプトは pixiv ページ上で動作するため、
// ブラウザが自動的に Referer: https://www.pixiv.net/ を付与する
async function prefetchPixivImages(
  images: ImageInfo[],
  onProgress?: (current: number, total: number) => void
): Promise<ImageInfo[]> {
  const pixivIndices = images
    .map((img, i) => i)
    .filter((i) => images[i].url.includes('i.pximg.net'));

  if (pixivIndices.length === 0) return images;

  const result = [...images];
  let fetched = 0;

  for (const i of pixivIndices) {
    try {
      const response = await fetch(images[i].url, {
        credentials: 'omit',
        cache: 'no-store',
        referrer: 'https://www.pixiv.net/',
        referrerPolicy: 'strict-origin-when-cross-origin',
      });
      if (response.ok) {
        const blobData = await response.arrayBuffer();
        const blobMimeType = response.headers.get('content-type') || 'image/jpeg';
        if (isValidImageResponse(blobMimeType, blobData)) {
          result[i] = { ...images[i], blobData, blobMimeType, downloadReferrer: 'https://www.pixiv.net/' };
        }
      }
    } catch {
      // service worker 側の referrer fetch にフォールバック
    }
    fetched++;
    onProgress?.(fetched, pixivIndices.length);
  }

  return result;
}

// FANBOX 原寸画像（downloads.fanbox.cc）をコンテンツスクリプト経由でプリフェッチする。
// コンテンツスクリプトは fanbox.cc 上で動作するため、Referer と Cookie が正しく付与される。
async function prefetchFanboxImages(
  images: ImageInfo[],
  onProgress?: (current: number, total: number) => void
): Promise<ImageInfo[]> {
  const fanboxIndices = images
    .map((_img, i) => i)
    .filter((i) => !images[i].blobData && isFanboxDownloadUrl(images[i].url));

  if (fanboxIndices.length === 0) return images;

  const result = [...images];
  let fetched = 0;

  for (const i of fanboxIndices) {
    try {
      const response = await fetch(images[i].url, {
        credentials: 'include',
        cache: 'no-store',
        referrer: 'https://www.fanbox.cc/',
        referrerPolicy: 'strict-origin-when-cross-origin',
      });
      if (response.ok) {
        const blobData = await response.arrayBuffer();
        const blobMimeType = response.headers.get('content-type') || 'image/jpeg';
        if (isValidImageResponse(blobMimeType, blobData)) {
          result[i] = { ...images[i], blobData, blobMimeType, downloadReferrer: 'https://www.fanbox.cc/' };
        }
      }
    } catch {
      // service worker 側のダウンロードにフォールバック
    }
    fetched++;
    onProgress?.(fetched, fanboxIndices.length);
  }

  return result;
}

function isFanboxDownloadUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'downloads.fanbox.cc';
  } catch {
    return false;
  }
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
