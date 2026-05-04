/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 472
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  DEFAULT_SITE_RULES: () => (/* binding */ DEFAULT_SITE_RULES),
  genericRule: () => (/* reexport */ genericRule),
  patreonRule: () => (/* reexport */ patreonRule),
  pixivFanboxRule: () => (/* reexport */ pixivFanboxRule),
  xRule: () => (/* reexport */ xRule)
});

;// ./src/naming/site-rules/generic-rule.ts
/**
 * 汎用ルール - すべてのサイトで使用できる基本的なテンプレート変数
 * 既存のTemplateVariablesをRuleVariableに変換
 */
function formatDate(date, format) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return format
        .replace('YYYY', String(y))
        .replace('MM', m)
        .replace('DD', d);
}
function sanitizeForFilename(str) {
    return str
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);
}
function extractExtension(url = '') {
    try {
        const pathname = new URL(url).pathname;
        const match = pathname.match(/\.([^.?]+)(?:\?|$)/);
        return match ? match[1].toLowerCase() : 'jpg';
    }
    catch {
        return 'jpg';
    }
}
// このファイルでは、ImageInfoの代わりにメタデータだけを使用するため、
// URLが必要な場合はcontextから取得する必要があります
const dateVariable = {
    name: 'date',
    label: '日付',
    description: 'YYYY-MM-DD形式の投稿日',
    getValue: (metadata) => {
        const rawDate = metadata.postDate;
        const date = rawDate instanceof Date
            ? rawDate
            : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
        const validDate = isNaN(date.getTime()) ? new Date() : date;
        return formatDate(validDate, 'YYYY-MM-DD');
    },
    default: '1900-01-01',
};
const yearVariable = {
    name: 'year',
    label: '年',
    description: 'YYYY形式の年',
    getValue: (metadata) => {
        const rawDate = metadata.postDate;
        const date = rawDate instanceof Date
            ? rawDate
            : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
        const validDate = isNaN(date.getTime()) ? new Date() : date;
        return formatDate(validDate, 'YYYY');
    },
    default: '1900',
};
const monthVariable = {
    name: 'month',
    label: '月',
    description: 'MM形式の月',
    getValue: (metadata) => {
        const rawDate = metadata.postDate;
        const date = rawDate instanceof Date
            ? rawDate
            : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
        const validDate = isNaN(date.getTime()) ? new Date() : date;
        return formatDate(validDate, 'MM');
    },
    default: '01',
};
const dayVariable = {
    name: 'day',
    label: '日',
    description: 'DD形式の日',
    getValue: (metadata) => {
        const rawDate = metadata.postDate;
        const date = rawDate instanceof Date
            ? rawDate
            : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
        const validDate = isNaN(date.getTime()) ? new Date() : date;
        return formatDate(validDate, 'DD');
    },
    default: '01',
};
const creatorVariable = {
    name: 'creator',
    label: 'クリエイター名',
    description: 'Webサイトに登録されているクリエイター名',
    getValue: (metadata) => metadata.creator || '',
    default: 'unknown',
};
const titleVariable = {
    name: 'title',
    label: 'ポスト名',
    description: 'ポストのタイトル',
    getValue: (metadata) => {
        return sanitizeForFilename(metadata.postTitle || 'untitled');
    },
    default: 'untitled',
};
const postIdVariable = {
    name: 'postId',
    label: 'ポストID',
    description: 'ポストの一意な識別子',
    getValue: (metadata) => metadata.postId || 'unknown',
    default: 'unknown',
};
const originalVariable = {
    name: 'original',
    label: '元のファイル名',
    description: '元のファイル名（拡張子なし）',
    getValue: (metadata) => {
        const urlFilename = metadata.originalFilename || 'image';
        return urlFilename.replace(/\.[^.]+$/, '');
    },
    default: 'image',
};
const indexVariable = {
    name: 'index',
    label: '連番',
    description: 'ダウンロード順の連番（01, 02, ...）',
    getValue: (metadata) => {
        // indexはメタデータに含まれないため、ここでは0を返す
        // 実際の値は呼び出し側で提供される
        return '00';
    },
    default: '00',
};
// 注：extは別途処理が必要なため、ここでは定義しない
const genericRule = {
    siteId: 'generic',
    label: '汎用ルール',
    description: 'すべてのサイトで使用できる基本的なテンプレート変数',
    defaultTemplate: '{date}_{title}_{index}',
    availableVariables: [
        dateVariable,
        yearVariable,
        monthVariable,
        dayVariable,
        creatorVariable,
        titleVariable,
        postIdVariable,
        originalVariable,
        indexVariable,
    ],
};

