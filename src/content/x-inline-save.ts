import { ImageInfo, ImageMetadata } from '../types/image-info';
import { DownloadImagesMessage, XTweetMedia } from '../types/messages';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { normalizeSettings } from '../utils/settings-normalizer';

const PROCESSED_ATTR = 'data-picpick-x-inline';
const STORAGE_KEY = 'picpickXDownloadedMedia';
const SCAN_DEBOUNCE_MS = 250;
const SETTINGS_CACHE_MS = 5000;
const EXTRACTION_RETRY_DELAYS_MS = [150, 450, 900];
const ERROR_RESET_MS = 3500;

let observer: MutationObserver | null = null;
let scanTimer: number | null = null;
let styleInjected = false;
let downloadedKeys = new Set<string>();
let cachedDownloadSettings: { settings: Settings; expiresAt: number } | null = null;
let pendingSettingsRequest: Promise<Settings> | null = null;
const activeDownloadKeys = new Set<string>();

type ButtonState = 'ready' | 'loading' | 'saved' | 'error';

export async function initXInlineSave(): Promise<void> {
  if (!isXHost(location.hostname)) return;

  downloadedKeys = await loadDownloadedKeys();
  injectStyle();
  scanArticles();

  observer = new MutationObserver(scheduleScan);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function isXHost(hostname: string): boolean {
  return /(^|\.)x\.com$/.test(hostname) || /(^|\.)twitter\.com$/.test(hostname);
}

function scheduleScan(): void {
  if (scanTimer !== null) {
    window.clearTimeout(scanTimer);
  }
  scanTimer = window.setTimeout(() => {
    scanTimer = null;
    scanArticles();
  }, SCAN_DEBOUNCE_MS);
}

function scanArticles(): void {
  document.querySelectorAll<HTMLElement>('article').forEach((article) => {
    if (article.getAttribute(PROCESSED_ATTR) === 'true') {
      if (!article.querySelector('.picpick-x-inline-button')) {
        const actionBar = findActionBar(article);
        if (actionBar) addSaveButton(article, actionBar);
      } else {
        updateButtonStateForArticle(article);
      }
      return;
    }

    const images = extractImagesFromArticle(article);
    if (images.length === 0 && !hasPotentialVideo(article)) return;

    const actionBar = findActionBar(article);
    if (!actionBar) return;

    article.setAttribute(PROCESSED_ATTR, 'true');
    addSaveButton(article, actionBar);
  });
}

function findActionBar(article: HTMLElement): HTMLElement | null {
  const groups = Array.from(article.querySelectorAll<HTMLElement>('div[role="group"]'));
  return groups.find((group) => group.querySelector('[data-testid="reply"], [data-testid="retweet"], [data-testid="like"], [data-testid="share"]'))
    || groups[groups.length - 1]
    || null;
}

function addSaveButton(article: HTMLElement, actionBar: HTMLElement): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'picpick-x-inline-slot';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'picpick-x-inline-button';
  button.setAttribute('aria-label', 'Picpickで画像を保存');
  button.title = 'Picpickで画像を保存';
  button.innerHTML = getIconSvg('ready');
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleInlineDownload(article, button).catch((error) => {
      setButtonError(button, getErrorMessage(error));
      window.setTimeout(() => updateButtonStateForArticle(article), ERROR_RESET_MS);
    });
  });

  wrapper.appendChild(button);
  actionBar.appendChild(wrapper);
  updateButtonStateForArticle(article);
}

