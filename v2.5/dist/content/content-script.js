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

;// ./src/extractors/base-extractor.ts
class BaseExtractor {
    constructor(config) {
        this.config = config;
    }
    canHandle(url) {
        return this.config.urlPatterns.some((pattern) => pattern.test(url));
    }
    async getImageDimensions(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve(null);
            img.src = url;
        });
    }
    parseDate(dateStr) {
        try {
            return new Date(dateStr);
        }
        catch {
            return null;
        }
    }
    extractFilenameFromUrl(url) {
        try {
            const pathname = new URL(url).pathname;
            return pathname.split('/').pop() || 'image';
        }
        catch {
            return 'image';
        }
    }
}

;// ./src/extractors/patreon-extractor.ts

class PatreonExtractor extends BaseExtractor {
    constructor() {
        super({
            urlPatterns: [
                /^https:\/\/www\.patreon\.com\/posts\//,
                /^https:\/\/www\.patreon\.com\/[^/]+\/posts\//,
                /^https:\/\/www\.patreon\.com\/[^/]+$/,
            ],
            selectors: {
                images: 'img[src*="patreonusercontent.com"]',
                creator: '[data-tag="creator-name"]',
                postTitle: '[data-tag="post-title"], h1[data-tag="post-title"]',
                postDate: 'time[datetime], [data-tag="post-published-at"]',
            },
        });
    }
    async extractImages() {
        const images = [];
        const metadata = this.extractMetadata();
        const seen = new Set();
        const imgElements = document.querySelectorAll(this.config.selectors.images);
        for (const img of imgElements) {
            const url = this.getBestImageUrl(img);
            if (!url || seen.has(url))
                continue;
            if (this.isLikelyIcon(img))
                continue;
            seen.add(url);
            let width = img.naturalWidth || null;
            let height = img.naturalHeight || null;
            if (img.srcset) {
                const widths = img.srcset
                    .split(',')
                    .map((s) => {
                    const parts = s.trim().split(' ');
                    return parts[1] ? parseInt(parts[1].replace('w', '')) : 0;
                })
                    .filter((w) => w > 0);
                if (widths.length > 0) {
                    width = Math.max(...widths);
                }
            }
            images.push({
                url,
                originalUrl: img.src,
                width,
                height,
                index: images.length + 1,
                metadata: {
                    ...metadata,
                    originalFilename: this.extractFilenameFromUrl(url),
                },
            });
        }
        await this.extractFromLinks(images, metadata, seen);
        await this.extractFromDataAttributes(images, metadata, seen);
        return images;
    }
    getBestImageUrl(img) {
        if (img.srcset) {
            const sources = img.srcset
                .split(',')
                .map((s) => {
                const parts = s.trim().split(' ');
                const url = parts[0];
                const width = parts[1] ? parseInt(parts[1].replace('w', '')) : 0;
                return { url, width };
            })
                .filter((s) => s.url.includes('patreonusercontent.com'));
            sources.sort((a, b) => b.width - a.width);
            if (sources.length > 0) {
                return sources[0].url;
            }
        }
        if (img.src && img.src.includes('patreonusercontent.com')) {
            return img.src;
        }
        return null;
    }
    isLikelyIcon(img) {
        const rect = img.getBoundingClientRect();
        if (rect.width < 100 && rect.height < 100) {
            return true;
        }
        const url = img.src.toLowerCase();
        if (url.includes('avatar') || url.includes('icon')) {
            return true;
        }
        return false;
    }
    async extractFromLinks(images, metadata, seen) {
        const links = document.querySelectorAll('a[href*="patreonusercontent.com"]');
        for (const link of links) {
            const url = link.href;
            if (seen.has(url))
                continue;
            seen.add(url);
            images.push({
                url,
                originalUrl: url,
                width: null,
                height: null,
                index: images.length + 1,
                metadata: {
                    ...metadata,
                    originalFilename: this.extractFilenameFromUrl(url),
                },
            });
        }
    }
    async extractFromDataAttributes(images, metadata, seen) {
        const mediaElements = document.querySelectorAll('[data-media-id]');
        for (const el of mediaElements) {
            const img = el.querySelector('img');
            if (!img)
                continue;
            const url = this.getBestImageUrl(img);
            if (!url || seen.has(url))
                continue;
            seen.add(url);
            let width = img.naturalWidth || null;
            let height = img.naturalHeight || null;
            if (img.srcset) {
                const widths = img.srcset
                    .split(',')
                    .map((s) => {
                    const parts = s.trim().split(' ');
                    return parts[1] ? parseInt(parts[1].replace('w', '')) : 0;
                })
                    .filter((w) => w > 0);
                if (widths.length > 0) {
                    width = Math.max(...widths);
                }
            }
            images.push({
                url,
                originalUrl: img.src,
                width,
                height,
                index: images.length + 1,
                metadata: {
                    ...metadata,
                    originalFilename: this.extractFilenameFromUrl(url),
                },
            });
        }
    }
    extractMetadata() {
        const titleEl = document.querySelector(this.config.selectors.postTitle);
        const postTitle = titleEl?.textContent?.trim() || 'untitled';
        const dateEl = document.querySelector(this.config.selectors.postDate);
        const postDate = dateEl?.getAttribute('datetime')
            ? this.parseDate(dateEl.getAttribute('datetime'))
            : null;
        const postId = this.extractPostIdFromUrl();
        return {
            creator: '', // クリエイター名はポップアップで選択
            postId,
            postTitle,
            postDate,
            originalFilename: '',
        };
    }
    extractPostIdFromUrl() {
        const match = window.location.pathname.match(/\/posts\/([^/?]+)/);
        return match ? match[1] : 'unknown';
    }
}

