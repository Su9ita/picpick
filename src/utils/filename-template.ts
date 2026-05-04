import { ImageInfo } from '../types/image-info';

// ベースプレフィックスから次の連番を取得（ダウンロード履歴を検索）
export async function findNextIndex(
  basePrefix: string,
  _downloadFolder: string
): Promise<number> {
  return new Promise((resolve) => {
    // Chrome Downloads APIで最近のダウンロード履歴を取得
    // filenameRegexは絵文字や特殊文字で問題があるため、全件取得してJSでフィルタ
    chrome.downloads.search(
      {
        orderBy: ['-startTime'],
        limit: 500,
      },
      (downloads) => {
        if (!downloads || downloads.length === 0) {
          resolve(1);
          return;
        }

        // 既存ファイルから連番を抽出
        const existingNumbers: number[] = [];

        for (const d of downloads) {
          // interrupted/cancelled items still remain in Chrome's history with
          // their reserved filename. Counting those creates visible gaps such
          // as _01 missing and the next successful file starting at _02.
          if (d.state !== 'complete') continue;

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
      }
    );
  });
}

// ベースプレフィックス（連番なしのファイル名）を生成
export function generateBasePrefix(
  template: string,
  imageInfo: ImageInfo,
  customName: string = ''
): string {
  // {index} を除いたテンプレートでファイル名を生成
  const templateWithoutIndex = template.replace(/\{index\}/g, '').replace(/_+$/, '');
  const vars = buildVariablesWithoutIndex(imageInfo, customName);

  let filename = templateWithoutIndex;
  for (const [key, value] of Object.entries(vars)) {
    filename = filename.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return sanitizeFilename(filename);
}

function buildVariablesWithoutIndex(
  imageInfo: ImageInfo,
  customName: string = ''
): Omit<TemplateVariables, 'index'> {
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

export interface TemplateVariables {
  date: string;
  year: string;
  month: string;
  day: string;
  creator: string;
  title: string;
  postId: string;
  index: string;
  original: string;
  ext: string;
  custom: string;
}

export function generateFilename(
  template: string,
  imageInfo: ImageInfo,
  index: number,
  customName: string = ''
): string {
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
export function generateCustomFilename(
  customName: string,
  imageInfo: ImageInfo,
  index: number
): string {
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
export function generateCustomBasePrefix(
  customName: string,
  imageInfo: ImageInfo
): string {
  const rawDate = imageInfo.metadata.postDate;
  const date = rawDate instanceof Date
    ? rawDate
    : (typeof rawDate === 'string' ? new Date(rawDate) : new Date());
  const validDate = isNaN(date.getTime()) ? new Date() : date;

  const dateStr = formatDate(validDate, 'YYYY-MM-DD');
  const sanitizedName = sanitizeForFilename(customName || 'image');

  return sanitizeFilename(`${dateStr}_${sanitizedName}`);
}


function buildVariables(
  imageInfo: ImageInfo,
  index: number,
  customName: string = ''
): TemplateVariables {
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
    creator: imageInfo.metadata.creator || '',  // 空ならファイル名から省略
    title: sanitizeForFilename(imageInfo.metadata.postTitle || 'untitled'),
    postId: imageInfo.metadata.postId || 'unknown',
    index: String(index).padStart(2, '0'),
    original: urlFilename.replace(/\.[^.]+$/, ''),
    ext,
    custom: sanitizeForFilename(customName || 'image'),
  };
}

function formatDate(date: Date, format: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return format
    .replace('YYYY', String(y))
    .replace('MM', m)
    .replace('DD', d);
}

function extractExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([^.?]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : 'jpg';
  } catch {
    return 'jpg';
  }
}

function sanitizeForFilename(str: string): string {
  return str
    // ファイル名に使えない文字のみ置換（絵文字は保持）
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    // 複数の空白は1つのスペースに
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

function sanitizeFilename(filename: string): string {
  return filename
    // ファイル名に使えない文字のみ置換（絵文字は保持）
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    // 連続アンダースコアを1つに
    .replace(/__+/g, '_')
    .trim()
    .slice(0, 200);
}
