import { ImageInfo } from '../types/image-info';
import { Settings } from '../types/settings';

export interface FilterResult {
  passed: ImageInfo[];
  filtered: ImageInfo[];
  reasons: Map<string, string>;
}

export function filterImages(
  images: ImageInfo[],
  settings: Settings
): FilterResult {
  const passed: ImageInfo[] = [];
  const filtered: ImageInfo[] = [];
  const reasons = new Map<string, string>();

  for (const image of images) {
    const result = checkImage(image, settings);

    if (result.pass) {
      passed.push(image);
    } else {
      filtered.push(image);
      reasons.set(image.url, result.reason);
    }
  }

  return { passed, filtered, reasons };
}

export async function filterNearDuplicateImages(
  images: ImageInfo[],
  settings: Settings
): Promise<FilterResult> {
  if (
    settings.advancedImageFiltersEnabled === false ||
    settings.pHashDuplicateFilterEnabled === false ||
    images.length < 2
  ) {
    return { passed: images, filtered: [], reasons: new Map() };
  }

  const threshold = Math.max(0, Math.min(32, Math.round(settings.pHashDistanceThreshold ?? 6)));
  const passed: ImageInfo[] = [];
  const filtered: ImageInfo[] = [];
  const reasons = new Map<string, string>();
  const hashesByPost = new Map<string, bigint[]>();

  for (const image of images) {
    const hash = await computeAverageHash(image);
    if (hash == null) {
      passed.push(image);
      continue;
    }

    const postId = image.metadata.postId || '__unknown__';
    const hashes = hashesByPost.get(postId) || [];
    const isDuplicate = hashes.some((existing) => hammingDistance(hash, existing) <= threshold);

    if (isDuplicate) {
      filtered.push(image);
      reasons.set(image.url, `近似重複（pHash距離 ${threshold} 以下）`);
      continue;
    }

    hashes.push(hash);
    hashesByPost.set(postId, hashes);
    passed.push(image);
  }

  return { passed, filtered, reasons };
}

function checkImage(
  image: ImageInfo,
  settings: Settings
): { pass: boolean; reason: string } {
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

  if (settings.advancedImageFiltersEnabled !== false) {
    if (settings.aspectRatioFilterEnabled !== false && image.width && image.height) {
      const ratio = image.width / image.height;
      const min = settings.minAspectRatio ?? 0.35;
      const max = settings.maxAspectRatio ?? 3.2;
      if (ratio < min || ratio > max) {
        return { pass: false, reason: `縦横比が対象外 (${ratio.toFixed(2)})` };
      }
    }

    if (settings.keywordFilterEnabled !== false && hasExcludedKeyword(image)) {
      return { pass: false, reason: 'sample/お礼/目次系のキーワード' };
    }

    if (settings.positionHeuristicFilterEnabled !== false && isLikelyEdgeCard(image)) {
      return { pass: false, reason: '投稿の先頭/末尾にあるカード候補' };
    }
  }

  return { pass: true, reason: '' };
}

function extractExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([^.?]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : '';
  } catch {
    return '';
  }
}

function hasExcludedKeyword(image: ImageInfo): boolean {
  const haystack = [
    image.url,
    image.originalUrl,
    image.metadata.originalFilename,
    image.metadata.postTitle,
  ].join(' ').toLowerCase();

  return [
    'sample',
    'preview',
    'thumbnail',
    'thumb',
    'banner',
    'header',
    'cover',
    'thanks',
    'thank_you',
    'thank-you',
    'notice',
    'readme',
    'omake',
    'mokuji',
    '目次',
    'サンプル',
    'sample版',
    'お礼',
    '御礼',
    '告知',
    '案内',
    '表紙',
  ].some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function isLikelyEdgeCard(image: ImageInfo): boolean {
  const index = image.index || 0;
  if (index > 2) return false;
  if (image.width && image.height) {
    const ratio = image.width / image.height;
    if (ratio > 1.8 || ratio < 0.45) return true;
  }
  return hasExcludedKeyword(image);
}

async function computeAverageHash(image: ImageInfo): Promise<bigint | null> {
  if (!image.blobData) return null;
  try {
    const blob = new Blob([image.blobData], { type: image.blobMimeType || 'image/jpeg' });
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0, 8, 8);
    bitmap.close();

    const data = ctx.getImageData(0, 0, 8, 8).data;
    const values: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      values.push((data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114));
    }
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return values.reduce((hash, value, index) => (
      value >= average ? hash | (1n << BigInt(index)) : hash
    ), 0n);
  } catch {
    return null;
  }
}

function hammingDistance(a: bigint, b: bigint): number {
  let value = a ^ b;
  let distance = 0;
  while (value > 0n) {
    distance += Number(value & 1n);
    value >>= 1n;
  }
  return distance;
}