;// ./src/extractors/x-extractor.ts

class XExtractor extends BaseExtractor {
    constructor() {
        super({
            urlPatterns: [
                /^https:\/\/x\.com\/[^/]+\/status\/\d+/,
                /^https:\/\/twitter\.com\/[^/]+\/status\/\d+/,
            ],
            selectors: {
                images: 'img[src*="pbs.twimg.com/media"]',
                postDate: 'article time[datetime]',
            },
        });
    }
    async extractImages() {
        const images = [];
        const metadata = this.extractMetadata();
        const seen = new Set();
        // メインツイートのarticle要素を取得（最初のarticleがメインツイート）
        const articles = document.querySelectorAll('article');
        const mainArticle = articles[0];
        if (!mainArticle) {
            return images;
        }
        // メインツイート内の画像のみを取得
        const imgElements = mainArticle.querySelectorAll(this.config.selectors.images);
        for (const img of imgElements) {
            const originalUrl = img.src;
            if (!originalUrl || seen.has(originalUrl))
                continue;
            // アイコンやプロフィール画像を除外
            if (this.isLikelyIcon(img))
                continue;
            const url = this.getBestImageUrl(originalUrl);
            if (seen.has(url))
                continue;
            seen.add(url);
            seen.add(originalUrl);
            images.push({
                url,
                originalUrl,
                width: img.naturalWidth || null,
                height: img.naturalHeight || null,
                index: images.length + 1,
                metadata: {
                    ...metadata,
                    originalFilename: this.extractFilenameFromUrl(url),
                },
            });
        }
        return images;
    }
    getBestImageUrl(url) {
        // X/Twitterの画像URLのnameパラメータをorigに変更してオリジナルサイズを取得
        // 例: ?format=jpg&name=small → ?format=jpg&name=orig
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'pbs.twimg.com') {
                urlObj.searchParams.set('name', 'orig');
                return urlObj.toString();
            }
        }
        catch {
            // URLパースに失敗した場合は元のURLを返す
        }
        return url;
    }
    isLikelyIcon(img) {
        const rect = img.getBoundingClientRect();
        // 小さい画像はアイコンの可能性が高い
        if (rect.width < 100 && rect.height < 100) {
            return true;
        }
        // プロフィール画像のURLパターンを除外
        const url = img.src.toLowerCase();
        if (url.includes('profile_images') ||
            url.includes('default_profile') ||
            url.includes('avatar')) {
            return true;
        }
        return false;
    }
    extractMetadata() {
        const postDate = this.extractDateFromPage();
        return {
            creator: this.extractUsernameFromUrl(),
            postId: this.extractTweetIdFromUrl(),
            postTitle: '', // Xにはポストタイトルがない
            postDate,
            originalFilename: '',
        };
    }
    extractUsernameFromUrl() {
        // URLから@なしのユーザー名を抽出
        // 例: https://x.com/username/status/123 → username
        const match = window.location.pathname.match(/^\/([^/]+)\/status\//);
        return match ? match[1] : 'unknown';
    }
    extractTweetIdFromUrl() {
        // URLからツイートIDを抽出
        // 例: https://x.com/username/status/123456789 → 123456789
        const match = window.location.pathname.match(/\/status\/(\d+)/);
        return match ? match[1] : 'unknown';
    }
    extractDateFromPage() {
        // メインツイートのarticle内のtime要素から日時を取得
        const articles = document.querySelectorAll('article');
        const mainArticle = articles[0];
        if (mainArticle) {
            const timeEl = mainArticle.querySelector(this.config.selectors.postDate);
            if (timeEl) {
                const datetime = timeEl.getAttribute('datetime');
                if (datetime) {
                    return this.parseDate(datetime);
                }
            }
        }
        return null;
    }
}

;// ./src/extractors/generic-extractor.ts

/**
 * 汎用画像抽出器
 * 任意のWebサイトからimg要素とbackground-imageを抽出
 */
