import { SiteRule, RuleVariable, SiteContext } from '../../types/site-rules';
import { ImageMetadata } from '../../types/image-info';

/**
 * 汎用ルール - すべてのサイトで使用できる基本的なテンプレート変数
 * 既存のTemplateVariablesをRuleVariableに変換
 */

function formatDate(date: Date, format: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return format
    .replace('YYYY', String(y))
    .replace('MM', m)
    .replace('DD', d);
}

function sanitizeForFilename(str: string): string {
  return str
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

function extractExtension(url: string = ''): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([^.?]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : 'jpg';
  } catch {
    return 'jpg';
  }
}

// このファイルでは、ImageInfoの代わりにメタデータだけを使用するため、
// URLが必要な場合はcontextから取得する必要があります

const dateVariable: RuleVariable = {
  name: 'date',
  label: '日付',
  description: 'YYYY-MM-DD形式の投稿日',
  getValue: (metadata: ImageMetadata) => {
    const rawDate = metadata.postDate;
    const date = rawDate instanceof Date
      ? rawDate
      : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    return formatDate(validDate, 'YYYY-MM-DD');
  },
  default: '1900-01-01',
};

const yearVariable: RuleVariable = {
  name: 'year',
  label: '年',
  description: 'YYYY形式の年',
  getValue: (metadata: ImageMetadata) => {
    const rawDate = metadata.postDate;
    const date = rawDate instanceof Date
      ? rawDate
      : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    return formatDate(validDate, 'YYYY');
  },
  default: '1900',
};

const monthVariable: RuleVariable = {
  name: 'month',
  label: '月',
  description: 'MM形式の月',
  getValue: (metadata: ImageMetadata) => {
    const rawDate = metadata.postDate;
    const date = rawDate instanceof Date
      ? rawDate
      : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    return formatDate(validDate, 'MM');
  },
  default: '01',
};

const dayVariable: RuleVariable = {
  name: 'day',
  label: '日',
  description: 'DD形式の日',
  getValue: (metadata: ImageMetadata) => {
    const rawDate = metadata.postDate;
    const date = rawDate instanceof Date
      ? rawDate
      : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    return formatDate(validDate, 'DD');
  },
  default: '01',
};

const creatorVariable: RuleVariable = {
  name: 'creator',
  label: 'クリエイター名',
  description: 'Webサイトに登録されているクリエイター名',
  getValue: (metadata: ImageMetadata) => metadata.creator || '',
  default: 'unknown',
};

const titleVariable: RuleVariable = {
  name: 'title',
  label: 'ポスト名',
  description: 'ポストのタイトル',
  getValue: (metadata: ImageMetadata) => {
    return sanitizeForFilename(metadata.postTitle || 'untitled');
  },
  default: 'untitled',
};

const postIdVariable: RuleVariable = {
  name: 'postId',
  label: 'ポストID',
  description: 'ポストの一意な識別子',
  getValue: (metadata: ImageMetadata) => metadata.postId || 'unknown',
  default: 'unknown',
};

const originalVariable: RuleVariable = {
  name: 'original',
  label: '元のファイル名',
  description: '元のファイル名（拡張子なし）',
  getValue: (metadata: ImageMetadata) => {
    const urlFilename = metadata.originalFilename || 'image';
    return urlFilename.replace(/\.[^.]+$/, '');
  },
  default: 'image',
};

const indexVariable: RuleVariable = {
  name: 'index',
  label: '連番',
  description: 'ダウンロード順の連番（01, 02, ...）',
  getValue: (metadata: ImageMetadata) => {
    // indexはメタデータに含まれないため、ここでは0を返す
    // 実際の値は呼び出し側で提供される
    return '00';
  },
  default: '00',
};

// 注：extは別途処理が必要なため、ここでは定義しない

export const genericRule: SiteRule = {
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
