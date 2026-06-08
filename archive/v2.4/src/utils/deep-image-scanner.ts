import { BaseExtractor } from '../extractors/base-extractor';
import { ImageInfo, ImageMetadata } from '../types/image-info';
import { autoScrollToLoadAll } from './auto-scroller';

const IMAGE_URL_PATTERN = /\.(jpe?g|png|gif|webp|avif|bmp)(?:[?#].*)?$/i;
const SRCSET_ATTRS = ['srcset', 'data-srcset'];
const URL_ATTRS = [
  'src',
  'currentSrc',
  'href',
  'data-src',
  'data-lazy-src',
  'data-original',
  'data-echo',
  'data-lazyload',
  'data-lazy',
  'data-url',
  'data-image',
  'data-bg',
  'data-background',
  'data-hi-res-src',
  'data-full',
  'data-full-src',
  'data-large',
  'data-large-file',
  'data-webp',
];

const EXCLUDE_KEYWORDS = [
  'avatar',
  'badge',
  'banner',
  'button',
  'emoji',
  'favicon',
  'icon',
  'logo',
  'placeholder',
  'profile',
  'sprite',
  'thumbnail',
];

export async function deepScanImages(
  extractor: BaseExtractor,
  options: {
    scroll?: boolean;
  } = {}
): Promise<ImageInfo[]> {
  const metadata = extractor.extractMetadata();
  const imagesByUrl = new Map<string, ImageInfo>();
  const debug = createScanDebug();

  const addImage = (image: ImageInfo) => {
    const normalizedUrl = normalizeUrl(image.url);
    if (!normalizedUrl || imagesByUrl.has(normalizedUrl)) return;
    imagesByUrl.set(normalizedUrl, {
      ...image,
      url: normalizedUrl,
      originalUrl: image.originalUrl || normalizedUrl,
      index: imagesByUrl.size + 1,
    });
  };

  const addUrl = (url: string, sourceMetadata = metadata) => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl || imagesByUrl.has(normalizedUrl)) return;
    imagesByUrl.set(normalizedUrl, createImageInfo(normalizedUrl, sourceMetadata, imagesByUrl.size + 1));
  };

  debug('start', { url: location.href });
  await startNetworkCapture();

  const extractorImages = await extractor.extractImages();
  debug('extractor', { count: extractorImages.length });
  for (const image of extractorImages) {
    addImage(image);
  }

  collectFromDocument(addUrl, metadata);
  collectFromPerformance(addUrl, metadata);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        collectFromElement(mutation.target, addUrl, metadata);
      }

      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          collectFromElement(node, addUrl, metadata);
          node.querySelectorAll('*').forEach((el) => collectFromElement(el, addUrl, metadata));
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [...URL_ATTRS, ...SRCSET_ATTRS, 'style'],
  });

  try {
    if (options.scroll !== false) {
      await autoScrollToLoadAll({
        scrollDelay: 350,
        scrollStep: Math.max(window.innerHeight * 0.85, 600),
        maxScrolls: 180,
      });
      await sleep(700);
    }

    collectFromDocument(addUrl, metadata);
    collectFromPerformance(addUrl, metadata);

    const linkedImageUrls = await fetchLinkedImageUrls(debug);
    debug('linked-images', { count: linkedImageUrls.length });
    for (const url of linkedImageUrls) {
      addUrl(url, metadata);
    }
  } finally {
    observer.disconnect();

    const networkUrls = await stopNetworkCapture();
    debug('network-images', { count: networkUrls.length });
    for (const url of networkUrls) {
      addUrl(url, metadata);
    }
  }

  const images = Array.from(imagesByUrl.values());
  debug('before-dimensions', { count: images.length });
  await fillMissingDimensions(images);
  debug('after-dimensions', {
    count: images.length,
    withDimensions: images.filter((image) => image.width !== null && image.height !== null).length,
  });

  return images.map((image, index) => ({
    ...image,
    index: index + 1,
  }));
}

async function startNetworkCapture(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ type: 'START_NETWORK_CAPTURE' });
  } catch {
    // v2.1 can still fall back to DOM/performance scanning if capture is unavailable.
  }
}