class GenericExtractor extends BaseExtractor {
    constructor() {
        super({
            urlPatterns: [/.*/], // 全てのURLにマッチ（フォールバック用）
            selectors: {
                images: 'img',
            },
        });
    }
    async extractImages() {
        const images = [];
        const metadata = this.extractMetadata();
        const seen = new Set();
        // 1. 全てのimg要素を取得
        await this.extractFromImgElements(images, metadata, seen);
        // 2. picture要素内のsourceを取得
        await this.extractFromPictureElements(images, metadata, seen);
        // 3. background-imageを取得
        await this.extractFromBackgroundImages(images, metadata, seen);
        // 4. リンク先の画像を取得
        await this.extractFromImageLinks(images, metadata, seen);
        return images;
    }
    async extractFromImgElements(images, metadata, seen) {
        const imgElements = document.querySelectorAll('img');
        for (const img of imgElements) {
            const url = this.getBestImageUrl(img);
            if (!url || seen.has(url))
                continue;
            if (this.isLikelyIcon(img))
                continue;
            seen.add(url);
            let width = img.naturalWidth || null;
            let height = img.naturalHeight || null;
            // srcsetから最大幅を取得
            if (img.srcset) {
                const maxWidth = this.getMaxWidthFromSrcset(img.srcset);
                if (maxWidth)
                    width = maxWidth;
            }
            images.push({
                url,
                originalUrl: img.src,
                width,
                height,
                index: images.length + 1,
                metadata: {
                    ...metadata,
                    originalFilename: this.extractFilenameFromUrl(url),
                },
            });
        }
    }
    async extractFromPictureElements(images, metadata, seen) {
        const pictures = document.querySelectorAll('picture');
        for (const picture of pictures) {
            // sourceタグから最高品質の画像を取得
            const sources = picture.querySelectorAll('source');
            let bestUrl = null;
            let bestWidth = 0;
            for (const source of sources) {
                if (source.srcset) {
                    const urls = this.parseSrcset(source.srcset);
                    for (const { url, width } of urls) {
                        if (width > bestWidth) {
                            bestWidth = width;
                            bestUrl = url;
                        }
                    }
                }
            }
            // fallback img
            const img = picture.querySelector('img');
            if (img && !bestUrl) {
                bestUrl = this.getBestImageUrl(img);
            }
            if (!bestUrl || seen.has(bestUrl))
                continue;
            seen.add(bestUrl);
            images.push({
                url: bestUrl,
                originalUrl: bestUrl,
                width: bestWidth || null,
                height: null,
                index: images.length + 1,
                metadata: {
                    ...metadata,
                    originalFilename: this.extractFilenameFromUrl(bestUrl),
                },
            });
        }
    }
    async extractFromBackgroundImages(images, metadata, seen) {
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
            const style = window.getComputedStyle(el);
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage !== 'none') {
                const urls = bgImage.match(/url\(["']?([^"')]+)["']?\)/g);
                if (urls) {
                    for (const urlMatch of urls) {
                        const url = urlMatch.replace(/url\(["']?|["']?\)/g, '');
                        if (!url || seen.has(url))
                            continue;
                        if (this.isDataUrl(url) || this.isSvgUrl(url))
                            continue;
                        seen.add(url);
                        images.push({
                            url: this.resolveUrl(url),
                            originalUrl: url,
                            width: null,
                            height: null,
                            index: images.length + 1,
                            metadata: {
                                ...metadata,
                                originalFilename: this.extractFilenameFromUrl(url),
                            },
                        });
                    }
                }
            }
        }
    }
    async extractFromImageLinks(images, metadata, seen) {
        // 画像拡張子を持つリンクを取得
        const imageExtensions = /\.(jpe?g|png|gif|webp|avif|bmp)(\?.*)?$/i;
        const links = document.querySelectorAll('a[href]');
        for (const link of links) {
            const url = link.href;
            if (!url || !imageExtensions.test(url))
                continue;
            if (seen.has(url))
                continue;
            seen.add(url);
            images.push({
                url,
                originalUrl: url,
                width: null,
                height: null,
                index: images.length + 1,
                metadata: {
                    ...metadata,
                    originalFilename: this.extractFilenameFromUrl(url),
                },
            });
        }
    }
    getBestImageUrl(img) {
        // srcsetがある場合は最大サイズを選択
        if (img.srcset) {
            const sources = this.parseSrcset(img.srcset);
            sources.sort((a, b) => b.width - a.width);
            if (sources.length > 0 && sources[0].url) {
                return this.resolveUrl(sources[0].url);
            }
        }
        // data-srcをチェック（遅延読み込み対応）
        const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
        if (dataSrc && !this.isDataUrl(dataSrc)) {
            return this.resolveUrl(dataSrc);
        }
        // 通常のsrc
        if (img.src && !this.isDataUrl(img.src)) {
            return img.src;
        }
        return null;
    }
    parseSrcset(srcset) {
        return srcset
            .split(',')
            .map((s) => {
            const parts = s.trim().split(/\s+/);
            const url = parts[0];
            let width = 0;
            if (parts[1]) {
                const match = parts[1].match(/(\d+)w/);
                if (match)
                    width = parseInt(match[1]);
            }
            return { url, width };
        })
            .filter((s) => s.url);
    }
    getMaxWidthFromSrcset(srcset) {
        const widths = this.parseSrcset(srcset)
            .map((s) => s.width)
            .filter((w) => w > 0);
        return widths.length > 0 ? Math.max(...widths) : null;
    }
    isLikelyIcon(img) {
        // 表示サイズが小さい
        const rect = img.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.width < 50 && rect.height < 50) {
            return true;
        }
        // URLにアイコン系キーワード
        const url = (img.src || '').toLowerCase();
        const iconKeywords = ['icon', 'avatar', 'logo', 'favicon', 'emoji', 'badge', 'button'];
        if (iconKeywords.some((kw) => url.includes(kw))) {
            return true;
        }
        // alt属性にアイコン系キーワード
        const alt = (img.alt || '').toLowerCase();
        if (iconKeywords.some((kw) => alt.includes(kw))) {
            return true;
        }
        return false;
    }
    isDataUrl(url) {
        return url.startsWith('data:');
    }
    isSvgUrl(url) {
        return url.endsWith('.svg') || url.includes('.svg?');
    }
    resolveUrl(url) {
        try {
            return new URL(url, window.location.href).href;
        }
        catch {
            return url;
        }
    }
    extractMetadata() {
        // ページタイトルから取得
        const pageTitle = document.title || 'untitled';
        // og:titleやh1も試す
        const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
        const h1 = document.querySelector('h1')?.textContent?.trim();
        const postTitle = ogTitle || h1 || pageTitle;
        return {
            creator: '',
            postId: this.generatePostId(),
            postTitle: this.sanitizeTitle(postTitle),
            postDate: new Date(),
            originalFilename: '',
        };
    }
    generatePostId() {
        // URLからIDを生成（パスの最後の部分）
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        return segments[segments.length - 1] || 'page';
    }
    sanitizeTitle(title) {
        // ファイル名に使えない文字を除去
        return title
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 100);
    }
}