;// ./src/naming/site-rules/patreon-rule.ts
/**
 * Patreon ルール - Patreon特有のテンプレート変数
 */
function patreon_rule_formatDate(date, format) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return format
        .replace('YYYY', String(y))
        .replace('MM', m)
        .replace('DD', d);
}
function patreon_rule_sanitizeForFilename(str) {
    return str
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);
}
const patreon_rule_dateVariable = {
    name: 'date',
    label: '投稿日',
    description: 'YYYY-MM-DD形式のPatreon投稿日',
    getValue: (metadata) => {
        const rawDate = metadata.postDate;
        const date = rawDate instanceof Date
            ? rawDate
            : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
        const validDate = isNaN(date.getTime()) ? new Date() : date;
        return patreon_rule_formatDate(validDate, 'YYYY-MM-DD');
    },
    default: '1900-01-01',
};
const patreon_rule_creatorVariable = {
    name: 'creator',
    label: 'Patreon クリエイター名',
    description: 'Patreon登録名',
    getValue: (metadata) => metadata.creator || '',
    default: 'unknown',
};
const patreon_rule_titleVariable = {
    name: 'title',
    label: 'ポスト名',
    description: 'Patreonのポストタイトル',
    getValue: (metadata) => {
        return patreon_rule_sanitizeForFilename(metadata.postTitle || 'untitled');
    },
    default: 'untitled',
};
const patreon_rule_postIdVariable = {
    name: 'postId',
    label: 'ポストID',
    description: 'Patreonポストの一意な識別子',
    getValue: (metadata) => metadata.postId || 'unknown',
    default: 'unknown',
};
const patreon_rule_indexVariable = {
    name: 'index',
    label: '連番',
    description: 'ダウンロード順の連番（01, 02, ...）',
    getValue: () => '00',
    default: '00',
};
const patreonRule = {
    siteId: 'patreon',
    label: 'Patreon ルール',
    description: 'Patreon用の命名規則',
    defaultTemplate: '{date}_{creator}_{title}_{index}',
    availableVariables: [
        patreon_rule_dateVariable,
        patreon_rule_creatorVariable,
        patreon_rule_titleVariable,
        patreon_rule_postIdVariable,
        patreon_rule_indexVariable,
    ],
};

;// ./src/naming/site-rules/pixiv-fanbox-rule.ts
/**
 * Pixiv Fanbox ルール - Pixiv Fanbox特有のテンプレート変数
 *
 * 注：このルールは現在スケルトン実装です。
 * 実装時にPixiv Fanboxのメタデータ構造に合わせて拡張してください。
 */