async function handleInlineDownload(article: HTMLElement, button: HTMLButtonElement): Promise<void> {
  if (button.dataset.state === 'loading') return;

  const downloadKey = getArticleDownloadKey(article);
  if (activeDownloadKeys.has(downloadKey)) {
    setButtonState(button, 'loading');
    return;
  }

  activeDownloadKeys.add(downloadKey);
  setButtonState(button, 'loading');

  try {
    const media = await extractDownloadMediaFromArticleWithRetry(article);

    if (media.length === 0) {
      setButtonError(button, '画像/動画を取得できませんでした');
      window.setTimeout(() => updateButtonStateForArticle(article), ERROR_RESET_MS);
      return;
    }

    const settings = await getDownloadSettings();
    const result = await sendDownloadMessage({
      type: 'DOWNLOAD_IMAGES',
      images: media,
      settings,
      waitForCompletion: true,
      interDownloadDelayMs: 0,
    });

    if (result.error || result.success !== media.length || result.failed) {
      throw new Error(result.error || result.errors?.[0] || 'Download failed');
    }

    for (const item of media) {
      downloadedKeys.add(getMediaKey(item));
    }
    await saveDownloadedKeys(downloadedKeys);
    button.dataset.count = String(media.length);
    setButtonState(button, 'saved');
  } catch (error) {
    setButtonError(button, getErrorMessage(error));
    window.setTimeout(() => updateButtonStateForArticle(article), ERROR_RESET_MS);
  } finally {
    activeDownloadKeys.delete(downloadKey);
  }
}

function updateButtonStateForArticle(article: HTMLElement): void {
  const button = article.querySelector<HTMLButtonElement>('.picpick-x-inline-button');
  if (!button || button.dataset.state === 'loading') return;

  const images = extractImagesFromArticle(article);
  const hasVideo = hasPotentialVideo(article);
  button.dataset.count = hasVideo ? `${images.length}+` : String(images.length);
  if (!hasVideo && images.length > 0 && images.every((image) => downloadedKeys.has(getMediaKey(image)))) {
    setButtonState(button, 'saved');
  } else {
    setButtonState(button, 'ready');
  }
}

function setButtonState(button: HTMLButtonElement, state: ButtonState): void {
  button.dataset.state = state;
  delete button.dataset.error;
  button.disabled = state === 'loading';
  button.innerHTML = getIconSvg(state);

  if (state === 'saved') {
    button.setAttribute('aria-label', 'Picpickで保存済み');
    button.title = `保存済み - クリックで再保存 (${button.dataset.count || '?'}件)`;
  } else if (state === 'loading') {
    button.setAttribute('aria-label', 'Picpickで保存中');
    button.title = '保存中';
  } else {
    button.setAttribute('aria-label', 'Picpickで画像を保存');
    button.title = state === 'error'
      ? '保存に失敗しました'
      : `Picpickで画像/動画を保存 (${button.dataset.count || '?'}件)`;
  }
}

function setButtonError(button: HTMLButtonElement, message: string): void {
  button.dataset.error = message;
  setButtonState(button, 'error');
  button.dataset.error = message;
  button.setAttribute('aria-label', `Picpickで保存失敗: ${message}`);
  button.title = `保存に失敗しました: ${message}`;
}

async function extractDownloadMediaFromArticleWithRetry(article: HTMLElement): Promise<ImageInfo[]> {
  let media = await extractDownloadMediaFromArticle(article);
  if (media.length > 0) return media;

  for (const delay of EXTRACTION_RETRY_DELAYS_MS) {
    await sleep(delay);
    media = await extractDownloadMediaFromArticle(article);
    if (media.length > 0) return media;
  }

  return [];
}

async function extractDownloadMediaFromArticle(article: HTMLElement): Promise<ImageInfo[]> {
  const images = extractImagesFromArticle(article);
  const metadata = extractMetadataFromArticle(article);
  if (!metadata.postId || metadata.postId === 'unknown' || !hasPotentialVideo(article)) {
    return images;
  }

  try {
    const videos = await fetchTweetVideos(metadata);
    return dedupeMedia([...images, ...videos]);
  } catch {
    return images;
  }
}