async function stopNetworkCapture(): Promise<string[]> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'STOP_NETWORK_CAPTURE' });
    return Array.isArray(response?.urls) ? response.urls : [];
  } catch {
    return [];
  }
}

async function fetchLinkedImageUrls(debug: (step: string, data?: unknown) => void): Promise<string[]> {
  await waitForReaderLinks();

  const readerUrls = collectReaderUrls();
  const ajaxRequests = collectAjaxReaderRequests();
  debug('reader-links', { urls: readerUrls.length, ajaxRequests: ajaxRequests.length });

  if (readerUrls.length === 0 && ajaxRequests.length === 0) {
    return [];
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_IMAGE_URLS',
      urls: readerUrls,
      ajaxRequests,
    });
    return Array.isArray(response?.urls) ? response.urls : [];
  } catch {
    return [];
  }
}

function collectReaderUrls(): string[] {
  const urls = new Set<string>();

  if (isMangaRawJpChapter()) {
    urls.add(location.href);
  }

  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    const href = link.href;
    const rawHref = link.getAttribute('href') || '';
    if (!href || rawHref === '#' || href === location.href || href.startsWith('javascript:')) return;

    const className = link.className || '';
    if (
      className.includes('go-to-B') ||
      link.closest('.image_server') ||
      /server|reader|chapter|view/i.test(href)
    ) {
      urls.add(href);
    }
  });

  return Array.from(urls);
}

function isMangaRawJpChapter(): boolean {
  return /(?:^|\.)mangarawjp\.tv$/i.test(location.hostname) && location.pathname.includes('/manga-raw/');
}

async function waitForReaderLinks(timeoutMs = 6000): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const readyLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('.go-to-B[href]'))
      .some((link) => {
        const href = link.getAttribute('href') || '';
        return href && href !== '#';
      });

    if (readyLink) return;
    await sleep(300);
  }
}

function collectAjaxReaderRequests(): Array<{ url: string; body: Record<string, string> }> {
  const requests: Array<{ url: string; body: Record<string, string> }> = [];
  const ajaxUrl = getZingValue('ajax_url') || new URL('/wp-admin/admin-ajax.php', location.href).href;
  const nonce = getZingValue('nonce');

  document.querySelectorAll<HTMLElement>('.go-to-B[data-p][data-c]').forEach((element) => {
    const p = element.dataset.p;
    const c = element.dataset.c;
    if (!p || !c || !nonce) return;

    requests.push({
      url: ajaxUrl,
      body: {
        action: 'z_do_ajax',
        _action: 'GoToB',
        nonce,
        p,
        c,
      },
    });
  });

  return requests;
}

