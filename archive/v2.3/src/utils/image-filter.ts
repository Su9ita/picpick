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

function checkImage(
  image: ImageInfo,
  settings: Settings
): { pass: boolean; reason: string } {
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

function extractExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([^.?]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : '';
  } catch {
    return '';
  }
}
