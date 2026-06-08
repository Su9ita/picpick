import { Settings, DEFAULT_SETTINGS, SizePreset, DEFAULT_SIZE_PRESETS } from '../types/settings';

let currentSettings: Settings = { ...DEFAULT_SETTINGS };

// ルールIDの定義
const RULE_IDS = ['patreon', 'pixiv_fanbox', 'generic'] as const;
type RuleId = typeof RULE_IDS[number];

// HTML IDとルールIDのマッピング
const HTML_TO_RULE_ID: { [key: string]: RuleId } = {
  'patreon': 'patreon',
  'fanbox': 'pixiv_fanbox',
  'generic': 'generic',
};

// DOM要素
const filenameTemplateInput = document.getElementById('filename-template') as HTMLInputElement;
const downloadFolderInput = document.getElementById('download-folder') as HTMLInputElement;
const saveGlobalSettingsBtn = document.getElementById('save-global-settings') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLParagraphElement;
const overlayEnabledCheckbox = document.getElementById('overlay-enabled') as HTMLInputElement;

// タブナビゲーション要素
const tabButtons = document.querySelectorAll('.tab-btn') as NodeListOf<HTMLButtonElement>;
const tabContents = document.querySelectorAll('.tab-content') as NodeListOf<HTMLElement>;

// グローバルテンプレート/プリセット要素
const customTemplateList = document.getElementById('custom-template-list') as HTMLDivElement;
const newTemplateInput = document.getElementById('new-template') as HTMLInputElement;
const addCustomTemplateBtn = document.getElementById('add-custom-template') as HTMLButtonElement;
const sizePresetList = document.getElementById('size-preset-list') as HTMLDivElement;
const newPresetNameInput = document.getElementById('new-preset-name') as HTMLInputElement;
const newPresetWidthInput = document.getElementById('new-preset-width') as HTMLInputElement;
const newPresetHeightInput = document.getElementById('new-preset-height') as HTMLInputElement;
const addSizePresetBtn = document.getElementById('add-size-preset') as HTMLButtonElement;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  initTabNavigation();
  initGlobalTemplateManagement();
  initGlobalPresetManagement();
  initRuleManagement();
  initOverlayToggle();
});

// タブナビゲーション初期化
function initTabNavigation(): void {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      if (tabName) {
        switchTab(tabName);
      }
    });
  });
}

