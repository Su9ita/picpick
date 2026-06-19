import { DEFAULT_SETTINGS, DownloadFolderPreset, FilenamePreset, Settings, SizePreset } from '../types/settings';
import { SiteRule } from '../types/site-rules';
import { getDefaultDownloadFolderLabel, getRuleFilenamePresets, normalizeSettings } from '../utils/settings-normalizer';

let currentSettings: Settings = normalizeSettings(DEFAULT_SETTINGS);

const tabButtons = document.querySelectorAll('.tab-btn') as NodeListOf<HTMLButtonElement>;
const tabContents = document.querySelectorAll('.tab-content') as NodeListOf<HTMLElement>;

const activeRuleSelect = document.getElementById('active-rule') as HTMLSelectElement;
const ruleDescription = document.getElementById('rule-description') as HTMLElement;
const ruleVariables = document.getElementById('rule-variables') as HTMLDivElement;
const filenamePresetList = document.getElementById('filename-preset-list') as HTMLDivElement;
const newFilenamePresetLabel = document.getElementById('new-filename-preset-label') as HTMLInputElement;
const newFilenamePresetTemplate = document.getElementById('new-filename-preset-template') as HTMLInputElement;
const addFilenamePresetBtn = document.getElementById('add-filename-preset') as HTMLButtonElement;

const downloadFolderPresetList = document.getElementById('download-folder-preset-list') as HTMLDivElement;
const defaultDownloadFolderLabelInput = document.getElementById('default-download-folder-label') as HTMLInputElement;
const defaultDownloadFolderPathInput = document.getElementById('default-download-folder-path') as HTMLInputElement;
const newDownloadFolderPresetInput = document.getElementById('new-download-folder-preset') as HTMLInputElement;
const addDownloadFolderPresetBtn = document.getElementById('add-download-folder-preset') as HTMLButtonElement;
const scanScrollEnabledCheckbox = document.getElementById('scan-scroll-enabled') as HTMLInputElement;
const saveGlobalSettingsBtn = document.getElementById('save-global-settings') as HTMLButtonElement;
const overlayEnabledCheckbox = document.getElementById('overlay-enabled') as HTMLInputElement;

const sizePresetList = document.getElementById('size-preset-list') as HTMLDivElement;
const newPresetWidthInput = document.getElementById('new-preset-width') as HTMLInputElement;
const addSizePresetBtn = document.getElementById('add-size-preset') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLParagraphElement;

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  initTabNavigation();
  initRuleEditor();
  initGlobalSettings();
  initSizePresetManagement();
});

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] || c));
}

function makePresetId(label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset';
  return `user-${Date.now()}-${slug}`;
}

function isBuiltInFilenamePreset(id: string): boolean {
  return id === 'default' || id === 'manual' || id === 'custom-index';
}

function getActiveRuleId(): string {
  return activeRuleSelect?.value || currentSettings.activeRuleId || 'generic';
}

function getActiveRule(): SiteRule | undefined {
  const ruleId = getActiveRuleId();
  return currentSettings.siteRules?.find((rule) => rule.siteId === ruleId);
}

async function loadSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      currentSettings = normalizeSettings(response && !response.error ? response : DEFAULT_SETTINGS);
      renderAll();
      resolve();
    });
  });
}

function renderAll(): void {
  renderRuleSelect();
  renderRuleDetails();
  renderGlobalSettings();
  renderSizePresetList();
  renderDownloadFolderPresetList();
}

function initTabNavigation(): void {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      if (!tabName) return;
      tabButtons.forEach((button) => button.classList.remove('active'));
      tabContents.forEach((content) => content.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(tabName)?.classList.add('active');
    });
  });
}

function initRuleEditor(): void {
  activeRuleSelect?.addEventListener('change', async () => {
    currentSettings.activeRuleId = getActiveRuleId();
    ensureRuleSession(getActiveRuleId());
    renderRuleDetails();
    await saveSettings();
  });

  addFilenamePresetBtn?.addEventListener('click', addFilenamePreset);
  newFilenamePresetTemplate?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') addFilenamePreset();
  });
}