;// ./src/extractors/index.ts



// サイト専用のextractorを優先順に登録
const siteExtractors = [
    new PatreonExtractor(),
    new XExtractor(),
    // 将来追加:
    // new PixivExtractor(),
    // new FanboxExtractor(),
];
// 汎用extractor（フォールバック）
const genericExtractor = new GenericExtractor();
function getExtractor(url) {
    // まずサイト専用extractorを探す
    const siteExtractor = siteExtractors.find((e) => e.canHandle(url));
    if (siteExtractor)
        return siteExtractor;
    // 見つからなければ汎用extractorを使用
    return genericExtractor;
}
function getSupportedSites() {
    return ['patreon.com', 'pixiv.net', 'fanbox.cc', '全てのサイト'];
}
function detectSite(url) {
    if (url.includes('patreon.com'))
        return 'patreon';
    if (url.includes('pixiv.net'))
        return 'pixiv';
    if (url.includes('fanbox.cc'))
        return 'fanbox';
    if (url.includes('x.com') || url.includes('twitter.com'))
        return 'x';
    return 'generic';
}

;// ./src/utils/image-filter.ts
function filterImages(images, settings) {
    const passed = [];
    const filtered = [];
    const reasons = new Map();
    for (const image of images) {
        const result = checkImage(image, settings);
        if (result.pass) {
            passed.push(image);
        }
        else {
            filtered.push(image);
            reasons.set(image.url, result.reason);
        }
    }
    return { passed, filtered, reasons };
}
function checkImage(image, settings) {
    // サイズチェック
    if (settings.minWidth > 0 && image.width !== null) {
        if (image.width < settings.minWidth) {
            return { pass: false, reason: `幅が${settings.minWidth}px未満` };
        }
    }
    if (settings.minHeight > 0 && image.height !== null) {
        if (image.height < settings.minHeight) {
            return { pass: false, reason: `高さが${settings.minHeight}px未満` };
        }
    }
    // 拡張子チェック
    if (settings.enabledExtensions.length > 0) {
        const ext = extractExtension(image.url);
        if (ext && !settings.enabledExtensions.includes(ext)) {
            return { pass: false, reason: `拡張子 .${ext} は対象外` };
        }
    }
    return { pass: true, reason: '' };
}
function extractExtension(url) {
    try {
        const pathname = new URL(url).pathname;
        const match = pathname.match(/\.([^.?]+)(?:\?|$)/);
        return match ? match[1].toLowerCase() : '';
    }
    catch {
        return '';
    }
}

;// ./src/utils/auto-scroller.ts
/**
 * 自動スクロールでLazy Loadを発火させる
 */