// タブを切り替え
function switchTab(tabName: string): void {
  tabButtons.forEach((btn) => btn.classList.remove('active'));
  tabContents.forEach((content) => content.classList.remove('active'));

  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`) as HTMLButtonElement;
  if (activeBtn) activeBtn.classList.add('active');

  const activeContent = document.getElementById(tabName) as HTMLElement;
  if (activeContent) activeContent.classList.add('active');
}

// 設定を読み込み
async function loadSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response && !response.error) {
        const savedPresets = response.sizePresets || [];
        const savedPresetNames = new Set(savedPresets.map((p: SizePreset) => p.name));
        const newPresets = DEFAULT_SIZE_PRESETS.filter((p: SizePreset) => !savedPresetNames.has(p.name));
        const mergedPresets = [...savedPresets, ...newPresets];

        currentSettings = {
          ...DEFAULT_SETTINGS,
          ...response,
          sizePresets: mergedPresets,
          customNameTemplates: response.customNameTemplates || [],
          ruleSpecificTemplates: response.ruleSpecificTemplates || {
            'generic': [],
            'patreon': [],
            'pixiv_fanbox': [],
          },
          ruleSpecificPresets: response.ruleSpecificPresets || {
            'generic': [],
            'patreon': [],
            'pixiv_fanbox': [],
          },
        };

        filenameTemplateInput.value = currentSettings.filenameTemplate;
        downloadFolderInput.value = currentSettings.downloadFolder;

        // オーバーレイトグルの状態を設定
        if (overlayEnabledCheckbox) {
          overlayEnabledCheckbox.checked = currentSettings.overlayEnabled !== false;
        }

        renderGlobalTemplateList();
        renderGlobalPresetList();
        renderAllRuleLists();
      }
      resolve();
    });
  });
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c] || c));
}

// ========================================
// グローバルテンプレート管理
// ========================================
function initGlobalTemplateManagement(): void {
  if (addCustomTemplateBtn) {
    addCustomTemplateBtn.addEventListener('click', addGlobalTemplate);
  }
  if (newTemplateInput) {
    newTemplateInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addGlobalTemplate();
    });
  }
}

function renderGlobalTemplateList(): void {
  if (!customTemplateList) return;
  customTemplateList.innerHTML = '';

  const templates = currentSettings.customNameTemplates || [];
  if (templates.length === 0) {
    customTemplateList.innerHTML = '<p style="font-size: 11px; color: #9ca3af;">登録なし</p>';
    return;
  }

  for (let i = 0; i < templates.length; i++) {
    const name = templates[i];
    const item = document.createElement('div');
    item.className = 'template-item';
    item.innerHTML = `<span class="name">${escapeHtml(name)}</span><button class="delete-btn" data-index="${i}">×</button>`;
    customTemplateList.appendChild(item);
  }

  customTemplateList.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
      deleteGlobalTemplate(index);
    });
  });
}

function addGlobalTemplate(): void {
  if (!newTemplateInput) return;
  const name = newTemplateInput.value.trim();
  if (!name || currentSettings.customNameTemplates.includes(name)) return;

  currentSettings.customNameTemplates.push(name);
  newTemplateInput.value = '';
  renderGlobalTemplateList();
  saveSettings();
}

function deleteGlobalTemplate(index: number): void {
  currentSettings.customNameTemplates.splice(index, 1);
  renderGlobalTemplateList();
  saveSettings();
}

// ========================================
// グローバルプリセット管理
// ========================================
function initGlobalPresetManagement(): void {
  if (addSizePresetBtn) {
    addSizePresetBtn.addEventListener('click', addGlobalPreset);
  }
  if (newPresetNameInput) {
    newPresetNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addGlobalPreset();
    });
  }
}

function renderGlobalPresetList(): void {
  if (!sizePresetList) return;
  sizePresetList.innerHTML = '';

  const presets = currentSettings.sizePresets || [];
  if (presets.length === 0) {
    sizePresetList.innerHTML = '<p style="font-size: 11px; color: #9ca3af;">登録なし</p>';
    return;
  }

  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    const item = document.createElement('div');
    item.className = 'preset-item';
    item.innerHTML = `
      <span class="preset-name">${escapeHtml(preset.name)}</span>
      <span class="preset-size">${preset.minWidth}×${preset.minHeight}px</span>
      <button class="delete-btn" data-index="${i}">×</button>
    `;
    sizePresetList.appendChild(item);
  }

  sizePresetList.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
      deleteGlobalPreset(index);
    });
  });
}

function addGlobalPreset(): void {
  if (!newPresetNameInput || !newPresetWidthInput || !newPresetHeightInput) return;

  const name = newPresetNameInput.value.trim();
  const minWidth = parseInt(newPresetWidthInput.value) || 0;
  const minHeight = parseInt(newPresetHeightInput.value) || 0;

  if (!name || currentSettings.sizePresets.some(p => p.name === name)) return;

  currentSettings.sizePresets.push({ name, minWidth, minHeight });
  newPresetNameInput.value = '';
  newPresetWidthInput.value = '';
  newPresetHeightInput.value = '';
  renderGlobalPresetList();
  saveSettings();
}

function deleteGlobalPreset(index: number): void {
  currentSettings.sizePresets.splice(index, 1);
  renderGlobalPresetList();
  saveSettings();
}

// ========================================
// ルール別テンプレート/プリセット管理
// ========================================
function renderRuleTemplateList(htmlPrefix: string): void {
  const ruleId = HTML_TO_RULE_ID[htmlPrefix];
  const listDiv = document.getElementById(`${htmlPrefix}-templates-list`) as HTMLDivElement | null;
  if (!listDiv || !ruleId) return;

  const templates = currentSettings.ruleSpecificTemplates?.[ruleId] || [];
  listDiv.innerHTML = '';

  if (templates.length === 0) {
    listDiv.innerHTML = '<p style="font-size: 11px; color: #9ca3af;">登録なし</p>';
    return;
  }

  for (let i = 0; i < templates.length; i++) {
    const name = templates[i];
    const item = document.createElement('div');
    item.className = 'template-item';
    item.innerHTML = `<span class="name">${escapeHtml(name)}</span><button class="delete-btn" data-index="${i}" data-rule="${htmlPrefix}">×</button>`;
    listDiv.appendChild(item);
  }

  listDiv.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
      const rule = (e.target as HTMLElement).getAttribute('data-rule') || '';
      deleteRuleTemplate(rule, index);
    });
  });
}

function addRuleTemplate(htmlPrefix: string): void {
  const ruleId = HTML_TO_RULE_ID[htmlPrefix];
  const input = document.getElementById(`${htmlPrefix}-new-template`) as HTMLInputElement | null;
  if (!input || !ruleId) return;

  const name = input.value.trim();
  if (!name) return;

  if (!currentSettings.ruleSpecificTemplates) {
    currentSettings.ruleSpecificTemplates = {};
  }
  if (!currentSettings.ruleSpecificTemplates[ruleId]) {
    currentSettings.ruleSpecificTemplates[ruleId] = [];
  }

  if (currentSettings.ruleSpecificTemplates[ruleId].includes(name)) return;

  currentSettings.ruleSpecificTemplates[ruleId].push(name);
  input.value = '';
  renderRuleTemplateList(htmlPrefix);
  saveSettings();
}

function deleteRuleTemplate(htmlPrefix: string, index: number): void {
  const ruleId = HTML_TO_RULE_ID[htmlPrefix];
  if (!ruleId || !currentSettings.ruleSpecificTemplates?.[ruleId]) return;

  currentSettings.ruleSpecificTemplates[ruleId].splice(index, 1);
  renderRuleTemplateList(htmlPrefix);
  saveSettings();
}

function renderRulePresetList(htmlPrefix: string): void {
  const ruleId = HTML_TO_RULE_ID[htmlPrefix];
  const listDiv = document.getElementById(`${htmlPrefix}-presets-list`) as HTMLDivElement | null;
  if (!listDiv || !ruleId) return;

  const presets = currentSettings.ruleSpecificPresets?.[ruleId] || [];
  listDiv.innerHTML = '';

  if (presets.length === 0) {
    listDiv.innerHTML = '<p style="font-size: 11px; color: #9ca3af;">登録なし</p>';
    return;
  }

  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    const item = document.createElement('div');
    item.className = 'preset-item';
    item.innerHTML = `
      <span class="preset-name">${escapeHtml(preset.name)}</span>
      <span class="preset-size">${preset.minWidth}×${preset.minHeight}px</span>
      <button class="delete-btn" data-index="${i}" data-rule="${htmlPrefix}">×</button>
    `;
    listDiv.appendChild(item);
  }

  listDiv.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
      const rule = (e.target as HTMLElement).getAttribute('data-rule') || '';
      deleteRulePreset(rule, index);
    });
  });
}

function addRulePreset(htmlPrefix: string): void {
  const ruleId = HTML_TO_RULE_ID[htmlPrefix];
  const nameInput = document.getElementById(`${htmlPrefix}-new-preset-name`) as HTMLInputElement | null;
  const widthInput = document.getElementById(`${htmlPrefix}-new-preset-width`) as HTMLInputElement | null;
  const heightInput = document.getElementById(`${htmlPrefix}-new-preset-height`) as HTMLInputElement | null;
  if (!nameInput || !widthInput || !heightInput || !ruleId) return;

  const name = nameInput.value.trim();
  const minWidth = parseInt(widthInput.value) || 0;
  const minHeight = parseInt(heightInput.value) || 0;
  if (!name) return;

  if (!currentSettings.ruleSpecificPresets) {
    currentSettings.ruleSpecificPresets = {};
  }
  if (!currentSettings.ruleSpecificPresets[ruleId]) {
    currentSettings.ruleSpecificPresets[ruleId] = [];
  }

  if (currentSettings.ruleSpecificPresets[ruleId].some(p => p.name === name)) return;

  currentSettings.ruleSpecificPresets[ruleId].push({ name, minWidth, minHeight });
  nameInput.value = '';
  widthInput.value = '';
  heightInput.value = '';
  renderRulePresetList(htmlPrefix);
  saveSettings();
}

function deleteRulePreset(htmlPrefix: string, index: number): void {
  const ruleId = HTML_TO_RULE_ID[htmlPrefix];
  if (!ruleId || !currentSettings.ruleSpecificPresets?.[ruleId]) return;

  currentSettings.ruleSpecificPresets[ruleId].splice(index, 1);
  renderRulePresetList(htmlPrefix);
  saveSettings();
}

function renderAllRuleLists(): void {
  for (const htmlPrefix of Object.keys(HTML_TO_RULE_ID)) {
    renderRuleTemplateList(htmlPrefix);
    renderRulePresetList(htmlPrefix);
  }
}

function initRuleManagement(): void {
  // Patreon
  document.getElementById('patreon-add-template')?.addEventListener('click', () => addRuleTemplate('patreon'));
  document.getElementById('patreon-add-preset')?.addEventListener('click', () => addRulePreset('patreon'));

  // Pixiv Fanbox
  document.getElementById('fanbox-add-template')?.addEventListener('click', () => addRuleTemplate('fanbox'));
  document.getElementById('fanbox-add-preset')?.addEventListener('click', () => addRulePreset('fanbox'));

  // Generic
  document.getElementById('generic-add-template')?.addEventListener('click', () => addRuleTemplate('generic'));
  document.getElementById('generic-add-preset')?.addEventListener('click', () => addRulePreset('generic'));
}

// ========================================
// オーバーレイトグル管理
// ========================================
function initOverlayToggle(): void {
  if (overlayEnabledCheckbox) {
    overlayEnabledCheckbox.addEventListener('change', async () => {
      currentSettings.overlayEnabled = overlayEnabledCheckbox.checked;
      await saveSettings();

      // 全てのタブにオーバーレイの表示/非表示を通知
      try {
        chrome.tabs.query({}, (tabs) => {
          for (const tab of tabs) {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'TOGGLE_OVERLAY',
                enabled: currentSettings.overlayEnabled,
              }).catch(() => {
                // タブが対応していない場合は無視
              });
            }
          }
        });
      } catch (error) {
        console.error('Failed to notify tabs:', error);
      }
    });
  }
}

// ========================================
// 設定保存
// ========================================
async function saveSettings(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings: currentSettings,
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// グローバル設定保存ボタン
if (saveGlobalSettingsBtn) {
  saveGlobalSettingsBtn.addEventListener('click', async () => {
    currentSettings.filenameTemplate = filenameTemplateInput.value || DEFAULT_SETTINGS.filenameTemplate;
    currentSettings.downloadFolder = downloadFolderInput.value || DEFAULT_SETTINGS.downloadFolder;

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
}
