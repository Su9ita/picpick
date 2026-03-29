import { ImageInfo } from '../types/image-info';

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
}

export function generateFilename(
  template: string,
  imageInfo: ImageInfo,
  index: number
): string {
  const vars = buildVariables(imageInfo, index);

  let filename = template;
  for (const [key, value] of Object.entries(vars)) {
    filename = filename.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  filename = sanitizeFilename(filename);

  const ext = vars.ext || 'jpg';
  return `${filename}.${ext}`;
}

function buildVariables(
  imageInfo: ImageInfo,
  index: number
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
