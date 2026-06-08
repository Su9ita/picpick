import { SiteRule, RuleVariable } from '../../types/site-rules';
import { ImageMetadata } from '../../types/image-info';

/**
 * X (Twitter) ルール - X/Twitter特有のテンプレート変数
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

const dateVariable: RuleVariable = {
  name: 'date',
  label: '投稿日',
  description: 'YYYY-MM-DD形式のツイート投稿日',
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
  label: 'ユーザー名',
  description: 'X/Twitterの@なしユーザー名',
  getValue: (metadata: ImageMetadata) => metadata.creator || '',
  default: 'unknown',
};

const postIdVariable: RuleVariable = {
  name: 'postId',
  label: 'ツイートID',
  description: 'ツイートの一意な識別子',
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

export const xRule: SiteRule = {
  siteId: 'x',
  label: 'X (Twitter) ルール',
  description: 'X (Twitter)用の命名規則',
  defaultTemplate: '{date}_{creator}_{postId}_{index}',
  availableVariables: [
    dateVariable,
    creatorVariable,
    postIdVariable,
    indexVariable,
  ],
};