function pixiv_fanbox_rule_formatDate(date, format) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return format
        .replace('YYYY', String(y))
        .replace('MM', m)
        .replace('DD', d);
}
function pixiv_fanbox_rule_sanitizeForFilename(str) {
    return str
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);
}
const pixiv_fanbox_rule_dateVariable = {
    name: 'date',
    label: '投稿日',
    description: 'YYYY-MM-DD形式のPixiv Fanbox投稿日',
    getValue: (metadata) => {
        const rawDate = metadata.postDate;
        const date = rawDate instanceof Date
            ? rawDate
            : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
        const validDate = isNaN(date.getTime()) ? new Date() : date;
        return pixiv_fanbox_rule_formatDate(validDate, 'YYYY-MM-DD');
    },
    default: '1900-01-01',
};
const pixiv_fanbox_rule_creatorVariable = {
    name: 'creator',
    label: 'Fanbox クリエイター名',
    description: 'Pixiv Fanbox登録名',
    getValue: (metadata) => {
        // TODO: Fanbox特有のクリエイター名フィールドがある場合は、ここで処理
        return metadata.creator || '';
    },
    default: 'unknown',
};
const pixiv_fanbox_rule_titleVariable = {
    name: 'title',
    label: 'ポスト名',
    description: 'Pixiv Fanboxのポストタイトル',
    getValue: (metadata) => {
        return pixiv_fanbox_rule_sanitizeForFilename(metadata.postTitle || 'untitled');
    },
    default: 'untitled',
};
const pixiv_fanbox_rule_postIdVariable = {
    name: 'postId',
    label: 'ポストID',
    description: 'Pixiv Fanboxポストの一意な識別子',
    getValue: (metadata) => metadata.postId || 'unknown',
    default: 'unknown',
};
const pixiv_fanbox_rule_indexVariable = {
    name: 'index',
    label: '連番',
    description: 'ダウンロード順の連番（01, 02, ...）',
    getValue: () => '00',
    default: '00',
};
const pixivFanboxRule = {
    siteId: 'pixiv_fanbox',
    label: 'Pixiv Fanbox ルール',
    description: 'Pixiv Fanbox用の命名規則',
    defaultTemplate: '{date}_{creator}_{title}_{index}',
    availableVariables: [
        pixiv_fanbox_rule_dateVariable,
        pixiv_fanbox_rule_creatorVariable,
        pixiv_fanbox_rule_titleVariable,
        pixiv_fanbox_rule_postIdVariable,
        pixiv_fanbox_rule_indexVariable,
    ],
};

;// ./src/naming/site-rules/x-rule.ts
/**
 * X (Twitter) ルール - X/Twitter特有のテンプレート変数
 */
function x_rule_formatDate(date, format) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return format
        .replace('YYYY', String(y))
        .replace('MM', m)
        .replace('DD', d);
}
const x_rule_dateVariable = {
    name: 'date',
    label: '投稿日',
    description: 'YYYY-MM-DD形式のツイート投稿日',
    getValue: (metadata) => {
        const rawDate = metadata.postDate;
        const date = rawDate instanceof Date
            ? rawDate
            : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
        const validDate = isNaN(date.getTime()) ? new Date() : date;
        return x_rule_formatDate(validDate, 'YYYY-MM-DD');
    },
    default: '1900-01-01',
};
const x_rule_creatorVariable = {
    name: 'creator',
    label: 'ユーザー名',
    description: 'X/Twitterの@なしユーザー名',
    getValue: (metadata) => metadata.creator || '',
    default: 'unknown',
};
const x_rule_postIdVariable = {
    name: 'postId',
    label: 'ツイートID',
    description: 'ツイートの一意な識別子',
    getValue: (metadata) => metadata.postId || 'unknown',
    default: 'unknown',
};
const x_rule_indexVariable = {
    name: 'index',
    label: '連番',
    description: 'ダウンロード順の連番（01, 02, ...）',
    getValue: () => '00',
    default: '00',
};
const xRule = {
    siteId: 'x',
    label: 'X (Twitter) ルール',
    description: 'X (Twitter)用の命名規則',
    defaultTemplate: '{date}_{creator}_{postId}_{index}',
    availableVariables: [
        x_rule_dateVariable,
        x_rule_creatorVariable,
        x_rule_postIdVariable,
        x_rule_indexVariable,
    ],
};

;// ./src/naming/site-rules/index.ts




/**
 * デフォルトで組み込まれるサイトルール一覧
 */
const DEFAULT_SITE_RULES = [
    genericRule,
    patreonRule,
    pixivFanboxRule,
    xRule,
];



