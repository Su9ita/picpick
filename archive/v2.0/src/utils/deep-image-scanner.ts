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

  for (const image of await extractor.extractImages()) {
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
  } finally {
    observer.disconnect();
  }

  const images = Array.from(imagesByUrl.values());
  await fillMissingDimensions(images);

  return images.map((image, index) => ({
    ...image,
    index: index + 1,
  }));
}

function collectFromDocument(addUrl: (url: string, metadata?: ImageMetadata) => void, metadata: ImageMetadata): void {
  document.querySelectorAll('*').forEach((el) => collectFromElement(el, addUrl, metadata));
}

function collectFromElement(
  element: Element,
  addUrl: (url: string, metadata?: ImageMetadata) => void,
  metadata: ImageMetadata
): void {
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
    if (entry.initiatorType === 'img' || looksLikeImageUrl(entry.name)) {
      collectUrlValue(entry.name, addUrl, metadata);
    }
  }
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
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return false;

  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.svg') || EXCLUDE_KEYWORDS.some((keyword) => lowerUrl.includes(keyword))) {
    return false;
  }

  return IMAGE_URL_PATTERN.test(lowerUrl) || /[?&](format|type)=webp(?:&|$)/i.test(lowerUrl);
}

function extractFilenameFromUrl(url: string): string {
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