async function autoScrollToLoadAll(options = {}) {
    const { scrollDelay = 300, scrollStep = window.innerHeight * 0.8, maxScrolls = 100, onProgress, } = options;
    const originalPosition = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    let currentScroll = 0;
    let scrollCount = 0;
    let lastHeight = documentHeight;
    console.log('[PicPick] 自動スクロール開始');
    while (scrollCount < maxScrolls) {
        // 下にスクロール
        currentScroll += scrollStep;
        window.scrollTo({ top: currentScroll, behavior: 'smooth' });
        await sleep(scrollDelay);
        // 新しい要素が追加されてページ高さが変わったかチェック
        const newHeight = document.documentElement.scrollHeight;
        // 進捗通知
        if (onProgress) {
            const progress = Math.min(currentScroll / newHeight, 1);
            onProgress(Math.round(progress * 100), 100);
        }
        // ページ末尾に到達したかチェック
        if (currentScroll >= newHeight - window.innerHeight) {
            // ページ高さが増えなくなったら終了
            if (newHeight === lastHeight) {
                console.log('[PicPick] ページ末尾到達');
                break;
            }
            lastHeight = newHeight;
        }
        scrollCount++;
    }
    // 元の位置に戻る
    window.scrollTo({ top: originalPosition, behavior: 'smooth' });
    console.log('[PicPick] 自動スクロール完了');
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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

;// ./src/content/overlay.ts
// オーバーレイUIを作成・管理




let overlayContainer = null;
let isDownloading = false;
let scannedImages = [];
let currentSettings = { ...DEFAULT_SETTINGS };
let suppressNextOverlayClick = false;
const OVERLAY_POSITION_KEY = 'picpickOverlayPosition';
// 対応サイトかチェックしてオーバーレイを表示
async function initOverlay() {
    const url = window.location.href;
    const extractor = getExtractor(url);
    if (!extractor)
        return; // 非対応サイトでは何もしない
    // 設定を取得してオーバーレイを表示するかチェック
    try {
        const settings = await getSettings();
        if (settings.overlayEnabled === false) {
            return; // オーバーレイが無効なら表示しない
        }
    }
    catch {
        // 設定取得に失敗した場合はデフォルトで表示
    }
    createOverlay();
    setupOverlayToggleListener();
}
function createOverlay() {
    if (overlayContainer)
        return;
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
    const presetSelect = document.getElementById('picpick-preset-select');
    const minWidthInput = document.getElementById('picpick-min-width');
    const minHeightInput = document.getElementById('picpick-min-height');
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
    const modeCustomRadio = document.getElementById('picpick-mode-custom');
    const modeTemplateRadio = document.getElementById('picpick-mode-template');
    const customNameSection = document.getElementById('picpick-custom-name-section');
    const customNameInput = document.getElementById('picpick-custom-name');
    const customTemplateSelect = document.getElementById('picpick-custom-template-select');
    const filenamePreview = document.getElementById('picpick-filename-preview');
    // 設定パネルのイベント
    const filenameTemplateInput = document.getElementById('picpick-filename-template');
    const downloadFolderInput = document.getElementById('picpick-download-folder');
    const customTemplateList = document.getElementById('picpick-custom-template-list');
    const newTemplateInput = document.getElementById('picpick-new-template');
    const addTemplateBtn = document.getElementById('picpick-add-template');
    const saveSettingsBtn = document.getElementById('picpick-save-settings');
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
            }
            catch (e) {
                console.error('Settings save failed:', e);
            }
        }
    });
}
// スキャンボタンクリック（確認ダイアログを表示）
async function handleScanClick() {
    if (isDownloading)
        return;
    const btn = document.getElementById('picpick-btn');
    const status = document.getElementById('picpick-status');
    const statusText = document.getElementById('picpick-status-text');
    if (!btn || !status || !statusText)
        return;
    btn.disabled = true;
    btn.classList.add('picpick-loading');
    status.classList.add('show');
    statusText.textContent = 'スキャン中...';
    try {
        const url = window.location.href;
        const extractor = getExtractor(url);
        if (!extractor)
            throw new Error('非対応サイト');
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
    }
    catch (error) {
        statusText.textContent = `エラー: ${error.message}`;
        setTimeout(() => status.classList.remove('show'), 3000);
    }
    finally {
        btn.disabled = false;
        btn.classList.remove('picpick-loading');
    }
}
// 再スキャン（ダイアログ内から）
async function handleRescan() {
    if (isDownloading)
        return;
    const rescanBtn = document.getElementById('picpick-rescan-btn');
    if (!rescanBtn)
        return;
    rescanBtn.disabled = true;
    rescanBtn.textContent = 'スキャン中...';
    try {
        const url = window.location.href;
        const extractor = getExtractor(url);
        if (!extractor)
            throw new Error('非対応サイト');
        currentSettings = await getSettings();
        await scrollBeforeScanIfEnabled(currentSettings);
        scannedImages = await extractor.extractImages();
        updateFilteredCount();
    }
    catch (error) {
        console.error('Rescan error:', error);
    }
    finally {
        rescanBtn.disabled = false;
        rescanBtn.textContent = '再スキャン';
    }
}
function setupDraggableOverlay(btn) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let hasMoved = false;
    btn.addEventListener('pointerdown', (event) => {
        if (!overlayContainer || event.button !== 0 || isDownloading)
            return;
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
        if (!overlayContainer || pointerId !== event.pointerId)
            return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        if (!hasMoved && Math.hypot(deltaX, deltaY) < 4)
            return;
        hasMoved = true;
        suppressNextOverlayClick = true;
        const position = clampOverlayPosition(startLeft + deltaX, startTop + deltaY);
        applyOverlayPosition(position.left, position.top);
    });
    btn.addEventListener('pointerup', (event) => {
        if (pointerId !== event.pointerId)
            return;
        btn.classList.remove('picpick-dragging');
        if (hasMoved && overlayContainer) {
            const rect = overlayContainer.getBoundingClientRect();
            saveOverlayPosition(rect.left, rect.top);
        }
        pointerId = null;
    });
    btn.addEventListener('pointercancel', (event) => {
        if (pointerId !== event.pointerId)
            return;
        btn.classList.remove('picpick-dragging');
        pointerId = null;
    });
}
function clampOverlayPosition(left, top) {
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
function applyOverlayPosition(left, top) {
    if (!overlayContainer)
        return;
    const position = clampOverlayPosition(left, top);
    overlayContainer.style.left = `${position.left}px`;
    overlayContainer.style.top = `${position.top}px`;
    overlayContainer.style.right = 'auto';
}
function restoreOverlayPosition() {
    if (!isExtensionContextValid())
        return;
    try {
        chrome.storage.sync.get(OVERLAY_POSITION_KEY, (result) => {
            const position = result?.[OVERLAY_POSITION_KEY];
            if (position &&
                typeof position.left === 'number' &&
                typeof position.top === 'number') {
                applyOverlayPosition(position.left, position.top);
            }
        });
    }
    catch {
        // 位置の復元に失敗した場合はデフォルト位置を使う
    }
}
function saveOverlayPosition(left, top) {
    if (!isExtensionContextValid())
        return;
    const position = clampOverlayPosition(left, top);
    try {
        chrome.storage.sync.set({
            [OVERLAY_POSITION_KEY]: position,
        });
    }
    catch {
        // 位置保存に失敗してもスキャン機能には影響させない
    }
}
async function scrollBeforeScanIfEnabled(settings, onProgress) {
    if (settings.scanScrollEnabled !== true)
        return;
    await autoScrollToLoadAll({
        scrollDelay: 350,
        scrollStep: Math.max(window.innerHeight * 0.85, 600),
        maxScrolls: 40,
        onProgress,
    });
}
// 確認ダイアログを表示
function showConfirmDialog() {
    const dialog = document.getElementById('picpick-confirm-dialog');
    const countEl = document.getElementById('picpick-dialog-count');
    const presetSelect = document.getElementById('picpick-preset-select');
    const minWidthInput = document.getElementById('picpick-min-width');
    const minHeightInput = document.getElementById('picpick-min-height');
    const ruleSelect = document.getElementById('picpick-rule-select');
    if (!dialog || !countEl || !presetSelect || !minWidthInput || !minHeightInput)
        return;
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
function updatePresetDropdown() {
    const presetSelect = document.getElementById('picpick-preset-select');
    if (!presetSelect)
        return;
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
function switchRule(ruleId) {
    // 前のルール設定を保存
    if (currentSettings.activeRuleId && currentSettings.ruleSessionSettings) {
        const customName = document.getElementById('picpick-custom-name')?.value || '';
        const presetSelect = document.getElementById('picpick-preset-select');
        const selectedPreset = presetSelect?.value || '';
        const namingMode = document.querySelector('input[name="picpick-naming-mode"]:checked')?.value || 'custom';
        if (!currentSettings.ruleSessionSettings[currentSettings.activeRuleId]) {
            currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {};
        }
        currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {
            customName,
            selectedPreset,
            namingMode: namingMode,
        };
    }
    // 新しいルールに切り替え
    currentSettings.activeRuleId = ruleId;
    // プリセットドロップダウンを更新
    updatePresetDropdown();
    // 新しいルールの設定を復元
    const ruleSetting = currentSettings.ruleSessionSettings?.[ruleId];
    if (ruleSetting) {
        const customNameInput = document.getElementById('picpick-custom-name');
        const presetSelect = document.getElementById('picpick-preset-select');
        const modeCustom = document.getElementById('picpick-mode-custom');
        const modeTemplate = document.getElementById('picpick-mode-template');
        if (customNameInput)
            customNameInput.value = ruleSetting.customName;
        if (presetSelect)
            presetSelect.value = ruleSetting.selectedPreset;
        if (modeCustom && modeTemplate) {
            if (ruleSetting.namingMode === 'custom') {
                modeCustom.checked = true;
            }
            else {
                modeTemplate.checked = true;
            }
        }
        // UIを更新
        updateFilteredCount();
        initOverlayNamingMode();
    }
}
// 確認ダイアログを非表示
function hideConfirmDialog() {
    const dialog = document.getElementById('picpick-confirm-dialog');
    dialog?.classList.remove('show');
}
// フィルター後の枚数を更新
function updateFilteredCount() {
    const minWidthInput = document.getElementById('picpick-min-width');
    const minHeightInput = document.getElementById('picpick-min-height');
    const countEl = document.getElementById('picpick-dialog-count');
    const scannedEl = document.getElementById('picpick-dialog-scanned');
    const imageListEl = document.getElementById('picpick-image-list');
    if (!minWidthInput || !minHeightInput || !countEl || !scannedEl || !imageListEl)
        return;
    const tempSettings = {
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
    }
    else {
        imageListEl.style.display = 'none';
    }
}
// オーバーレイのファイル名プレビューを更新
function updateOverlayFilenamePreview() {
    const customNameInput = document.getElementById('picpick-custom-name');
    const previewEl = document.getElementById('picpick-filename-preview');
    if (!previewEl)
        return;
    const name = customNameInput?.value.trim() || 'name';
    const date = new Date().toISOString().split('T')[0];
    previewEl.textContent = date + '_' + name + '_01.jpg';
}
// オーバーレイのカスタム名テンプレートリストを描画
function renderOverlayCustomTemplates() {
    const list = document.getElementById('picpick-custom-template-list');
    if (!list)
        return;
    if (currentSettings.customNameTemplates.length === 0) {
        list.innerHTML = '<p style="font-size: 11px; color: #9ca3af;">登録なし</p>';
        return;
    }
    list.innerHTML = currentSettings.customNameTemplates
        .map((name, i) => '<div class="picpick-template-item"><span>' + name + '</span><button data-index="' + i + '">×</button></div>')
        .join('');
    list.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index || '0');
            currentSettings.customNameTemplates.splice(index, 1);
            renderOverlayCustomTemplates();
            updateOverlayCustomTemplateSelect();
        });
    });
}
// オーバーレイのカスタム名テンプレート選択を更新
function updateOverlayCustomTemplateSelect() {
    const select = document.getElementById('picpick-custom-template-select');
    if (!select)
        return;
    select.innerHTML = '<option value="">-- 選択 --</option>';
    currentSettings.customNameTemplates.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}