function extractImagesFromArticle(article: HTMLElement): ImageInfo[] {
  const metadata = extractMetadataFromArticle(article);
  if (!metadata.postId || metadata.postId === 'unknown') return [];

  return collectArticleMedia(article).map((media, index) => ({
    url: media.url,
    originalUrl: media.originalUrl,
    width: media.width,
    height: media.height,
    index: index + 1,
    metadata: {
      ...metadata,
      originalFilename: extractFilenameFromUrl(media.url),
    },
  }));
}

async function fetchTweetVideos(metadata: ImageMetadata): Promise<ImageInfo[]> {
  const response = await sendXTweetMediaMessage(metadata.postId);
  return response.map((media, index) => ({
    url: media.url,
    originalUrl: media.originalUrl,
    width: media.width,
    height: media.height,
    index: index + 1,
    metadata: {
      ...metadata,
      originalFilename: media.originalFilename,
    },
  }));
}

function dedupeMedia(media: ImageInfo[]): ImageInfo[] {
  const seen = new Set<string>();
  const result: ImageInfo[] = [];

  for (const item of media) {
    const key = getMediaKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      ...item,
      index: result.length + 1,
    });
  }

  return result;
}

interface ArticleMedia {
  url: string;
  originalUrl: string;
  width: number | null;
  height: number | null;
  photoIndex: number;
  order: number;
}

function collectArticleMedia(article: HTMLElement): ArticleMedia[] {
  const media = new Map<string, ArticleMedia>();
  let order = 0;

  const addMediaUrl = (
    rawUrl: string,
    source: Element,
    photoIndex = Number.MAX_SAFE_INTEGER
  ) => {
    if (!rawUrl || !rawUrl.includes('pbs.twimg.com/media')) return;

    const originalUrl = cleanCssUrl(rawUrl);
    const url = getOriginalImageUrl(originalUrl);
    const mediaId = getMediaIdFromUrl(url);
    if (!mediaId || media.has(mediaId)) return;

    const img = source instanceof HTMLImageElement ? source : source.querySelector<HTMLImageElement>('img');
    if (img && isLikelyIcon(img)) return;

    media.set(mediaId, {
      url,
      originalUrl,
      width: img?.naturalWidth || null,
      height: img?.naturalHeight || null,
      photoIndex,
      order: order++,
    });
  };

  article.querySelectorAll<HTMLAnchorElement>('a[href*="/photo/"]').forEach((link) => {
    const photoIndex = extractPhotoIndex(link.getAttribute('href') || '');
    collectMediaUrlsFromElement(link).forEach((url) => addMediaUrl(url, link, photoIndex));
  });

  article.querySelectorAll<HTMLImageElement>('img[src*="pbs.twimg.com/media"], img[srcset*="pbs.twimg.com/media"]').forEach((img) => {
    const photoIndex = extractPhotoIndex(img.closest<HTMLAnchorElement>('a[href*="/photo/"]')?.getAttribute('href') || '');
    collectMediaUrlsFromImage(img).forEach((url) => addMediaUrl(url, img, photoIndex));
  });

  article.querySelectorAll<HTMLElement>('[style*="pbs.twimg.com/media"]').forEach((element) => {
    const photoIndex = extractPhotoIndex(element.closest<HTMLAnchorElement>('a[href*="/photo/"]')?.getAttribute('href') || '');
    collectMediaUrlsFromStyle(element).forEach((url) => addMediaUrl(url, element, photoIndex));
  });

  return Array.from(media.values()).sort((a, b) => {
    if (a.photoIndex !== b.photoIndex) return a.photoIndex - b.photoIndex;
    return a.order - b.order;
  });
}

function collectMediaUrlsFromElement(element: Element): string[] {
  const urls: string[] = [];
  element.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    urls.push(...collectMediaUrlsFromImage(img));
  });
  if (element instanceof HTMLElement) {
    urls.push(...collectMediaUrlsFromStyle(element));
    element.querySelectorAll<HTMLElement>('[style*="pbs.twimg.com/media"]').forEach((child) => {
      urls.push(...collectMediaUrlsFromStyle(child));
    });
  }
  return urls;
}

