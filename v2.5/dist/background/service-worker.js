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

;// ./src/utils/filename-template.ts
// ベースプレフィックスから次の連番を取得（ダウンロード履歴を検索）
async function findNextIndex(basePrefix, _downloadFolder) {
    return new Promise((resolve) => {
        // Chrome Downloads APIで最近のダウンロード履歴を取得
        // filenameRegexは絵文字や特殊文字で問題があるため、全件取得してJSでフィルタ
        chrome.downloads.search({
            orderBy: ['-startTime'],
            limit: 500,
        }, (downloads) => {
            if (!downloads || downloads.length === 0) {
                resolve(1);
                return;
            }
            // 既存ファイルから連番を抽出
            const existingNumbers = [];
            for (const d of downloads) {
                // interrupted/cancelled items still remain in Chrome's history with
                // their reserved filename. Counting those creates visible gaps such
                // as _01 missing and the next successful file starting at _02.
                if (d.state !== 'complete')
                    continue;
                // ファイル名部分だけを取得（パスを除去）
                const filename = d.filename.replace(/\\/g, '/').split('/').pop() || '';
                // ベースプレフィックスで始まり、_XX.ext で終わるかチェック
                // 絵文字を含むため、単純な文字列比較を使用
                if (filename.startsWith(basePrefix)) {
                    const suffix = filename.slice(basePrefix.length);
                    // _01.jpg, _02.png などのパターンをマッチ
                    const match = suffix.match(/^_(\d+)\.[^.]+$/);
                    if (match) {
                        existingNumbers.push(parseInt(match[1], 10));
                    }
                }
            }
            if (existingNumbers.length === 0) {
                resolve(1);
                return;
            }
            // 最大値 + 1 を返す
            resolve(Math.max(...existingNumbers) + 1);
        });
    });
}
// ベースプレフィックス（連番なしのファイル名）を生成
function generateBasePrefix(template, imageInfo, customName = '') {
    // {index} を除いたテンプレートでファイル名を生成
    const templateWithoutIndex = template.replace(/\{index\}/g, '').replace(/_+$/, '');
    const vars = buildVariablesWithoutIndex(imageInfo, customName);
    let filename = templateWithoutIndex;
    for (const [key, value] of Object.entries(vars)) {
        filename = filename.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return sanitizeFilename(filename);
}
function buildVariablesWithoutIndex(imageInfo, customName = '') {
    const rawDate = imageInfo.metadata.postDate;
    const date = rawDate instanceof Date
        ? rawDate
        : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    const urlFilename = imageInfo.metadata.originalFilename || 'image';
    const ext = extractExtension(imageInfo.url);
    return {
        date: formatDate(validDate, 'YYYY-MM-DD'),
        year: formatDate(validDate, 'YYYY'),
        month: formatDate(validDate, 'MM'),
        day: formatDate(validDate, 'DD'),
        creator: imageInfo.metadata.creator || '',
        title: sanitizeForFilename(imageInfo.metadata.postTitle || 'untitled'),
        postId: imageInfo.metadata.postId || 'unknown',
        original: urlFilename.replace(/\.[^.]+$/, ''),
        ext,
        custom: sanitizeForFilename(customName || 'image'),
    };
}
function generateFilename(template, imageInfo, index, customName = '') {
    const vars = buildVariables(imageInfo, index, customName);
    let filename = template;
    for (const [key, value] of Object.entries(vars)) {
        filename = filename.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    filename = sanitizeFilename(filename);
    const ext = vars.ext || 'jpg';
    return `${filename}.${ext}`;
}
/**
 * カスタム名モード用のファイル名を生成
 * 形式: {date}_{customName}_{index}.{ext}
 */
function generateCustomFilename(customName, imageInfo, index) {
    const rawDate = imageInfo.metadata.postDate;
    const date = rawDate instanceof Date
        ? rawDate
        : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    const dateStr = formatDate(validDate, 'YYYY-MM-DD');
    const indexStr = String(index).padStart(2, '0');
    const ext = extractExtension(imageInfo.url) || 'jpg';
    const sanitizedName = sanitizeForFilename(customName || 'image');
    const filename = sanitizeFilename(`${dateStr}_${sanitizedName}_${indexStr}`);
    return `${filename}.${ext}`;
}
/**
 * カスタム名モード用のベースプレフィックスを生成（連番検出用）
 * 形式: {date}_{customName}
 */
function generateCustomBasePrefix(customName, imageInfo) {
    const rawDate = imageInfo.metadata.postDate;
    const date = rawDate instanceof Date
        ? rawDate
        : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    const dateStr = formatDate(validDate, 'YYYY-MM-DD');
    const sanitizedName = sanitizeForFilename(customName || 'image');
    return sanitizeFilename(`${dateStr}_${sanitizedName}`);
}
function buildVariables(imageInfo, index, customName = '') {
    const rawDate = imageInfo.metadata.postDate;
    // 文字列の場合はDateに変換、nullや無効な場合は現在日時
    const date = rawDate instanceof Date
        ? rawDate
        : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
    // 無効な日付の場合は現在日時にフォールバック
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    const urlFilename = imageInfo.metadata.originalFilename || 'image';
    const ext = extractExtension(imageInfo.url);
    return {
        date: formatDate(validDate, 'YYYY-MM-DD'),
        year: formatDate(validDate, 'YYYY'),
        month: formatDate(validDate, 'MM'),
        day: formatDate(validDate, 'DD'),
        creator: imageInfo.metadata.creator || '', // 空ならファイル名から省略
        title: sanitizeForFilename(imageInfo.metadata.postTitle || 'untitled'),
        postId: imageInfo.metadata.postId || 'unknown',
        index: String(index).padStart(2, '0'),
        original: urlFilename.replace(/\.[^.]+$/, ''),
        ext,
        custom: sanitizeForFilename(customName || 'image'),
    };
}
function formatDate(date, format) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return format
        .replace('YYYY', String(y))
        .replace('MM', m)
        .replace('DD', d);
}
function extractExtension(url) {
    try {
        const pathname = new URL(url).pathname;
        const match = pathname.match(/\.([^.?]+)(?:\?|$)/);
        return match ? match[1].toLowerCase() : 'jpg';
    }
    catch {
        return 'jpg';
    }
}
function sanitizeForFilename(str) {
    return str
        // ファイル名に使えない文字のみ置換（絵文字は保持）
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        // 複数の空白は1つのスペースに
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);
}
function sanitizeFilename(filename) {
    return filename
        // ファイル名に使えない文字のみ置換（絵文字は保持）
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        // 連続アンダースコアを1つに
        .replace(/__+/g, '_')
        .trim()
        .slice(0, 200);
}