// オーバーレイのカスタム名モードを初期化
function initOverlayNamingMode() {
    const modeCustomRadio = document.getElementById('picpick-mode-custom');
    const modeTemplateRadio = document.getElementById('picpick-mode-template');
    const customNameSection = document.getElementById('picpick-custom-name-section');
    const filenameTemplateInput = document.getElementById('picpick-filename-template');
    const downloadFolderInput = document.getElementById('picpick-download-folder');
    if (currentSettings.namingMode === 'template') {
        if (modeTemplateRadio)
            modeTemplateRadio.checked = true;
        if (customNameSection)
            customNameSection.style.display = 'none';
    }
    else {
        if (modeCustomRadio)
            modeCustomRadio.checked = true;
        if (customNameSection)
            customNameSection.style.display = 'block';
    }
    if (filenameTemplateInput)
        filenameTemplateInput.value = currentSettings.filenameTemplate;
    if (downloadFolderInput)
        downloadFolderInput.value = currentSettings.downloadFolder;
    renderOverlayCustomTemplates();
    updateOverlayCustomTemplateSelect();
    updateOverlayFilenamePreview();
}
// 保存確認
async function handleConfirmDownload() {
    if (isDownloading)
        return;
    const btn = document.getElementById('picpick-btn');
    const status = document.getElementById('picpick-status');
    const statusText = document.getElementById('picpick-status-text');
    const progressBar = document.getElementById('picpick-progress-bar');
    const presetSelect = document.getElementById('picpick-preset-select');
    const minWidthInput = document.getElementById('picpick-min-width');
    const minHeightInput = document.getElementById('picpick-min-height');
    if (!btn || !status || !statusText || !progressBar || !minWidthInput || !minHeightInput)
        return;
    // 【新規】ダウンロード前にルール設定を保存
    if (currentSettings.activeRuleId && currentSettings.ruleSessionSettings) {
        const customNameInput = document.getElementById('picpick-custom-name');
        const customName = customNameInput?.value || '';
        const selectedPreset = presetSelect?.value || '';
        const namingMode = document.querySelector('input[name="picpick-naming-mode"]:checked')?.value || 'custom';
        if (!currentSettings.ruleSessionSettings[currentSettings.activeRuleId]) {
            currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {};
        }
        currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {
            customName,
            selectedPreset,
            namingMode: namingMode,
        };
    }
    hideConfirmDialog();
    isDownloading = true;
    btn.disabled = true;
    btn.classList.add('picpick-loading');
    status.classList.add('show');
    // 設定を更新
    const settings = {
        ...currentSettings,
        minWidth: parseInt(minWidthInput.value) || 0,
        minHeight: parseInt(minHeightInput.value) || 0,
        selectedPreset: presetSelect?.value || '',
    };
    // 設定を保存（エラーは無視）
    if (isExtensionContextValid()) {
        try {
            chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings });
        }
        catch {
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
        const result = await new Promise((resolve, reject) => {
            try {
                // カスタム名モードの場合はcustomNameを送信
                const customNameInput = document.getElementById('picpick-custom-name');
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
            }
            catch {
                reject(new Error('拡張機能が更新されました。ページを再読み込みしてください。'));
            }
        });
        if (result.error) {
            statusText.textContent = `エラー: ${result.error}`;
        }
        else {
            const { success, failed } = result;
            statusText.textContent = failed > 0
                ? `完了: ${success}枚成功, ${failed}枚失敗`
                : `${success}枚のダウンロード完了!`;
            progressBar.style.width = '100%';
        }
        setTimeout(() => {
            status.classList.remove('show');
            progressBar.style.width = '0%';
        }, 3000);
    }
    catch (error) {
        statusText.textContent = `エラー: ${error.message}`;
        setTimeout(() => status.classList.remove('show'), 3000);
    }
    finally {
        isDownloading = false;
        btn.disabled = false;
        btn.classList.remove('picpick-loading');
    }
}
// 拡張機能コンテキストが有効かチェック
function isExtensionContextValid() {
    try {
        return chrome.runtime?.id !== undefined;
    }
    catch {
        return false;
    }
}
// エラー表示
function showError(message) {
    const status = document.getElementById('picpick-status');
    const statusText = document.getElementById('picpick-status-text');
    if (status && statusText) {
        status.classList.add('show');
        statusText.textContent = message;
        setTimeout(() => status.classList.remove('show'), 5000);
    }
}
async function getSettings() {
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
                    const savedPresetNames = new Set(savedPresets.map((p) => p.name));
                    const newPresets = DEFAULT_SIZE_PRESETS.filter((p) => !savedPresetNames.has(p.name));
                    const mergedPresets = [...savedPresets, ...newPresets];
                    const mergedSettings = {
                        ...DEFAULT_SETTINGS,
                        ...response,
                        sizePresets: mergedPresets,
                    };
                    resolve(mergedSettings);
                }
                else {
                    resolve(DEFAULT_SETTINGS);
                }
            });
        }
        catch (error) {
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
}
catch {
    // 拡張機能コンテキストが無効な場合は無視
}
// オーバーレイ表示/非表示のトグルリスナーを設定
function setupOverlayToggleListener() {
    try {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'TOGGLE_OVERLAY') {
                if (message.enabled) {
                    showOverlay();
                }
                else {
                    hideOverlay();
                }
            }
        });
    }
    catch {
        // 拡張機能コンテキストが無効な場合は無視
    }
}
// オーバーレイを表示
function showOverlay() {
    if (!overlayContainer) {
        createOverlay();
    }
    else {
        overlayContainer.style.display = 'block';
    }
}
// オーバーレイを非表示
function hideOverlay() {
    if (overlayContainer) {
        overlayContainer.style.display = 'none';
    }
}