function collectMediaUrlsFromImage(img: HTMLImageElement): string[] {
  const urls = [img.currentSrc, img.src];
  if (img.srcset) {
    img.srcset.split(',').forEach((candidate) => {
      const url = candidate.trim().split(/\s+/)[0];
      if (url) urls.push(url);
    });
  }
  return urls.filter(Boolean);
}

function collectMediaUrlsFromStyle(element: HTMLElement): string[] {
  const styleValue = element.getAttribute('style') || '';
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  const urlPattern = /url\((["']?)(.*?)\1\)/g;
  while ((match = urlPattern.exec(styleValue)) !== null) {
    urls.push(match[2]);
  }
  return urls;
}

function extractMetadataFromArticle(article: HTMLElement): ImageMetadata {
  const statusLink = findStatusLink(article);
  const postId = statusLink?.match(/\/status\/(\d+)/)?.[1] || 'unknown';
  const creator = statusLink?.match(/^\/([^/]+)\/status\//)?.[1] || extractCreatorFromArticle(article);
  const timeEl = article.querySelector<HTMLTimeElement>('time[datetime]');
  const datetime = timeEl?.getAttribute('datetime');

  return {
    creator: creator || 'unknown',
    postId,
    postTitle: '',
    postDate: datetime ? new Date(datetime) : null,
    originalFilename: '',
  };
}

function hasPotentialVideo(article: HTMLElement): boolean {
  return Boolean(
    article.querySelector(
      'video, a[href*="/video/"], [data-testid="videoPlayer"], img[src*="video_thumb"], img[src*="amplify_video_thumb"], img[src*="tweet_video_thumb"]'
    )
  );
}

function findStatusLink(article: HTMLElement): string | null {
  const links = Array.from(article.querySelectorAll<HTMLAnchorElement>('a[href*="/status/"]'));
  const statusLink = links.find((link) => /\/[^/]+\/status\/\d+/.test(link.getAttribute('href') || ''));
  if (!statusLink) return null;

  try {
    return new URL(statusLink.getAttribute('href') || '', location.origin).pathname;
  } catch {
    return statusLink.getAttribute('href');
  }
}

function extractCreatorFromArticle(article: HTMLElement): string {
  const userLink = article.querySelector<HTMLAnchorElement>('a[role="link"][href^="/"]');
  const href = userLink?.getAttribute('href') || '';
  return href.split('/').filter(Boolean)[0] || 'unknown';
}

function getOriginalImageUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'pbs.twimg.com') {
      urlObj.searchParams.set('name', 'orig');
      return urlObj.toString();
    }
  } catch {
    return url;
  }
  return url;
}

function cleanCssUrl(url: string): string {
  return url.trim().replace(/^["']|["']$/g, '').replace(/&amp;/g, '&');
}

function getMediaIdFromUrl(url: string): string {
  try {
    return new URL(url).pathname.split('/').pop() || '';
  } catch {
    return url;
  }
}

function extractPhotoIndex(href: string): number {
  const match = href.match(/\/photo\/(\d+)/);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function isLikelyIcon(img: HTMLImageElement): boolean {
  const rect = img.getBoundingClientRect();
  const url = img.src.toLowerCase();
  if (url.includes('pbs.twimg.com/media')) {
    return false;
  }

  return (
    (rect.width < 100 && rect.height < 100) ||
    url.includes('profile_images') ||
    url.includes('default_profile') ||
    url.includes('avatar')
  );
}

function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const basename = urlObj.pathname.split('/').pop() || 'image';
    const format = urlObj.searchParams.get('format');
    return format && !basename.includes('.') ? `${basename}.${format}` : basename;
  } catch {
    return 'image';
  }
}

function getMediaKey(image: ImageInfo): string {
  const mediaId = image.metadata.originalFilename.replace(/\.[^.]+$/, '') || image.url;
  return `${image.metadata.postId}:${mediaId}`;
}

function getArticleDownloadKey(article: HTMLElement): string {
  const metadata = extractMetadataFromArticle(article);
  const images = extractImagesFromArticle(article);
  if (images.length === 0) return metadata.postId || 'unknown';
  return images.map(getMediaKey).join('|');
}

async function getDownloadSettings(): Promise<Settings> {
  const now = Date.now();
  if (cachedDownloadSettings && cachedDownloadSettings.expiresAt > now) {
    return cachedDownloadSettings.settings;
  }

  if (pendingSettingsRequest) {
    return pendingSettingsRequest;
  }

  pendingSettingsRequest = new Promise<Settings>((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      resolve(response && !response.error ? response : DEFAULT_SETTINGS);
    });
  }).then((settings) => {
    const normalized = normalizeSettings({
      ...settings,
      activeRuleId: 'x',
      minWidth: 0,
      minHeight: 0,
      selectedPreset: '',
    });

    cachedDownloadSettings = {
      settings: normalized,
      expiresAt: Date.now() + SETTINGS_CACHE_MS,
    };
    return normalized;
  }).finally(() => {
    pendingSettingsRequest = null;
  });

  return pendingSettingsRequest;
}