/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// ./src/types/settings.ts
const DEFAULT_SIZE_PRESETS = [
    { name: '小サイズ除外 (200px)', minWidth: 200, minHeight: 200 },
    { name: '標準 (400px)', minWidth: 400, minHeight: 400 },
    { name: '大きめ (800px)', minWidth: 800, minHeight: 800 },
    { name: 'HD以上 (1280px)', minWidth: 1280, minHeight: 720 },
    { name: 'Full HD (1920px)', minWidth: 1920, minHeight: 1080 },
    { name: '2K (2560px)', minWidth: 2560, minHeight: 1440 },
    { name: '4K (3840px)', minWidth: 3840, minHeight: 2160 },
    { name: '4K Ultrawide (5120px)', minWidth: 5120, minHeight: 1440 },
    { name: '5K (5120px)', minWidth: 5120, minHeight: 2880 },
    { name: '8K (7680px)', minWidth: 7680, minHeight: 4320 },
];
// デフォルトサイトルールをインポート（循環参照を避けるため遅延インポート）
let defaultSiteRulesInitialized = false;
let cachedDefaultSiteRules = [];
function getDefaultSiteRules() {
    if (!defaultSiteRulesInitialized) {
        try {
            const { DEFAULT_SITE_RULES } = __webpack_require__(472);
            cachedDefaultSiteRules = DEFAULT_SITE_RULES;
            defaultSiteRulesInitialized = true;
        }
        catch {
            // サイトルールの読み込みに失敗した場合は空配列を返す
            cachedDefaultSiteRules = [];
            defaultSiteRulesInitialized = true;
        }
    }
    return cachedDefaultSiteRules;
}
const DEFAULT_SETTINGS = {
    // グローバル設定
    filenameTemplate: '{date}_{title}_{index}',
    minWidth: 400,
    minHeight: 400,
    enabledExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    downloadFolder: 'PicPick',
    scanScrollEnabled: false,
    skipDuplicates: true,
    overlayEnabled: true, // デフォルトでオーバーレイを表示
    creatorList: [],
    lastSelectedCreator: '',
    sizePresets: DEFAULT_SIZE_PRESETS,
    selectedPreset: '標準 (400px)',
    namingMode: 'custom',
    customNameTemplates: [],
    // ルール別の実行時設定（デフォルト値）
    ruleSessionSettings: {
        'generic': {
            customName: '',
            selectedPreset: '標準 (400px)',
            namingMode: 'custom',
        },
        'patreon': {
            customName: '',
            selectedPreset: '標準 (400px)',
            namingMode: 'custom',
        },
        'pixiv_fanbox': {
            customName: '',
            selectedPreset: '標準 (400px)',
            namingMode: 'custom',
        },
        'x': {
            customName: '',
            selectedPreset: '標準 (400px)',
            namingMode: 'custom',
        },
    },
    // サイトルール関連
    activeRuleId: 'generic',
    siteRules: getDefaultSiteRules(),
    userDefinedRules: [],
    // ルール別テンプレート・プリセット
    ruleSpecificTemplates: {
        'generic': [],
        'patreon': [],
        'pixiv_fanbox': [],
        'x': [],
    },
    ruleSpecificPresets: {
        'generic': [],
        'patreon': [],
        'pixiv_fanbox': [],
        'x': [],
    },
};

;// ./src/popup/popup.ts