;// ./src/content/content-script.ts





// ページ読み込み完了後にオーバーレイを初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOverlay);
}
else {
    initOverlay();
}
// メッセージリスナー（ポップアップからの呼び出し用）
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'EXTRACT_IMAGES') {
        extractAndFilter()
            .then((result) => sendResponse(result))
            .catch((error) => sendResponse({ error: error.message }));
        return true;
    }
});
async function extractAndFilter() {
    const url = window.location.href;
    const extractor = getExtractor(url);
    if (!extractor) {
        return {
            error: 'このサイトはサポートされていません',
            supported: false,
        };
    }
    const settings = await getSettingsFromBackground();
    if (settings.scanScrollEnabled === true) {
        await autoScrollToLoadAll({
            scrollDelay: 350,
            scrollStep: Math.max(window.innerHeight * 0.85, 600),
            maxScrolls: 40,
        });
    }
    const images = await extractor.extractImages();
    const filterResult = filterImages(images, settings);
    const metadata = extractor.extractMetadata();
    return {
        images: filterResult.passed,
        filteredCount: filterResult.filtered.length,
        siteInfo: {
            site: detectSite(url),
            creator: '', // クリエイター名はポップアップで選択
            postTitle: metadata.postTitle,
        },
    };
}
async function getSettingsFromBackground() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
            if (response && !response.error) {
                resolve(response);
            }
            else {
                resolve(DEFAULT_SETTINGS);
            }
        });
    });
}

/******/ })()
;
//# sourceMappingURL=content-script.js.map