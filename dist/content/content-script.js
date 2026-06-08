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

;// ./src/extractors/base-extractor.ts
class BaseExtractor {
    constructor(config) {
        this.config = config;
    }
    canHandle(url) {
        return this.config.urlPatterns.some((pattern) => pattern.test(url));
    }
    async getImageDimensions(url, timeoutMs = 3000) {
        return new Promise((resolve) => {
            const img = new Image();
            const cleanup = () => {
                clearTimeout(timeoutId);
                img.onload = null;
                img.onerror = null;
            };
            const timeoutId = window.setTimeout(() => {
                cleanup();
                resolve(null);
            }, timeoutMs);
            img.onload = () => {
                cleanup();
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = () => {
                cleanup();
                resolve(null);
            };
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
        const url = img.src.toLowerCase();
        if (url.includes('pbs.twimg.com/media')) {
            return false;
        }
        // 小さい画像はアイコンの可能性が高い
        if (rect.width < 100 && rect.height < 100) {
            return true;
        }
        // プロフィール画像のURLパターンを除外
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
            const dimensions = await this.resolveImageDimensions(url, width, height);
            images.push({
                url,
                originalUrl: img.src,
                width: dimensions.width,
                height: dimensions.height,
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
            const resolvedBestUrl = this.resolveUrl(bestUrl);
            const dimensions = await this.resolveImageDimensions(resolvedBestUrl, bestWidth || null, null);
            images.push({
                url: resolvedBestUrl,
                originalUrl: bestUrl,
                width: dimensions.width,
                height: dimensions.height,
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
                        const resolvedUrl = this.resolveUrl(url);
                        const dimensions = await this.resolveImageDimensions(resolvedUrl, null, null);
                        images.push({
                            url: resolvedUrl,
                            originalUrl: url,
                            width: dimensions.width,
                            height: dimensions.height,
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
            const dimensions = await this.resolveImageDimensions(url, null, null);
            images.push({
                url,
                originalUrl: url,
                width: dimensions.width,
                height: dimensions.height,
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
    async resolveImageDimensions(url, width, height) {
        if (width !== null && height !== null) {
            return { width, height };
        }
        const dimensions = await this.getImageDimensions(url);
        if (!dimensions) {
            return { width, height };
        }
        return {
            width: dimensions.width || width,
            height: dimensions.height || height,
        };
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

;// ./src/extractors/pixiv-extractor.ts

class PixivExtractor extends BaseExtractor {
    constructor() {
        super({
            urlPatterns: [/^https?:\/\/www\.pixiv\.net\/(?:en\/)?artworks\/\d+/],
            selectors: {
                images: 'img',
            },
        });
        this.cachedMetadata = null;
    }
    async extractImages() {
        const fallbackMetadata = this.extractMetadata();
        const illustId = fallbackMetadata.postId;
        const [detailMetadata, pages] = await Promise.all([
            this.fetchPixivMetadata(illustId),
            this.fetchPixivPages(illustId),
        ]);
        const metadata = detailMetadata || fallbackMetadata;
        this.cachedMetadata = metadata;
        if (pages.length > 0) {
            return pages.map((page, index) => {
                const url = page.urls?.original || page.urls?.regular || '';
                return {
                    url,
                    originalUrl: url,
                    width: page.width || null,
                    height: page.height || null,
                    index: index + 1,
                    downloadReferrer: 'https://www.pixiv.net/',
                    metadata: {
                        ...metadata,
                        originalFilename: this.extractFilenameFromUrl(url),
                    },
                };
            }).filter((image) => image.url.includes('i.pximg.net'));
        }
        return this.extractImagesFromPreloadData(metadata);
    }
    extractMetadata() {
        if (this.cachedMetadata)
            return this.cachedMetadata;
        const illustId = this.extractIllustId();
        const preloadIllust = this.getPreloadIllust(illustId);
        const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
        const fallbackTitle = this.parseOgTitle(ogTitle);
        const title = preloadIllust?.title || fallbackTitle.title || document.title || 'untitled';
        const creator = preloadIllust?.userName || fallbackTitle.creator || '';
        const date = preloadIllust?.createDate || preloadIllust?.uploadDate || '';
        return {
            creator: this.sanitizeTitle(creator),
            postId: illustId,
            postTitle: this.sanitizeTitle(title),
            postDate: date ? this.parseDate(date) : new Date(),
            originalFilename: '',
        };
    }
    async fetchPixivMetadata(illustId) {
        if (!illustId || illustId === 'unknown')
            return null;
        try {
            const response = await fetch(`/ajax/illust/${encodeURIComponent(illustId)}?lang=ja`, {
                credentials: 'include',
                cache: 'no-store',
            });
            if (!response.ok)
                return null;
            const json = await response.json();
            if (json.error || !json.body)
                return null;
            return this.buildMetadata(json.body, illustId);
        }
        catch {
            return null;
        }
    }
    async fetchPixivPages(illustId) {
        if (!illustId || illustId === 'unknown')
            return [];
        try {
            const response = await fetch(`/ajax/illust/${encodeURIComponent(illustId)}/pages?lang=ja`, {
                credentials: 'include',
                cache: 'no-store',
            });
            if (!response.ok)
                return [];
            const json = await response.json();
            if (json.error || !Array.isArray(json.body))
                return [];
            return json.body;
        }
        catch {
            return [];
        }
    }
    extractImagesFromPreloadData(metadata) {
        const illust = this.getPreloadIllust(metadata.postId);
        const original = illust?.urls?.original || illust?.urls?.regular;
        if (!original || !original.includes('i.pximg.net'))
            return [];
        const pageCount = Math.max(illust?.pageCount || 1, 1);
        const images = [];
        for (let i = 0; i < pageCount; i++) {
            const url = original.replace(/_p\d+([._])/, `_p${i}$1`);
            images.push({
                url,
                originalUrl: url,
                width: illust?.width || null,
                height: illust?.height || null,
                index: i + 1,
                downloadReferrer: 'https://www.pixiv.net/',
                metadata: {
                    ...metadata,
                    originalFilename: this.extractFilenameFromUrl(url),
                },
            });
        }
        return images;
    }
    getPreloadIllust(illustId) {
        const preload = document.querySelector('meta[name="preload-data"]')?.content;
        if (preload) {
            try {
                const data = JSON.parse(preload);
                const illust = data?.illust?.[illustId];
                if (illust)
                    return illust;
            }
            catch {
                // Ignore malformed preload data and use other sources.
            }
        }
        const nextData = document.getElementById('__NEXT_DATA__')?.textContent;
        if (nextData) {
            try {
                return this.findIllustInObject(JSON.parse(nextData), illustId);
            }
            catch {
                return null;
            }
        }
        return null;
    }
    buildMetadata(illust, fallbackId) {
        const date = illust?.createDate || illust?.uploadDate || '';
        return {
            creator: this.sanitizeTitle(illust?.userName || ''),
            postId: illust?.id || fallbackId,
            postTitle: this.sanitizeTitle(illust?.title || 'untitled'),
            postDate: date ? this.parseDate(date) : new Date(),
            originalFilename: '',
        };
    }
    findIllustInObject(value, illustId) {
        if (!value || typeof value !== 'object')
            return null;
        const record = value;
        if ((record.id === illustId || record.illustId === illustId) && record.urls && record.title) {
            return record;
        }
        for (const child of Object.values(record)) {
            if (!child || typeof child !== 'object')
                continue;
            const found = this.findIllustInObject(child, illustId);
            if (found)
                return found;
        }
        return null;
    }
    extractIllustId() {
        const match = window.location.pathname.match(/\/artworks\/(\d+)/);
        return match?.[1] || 'unknown';
    }
    parseOgTitle(ogTitle) {
        const titleParts = ogTitle.split(' - ');
        const title = this.stripLeadingHashtags(titleParts[0] || '');
        const creator = this.stripPixivCreatorSuffix(titleParts[1] || '');
        return { title, creator };
    }
    stripPixivCreatorSuffix(creator) {
        return creator.replace(/のイラスト$/, '').trim();
    }
    stripLeadingHashtags(title) {
        return title.replace(/^(?:#[^\s#　]+[\s　]*)+/u, '').trim();
    }
    sanitizeTitle(title) {
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
    new PixivExtractor(),
    new XExtractor(),
    // 将来追加:
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
    if (settings.minWidth > 0) {
        if (image.width === null) {
            return { pass: false, reason: '幅が不明' };
        }
        if (image.width < settings.minWidth) {
            return { pass: false, reason: `幅が${settings.minWidth}px未満` };
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
    { name: '500px', minWidth: 500, minHeight: 0 },
    { name: '800px', minWidth: 800, minHeight: 0 },
    { name: '1000px', minWidth: 1000, minHeight: 0 },
    { name: '1200px', minWidth: 1200, minHeight: 0 },
    { name: '1600px', minWidth: 1600, minHeight: 0 },
    { name: '2500px', minWidth: 2500, minHeight: 0 },
    { name: '3500px', minWidth: 3500, minHeight: 0 },
];
const DEFAULT_RULE_FILENAME_PRESETS = {
    generic: [
        { id: 'default', label: '標準', template: '{title}_{index}' },
        { id: 'manual', label: '手入力名', template: '{custom}_{index}' },
        { id: 'custom-index', label: '手入力名 + 連番', template: '{custom}_{index}' },
    ],
    patreon: [
        { id: 'default', label: 'Patreon 標準', template: '{creator}_{title}_{index}' },
        { id: 'manual', label: '手入力名', template: '{custom}_{index}' },
        { id: 'custom-index', label: '手入力名 + 連番', template: '{custom}_{index}' },
    ],
    pixiv_fanbox: [
        { id: 'default', label: 'Fanbox 標準', template: '{creator}_{title}_{index}' },
        { id: 'manual', label: '手入力名', template: '{custom}_{index}' },
        { id: 'custom-index', label: '手入力名 + 連番', template: '{custom}_{index}' },
    ],
    x: [
        { id: 'default', label: 'X 標準', template: '{creator}_{index}' },
        { id: 'manual', label: '手入力名', template: '{custom}_{index}' },
        { id: 'custom-index', label: '手入力名 + 連番', template: '{custom}_{index}' },
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
    minWidth: 800,
    minHeight: 0,
    enabledExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    downloadFolder: '',
    downloadFolderPresets: [
        { id: 'picpick', label: 'picpick', folder: 'picpick' },
    ],
    selectedDownloadFolderPresetId: 'downloads',
    scanScrollEnabled: false,
    skipDuplicates: true,
    overlayEnabled: true, // デフォルトでオーバーレイを表示
    includeDateInFilename: true, // デフォルトで日付を含める
    creatorList: [],
    lastSelectedCreator: '',
    sizePresets: DEFAULT_SIZE_PRESETS,
    selectedPreset: '800px',
    namingMode: 'custom',
    customNameTemplates: [],
    // ルール別の実行時設定（デフォルト値）
    ruleSessionSettings: {
        'generic': {
            customName: '',
            selectedPreset: '800px',
            namingMode: 'custom',
            selectedFilenamePresetId: 'manual',
        },
        'patreon': {
            customName: '',
            selectedPreset: '800px',
            namingMode: 'custom',
            selectedFilenamePresetId: 'default',
        },
        'pixiv_fanbox': {
            customName: '',
            selectedPreset: '800px',
            namingMode: 'custom',
            selectedFilenamePresetId: 'default',
        },
        'x': {
            customName: '',
            selectedPreset: '800px',
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

const RULE_IDS = ['generic', 'patreon', 'pixiv_fanbox', 'x'];
// チェックボックス導入前のデフォルトIDプリセットから {date}_ を除去するマイグレーション対象
const DEFAULT_PRESET_IDS = new Set(['default', 'manual', 'custom-index']);
const REMOVED_DEFAULT_SIZE_PRESET_NAMES = new Set([
    '小サイズ除外 (200px)',
    '標準 (400px)',
    '大きめ (800px)',
    '1000×500',
    '1200×600',
    'HD以上 (1280px)',
    'Full HD (1920px)',
    '2K (2560px)',
    '4K (3840px)',
    '4K Ultrawide (5120px)',
    '5K (5120px)',
    '8K (7680px)',
]);
function cloneFilenamePresets(source) {
    return Object.fromEntries(Object.entries(source).map(([ruleId, presets]) => [
        ruleId,
        presets.map((preset) => normalizeFilenamePreset(preset)),
    ]));
}
function ensureIndexInTemplate(template) {
    const trimmed = template.trim();
    if (!trimmed || trimmed.includes('{index}'))
        return trimmed;
    return `${trimmed.replace(/_+$/, '')}_{index}`;
}
function normalizeFilenamePreset(preset) {
    return {
        ...preset,
        template: ensureIndexInTemplate(preset.template),
    };
}
function makePresetId(prefix, value, index) {
    return `${prefix}-${index}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset'}`;
}
function legacyNameToTemplate(value) {
    return value.includes('{') ? value : `{date}_${value}_{index}`;
}
function addUniquePreset(presets, preset) {
    const normalizedPreset = normalizeFilenamePreset(preset);
    if (presets.some((existing) => existing.id === normalizedPreset.id || existing.template === normalizedPreset.template)) {
        return;
    }
    presets.push(normalizedPreset);
}
function mergeSizePresets(saved) {
    const existing = Array.isArray(saved)
        ? saved
            .filter((preset) => !REMOVED_DEFAULT_SIZE_PRESET_NAMES.has(preset.name))
            .map((preset) => ({
            ...preset,
            name: `${preset.minWidth}px`,
            minHeight: 0,
        }))
        : [];
    const existingNames = new Set(existing.map((preset) => preset.name));
    return [
        ...existing,
        ...DEFAULT_SIZE_PRESETS.filter((preset) => !existingNames.has(preset.name)),
    ];
}
function sanitizeDownloadFolder(folder) {
    return folder
        .replace(/\\/g, '/')
        .split('/')
        .map((part) => part.trim().replace(/[<>:"\\|?*\x00-\x1f]/g, '_'))
        .filter(Boolean)
        .join('/');
}
function makeFolderPresetId(folder, index) {
    return `folder-${index}-${folder.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'downloads'}`;
}
function mergeDownloadFolderPresets(saved) {
    const defaults = (DEFAULT_SETTINGS.downloadFolderPresets || []).map((preset) => ({ ...preset }));
    const result = [...defaults];
    const seenFolders = new Set(result.map((preset) => preset.folder));
    for (const [index, preset] of (saved || []).entries()) {
        const folder = sanitizeDownloadFolder(preset?.folder || '');
        if (!folder || seenFolders.has(folder))
            continue;
        result.push({
            id: preset.id || makeFolderPresetId(folder, index),
            label: preset.label || folder,
            folder,
        });
        seenFolders.add(folder);
    }
    return result;
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
    // デフォルトIDのプリセットから {date}_ を除去（チェックボックス導入マイグレーション）
    for (const ruleId of RULE_IDS) {
        if (ruleFilenamePresets[ruleId]) {
            ruleFilenamePresets[ruleId] = ruleFilenamePresets[ruleId].map((preset) => {
                if (DEFAULT_PRESET_IDS.has(preset.id) && preset.template.startsWith('{date}_')) {
                    return { ...preset, template: preset.template.replace(/^\{date\}_/, '') };
                }
                return preset;
            });
        }
    }
    const settings = {
        ...DEFAULT_SETTINGS,
        ...saved,
        minHeight: 0,
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
        downloadFolderPresets: mergeDownloadFolderPresets(saved.downloadFolderPresets),
        selectedDownloadFolderPresetId: saved.selectedDownloadFolderPresetId || DEFAULT_SETTINGS.selectedDownloadFolderPresetId,
        includeDateInFilename: saved.includeDateInFilename !== undefined ? saved.includeDateInFilename : DEFAULT_SETTINGS.includeDateInFilename,
        ruleFilenamePresets,
    };
    const presetNames = new Set(settings.sizePresets.map((preset) => preset.name));
    if (settings.selectedPreset && !presetNames.has(settings.selectedPreset)) {
        settings.selectedPreset = DEFAULT_SETTINGS.selectedPreset;
        settings.minWidth = DEFAULT_SETTINGS.minWidth;
    }
    else if (settings.selectedPreset) {
        settings.minWidth = settings.sizePresets.find((preset) => preset.name === settings.selectedPreset)?.minWidth || settings.minWidth;
    }
    for (const ruleId of RULE_IDS) {
        const session = settings.ruleSessionSettings?.[ruleId];
        if (session && !session.selectedFilenamePresetId) {
            session.selectedFilenamePresetId = session.namingMode === 'template' ? 'default' : 'manual';
        }
        if (session && session.selectedPreset && !presetNames.has(session.selectedPreset)) {
            session.selectedPreset = DEFAULT_SETTINGS.selectedPreset;
        }
    }
    const folderPresetIds = new Set([
        'downloads',
        ...(settings.downloadFolderPresets || []).map((preset) => preset.id),
    ]);
    if (settings.selectedDownloadFolderPresetId && !folderPresetIds.has(settings.selectedDownloadFolderPresetId)) {
        settings.selectedDownloadFolderPresetId = DEFAULT_SETTINGS.selectedDownloadFolderPresetId;
    }
    return settings;
}
function getSelectedDownloadFolder(settings) {
    const selectedId = settings.selectedDownloadFolderPresetId || 'downloads';
    if (selectedId === 'downloads')
        return '';
    return settings.downloadFolderPresets?.find((preset) => preset.id === selectedId)?.folder || '';
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

;// ./src/utils/filename-template.ts
// チェックボックス状態に応じてテンプレートに {date}_ を付与する
function applyDateToTemplate(template, includeDateInFilename) {
    if (!includeDateInFilename)
        return template;
    if (template.startsWith('{date}'))
        return template;
    return `{date}_${template}`;
}
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
    const ext = filename_template_extractExtension(imageInfo.url);
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
    const ext = filename_template_extractExtension(imageInfo.url) || 'jpg';
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
    const ext = filename_template_extractExtension(imageInfo.url);
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
function filename_template_extractExtension(url) {
    try {
        const urlObj = new URL(url);
        const format = urlObj.searchParams.get('format');
        if (urlObj.hostname === 'pbs.twimg.com' && format) {
            return format.toLowerCase();
        }
        const pathname = urlObj.pathname;
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

;// ./src/content/overlay.ts
// オーバーレイUIを作成・管理






let overlayContainer = null;
let isDownloading = false;
let scannedImages = [];
let currentSettings = { ...DEFAULT_SETTINGS };
let suppressNextOverlayClick = false;
let overlayGhosted = false;
const OVERLAY_POSITION_KEY = 'picpickOverlayPosition';
const RULE_TAB_ORDER = ['x', 'patreon', 'pixiv_fanbox', 'generic'];
function getRuleIdForCurrentPage(url) {
    const site = detectSite(url);
    if (site === 'pixiv' || site === 'fanbox')
        return 'pixiv_fanbox';
    return site === 'unknown' ? 'generic' : site;
}
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
            if (event.button !== 1)
                return;
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
    const presetSelect = document.getElementById('picpick-preset-select');
    const minWidthInput = document.getElementById('picpick-min-width');
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
    // カスタム名モードのイベント
    const customNameSection = document.getElementById('picpick-custom-name-section');
    const customNameInput = document.getElementById('picpick-custom-name');
    const filenamePresetSelect = document.getElementById('picpick-filename-preset-select');
    const saveDestinationSelect = document.getElementById('picpick-save-destination-select');
    filenamePresetSelect?.addEventListener('change', () => {
        const ruleId = currentSettings.activeRuleId || 'generic';
        if (!currentSettings.ruleSessionSettings)
            currentSettings.ruleSessionSettings = {};
        if (!currentSettings.ruleSessionSettings[ruleId]) {
            currentSettings.ruleSessionSettings[ruleId] = {};
        }
        currentSettings.ruleSessionSettings[ruleId] = {
            ...currentSettings.ruleSessionSettings[ruleId],
            selectedFilenamePresetId: filenamePresetSelect.value,
            namingMode: getSelectedFilenamePreset(currentSettings, ruleId).template.includes('{custom}') ? 'custom' : 'template',
            customName: customNameInput?.value || '',
            selectedPreset: document.getElementById('picpick-preset-select')?.value || '',
        };
        currentSettings.namingMode = currentSettings.ruleSessionSettings[ruleId].namingMode;
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
    const includeDateCheckbox = document.getElementById('picpick-include-date');
    includeDateCheckbox?.addEventListener('change', () => {
        currentSettings.includeDateInFilename = includeDateCheckbox.checked;
        updateFilenamePresetDropdown(false);
        updateOverlayFilenamePreview();
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
        currentSettings.activeRuleId = getRuleIdForCurrentPage(url);
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
function toggleOverlayGhosted() {
    const btn = document.getElementById('picpick-btn');
    if (!btn)
        return;
    overlayGhosted = !overlayGhosted;
    btn.classList.toggle('picpick-ghosted', overlayGhosted);
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
    const overlayWidth = overlayContainer.offsetWidth || 44;
    const fromRight = window.innerWidth - position.left - overlayWidth;
    overlayContainer.style.right = `${fromRight}px`;
    overlayContainer.style.top = `${position.top}px`;
    overlayContainer.style.left = 'auto';
}
function restoreOverlayPosition() {
    if (!isExtensionContextValid())
        return;
    try {
        chrome.storage.sync.get(OVERLAY_POSITION_KEY, (result) => {
            const position = result?.[OVERLAY_POSITION_KEY];
            if (!position || typeof position.top !== 'number')
                return;
            if (typeof position.fromRight === 'number' && overlayContainer) {
                // 新フォーマット: 右端からの距離で復元（ウィンドウサイズ変化に追従）
                overlayContainer.style.right = `${position.fromRight}px`;
                overlayContainer.style.top = `${position.top}px`;
                overlayContainer.style.left = 'auto';
            }
            else if (typeof position.left === 'number') {
                // 旧フォーマット: 互換性のため一度だけ変換して適用
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
    const overlayWidth = overlayContainer?.offsetWidth || 44;
    const fromRight = window.innerWidth - position.left - overlayWidth;
    try {
        chrome.storage.sync.set({
            [OVERLAY_POSITION_KEY]: { fromRight, top: position.top },
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
    const ruleSelect = document.getElementById('picpick-rule-select');
    if (!dialog || !countEl || !presetSelect || !minWidthInput)
        return;
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
    // 日付チェックボックスの初期値を設定
    const includeDateCheckbox = document.getElementById('picpick-include-date');
    if (includeDateCheckbox) {
        includeDateCheckbox.checked = currentSettings.includeDateInFilename !== false;
    }
    updateFilteredCount();
    initOverlayNamingMode();
    updateSaveDestinationDropdown();
    dialog.classList.add('show');
}
function renderRuleTabs() {
    const tabs = document.getElementById('picpick-rule-tabs');
    const ruleSelect = document.getElementById('picpick-rule-select');
    if (!tabs)
        return;
    const rules = currentSettings.siteRules || [];
    const orderedRules = [
        ...RULE_TAB_ORDER
            .map((ruleId) => rules.find((rule) => rule.siteId === ruleId))
            .filter((rule) => Boolean(rule)),
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
            if (ruleSelect)
                ruleSelect.value = rule.siteId;
            switchRule(rule.siteId);
        });
        tabs.appendChild(button);
    }
    updateRuleTabsActive();
}
function updateRuleTabsActive() {
    const activeRuleId = currentSettings.activeRuleId || 'generic';
    document.querySelectorAll('.picpick-rule-tab').forEach((tab) => {
        const isActive = tab.dataset.ruleId === activeRuleId;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
    });
}
function getRuleIconSvg(ruleId) {
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
function switchRule(ruleId) {
    // 前のルール設定を保存
    if (currentSettings.activeRuleId && currentSettings.ruleSessionSettings) {
        const customName = document.getElementById('picpick-custom-name')?.value || '';
        const presetSelect = document.getElementById('picpick-preset-select');
        const selectedPreset = presetSelect?.value || '';
        const filenamePresetSelect = document.getElementById('picpick-filename-preset-select');
        const selectedFilenamePresetId = filenamePresetSelect?.value;
        const selectedFilenamePreset = getRuleFilenamePresets(currentSettings, currentSettings.activeRuleId)
            .find((preset) => preset.id === selectedFilenamePresetId);
        const namingMode = selectedFilenamePreset?.template.includes('{custom}') ? 'custom' : 'template';
        if (!currentSettings.ruleSessionSettings[currentSettings.activeRuleId]) {
            currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {};
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
    const ruleSelect = document.getElementById('picpick-rule-select');
    if (ruleSelect)
        ruleSelect.value = ruleId;
    updateRuleTabsActive();
    // プリセットドロップダウンを更新
    updatePresetDropdown();
    updateFilenamePresetDropdown();
    updateSaveDestinationDropdown();
    // 新しいルールの設定を復元
    const ruleSetting = currentSettings.ruleSessionSettings?.[ruleId];
    if (ruleSetting) {
        const customNameInput = document.getElementById('picpick-custom-name');
        const presetSelect = document.getElementById('picpick-preset-select');
        if (customNameInput)
            customNameInput.value = ruleSetting.customName;
        if (presetSelect)
            presetSelect.value = ruleSetting.selectedPreset;
        // UIを更新
        updateFilteredCount();
        initOverlayNamingMode();
    }
    updateFilteredCount();
    updateCustomNameVisibility();
    updateOverlayFilenamePreview();
}
// 確認ダイアログを非表示
function hideConfirmDialog() {
    const dialog = document.getElementById('picpick-confirm-dialog');
    dialog?.classList.remove('show');
}
// フィルター後の枚数を更新
function updateFilteredCount() {
    const minWidthInput = document.getElementById('picpick-min-width');
    const countEl = document.getElementById('picpick-dialog-count');
    const scannedEl = document.getElementById('picpick-dialog-scanned');
    const imageListEl = document.getElementById('picpick-image-list');
    if (!minWidthInput || !countEl || !scannedEl || !imageListEl)
        return;
    const tempSettings = {
        ...currentSettings,
        minWidth: parseInt(minWidthInput.value) || 0,
        minHeight: 0,
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
    const includeDateCheckbox = document.getElementById('picpick-include-date');
    const previewEl = document.getElementById('picpick-filename-preview');
    if (!previewEl)
        return;
    const name = customNameInput?.value.trim() || 'name';
    const ruleId = currentSettings.activeRuleId || 'generic';
    const preset = getSelectedFilenamePreset(currentSettings, ruleId);
    const includeDate = includeDateCheckbox ? includeDateCheckbox.checked : (currentSettings.includeDateInFilename !== false);
    const template = applyDateToTemplate(preset.template, includeDate);
    const previewImage = scannedImages[0] || createPreviewImageInfo();
    previewEl.textContent = generateFilename(template, previewImage, 1, name);
}
function createPreviewImageInfo() {
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
function updateFilenamePresetDropdown(resetToSaved = true) {
    const select = document.getElementById('picpick-filename-preset-select');
    if (!select)
        return;
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
function getFilenamePresetDisplayLabel(label, template) {
    if (template.includes('{custom}')) {
        return label.includes('連番') ? 'カスタム + 連番' : 'カスタム';
    }
    return label.replace(/\s*標準$/, ' 標準');
}
function getFilenamePresetPreview(template) {
    const customNameInput = document.getElementById('picpick-custom-name');
    const includeDateCheckbox = document.getElementById('picpick-include-date');
    const includeDate = includeDateCheckbox ? includeDateCheckbox.checked : (currentSettings.includeDateInFilename !== false);
    const resolvedTemplate = applyDateToTemplate(template, includeDate);
    const previewImage = scannedImages[0] || createPreviewImageInfo();
    const customName = customNameInput?.value.trim() || 'name';
    return generateFilename(resolvedTemplate, previewImage, 1, customName);
}
function updateSaveDestinationDropdown() {
    const select = document.getElementById('picpick-save-destination-select');
    if (!select)
        return;
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
function updateCustomNameVisibility() {
    const customNameSection = document.getElementById('picpick-custom-name-section');
    const customNameInput = document.getElementById('picpick-custom-name');
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
function initOverlayNamingMode() {
    updateCustomNameVisibility();
    updateFilenamePresetDropdown();
    updateSaveDestinationDropdown();
    updateOverlayFilenamePreview();
}
// 保存確認
async function handleConfirmDownload() {
    if (isDownloading)
        return;
    // クリック直後に確認ボタンを即座に無効化して二重クリックを防止
    const confirmBtnEl = document.getElementById('picpick-confirm-btn');
    if (confirmBtnEl)
        confirmBtnEl.disabled = true;
    const btn = document.getElementById('picpick-btn');
    const status = document.getElementById('picpick-status');
    const statusText = document.getElementById('picpick-status-text');
    const progressBar = document.getElementById('picpick-progress-bar');
    const presetSelect = document.getElementById('picpick-preset-select');
    const minWidthInput = document.getElementById('picpick-min-width');
    if (!btn || !status || !statusText || !progressBar || !minWidthInput) {
        if (confirmBtnEl)
            confirmBtnEl.disabled = false;
        return;
    }
    // 【新規】ダウンロード前にルール設定を保存
    if (currentSettings.activeRuleId && currentSettings.ruleSessionSettings) {
        const customNameInput = document.getElementById('picpick-custom-name');
        const filenamePresetSelect = document.getElementById('picpick-filename-preset-select');
        const customName = customNameInput?.value || '';
        const selectedPreset = presetSelect?.value || '';
        const selectedFilenamePresetId = filenamePresetSelect?.value;
        const selectedFilenamePreset = getRuleFilenamePresets(currentSettings, currentSettings.activeRuleId)
            .find((preset) => preset.id === selectedFilenamePresetId);
        const namingMode = selectedFilenamePreset?.template.includes('{custom}') ? 'custom' : 'template';
        if (!currentSettings.ruleSessionSettings[currentSettings.activeRuleId]) {
            currentSettings.ruleSessionSettings[currentSettings.activeRuleId] = {};
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
    const includeDateCheckboxFinal = document.getElementById('picpick-include-date');
    if (includeDateCheckboxFinal) {
        currentSettings.includeDateInFilename = includeDateCheckboxFinal.checked;
    }
    hideConfirmDialog();
    isDownloading = true;
    btn.disabled = true;
    btn.classList.add('picpick-loading');
    status.classList.add('show');
    // 設定を更新
    const settings = normalizeSettings({
        ...currentSettings,
        minWidth: parseInt(minWidthInput.value) || 0,
        minHeight: 0,
        selectedPreset: presetSelect?.value || '',
    });
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
        // pixiv CDN 画像はコンテンツスクリプト経由でプリフェッチ
        // (service worker から直接 fetch しても Referer が設定されないため)
        const imagesToDownload = await prefetchPixivImages(filteredImages, (current, total) => {
            statusText.textContent = `画像を取得中... ${current}/${total}`;
        });
        // ダウンロード実行
        if (!isExtensionContextValid()) {
            throw new Error('拡張機能が更新されました。ページを再読み込みしてください。');
        }
        const customNameInput = document.getElementById('picpick-custom-name');
        const customName = customNameInput?.value.trim() || undefined;
        const sendMsgPromise = new Promise((resolve, reject) => {
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
            }
            catch {
                reject(new Error('拡張機能が更新されました。ページを再読み込みしてください。'));
            }
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('タイムアウトしました。ページを再読み込みしてください。')), 15000));
        const result = await Promise.race([sendMsgPromise, timeoutPromise]);
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
        const confirmBtnFinal = document.getElementById('picpick-confirm-btn');
        if (confirmBtnFinal)
            confirmBtnFinal.disabled = false;
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
                    resolve(normalizeSettings(response));
                }
                else {
                    resolve(normalizeSettings(DEFAULT_SETTINGS));
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
// pixiv CDN 画像をコンテンツスクリプト経由でプリフェッチする
// コンテンツスクリプトは pixiv ページ上で動作するため、
// ブラウザが自動的に Referer: https://www.pixiv.net/ を付与する
async function prefetchPixivImages(images, onProgress) {
    const pixivIndices = images
        .map((img, i) => i)
        .filter((i) => images[i].url.includes('i.pximg.net'));
    if (pixivIndices.length === 0)
        return images;
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
        }
        catch {
            // service worker 側の referrer fetch にフォールバック
        }
        fetched++;
        onProgress?.(fetched, pixivIndices.length);
    }
    return result;
}
function isValidImageResponse(contentType, buffer) {
    if (contentType.toLowerCase().startsWith('image/'))
        return true;
    const bytes = new Uint8Array(buffer.slice(0, 12));
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
    const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    return isJpeg || isPng || isGif || isWebp;
}

;// ./src/content/x-inline-save.ts


const PROCESSED_ATTR = 'data-picpick-x-inline';
const STORAGE_KEY = 'picpickXDownloadedMedia';
const SCAN_DEBOUNCE_MS = 250;
const SETTINGS_CACHE_MS = 5000;
const EXTRACTION_RETRY_DELAYS_MS = [150, 450, 900];
const ERROR_RESET_MS = 3500;
let observer = null;
let scanTimer = null;
let styleInjected = false;
let downloadedKeys = new Set();
let cachedDownloadSettings = null;
let pendingSettingsRequest = null;
const activeDownloadKeys = new Set();
async function initXInlineSave() {
    if (!isXHost(location.hostname))
        return;
    downloadedKeys = await loadDownloadedKeys();
    injectStyle();
    scanArticles();
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}
function isXHost(hostname) {
    return /(^|\.)x\.com$/.test(hostname) || /(^|\.)twitter\.com$/.test(hostname);
}
function scheduleScan() {
    if (scanTimer !== null) {
        window.clearTimeout(scanTimer);
    }
    scanTimer = window.setTimeout(() => {
        scanTimer = null;
        scanArticles();
    }, SCAN_DEBOUNCE_MS);
}
function scanArticles() {
    document.querySelectorAll('article').forEach((article) => {
        if (article.getAttribute(PROCESSED_ATTR) === 'true') {
            if (!article.querySelector('.picpick-x-inline-button')) {
                const actionBar = findActionBar(article);
                if (actionBar)
                    addSaveButton(article, actionBar);
            }
            else {
                updateButtonStateForArticle(article);
            }
            return;
        }
        const images = extractImagesFromArticle(article);
        if (images.length === 0 && !hasPotentialVideo(article))
            return;
        const actionBar = findActionBar(article);
        if (!actionBar)
            return;
        article.setAttribute(PROCESSED_ATTR, 'true');
        addSaveButton(article, actionBar);
    });
}
function findActionBar(article) {
    const groups = Array.from(article.querySelectorAll('div[role="group"]'));
    return groups.find((group) => group.querySelector('[data-testid="reply"], [data-testid="retweet"], [data-testid="like"], [data-testid="share"]'))
        || groups[groups.length - 1]
        || null;
}
function addSaveButton(article, actionBar) {
    const wrapper = document.createElement('div');
    wrapper.className = 'picpick-x-inline-slot';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'picpick-x-inline-button';
    button.setAttribute('aria-label', 'Picpickで画像を保存');
    button.title = 'Picpickで画像を保存';
    button.innerHTML = getIconSvg('ready');
    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleInlineDownload(article, button).catch((error) => {
            setButtonError(button, getErrorMessage(error));
            window.setTimeout(() => updateButtonStateForArticle(article), ERROR_RESET_MS);
        });
    });
    wrapper.appendChild(button);
    actionBar.appendChild(wrapper);
    updateButtonStateForArticle(article);
}
async function handleInlineDownload(article, button) {
    if (button.dataset.state === 'loading')
        return;
    const downloadKey = getArticleDownloadKey(article);
    if (activeDownloadKeys.has(downloadKey)) {
        setButtonState(button, 'loading');
        return;
    }
    activeDownloadKeys.add(downloadKey);
    setButtonState(button, 'loading');
    try {
        const media = await extractDownloadMediaFromArticleWithRetry(article);
        if (media.length === 0) {
            setButtonError(button, '画像/動画を取得できませんでした');
            window.setTimeout(() => updateButtonStateForArticle(article), ERROR_RESET_MS);
            return;
        }
        const settings = await getDownloadSettings();
        const result = await sendDownloadMessage({
            type: 'DOWNLOAD_IMAGES',
            images: media,
            settings,
            waitForCompletion: true,
            interDownloadDelayMs: 0,
        });
        if (result.error || result.success !== media.length || result.failed) {
            throw new Error(result.error || result.errors?.[0] || 'Download failed');
        }
        for (const item of media) {
            downloadedKeys.add(getMediaKey(item));
        }
        await saveDownloadedKeys(downloadedKeys);
        button.dataset.count = String(media.length);
        setButtonState(button, 'saved');
    }
    catch (error) {
        setButtonError(button, getErrorMessage(error));
        window.setTimeout(() => updateButtonStateForArticle(article), ERROR_RESET_MS);
    }
    finally {
        activeDownloadKeys.delete(downloadKey);
    }
}
function updateButtonStateForArticle(article) {
    const button = article.querySelector('.picpick-x-inline-button');
    if (!button || button.dataset.state === 'loading')
        return;
    const images = extractImagesFromArticle(article);
    const hasVideo = hasPotentialVideo(article);
    button.dataset.count = hasVideo ? `${images.length}+` : String(images.length);
    if (!hasVideo && images.length > 0 && images.every((image) => downloadedKeys.has(getMediaKey(image)))) {
        setButtonState(button, 'saved');
    }
    else {
        setButtonState(button, 'ready');
    }
}
function setButtonState(button, state) {
    button.dataset.state = state;
    delete button.dataset.error;
    button.disabled = state === 'loading';
    button.innerHTML = getIconSvg(state);
    if (state === 'saved') {
        button.setAttribute('aria-label', 'Picpickで保存済み');
        button.title = `保存済み - クリックで再保存 (${button.dataset.count || '?'}件)`;
    }
    else if (state === 'loading') {
        button.setAttribute('aria-label', 'Picpickで保存中');
        button.title = '保存中';
    }
    else {
        button.setAttribute('aria-label', 'Picpickで画像を保存');
        button.title = state === 'error'
            ? '保存に失敗しました'
            : `Picpickで画像/動画を保存 (${button.dataset.count || '?'}件)`;
    }
}
function setButtonError(button, message) {
    button.dataset.error = message;
    setButtonState(button, 'error');
    button.dataset.error = message;
    button.setAttribute('aria-label', `Picpickで保存失敗: ${message}`);
    button.title = `保存に失敗しました: ${message}`;
}
async function extractDownloadMediaFromArticleWithRetry(article) {
    let media = await extractDownloadMediaFromArticle(article);
    if (media.length > 0)
        return media;
    for (const delay of EXTRACTION_RETRY_DELAYS_MS) {
        await x_inline_save_sleep(delay);
        media = await extractDownloadMediaFromArticle(article);
        if (media.length > 0)
            return media;
    }
    return [];
}
async function extractDownloadMediaFromArticle(article) {
    const images = extractImagesFromArticle(article);
    const metadata = extractMetadataFromArticle(article);
    if (!metadata.postId || metadata.postId === 'unknown' || !hasPotentialVideo(article)) {
        return images;
    }
    try {
        const videos = await fetchTweetVideos(metadata);
        return dedupeMedia([...images, ...videos]);
    }
    catch {
        return images;
    }
}
function extractImagesFromArticle(article) {
    const metadata = extractMetadataFromArticle(article);
    if (!metadata.postId || metadata.postId === 'unknown')
        return [];
    return collectArticleMedia(article).map((media, index) => ({
        url: media.url,
        originalUrl: media.originalUrl,
        width: media.width,
        height: media.height,
        index: index + 1,
        metadata: {
            ...metadata,
            originalFilename: extractFilenameFromUrl(media.url),
        },
    }));
}
async function fetchTweetVideos(metadata) {
    const response = await sendXTweetMediaMessage(metadata.postId);
    return response.map((media, index) => ({
        url: media.url,
        originalUrl: media.originalUrl,
        width: media.width,
        height: media.height,
        index: index + 1,
        metadata: {
            ...metadata,
            originalFilename: media.originalFilename,
        },
    }));
}
function dedupeMedia(media) {
    const seen = new Set();
    const result = [];
    for (const item of media) {
        const key = getMediaKey(item);
        if (seen.has(key))
            continue;
        seen.add(key);
        result.push({
            ...item,
            index: result.length + 1,
        });
    }
    return result;
}
function collectArticleMedia(article) {
    const media = new Map();
    let order = 0;
    const addMediaUrl = (rawUrl, source, photoIndex = Number.MAX_SAFE_INTEGER) => {
        if (!rawUrl || !rawUrl.includes('pbs.twimg.com/media'))
            return;
        const originalUrl = cleanCssUrl(rawUrl);
        const url = getOriginalImageUrl(originalUrl);
        const mediaId = getMediaIdFromUrl(url);
        if (!mediaId || media.has(mediaId))
            return;
        const img = source instanceof HTMLImageElement ? source : source.querySelector('img');
        if (img && isLikelyIcon(img))
            return;
        media.set(mediaId, {
            url,
            originalUrl,
            width: img?.naturalWidth || null,
            height: img?.naturalHeight || null,
            photoIndex,
            order: order++,
        });
    };
    article.querySelectorAll('a[href*="/photo/"]').forEach((link) => {
        const photoIndex = extractPhotoIndex(link.getAttribute('href') || '');
        collectMediaUrlsFromElement(link).forEach((url) => addMediaUrl(url, link, photoIndex));
    });
    article.querySelectorAll('img[src*="pbs.twimg.com/media"], img[srcset*="pbs.twimg.com/media"]').forEach((img) => {
        const photoIndex = extractPhotoIndex(img.closest('a[href*="/photo/"]')?.getAttribute('href') || '');
        collectMediaUrlsFromImage(img).forEach((url) => addMediaUrl(url, img, photoIndex));
    });
    article.querySelectorAll('[style*="pbs.twimg.com/media"]').forEach((element) => {
        const photoIndex = extractPhotoIndex(element.closest('a[href*="/photo/"]')?.getAttribute('href') || '');
        collectMediaUrlsFromStyle(element).forEach((url) => addMediaUrl(url, element, photoIndex));
    });
    return Array.from(media.values()).sort((a, b) => {
        if (a.photoIndex !== b.photoIndex)
            return a.photoIndex - b.photoIndex;
        return a.order - b.order;
    });
}
function collectMediaUrlsFromElement(element) {
    const urls = [];
    element.querySelectorAll('img').forEach((img) => {
        urls.push(...collectMediaUrlsFromImage(img));
    });
    if (element instanceof HTMLElement) {
        urls.push(...collectMediaUrlsFromStyle(element));
        element.querySelectorAll('[style*="pbs.twimg.com/media"]').forEach((child) => {
            urls.push(...collectMediaUrlsFromStyle(child));
        });
    }
    return urls;
}
function collectMediaUrlsFromImage(img) {
    const urls = [img.currentSrc, img.src];
    if (img.srcset) {
        img.srcset.split(',').forEach((candidate) => {
            const url = candidate.trim().split(/\s+/)[0];
            if (url)
                urls.push(url);
        });
    }
    return urls.filter(Boolean);
}
function collectMediaUrlsFromStyle(element) {
    const styleValue = element.getAttribute('style') || '';
    const urls = [];
    let match;
    const urlPattern = /url\((["']?)(.*?)\1\)/g;
    while ((match = urlPattern.exec(styleValue)) !== null) {
        urls.push(match[2]);
    }
    return urls;
}
function extractMetadataFromArticle(article) {
    const statusLink = findStatusLink(article);
    const postId = statusLink?.match(/\/status\/(\d+)/)?.[1] || 'unknown';
    const creator = statusLink?.match(/^\/([^/]+)\/status\//)?.[1] || extractCreatorFromArticle(article);
    const timeEl = article.querySelector('time[datetime]');
    const datetime = timeEl?.getAttribute('datetime');
    return {
        creator: creator || 'unknown',
        postId,
        postTitle: '',
        postDate: datetime ? new Date(datetime) : null,
        originalFilename: '',
    };
}
function hasPotentialVideo(article) {
    return Boolean(article.querySelector('video, a[href*="/video/"], [data-testid="videoPlayer"], img[src*="video_thumb"], img[src*="amplify_video_thumb"], img[src*="tweet_video_thumb"]'));
}
function findStatusLink(article) {
    const links = Array.from(article.querySelectorAll('a[href*="/status/"]'));
    const statusLink = links.find((link) => /\/[^/]+\/status\/\d+/.test(link.getAttribute('href') || ''));
    if (!statusLink)
        return null;
    try {
        return new URL(statusLink.getAttribute('href') || '', location.origin).pathname;
    }
    catch {
        return statusLink.getAttribute('href');
    }
}
function extractCreatorFromArticle(article) {
    const userLink = article.querySelector('a[role="link"][href^="/"]');
    const href = userLink?.getAttribute('href') || '';
    return href.split('/').filter(Boolean)[0] || 'unknown';
}
function getOriginalImageUrl(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'pbs.twimg.com') {
            urlObj.searchParams.set('name', 'orig');
            return urlObj.toString();
        }
    }
    catch {
        return url;
    }
    return url;
}
function cleanCssUrl(url) {
    return url.trim().replace(/^["']|["']$/g, '').replace(/&amp;/g, '&');
}
function getMediaIdFromUrl(url) {
    try {
        return new URL(url).pathname.split('/').pop() || '';
    }
    catch {
        return url;
    }
}
function extractPhotoIndex(href) {
    const match = href.match(/\/photo\/(\d+)/);
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}
function isLikelyIcon(img) {
    const rect = img.getBoundingClientRect();
    const url = img.src.toLowerCase();
    if (url.includes('pbs.twimg.com/media')) {
        return false;
    }
    return ((rect.width < 100 && rect.height < 100) ||
        url.includes('profile_images') ||
        url.includes('default_profile') ||
        url.includes('avatar'));
}
function extractFilenameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const basename = urlObj.pathname.split('/').pop() || 'image';
        const format = urlObj.searchParams.get('format');
        return format && !basename.includes('.') ? `${basename}.${format}` : basename;
    }
    catch {
        return 'image';
    }
}
function getMediaKey(image) {
    const mediaId = image.metadata.originalFilename.replace(/\.[^.]+$/, '') || image.url;
    return `${image.metadata.postId}:${mediaId}`;
}
function getArticleDownloadKey(article) {
    const metadata = extractMetadataFromArticle(article);
    const images = extractImagesFromArticle(article);
    if (images.length === 0)
        return metadata.postId || 'unknown';
    return images.map(getMediaKey).join('|');
}
async function getDownloadSettings() {
    const now = Date.now();
    if (cachedDownloadSettings && cachedDownloadSettings.expiresAt > now) {
        return cachedDownloadSettings.settings;
    }
    if (pendingSettingsRequest) {
        return pendingSettingsRequest;
    }
    pendingSettingsRequest = new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
            resolve(response && !response.error ? response : DEFAULT_SETTINGS);
        });
    }).then((settings) => {
        const normalized = normalizeSettings({
            ...settings,
            activeRuleId: 'x',
            minWidth: 0,
            minHeight: 0,
            selectedPreset: '',
        });
        cachedDownloadSettings = {
            settings: normalized,
            expiresAt: Date.now() + SETTINGS_CACHE_MS,
        };
        return normalized;
    }).finally(() => {
        pendingSettingsRequest = null;
    });
    return pendingSettingsRequest;
}
async function sendDownloadMessage(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(response || {});
        });
    });
}
function getErrorMessage(error) {
    return error instanceof Error && error.message ? error.message : 'Download failed';
}
function x_inline_save_sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
async function sendXTweetMediaMessage(postId) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            type: 'GET_X_TWEET_MEDIA',
            postId,
        }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            if (response?.error) {
                reject(new Error(response.error));
                return;
            }
            resolve(Array.isArray(response?.media) ? response.media : []);
        });
    });
}
async function loadDownloadedKeys() {
    return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEY, (result) => {
            const keys = Array.isArray(result?.[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
            resolve(new Set(keys.filter((key) => typeof key === 'string')));
        });
    });
}
async function saveDownloadedKeys(keys) {
    const values = Array.from(keys).slice(-5000);
    await chrome.storage.local.set({ [STORAGE_KEY]: values });
}
function injectStyle() {
    if (styleInjected)
        return;
    styleInjected = true;
    const style = document.createElement('style');
    style.textContent = `
    .picpick-x-inline-slot {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .picpick-x-inline-button {
      appearance: none;
      border: 0;
      background: transparent;
      color: rgb(83, 100, 113);
      cursor: pointer;
      width: 34.75px;
      height: 34.75px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: background-color 0.2s, color 0.2s;
    }

    .picpick-x-inline-button:hover {
      background-color: rgba(29, 155, 240, 0.1);
      color: rgb(29, 155, 240);
    }

    .picpick-x-inline-button[data-state="saved"] {
      color: rgb(0, 186, 124);
    }

    .picpick-x-inline-button[data-state="saved"]:hover {
      background-color: rgba(0, 186, 124, 0.1);
      color: rgb(0, 186, 124);
    }

    .picpick-x-inline-button[data-state="error"] {
      color: rgb(244, 33, 46);
    }

    .picpick-x-inline-button svg {
      width: 18.75px;
      height: 18.75px;
      fill: currentColor;
    }

    .picpick-x-inline-button[data-state="loading"] svg {
      animation: picpick-x-spin 0.8s linear infinite;
    }

    @keyframes picpick-x-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
    document.documentElement.appendChild(style);
}
function getIconSvg(state) {
    if (state === 'saved') {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.95 3.8 12.2l1.4-1.4 4.35 4.35L18.8 5.9l1.4 1.4-10.65 10.65Z"/></svg>';
    }
    if (state === 'loading') {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Z"/></svg>';
    }
    if (state === 'error') {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 7h2v7h-2V7Zm0 9h2v2h-2v-2Zm1-14 10 18H2L12 2Z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4h2v8.17l3.59-3.58L18 10l-6 6-6-6 1.41-1.41L11 12.17V4Zm-6 14h14v2H5v-2Z"/></svg>';
}

;// ./src/content/content-script.ts






// ページ読み込み完了後にオーバーレイを初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initOverlay();
        initXInlineSave();
    });
}
else {
    initOverlay();
    initXInlineSave();
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