let currentSettings = { ...DEFAULT_SETTINGS };
// ルールIDの定義
const RULE_IDS = (/* unused pure expression or super */ null && (['patreon', 'pixiv_fanbox', 'generic']));
// HTML IDとルールIDのマッピング
const HTML_TO_RULE_ID = {
    'patreon': 'patreon',
    'fanbox': 'pixiv_fanbox',
    'generic': 'generic',
};
// DOM要素
const filenameTemplateInput = document.getElementById('filename-template');
const downloadFolderInput = document.getElementById('download-folder');
const scanScrollEnabledCheckbox = document.getElementById('scan-scroll-enabled');
const saveGlobalSettingsBtn = document.getElementById('save-global-settings');
const popup_status = document.getElementById('status');
const overlayEnabledCheckbox = document.getElementById('overlay-enabled');
// タブナビゲーション要素
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
// グローバルテンプレート/プリセット要素
const customTemplateList = document.getElementById('custom-template-list');
const newTemplateInput = document.getElementById('new-template');
const addCustomTemplateBtn = document.getElementById('add-custom-template');
const sizePresetList = document.getElementById('size-preset-list');
const newPresetNameInput = document.getElementById('new-preset-name');
const newPresetWidthInput = document.getElementById('new-preset-width');
const newPresetHeightInput = document.getElementById('new-preset-height');
const addSizePresetBtn = document.getElementById('add-size-preset');
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
function initTabNavigation() {
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
function switchTab(tabName) {
    tabButtons.forEach((btn) => btn.classList.remove('active'));
    tabContents.forEach((content) => content.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn)
        activeBtn.classList.add('active');
    const activeContent = document.getElementById(tabName);
    if (activeContent)
        activeContent.classList.add('active');
}
// 設定を読み込み
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
            if (response && !response.error) {
                const savedPresets = response.sizePresets || [];
                const savedPresetNames = new Set(savedPresets.map((p) => p.name));
                const newPresets = DEFAULT_SIZE_PRESETS.filter((p) => !savedPresetNames.has(p.name));
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
                if (scanScrollEnabledCheckbox) {
                    scanScrollEnabledCheckbox.checked = currentSettings.scanScrollEnabled === true;
                }
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
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c] || c));
}
// ========================================
// グローバルテンプレート管理
// ========================================
function initGlobalTemplateManagement() {
    if (addCustomTemplateBtn) {
        addCustomTemplateBtn.addEventListener('click', addGlobalTemplate);
    }
    if (newTemplateInput) {
        newTemplateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter')
                addGlobalTemplate();
        });
    }
}
function renderGlobalTemplateList() {
    if (!customTemplateList)
        return;
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
            const index = parseInt(e.target.getAttribute('data-index') || '0');
            deleteGlobalTemplate(index);
        });
    });
}
function addGlobalTemplate() {
    if (!newTemplateInput)
        return;
    const name = newTemplateInput.value.trim();
    if (!name || currentSettings.customNameTemplates.includes(name))
        return;
    currentSettings.customNameTemplates.push(name);
    newTemplateInput.value = '';
    renderGlobalTemplateList();
    saveSettings();
}
function deleteGlobalTemplate(index) {
    currentSettings.customNameTemplates.splice(index, 1);
    renderGlobalTemplateList();
    saveSettings();
}
// ========================================
// グローバルプリセット管理
// ========================================
function initGlobalPresetManagement() {
    if (addSizePresetBtn) {
        addSizePresetBtn.addEventListener('click', addGlobalPreset);
    }
    if (newPresetNameInput) {
        newPresetNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter')
                addGlobalPreset();
        });
    }
}
function renderGlobalPresetList() {
    if (!sizePresetList)
        return;
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
            const index = parseInt(e.target.getAttribute('data-index') || '0');
            deleteGlobalPreset(index);
        });
    });
}
function addGlobalPreset() {
    if (!newPresetNameInput || !newPresetWidthInput || !newPresetHeightInput)
        return;
    const name = newPresetNameInput.value.trim();
    const minWidth = parseInt(newPresetWidthInput.value) || 0;
    const minHeight = parseInt(newPresetHeightInput.value) || 0;
    if (!name || currentSettings.sizePresets.some(p => p.name === name))
        return;
    currentSettings.sizePresets.push({ name, minWidth, minHeight });
    newPresetNameInput.value = '';
    newPresetWidthInput.value = '';
    newPresetHeightInput.value = '';
    renderGlobalPresetList();
    saveSettings();
}
function deleteGlobalPreset(index) {
    currentSettings.sizePresets.splice(index, 1);
    renderGlobalPresetList();
    saveSettings();
}
// ========================================
// ルール別テンプレート/プリセット管理
// ========================================
function renderRuleTemplateList(htmlPrefix) {
    const ruleId = HTML_TO_RULE_ID[htmlPrefix];
    const listDiv = document.getElementById(`${htmlPrefix}-templates-list`);
    if (!listDiv || !ruleId)
        return;
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
            const index = parseInt(e.target.getAttribute('data-index') || '0');
            const rule = e.target.getAttribute('data-rule') || '';
            deleteRuleTemplate(rule, index);
        });
    });
}
function addRuleTemplate(htmlPrefix) {
    const ruleId = HTML_TO_RULE_ID[htmlPrefix];
    const input = document.getElementById(`${htmlPrefix}-new-template`);
    if (!input || !ruleId)
        return;
    const name = input.value.trim();
    if (!name)
        return;
    if (!currentSettings.ruleSpecificTemplates) {
        currentSettings.ruleSpecificTemplates = {};
    }
    if (!currentSettings.ruleSpecificTemplates[ruleId]) {
        currentSettings.ruleSpecificTemplates[ruleId] = [];
    }
    if (currentSettings.ruleSpecificTemplates[ruleId].includes(name))
        return;
    currentSettings.ruleSpecificTemplates[ruleId].push(name);
    input.value = '';
    renderRuleTemplateList(htmlPrefix);
    saveSettings();
}
function deleteRuleTemplate(htmlPrefix, index) {
    const ruleId = HTML_TO_RULE_ID[htmlPrefix];
    if (!ruleId || !currentSettings.ruleSpecificTemplates?.[ruleId])
        return;
    currentSettings.ruleSpecificTemplates[ruleId].splice(index, 1);
    renderRuleTemplateList(htmlPrefix);
    saveSettings();
}
function renderRulePresetList(htmlPrefix) {
    const ruleId = HTML_TO_RULE_ID[htmlPrefix];
    const listDiv = document.getElementById(`${htmlPrefix}-presets-list`);
    if (!listDiv || !ruleId)
        return;
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
            const index = parseInt(e.target.getAttribute('data-index') || '0');
            const rule = e.target.getAttribute('data-rule') || '';
            deleteRulePreset(rule, index);
        });
    });
}
function addRulePreset(htmlPrefix) {
    const ruleId = HTML_TO_RULE_ID[htmlPrefix];
    const nameInput = document.getElementById(`${htmlPrefix}-new-preset-name`);
    const widthInput = document.getElementById(`${htmlPrefix}-new-preset-width`);
    const heightInput = document.getElementById(`${htmlPrefix}-new-preset-height`);
    if (!nameInput || !widthInput || !heightInput || !ruleId)
        return;
    const name = nameInput.value.trim();
    const minWidth = parseInt(widthInput.value) || 0;
    const minHeight = parseInt(heightInput.value) || 0;
    if (!name)
        return;
    if (!currentSettings.ruleSpecificPresets) {
        currentSettings.ruleSpecificPresets = {};
    }
    if (!currentSettings.ruleSpecificPresets[ruleId]) {
        currentSettings.ruleSpecificPresets[ruleId] = [];
    }
    if (currentSettings.ruleSpecificPresets[ruleId].some(p => p.name === name))
        return;
    currentSettings.ruleSpecificPresets[ruleId].push({ name, minWidth, minHeight });
    nameInput.value = '';
    widthInput.value = '';
    heightInput.value = '';
    renderRulePresetList(htmlPrefix);
    saveSettings();
}
function deleteRulePreset(htmlPrefix, index) {
    const ruleId = HTML_TO_RULE_ID[htmlPrefix];
    if (!ruleId || !currentSettings.ruleSpecificPresets?.[ruleId])
        return;
    currentSettings.ruleSpecificPresets[ruleId].splice(index, 1);
    renderRulePresetList(htmlPrefix);
    saveSettings();
}
function renderAllRuleLists() {
    for (const htmlPrefix of Object.keys(HTML_TO_RULE_ID)) {
        renderRuleTemplateList(htmlPrefix);
        renderRulePresetList(htmlPrefix);
    }
}
function initRuleManagement() {
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
function initOverlayToggle() {
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
            }
            catch (error) {
                console.error('Failed to notify tabs:', error);
            }
        });
    }
}
// ========================================
// 設定保存
// ========================================
async function saveSettings() {
    try {
        await chrome.runtime.sendMessage({
            type: 'SAVE_SETTINGS',
            settings: currentSettings,
        });
    }
    catch (error) {
        console.error('Failed to save settings:', error);
    }
}
// グローバル設定保存ボタン
if (saveGlobalSettingsBtn) {
    saveGlobalSettingsBtn.addEventListener('click', async () => {
        currentSettings.filenameTemplate = filenameTemplateInput.value || DEFAULT_SETTINGS.filenameTemplate;
        currentSettings.downloadFolder = downloadFolderInput.value || DEFAULT_SETTINGS.downloadFolder;
        currentSettings.scanScrollEnabled = scanScrollEnabledCheckbox?.checked === true;
        try {
            await chrome.runtime.sendMessage({
                type: 'SAVE_SETTINGS',
                settings: currentSettings,
            });
            popup_status.textContent = '設定を保存しました';
            setTimeout(() => {
                popup_status.textContent = '';
            }, 2000);
        }
        catch (error) {
            popup_status.textContent = '保存に失敗しました';
        }
    });
}

/******/ })()
;
//# sourceMappingURL=popup.js.map