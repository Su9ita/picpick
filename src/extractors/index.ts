import { BaseExtractor } from './base-extractor';
import { PatreonExtractor } from './patreon-extractor';
import { XExtractor } from './x-extractor';
import { GenericExtractor } from './generic-extractor';

// サイト専用のextractorを優先順に登録
const siteExtractors: BaseExtractor[] = [
  new PatreonExtractor(),
  new XExtractor(),
  // 将来追加:
  // new PixivExtractor(),
  // new FanboxExtractor(),
];

// 汎用extractor（フォールバック）
const genericExtractor = new GenericExtractor();

export function getExtractor(url: string): BaseExtractor | null {
  // まずサイト専用extractorを探す
  const siteExtractor = siteExtractors.find((e) => e.canHandle(url));
  if (siteExtractor) return siteExtractor;

  // 見つからなければ汎用extractorを使用
  return genericExtractor;
}

export function getSupportedSites(): string[] {
  return ['patreon.com', 'pixiv.net', 'fanbox.cc', '全てのサイト'];
}

export function detectSite(
  url: string
): 'patreon' | 'pixiv' | 'fanbox' | 'x' | 'generic' | 'unknown' {
  if (url.includes('patreon.com')) return 'patreon';
  if (url.includes('pixiv.net')) return 'pixiv';
  if (url.includes('fanbox.cc')) return 'fanbox';
  if (url.includes('x.com') || url.includes('twitter.com')) return 'x';
  return 'generic';
}