function renderRuleSelect(): void {
  if (!activeRuleSelect) return;
  activeRuleSelect.innerHTML = '';
  for (const rule of currentSettings.siteRules || []) {
    const option = document.createElement('option');
    option.value = rule.siteId;
    option.textContent = rule.label.replace(/ ルール$/, '');
    activeRuleSelect.appendChild(option);
  }
  activeRuleSelect.value = currentSettings.activeRuleId || 'generic';
}

function renderRuleDetails(): void {
  renderRuleVariables();
  renderFilenamePresetList();
}

function renderRuleVariables(): void {
  const rule = getActiveRule();
  if (!ruleVariables || !rule) return;

  if (ruleDescription) {
    ruleDescription.textContent = rule.description;
  }

  const variables = [...rule.availableVariables.map((variable) => variable.name), 'custom'];
  ruleVariables.innerHTML = variables
    .map((name) => `<button type="button" class="variable-chip" data-variable="${escapeHtml(name)}">{${escapeHtml(name)}}</button>`)
    .join('');

  ruleVariables.querySelectorAll('.variable-chip').forEach((button) => {
    button.addEventListener('click', () => {
      const variable = (button as HTMLElement).dataset.variable || '';
      insertAtCursor(newFilenamePresetTemplate, `{${variable}}`);
    });
  });
}

function renderFilenamePresetList(): void {
  if (!filenamePresetList) return;
  const ruleId = getActiveRuleId();
  const presets = getRuleFilenamePresets(currentSettings, ruleId);
  const selectedId = currentSettings.ruleSessionSettings?.[ruleId]?.selectedFilenamePresetId || presets[0]?.id;

  if (presets.length === 0) {
    filenamePresetList.innerHTML = '<p class="item-list-empty">登録なし</p>';
    return;
  }

  filenamePresetList.innerHTML = presets.map((preset, index) => `
    <div class="item-entry filename-preset-entry">
      <label class="radio-row">
        <input type="radio" name="filename-preset" value="${escapeHtml(preset.id)}" ${preset.id === selectedId ? 'checked' : ''}>
        <span class="name">${escapeHtml(preset.label)}</span>
      </label>
      <code>${escapeHtml(preset.template)}</code>
      <button class="delete-btn" data-index="${index}" ${isBuiltInFilenamePreset(preset.id) ? 'disabled' : ''}>×</button>
    </div>
  `).join('');

  filenamePresetList.querySelectorAll('input[name="filename-preset"]').forEach((radio) => {
    radio.addEventListener('change', async () => {
      ensureRuleSession(ruleId);
      currentSettings.ruleSessionSettings![ruleId]!.selectedFilenamePresetId = (radio as HTMLInputElement).value;
      currentSettings.namingMode = getRuleFilenamePresets(currentSettings, ruleId)
        .find((preset) => preset.id === (radio as HTMLInputElement).value)?.template.includes('{custom}')
        ? 'custom'
        : 'template';
      await saveSettings();
    });
  });

  filenamePresetList.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const index = parseInt((button as HTMLElement).dataset.index || '-1', 10);
      deleteFilenamePreset(index);
    });
  });
}

function addFilenamePreset(): void {
  const ruleId = getActiveRuleId();
  const label = newFilenamePresetLabel.value.trim();
  let template = newFilenamePresetTemplate.value.trim();
  if (!label || !template) return;

  const appendedIndex = !template.includes('{index}');
  if (appendedIndex) {
    template = `${template.replace(/_+$/, '')}_{index}`;
  }

  if (!currentSettings.ruleFilenamePresets) currentSettings.ruleFilenamePresets = {};
  if (!currentSettings.ruleFilenamePresets[ruleId]) currentSettings.ruleFilenamePresets[ruleId] = [];

  const preset: FilenamePreset = {
    id: makePresetId(label),
    label,
    template,
  };
  currentSettings.ruleFilenamePresets[ruleId].push(preset);
  ensureRuleSession(ruleId);
  currentSettings.ruleSessionSettings![ruleId]!.selectedFilenamePresetId = preset.id;
  currentSettings.namingMode = template.includes('{custom}') ? 'custom' : 'template';

  newFilenamePresetLabel.value = '';
  newFilenamePresetTemplate.value = '';
  renderFilenamePresetList();
  saveSettings();
  if (appendedIndex) {
    showStatus('連番用に _{index} を追加しました');
  }
}

