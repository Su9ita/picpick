import { BaseExtractor } from './base-extractor';
import { PatreonExtractor } from './patreon-extractor';

const extractors: BaseExtractor[] = [
  new PatreonExtractor(),
  // 将来追加:
  // new PixivExtractor(),
  // new FanboxExtractor(),
];

export function getExtractor(url: string): BaseExtractor | null {
  return extractors.find((e) => e.canHandle(url)) || null;
}

export function getSupportedSites(): string[] {
  return ['patreon.com', 'pixiv.net', 'fanbox.cc'];
}

export function detectSite(
  url: string
): 'patreon' | 'pixiv' | 'fanbox' | 'unknown' {
  if (url.includes('patreon.com')) return 'patreon';
  if (url.includes('pixiv.net')) return 'pixiv';
  if (url.includes('fanbox.cc')) return 'fanbox';
  return 'unknown';
}