function getZingValue(key: 'ajax_url' | 'nonce'): string | null {
  const scripts = Array.from(document.scripts).map((script) => script.textContent || '').join('\n');
  const match = scripts.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
  if (match) {
    return match[1].replace(/\\\//g, '/');
  }

  const globalZing = (window as Window & { zing?: Record<string, string> }).zing;
  return globalZing?.[key] || null;
}

function collectFromDocument(addUrl: (url: string, metadata?: ImageMetadata) => void, metadata: ImageMetadata): void {
  document.querySelectorAll('*').forEach((el) => collectFromElement(el, addUrl, metadata));
}

function collectFromElement(
  element: Element,
  addUrl: (url: string, metadata?: ImageMetadata) => void,
  metadata: ImageMetadata
): void {
  if (element instanceof HTMLImageElement && isVisibleImageElement(element)) {
    collectTrustedImageUrl(element.currentSrc || element.src, addUrl, metadata);
  }

  for (const attr of URL_ATTRS) {
    const value = attr === 'currentSrc' && element instanceof HTMLImageElement
      ? element.currentSrc
      : element.getAttribute(attr);
    collectUrlValue(value, addUrl, metadata);
  }

  for (const attr of SRCSET_ATTRS) {
    collectSrcset(element.getAttribute(attr), addUrl, metadata);
  }

  const style = element.getAttribute('style');
  if (style) {
    collectCssUrls(style, addUrl, metadata);
  }

  const computedBackground = window.getComputedStyle(element).backgroundImage;
  if (computedBackground && computedBackground !== 'none') {
    collectCssUrls(computedBackground, addUrl, metadata);
  }
}

function collectFromPerformance(addUrl: (url: string, metadata?: ImageMetadata) => void, metadata: ImageMetadata): void {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  for (const entry of entries) {
    if (entry.initiatorType === 'img') {
      collectTrustedImageUrl(entry.name, addUrl, metadata);
    } else if (looksLikeImageUrl(entry.name)) {
      collectUrlValue(entry.name, addUrl, metadata);
    }
  }
}

function collectTrustedImageUrl(
  value: string | null | undefined,
  addUrl: (url: string, metadata?: ImageMetadata) => void,
  metadata: ImageMetadata
): void {
  if (!value) return;

  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return;
  if (isExcludedImageUrl(trimmed)) return;

  addUrl(trimmed, metadata);
}

function collectUrlValue(
  value: string | null | undefined,
  addUrl: (url: string, metadata?: ImageMetadata) => void,
  metadata: ImageMetadata
): void {
  if (!value) return;

  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return;

  if (trimmed.includes(',')) {
    collectSrcset(trimmed, addUrl, metadata);
    return;
  }

  if (looksLikeImageUrl(trimmed)) {
    addUrl(trimmed, metadata);
  }
}

function collectSrcset(
  value: string | null | undefined,
  addUrl: (url: string, metadata?: ImageMetadata) => void,
  metadata: ImageMetadata
): void {
  if (!value) return;

  for (const part of value.split(',')) {
    const url = part.trim().split(/\s+/)[0];
    if (looksLikeImageUrl(url)) {
      addUrl(url, metadata);
    }
  }
}

function collectCssUrls(
  value: string,
  addUrl: (url: string, metadata?: ImageMetadata) => void,
  metadata: ImageMetadata
): void {
  const regex = /url\(["']?([^"')]+)["']?\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value)) !== null) {
    collectUrlValue(match[1], addUrl, metadata);
  }
}

async function fillMissingDimensions(images: ImageInfo[]): Promise<void> {
  const jobs = images
    .filter((image) => image.width === null || image.height === null)
    .map(async (image) => {
      const dimensions = await probeDimensions(image.url);
      if (dimensions) {
        image.width = dimensions.width;
        image.height = dimensions.height;
      }
    });

  await Promise.all(jobs);
}

function probeDimensions(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => resolve(null), 5000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    img.src = url;
  });
}

function createImageInfo(url: string, metadata: ImageMetadata, index: number): ImageInfo {
  return {
    url,
    originalUrl: url,
    width: null,
    height: null,
    index,
    metadata: {
      ...metadata,
      originalFilename: extractFilenameFromUrl(url),
    },
  };
}

function normalizeUrl(url: string): string | null {
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return null;
  }
}

function looksLikeImageUrl(url: string): boolean {
  if (!url || url.startsWith('blob:')) return false;

  if (url.startsWith('picpick-captured://')) return true;

  if (isExcludedImageUrl(url)) {
    return false;
  }

  const lowerUrl = url.toLowerCase();
  return IMAGE_URL_PATTERN.test(lowerUrl) || /[?&](format|type)=webp(?:&|$)/i.test(lowerUrl);
}

function isVisibleImageElement(img: HTMLImageElement): boolean {
  const rect = img.getBoundingClientRect();
  return Boolean((img.currentSrc || img.src) && rect.width >= 50 && rect.height >= 50);
}

function isExcludedImageUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.svg') || EXCLUDE_KEYWORDS.some((keyword) => lowerUrl.includes(keyword));
}

function extractFilenameFromUrl(url: string): string {
  if (url.startsWith('picpick-captured://')) {
    return url.split('/').pop() || 'captured-image.jpg';
  }

  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop() || 'image';
  } catch {
    return 'image';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createScanDebug(): (step: string, data?: unknown) => void {
  const enabled = localStorage.getItem('picpickDebug') === '1';
  return (step: string, data?: unknown) => {
    if (enabled) {
      console.log(`[PicPick v2.4] ${step}`, data || '');
    }
  };
}