function deleteFilenamePreset(index: number): void {
  const ruleId = getActiveRuleId();
  const presets = currentSettings.ruleFilenamePresets?.[ruleId];
  if (!presets || index < 0) return;
  const preset = presets[index];
  if (!preset || isBuiltInFilenamePreset(preset.id)) return;

  presets.splice(index, 1);
  ensureRuleSession(ruleId);
  currentSettings.ruleSessionSettings![ruleId]!.selectedFilenamePresetId = presets[0]?.id || 'default';
  renderFilenamePresetList();
  saveSettings();
}

function insertAtCursor(input: HTMLInputElement, text: string): void {
  if (!input) return;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  input.focus();
  input.setSelectionRange(start + text.length, start + text.length);
}

function ensureRuleSession(ruleId: string): void {
  if (!currentSettings.ruleSessionSettings) currentSettings.ruleSessionSettings = {};
  if (!currentSettings.ruleSessionSettings[ruleId]) {
    currentSettings.ruleSessionSettings[ruleId] = {
      customName: '',
      selectedPreset: currentSettings.selectedPreset || '',
      namingMode: 'template',
      selectedFilenamePresetId: getRuleFilenamePresets(currentSettings, ruleId)[0]?.id || 'default',
    };
  }
}

function initGlobalSettings(): void {
  addDownloadFolderPresetBtn?.addEventListener('click', addDownloadFolderPreset);
  newDownloadFolderPresetInput?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') addDownloadFolderPreset();
  });

  saveGlobalSettingsBtn?.addEventListener('click', async () => {
    updateDefaultDownloadFolderSettings();
    currentSettings.scanScrollEnabled = scanScrollEnabledCheckbox?.checked === true;
    await saveSettings();
    showStatus('設定を保存しました');
  });

  overlayEnabledCheckbox?.addEventListener('change', async () => {
    currentSettings.overlayEnabled = overlayEnabledCheckbox.checked;
    await saveSettings();
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (!tab.id) continue;
        chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_OVERLAY',
          enabled: currentSettings.overlayEnabled,
        }).catch(() => {});
      }
    });
  });
}

function renderGlobalSettings(): void {
  if (defaultDownloadFolderLabelInput) {
    defaultDownloadFolderLabelInput.value = getDefaultDownloadFolderLabel(currentSettings);
  }
  if (defaultDownloadFolderPathInput) {
    defaultDownloadFolderPathInput.value = currentSettings.defaultDownloadFolderPath || '';
  }
  if (scanScrollEnabledCheckbox) scanScrollEnabledCheckbox.checked = currentSettings.scanScrollEnabled === true;
  if (overlayEnabledCheckbox) overlayEnabledCheckbox.checked = currentSettings.overlayEnabled !== false;
}

function updateDefaultDownloadFolderSettings(): void {
  currentSettings.defaultDownloadFolderLabel = defaultDownloadFolderLabelInput?.value.trim() || 'ダウンロードフォルダ';
  currentSettings.defaultDownloadFolderPath = sanitizeDownloadFolder(defaultDownloadFolderPathInput?.value || '');
}

