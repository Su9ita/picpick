import { SiteRule, RuleVariable } from '../../types/site-rules';
import { ImageMetadata } from '../../types/image-info';

/**
 * Pixiv Fanbox ルール - Pixiv Fanbox特有のテンプレート変数
 *
 * 注：このルールは現在スケルトン実装です。
 * 実装時にPixiv Fanboxのメタデータ構造に合わせて拡張してください。
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
  description: 'YYYY-MM-DD形式のPixiv Fanbox投稿日',
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
  label: 'Fanbox クリエイター名',
  description: 'Pixiv Fanbox登録名',
  getValue: (metadata: ImageMetadata) => {
    // TODO: Fanbox特有のクリエイター名フィールドがある場合は、ここで処理
    return metadata.creator || '';
  },
  default: 'unknown',
};

const titleVariable: RuleVariable = {
  name: 'title',
  label: 'ポスト名',
  description: 'Pixiv Fanboxのポストタイトル',
  getValue: (metadata: ImageMetadata) => {
    return sanitizeForFilename(metadata.postTitle || 'untitled');
  },
  default: 'untitled',
};

const postIdVariable: RuleVariable = {
  name: 'postId',
  label: 'ポストID',
  description: 'Pixiv Fanboxポストの一意な識別子',
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

export const pixivFanboxRule: SiteRule = {
  siteId: 'pixiv_fanbox',
  label: 'Pixiv Fanbox ルール',
  description: 'Pixiv Fanbox用の命名規則',
  defaultTemplate: '{date}_{creator}_{title}_{index}',
  availableVariables: [
    dateVariable,
    creatorVariable,
    titleVariable,
    postIdVariable,
    indexVariable,
  ],
};