async function sendDownloadMessage(message: DownloadImagesMessage): Promise<{
  error?: string;
  success?: number;
  failed?: number;
  errors?: string[];
}> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response || {});
    });
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Download failed';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function sendXTweetMediaMessage(postId: string): Promise<XTweetMedia[]> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'GET_X_TWEET_MEDIA',
      postId,
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(Array.isArray(response?.media) ? response.media : []);
    });
  });
}

async function loadDownloadedKeys(): Promise<Set<string>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const keys = Array.isArray(result?.[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
      resolve(new Set(keys.filter((key: unknown): key is string => typeof key === 'string')));
    });
  });
}

async function saveDownloadedKeys(keys: Set<string>): Promise<void> {
  const values = Array.from(keys).slice(-5000);
  await chrome.storage.local.set({ [STORAGE_KEY]: values });
}

function injectStyle(): void {
  if (styleInjected) return;
  styleInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    .picpick-x-inline-slot {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .picpick-x-inline-button {
      appearance: none;
      border: 0;
      background: transparent;
      color: rgb(83, 100, 113);
      cursor: pointer;
      width: 34.75px;
      height: 34.75px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: background-color 0.2s, color 0.2s;
    }

    .picpick-x-inline-button:hover {
      background-color: rgba(29, 155, 240, 0.1);
      color: rgb(29, 155, 240);
    }

    .picpick-x-inline-button[data-state="saved"] {
      color: rgb(0, 186, 124);
    }

    .picpick-x-inline-button[data-state="saved"]:hover {
      background-color: rgba(0, 186, 124, 0.1);
      color: rgb(0, 186, 124);
    }

    .picpick-x-inline-button[data-state="error"] {
      color: rgb(244, 33, 46);
    }

    .picpick-x-inline-button svg {
      width: 18.75px;
      height: 18.75px;
      fill: currentColor;
    }

    .picpick-x-inline-button[data-state="loading"] svg {
      animation: picpick-x-spin 0.8s linear infinite;
    }

    @keyframes picpick-x-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.documentElement.appendChild(style);
}

function getIconSvg(state: ButtonState): string {
  if (state === 'saved') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.95 3.8 12.2l1.4-1.4 4.35 4.35L18.8 5.9l1.4 1.4-10.65 10.65Z"/></svg>';
  }

  if (state === 'loading') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Z"/></svg>';
  }

  if (state === 'error') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 7h2v7h-2V7Zm0 9h2v2h-2v-2Zm1-14 10 18H2L12 2Z"/></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4h2v8.17l3.59-3.58L18 10l-6 6-6-6 1.41-1.41L11 12.17V4Zm-6 14h14v2H5v-2Z"/></svg>';
}
