/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 268
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
const DEFAULT_RULE_FILENAME_PRESETS = {
    generic: [
        { id: 'default', label: '標準', template: '{date}_{title}_{index}' },
        { id: 'manual', label: '手入力名', template: '{date}_{custom}_{index}' },
    ],
    patreon: [
        { id: 'default', label: 'Patreon 標準', template: '{date}_{creator}_{title}_{index}' },
        { id: 'manual', label: '手入力名', template: '{date}_{custom}_{index}' },
    ],
    pixiv_fanbox: [
        { id: 'default', label: 'Fanbox 標準', template: '{date}_{creator}_{title}_{index}' },
        { id: 'manual', label: '手入力名', template: '{date}_{custom}_{index}' },
    ],
    x: [
        { id: 'default', label: 'X 標準', template: '{date}_{creator}_{index}' },
        { id: 'manual', label: '手入力名', template: '{date}_{custom}_{index}' },
    ],
};
// デフォルトサイトルールをインポート（循環参照を避けるため遅延インポート）
let defaultSiteRulesInitialized = false;
let cachedDefaultSiteRules = [];
function getDefaultSiteRules() {
    if (!defaultSiteRulesInitialized) {
        try {
            const { DEFAULT_SITE_RULES } = __webpack_require__(268);
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
    downloadFolder: 'picpick',
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
            selectedFilenamePresetId: 'manual',
        },
        'patreon': {
            customName: '',
            selectedPreset: '標準 (400px)',
            namingMode: 'custom',
            selectedFilenamePresetId: 'default',
        },
        'pixiv_fanbox': {
            customName: '',
            selectedPreset: '標準 (400px)',
            namingMode: 'custom',
            selectedFilenamePresetId: 'default',
        },
        'x': {
            customName: '',
            selectedPreset: '標準 (400px)',
            namingMode: 'custom',
            selectedFilenamePresetId: 'default',
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
    ruleFilenamePresets: DEFAULT_RULE_FILENAME_PRESETS,
};

;// ./src/utils/settings-normalizer.ts
/* unused harmony import specifier */ var settings_normalizer_DEFAULT_SETTINGS;

const RULE_IDS = ['generic', 'patreon', 'pixiv_fanbox', 'x'];
function cloneFilenamePresets(source) {
    return Object.fromEntries(Object.entries(source).map(([ruleId, presets]) => [
        ruleId,
        presets.map((preset) => ({ ...preset })),
    ]));
}
function makePresetId(prefix, value, index) {
    return `${prefix}-${index}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset'}`;
}
function legacyNameToTemplate(value) {
    return value.includes('{') ? value : `{date}_${value}_{index}`;
}
function addUniquePreset(presets, preset) {
    if (presets.some((existing) => existing.id === preset.id || existing.template === preset.template)) {
        return;
    }
    presets.push(preset);
}
function mergeSizePresets(saved) {
    const existing = Array.isArray(saved) ? saved : [];
    const existingNames = new Set(existing.map((preset) => preset.name));
    return [
        ...existing,
        ...DEFAULT_SIZE_PRESETS.filter((preset) => !existingNames.has(preset.name)),
    ];
}
function normalizeSettings(input) {
    const saved = input || {};
    const ruleFilenamePresets = cloneFilenamePresets(DEFAULT_RULE_FILENAME_PRESETS);
    if (saved.ruleFilenamePresets) {
        for (const [ruleId, presets] of Object.entries(saved.ruleFilenamePresets)) {
            if (!ruleFilenamePresets[ruleId]) {
                ruleFilenamePresets[ruleId] = [];
            }
            for (const preset of presets || []) {
                if (!preset?.label || !preset?.template)
                    continue;
                addUniquePreset(ruleFilenamePresets[ruleId], { ...preset });
            }
        }
    }
    for (const ruleId of RULE_IDS) {
        if (!ruleFilenamePresets[ruleId]) {
            ruleFilenamePresets[ruleId] = [];
        }
        const legacyRuleTemplates = saved.ruleSpecificTemplates?.[ruleId] || [];
        legacyRuleTemplates.forEach((value, index) => {
            addUniquePreset(ruleFilenamePresets[ruleId], {
                id: makePresetId('legacy-rule', value, index),
                label: value,
                template: legacyNameToTemplate(value),
            });
        });
        const legacyGlobalTemplates = saved.customNameTemplates || [];
        legacyGlobalTemplates.forEach((value, index) => {
            addUniquePreset(ruleFilenamePresets[ruleId], {
                id: makePresetId('legacy-global', value, index),
                label: value,
                template: legacyNameToTemplate(value),
            });
        });
    }
    const settings = {
        ...DEFAULT_SETTINGS,
        ...saved,
        sizePresets: mergeSizePresets(saved.sizePresets),
        customNameTemplates: saved.customNameTemplates || [],
        ruleSessionSettings: {
            ...DEFAULT_SETTINGS.ruleSessionSettings,
            ...(saved.ruleSessionSettings || {}),
        },
        ruleSpecificTemplates: {
            ...DEFAULT_SETTINGS.ruleSpecificTemplates,
            ...(saved.ruleSpecificTemplates || {}),
        },
        ruleSpecificPresets: {
            ...DEFAULT_SETTINGS.ruleSpecificPresets,
            ...(saved.ruleSpecificPresets || {}),
        },
        ruleFilenamePresets,
    };
    for (const ruleId of RULE_IDS) {
        const session = settings.ruleSessionSettings?.[ruleId];
        if (session && !session.selectedFilenamePresetId) {
            session.selectedFilenamePresetId = session.namingMode === 'template' ? 'default' : 'manual';
        }
    }
    return settings;
}
function getRuleFilenamePresets(settings, ruleId) {
    return settings.ruleFilenamePresets?.[ruleId] || settings.ruleFilenamePresets?.generic || [];
}
function getSelectedFilenamePreset(settings, ruleId) {
    const presets = getRuleFilenamePresets(settings, ruleId);
    const selectedId = settings.ruleSessionSettings?.[ruleId]?.selectedFilenamePresetId;
    return presets.find((preset) => preset.id === selectedId) || presets[0] || {
        id: 'fallback',
        label: '標準',
        template: settings.filenameTemplate || settings_normalizer_DEFAULT_SETTINGS.filenameTemplate,
    };
}

;// ./src/popup/popup.ts


let currentSettings = normalizeSettings(DEFAULT_SETTINGS);
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const activeRuleSelect = document.getElementById('active-rule');
const ruleDescription = document.getElementById('rule-description');
const ruleVariables = document.getElementById('rule-variables');
const filenamePresetList = document.getElementById('filename-preset-list');
const newFilenamePresetLabel = document.getElementById('new-filename-preset-label');
const newFilenamePresetTemplate = document.getElementById('new-filename-preset-template');
const addFilenamePresetBtn = document.getElementById('add-filename-preset');
const downloadFolderInput = document.getElementById('download-folder');
const scanScrollEnabledCheckbox = document.getElementById('scan-scroll-enabled');
const saveGlobalSettingsBtn = document.getElementById('save-global-settings');
const overlayEnabledCheckbox = document.getElementById('overlay-enabled');
const sizePresetList = document.getElementById('size-preset-list');
const newPresetNameInput = document.getElementById('new-preset-name');
const newPresetWidthInput = document.getElementById('new-preset-width');
const newPresetHeightInput = document.getElementById('new-preset-height');
const addSizePresetBtn = document.getElementById('add-size-preset');
const popup_status = document.getElementById('status');
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    initTabNavigation();
    initRuleEditor();
    initGlobalSettings();
    initSizePresetManagement();
});
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[c] || c));
}
function popup_makePresetId(label) {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset';
    return `user-${Date.now()}-${slug}`;
}
function getActiveRuleId() {
    return activeRuleSelect?.value || currentSettings.activeRuleId || 'generic';
}
function getActiveRule() {
    const ruleId = getActiveRuleId();
    return currentSettings.siteRules?.find((rule) => rule.siteId === ruleId);
}
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
            currentSettings = normalizeSettings(response && !response.error ? response : DEFAULT_SETTINGS);
            renderAll();
            resolve();
        });
    });
}
function renderAll() {
    renderRuleSelect();
    renderRuleDetails();
    renderGlobalSettings();
    renderSizePresetList();
}
function initTabNavigation() {
    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            if (!tabName)
                return;
            tabButtons.forEach((button) => button.classList.remove('active'));
            tabContents.forEach((content) => content.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabName)?.classList.add('active');
        });
    });
}
function initRuleEditor() {
    activeRuleSelect?.addEventListener('change', async () => {
        currentSettings.activeRuleId = getActiveRuleId();
        ensureRuleSession(getActiveRuleId());
        renderRuleDetails();
        await saveSettings();
    });
    addFilenamePresetBtn?.addEventListener('click', addFilenamePreset);
    newFilenamePresetTemplate?.addEventListener('keypress', (event) => {
        if (event.key === 'Enter')
            addFilenamePreset();
    });
}
function renderRuleSelect() {
    if (!activeRuleSelect)
        return;
    activeRuleSelect.innerHTML = '';
    for (const rule of currentSettings.siteRules || []) {
        const option = document.createElement('option');
        option.value = rule.siteId;
        option.textContent = rule.label.replace(/ ルール$/, '');
        activeRuleSelect.appendChild(option);
    }
    activeRuleSelect.value = currentSettings.activeRuleId || 'generic';
}
function renderRuleDetails() {
    renderRuleVariables();
    renderFilenamePresetList();
}
function renderRuleVariables() {
    const rule = getActiveRule();
    if (!ruleVariables || !rule)
        return;
    if (ruleDescription) {
        ruleDescription.textContent = rule.description;
    }
    const variables = [...rule.availableVariables.map((variable) => variable.name), 'custom'];
    ruleVariables.innerHTML = variables
        .map((name) => `<button type="button" class="variable-chip" data-variable="${escapeHtml(name)}">{${escapeHtml(name)}}</button>`)
        .join('');
    ruleVariables.querySelectorAll('.variable-chip').forEach((button) => {
        button.addEventListener('click', () => {
            const variable = button.dataset.variable || '';
            insertAtCursor(newFilenamePresetTemplate, `{${variable}}`);
        });
    });
}
function renderFilenamePresetList() {
    if (!filenamePresetList)
        return;
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
      <button class="delete-btn" data-index="${index}" ${preset.id === 'default' || preset.id === 'manual' ? 'disabled' : ''}>×</button>
    </div>
  `).join('');
    filenamePresetList.querySelectorAll('input[name="filename-preset"]').forEach((radio) => {
        radio.addEventListener('change', async () => {
            ensureRuleSession(ruleId);
            currentSettings.ruleSessionSettings[ruleId].selectedFilenamePresetId = radio.value;
            currentSettings.namingMode = getRuleFilenamePresets(currentSettings, ruleId)
                .find((preset) => preset.id === radio.value)?.template.includes('{custom}')
                ? 'custom'
                : 'template';
            await saveSettings();
        });
    });
    filenamePresetList.querySelectorAll('.delete-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const index = parseInt(button.dataset.index || '-1', 10);
            deleteFilenamePreset(index);
        });
    });
}
function addFilenamePreset() {
    const ruleId = getActiveRuleId();
    const label = newFilenamePresetLabel.value.trim();
    const template = newFilenamePresetTemplate.value.trim();
    if (!label || !template)
        return;
    if (!currentSettings.ruleFilenamePresets)
        currentSettings.ruleFilenamePresets = {};
    if (!currentSettings.ruleFilenamePresets[ruleId])
        currentSettings.ruleFilenamePresets[ruleId] = [];
    const preset = {
        id: popup_makePresetId(label),
        label,
        template,
    };
    currentSettings.ruleFilenamePresets[ruleId].push(preset);
    ensureRuleSession(ruleId);
    currentSettings.ruleSessionSettings[ruleId].selectedFilenamePresetId = preset.id;
    currentSettings.namingMode = template.includes('{custom}') ? 'custom' : 'template';
    newFilenamePresetLabel.value = '';
    newFilenamePresetTemplate.value = '';
    renderFilenamePresetList();
    saveSettings();
}
function deleteFilenamePreset(index) {
    const ruleId = getActiveRuleId();
    const presets = currentSettings.ruleFilenamePresets?.[ruleId];
    if (!presets || index < 0)
        return;
    const preset = presets[index];
    if (!preset || preset.id === 'default' || preset.id === 'manual')
        return;
    presets.splice(index, 1);
    ensureRuleSession(ruleId);
    currentSettings.ruleSessionSettings[ruleId].selectedFilenamePresetId = presets[0]?.id || 'default';
    renderFilenamePresetList();
    saveSettings();
}
function insertAtCursor(input, text) {
    if (!input)
        return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    input.focus();
    input.setSelectionRange(start + text.length, start + text.length);
}
function ensureRuleSession(ruleId) {
    if (!currentSettings.ruleSessionSettings)
        currentSettings.ruleSessionSettings = {};
    if (!currentSettings.ruleSessionSettings[ruleId]) {
        currentSettings.ruleSessionSettings[ruleId] = {
            customName: '',
            selectedPreset: currentSettings.selectedPreset || '',
            namingMode: 'template',
            selectedFilenamePresetId: getRuleFilenamePresets(currentSettings, ruleId)[0]?.id || 'default',
        };
    }
}
function initGlobalSettings() {
    saveGlobalSettingsBtn?.addEventListener('click', async () => {
        currentSettings.downloadFolder = downloadFolderInput.value || DEFAULT_SETTINGS.downloadFolder;
        currentSettings.scanScrollEnabled = scanScrollEnabledCheckbox?.checked === true;
        await saveSettings();
        showStatus('設定を保存しました');
    });
    overlayEnabledCheckbox?.addEventListener('change', async () => {
        currentSettings.overlayEnabled = overlayEnabledCheckbox.checked;
        await saveSettings();
        chrome.tabs.query({}, (tabs) => {
            for (const tab of tabs) {
                if (!tab.id)
                    continue;
                chrome.tabs.sendMessage(tab.id, {
                    type: 'TOGGLE_OVERLAY',
                    enabled: currentSettings.overlayEnabled,
                }).catch(() => { });
            }
        });
    });
}
function renderGlobalSettings() {
    if (downloadFolderInput)
        downloadFolderInput.value = currentSettings.downloadFolder;
    if (scanScrollEnabledCheckbox)
        scanScrollEnabledCheckbox.checked = currentSettings.scanScrollEnabled === true;
    if (overlayEnabledCheckbox)
        overlayEnabledCheckbox.checked = currentSettings.overlayEnabled !== false;
}
function initSizePresetManagement() {
    addSizePresetBtn?.addEventListener('click', addSizePreset);
    newPresetNameInput?.addEventListener('keypress', (event) => {
        if (event.key === 'Enter')
            addSizePreset();
    });
}
function renderSizePresetList() {
    if (!sizePresetList)
        return;
    const presets = currentSettings.sizePresets || [];
    if (presets.length === 0) {
        sizePresetList.innerHTML = '<p class="item-list-empty">登録なし</p>';
        return;
    }
    sizePresetList.innerHTML = presets.map((preset, index) => `
    <div class="preset-item">
      <span class="preset-name">${escapeHtml(preset.name)}</span>
      <span class="preset-size">${preset.minWidth}×${preset.minHeight}px</span>
      <button class="delete-btn" data-index="${index}">×</button>
    </div>
  `).join('');
    sizePresetList.querySelectorAll('.delete-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const index = parseInt(button.dataset.index || '-1', 10);
            if (index < 0)
                return;
            currentSettings.sizePresets.splice(index, 1);
            renderSizePresetList();
            saveSettings();
        });
    });
}
function addSizePreset() {
    const name = newPresetNameInput.value.trim();
    const minWidth = parseInt(newPresetWidthInput.value, 10) || 0;
    const minHeight = parseInt(newPresetHeightInput.value, 10) || 0;
    if (!name || currentSettings.sizePresets.some((preset) => preset.name === name))
        return;
    const preset = { name, minWidth, minHeight };
    currentSettings.sizePresets.push(preset);
    newPresetNameInput.value = '';
    newPresetWidthInput.value = '';
    newPresetHeightInput.value = '';
    renderSizePresetList();
    saveSettings();
}
async function saveSettings() {
    currentSettings = normalizeSettings(currentSettings);
    await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        settings: currentSettings,
    });
}
function showStatus(message) {
    if (!popup_status)
        return;
    popup_status.textContent = message;
    setTimeout(() => {
        popup_status.textContent = '';
    }, 2000);
}

/******/ })()
;
//# sourceMappingURL=popup.js.map