function sanitizeDownloadFolder(folder: string): string {
  return folder
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.trim().replace(/[<>:"\\|?*\x00-\x1f]/g, '_'))
    .filter(Boolean)
    .join('/');
}

function makeDownloadFolderPresetId(folder: string): string {
  return `folder-${Date.now()}-${folder.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'preset'}`;
}

function renderDownloadFolderPresetList(): void {
  if (!downloadFolderPresetList) return;
  const presets = currentSettings.downloadFolderPresets || [];
  const defaultLabel = getDefaultDownloadFolderLabel(currentSettings);
  const defaultPath = currentSettings.defaultDownloadFolderPath || 'Chrome既定フォルダ直下';

  downloadFolderPresetList.innerHTML = `
    <div class="item-entry default-folder-entry">
      <div class="folder-entry-text">
        <span class="name">${escapeHtml(defaultLabel)}</span>
        <small>${escapeHtml(defaultPath)}</small>
      </div>
      <span class="default-badge">標準</span>
    </div>
  ` + (presets.length === 0 ? '<p class="item-list-empty">追加プリセットなし</p>' : presets.map((preset, index) => `
    <div class="item-entry">
      <div class="folder-entry-text">
        <span class="name">${escapeHtml(preset.label)}</span>
        <small>${escapeHtml(preset.folder)}</small>
      </div>
      <button class="delete-btn" data-index="${index}">×</button>
    </div>
  `).join(''));

  downloadFolderPresetList.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const index = parseInt((button as HTMLElement).dataset.index || '-1', 10);
      deleteDownloadFolderPreset(index);
    });
  });
}

function addDownloadFolderPreset(): void {
  updateDefaultDownloadFolderSettings();
  const folder = sanitizeDownloadFolder(newDownloadFolderPresetInput.value);
  if (!folder) return;

  if (!currentSettings.downloadFolderPresets) currentSettings.downloadFolderPresets = [];
  if (currentSettings.downloadFolderPresets.some((preset) => preset.folder === folder)) return;

  const preset: DownloadFolderPreset = {
    id: makeDownloadFolderPresetId(folder),
    label: folder,
    folder,
  };
  currentSettings.downloadFolderPresets.push(preset);
  newDownloadFolderPresetInput.value = '';
  renderDownloadFolderPresetList();
  saveSettings();
}

function deleteDownloadFolderPreset(index: number): void {
  const presets = currentSettings.downloadFolderPresets;
  if (!presets || index < 0 || !presets[index]) return;
  const removed = presets.splice(index, 1)[0];
  if (currentSettings.selectedDownloadFolderPresetId === removed.id) {
    currentSettings.selectedDownloadFolderPresetId = 'downloads';
  }
  renderDownloadFolderPresetList();
  saveSettings();
}

function initSizePresetManagement(): void {
  addSizePresetBtn?.addEventListener('click', addSizePreset);
  newPresetWidthInput?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') addSizePreset();
  });
}

function renderSizePresetList(): void {
  if (!sizePresetList) return;
  const presets = currentSettings.sizePresets || [];

  if (presets.length === 0) {
    sizePresetList.innerHTML = '<p class="item-list-empty">登録なし</p>';
    return;
  }

  sizePresetList.innerHTML = presets.map((preset, index) => `
    <div class="preset-item">
      <span class="preset-name">${preset.minWidth}px</span>
      <button class="delete-btn" data-index="${index}">×</button>
    </div>
  `).join('');

  sizePresetList.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const index = parseInt((button as HTMLElement).dataset.index || '-1', 10);
      if (index < 0) return;
      currentSettings.sizePresets.splice(index, 1);
      renderSizePresetList();
      saveSettings();
    });
  });
}

function addSizePreset(): void {
  const minWidth = parseInt(newPresetWidthInput.value, 10) || 0;
  if (minWidth <= 0 || currentSettings.sizePresets.some((preset) => preset.minWidth === minWidth)) return;

  const preset: SizePreset = { name: `${minWidth}px`, minWidth, minHeight: 0 };
  currentSettings.sizePresets.push(preset);
  newPresetWidthInput.value = '';
  renderSizePresetList();
  saveSettings();
}

async function saveSettings(): Promise<void> {
  currentSettings = normalizeSettings(currentSettings);
  await chrome.runtime.sendMessage({
    type: 'SAVE_SETTINGS',
    settings: currentSettings,
  });
}

function showStatus(message: string): void {
  if (!status) return;
  status.textContent = message;
  setTimeout(() => {
    status.textContent = '';
  }, 2000);
}