;// ./src/utils/settings-normalizer.ts

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
        template: settings.filenameTemplate || DEFAULT_SETTINGS.filenameTemplate,
    };
}

;// ./src/background/service-worker.ts



// メッセージリスナー
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'DOWNLOAD_IMAGES') {
        handleDownload(message)
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
async function handleDownload(message) {
    const { images, customName } = message;
    const settings = normalizeSettings(message.settings);
    let success = 0;
    let failed = 0;
    const errors = [];
    const startIndexes = new Map();
    const attemptedCounts = new Map();
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        let basePrefix;
        let filename;
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
        }
        catch (error) {
            failed++;
            errors.push(`${filename}: ${error.message}`);
        }
    }
    return { success, failed, errors };
}
async function getNextBatchIndex(basePrefix, downloadFolder, startIndexes, attemptedCounts) {
    if (!startIndexes.has(basePrefix)) {
        startIndexes.set(basePrefix, await findNextIndex(basePrefix, downloadFolder));
    }
    return startIndexes.get(basePrefix) + (attemptedCounts.get(basePrefix) || 0);
}
async function downloadFileWithRetry(url, filename, retries = 2) {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            await downloadFile(url, filename);
            return;
        }
        catch (error) {
            lastError = error;
            if (attempt < retries) {
                await sleep(1000 * (attempt + 1));
            }
        }
    }
    throw lastError || new Error('Download failed');
}
function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        chrome.downloads.download({
            url,
            filename,
            saveAs: false,
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            }
            else if (downloadId === undefined) {
                reject(new Error('Download failed'));
            }
            else {
                let settled = false;
                const cleanup = () => {
                    chrome.downloads.onChanged.removeListener(listener);
                    clearTimeout(timeoutId);
                };
                const finish = (error) => {
                    if (settled)
                        return;
                    settled = true;
                    cleanup();
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                };
                // ダウンロード完了を待つ
                const listener = (delta) => {
                    if (delta.id === downloadId && delta.state) {
                        if (delta.state.current === 'complete') {
                            finish();
                        }
                        else if (delta.state.current === 'interrupted') {
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
                    if (!item)
                        return;
                    if (item.state === 'complete') {
                        finish();
                    }
                    else if (item.state === 'interrupted') {
                        finish(new Error(item.error || 'Download interrupted'));
                    }
                });
            }
        });
    });
}
function notifyProgress(current, total) {
    // 全てのタブに進捗を通知（Content Scriptへ）
    chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'DOWNLOAD_PROGRESS',
                    current,
                    total,
                }).catch(() => { });
            }
        }
    });
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('settings', (result) => {
            if (result.settings) {
                resolve(normalizeSettings(result.settings));
            }
            else {
                resolve(normalizeSettings(DEFAULT_SETTINGS));
            }
        });
    });
}
async function saveSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ settings: normalizeSettings(settings) }, () => {
            resolve();
        });
    });
}
async function resetSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.remove('settings', () => {
            resolve();
        });
    });
}

/******/ })()
;
//# sourceMappingURL=service-worker.js.map