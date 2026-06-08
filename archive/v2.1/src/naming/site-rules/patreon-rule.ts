import { SiteRule, RuleVariable } from '../../types/site-rules';
import { ImageMetadata } from '../../types/image-info';

/**
 * Patreon ルール - Patreon特有のテンプレート変数
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

const dateVariable: RuleVariable = {
  name: 'date',
  label: '投稿日',
  description: 'YYYY-MM-DD形式のPatreon投稿日',
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

const creatorVariable: RuleVariable = {
  name: 'creator',
  label: 'Patreon クリエイター名',
  description: 'Patreon登録名',
  getValue: (metadata: ImageMetadata) => metadata.creator || '',
  default: 'unknown',
};

const titleVariable: RuleVariable = {
  name: 'title',
  label: 'ポスト名',
  description: 'Patreonのポストタイトル',
  getValue: (metadata: ImageMetadata) => {
    return sanitizeForFilename(metadata.postTitle || 'untitled');
  },
  default: 'untitled',
};

const postIdVariable: RuleVariable = {
  name: 'postId',
  label: 'ポストID',
  description: 'Patreonポストの一意な識別子',
  getValue: (metadata: ImageMetadata) => metadata.postId || 'unknown',
  default: 'unknown',
};

const indexVariable: RuleVariable = {
  name: 'index',
  label: '連番',
  description: 'ダウンロード順の連番（01, 02, ...）',
  getValue: () => '00',
  default: '00',
};

export const patreonRule: SiteRule = {
  siteId: 'patreon',
  label: 'Patreon ルール',
  description: 'Patreon用の命名規則',
  defaultTemplate: '{date}_{creator}_{title}_{index}',
  availableVariables: [
    dateVariable,
    creatorVariable,
    titleVariable,
    postIdVariable,
    indexVariable,
  ],
};
