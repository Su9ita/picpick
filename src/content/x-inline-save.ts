import { ImageInfo, ImageMetadata } from '../types/image-info';
import { DownloadImagesMessage, XTweetMedia } from '../types/messages';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { normalizeSettings } from '../utils/settings-normalizer';

const PROCESSED_ATTR = 'data-picpick-x-inline';
const VIEWER_PROCESSED_ATTR = 'data-picpick-x-viewer';
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
const articleStateMap = new Map<string, { state: ButtonState; count?: number }>();

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
  scanPhotoViewer();

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

function scanPhotoViewer(): void {
  const viewer = findPhotoViewer();
  if (!viewer) return;

  if (viewer.getAttribute(VIEWER_PROCESSED_ATTR) === 'true') {
    if (!viewer.querySelector('.picpick-x-viewer-button')) {
      addViewerSaveButton(viewer);
    } else {
      updateButtonStateForArticle(viewer, '.picpick-x-viewer-button');
    }
    return;
  }

  const images = extractImagesFromArticle(viewer);
  if (images.length === 0) return;

  viewer.setAttribute(VIEWER_PROCESSED_ATTR, 'true');
  addViewerSaveButton(viewer);
}

function findPhotoViewer(): HTMLElement | null {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [aria-modal="true"]'));
  const dialog = dialogs.reverse().find((candidate) => candidate.querySelector('img[src*="pbs.twimg.com/media"], img[srcset*="pbs.twimg.com/media"]'));
  if (dialog) return dialog;

  if (!/\/status\/\d+\/photo\//.test(location.pathname)) return null;
  const visibleMedia = Array.from(document.querySelectorAll<HTMLImageElement>('img[src*="pbs.twimg.com/media"], img[srcset*="pbs.twimg.com/media"]'))
    .find((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width >= 200 && rect.height >= 200;
    });
  return visibleMedia?.closest<HTMLElement>('div') || null;
}

function findActionBar(article: HTMLElement): HTMLElement | null {
  const groups = Array.from(article.querySelectorAll<HTMLElement>('div[role="group"]'));
  return groups.find((group) => group.querySelector('[data-testid="reply"], [data-testid="retweet"], [data-testid="like"], [data-testid="share"]'))
    || groups[groups.length - 1]
    || null;
}

function addSaveButton(article: HTMLElement, actionBar: HTMLElement): void {
  const existing = actionBar.querySelector<HTMLButtonElement>('.picpick-x-inline-button');
  if (existing) {
    restoreButtonState(article, existing);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'picpick-x-inline-slot';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'picpick-x-inline-button';
  button.setAttribute('aria-label', 'Picpickで画像を保存');
  button.title = 'Picpickで画像を保存';
  button.innerHTML = getIconSvg('ready');

  // pointerdown で起動：click は pointerup 成立まで待つためXのレイヤー変動で不成立になる
  button.addEventListener('pointerdown', (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    spawnRipple(button);
    handleInlineDownload(article, button).catch((error) => {
      setButtonError(button, getErrorMessage(error));
      window.setTimeout(() => updateButtonStateForArticle(article), ERROR_RESET_MS);
    });
  });

  // Xのポスト遷移へのバブルを阻止（click自体は処理しない）
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  wrapper.appendChild(button);
  actionBar.appendChild(wrapper);
  restoreButtonState(article, button);
}

function addViewerSaveButton(viewer: HTMLElement): void {
  const existing = viewer.querySelector<HTMLButtonElement>('.picpick-x-viewer-button');
  if (existing) {
    restoreButtonState(viewer, existing);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'picpick-x-inline-slot picpick-x-viewer-slot';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'picpick-x-inline-button picpick-x-viewer-button';
  button.setAttribute('aria-label', 'Picpickで画像を保存');
  button.title = 'Picpickで画像を保存';
  button.innerHTML = getIconSvg('ready');

  button.addEventListener('pointerdown', (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    spawnRipple(button);
    handleInlineDownload(viewer, button).catch((error) => {
      setButtonError(button, getErrorMessage(error));
      window.setTimeout(() => updateButtonStateForArticle(viewer, '.picpick-x-viewer-button'), ERROR_RESET_MS);
    });
  });

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  viewer.appendChild(wrapper);
  wrapper.appendChild(button);
  restoreButtonState(viewer, button);
}

function restoreButtonState(article: HTMLElement, button: HTMLButtonElement): void {
  const key = getArticleDownloadKey(article);
  if (activeDownloadKeys.has(key)) {
    setButtonState(button, 'loading', true);
    return;
  }
  const saved = articleStateMap.get(key);
  if (saved) {
    if (saved.count != null) button.dataset.count = String(saved.count);
    setButtonState(button, saved.state, true);
  } else {
    updateButtonStateForArticle(article);
  }
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function handleInlineDownload(article: HTMLElement, button: HTMLButtonElement): Promise<void> {
  if (button.dataset.state === 'loading') return;

  const downloadKey = getArticleDownloadKey(article);
  if (activeDownloadKeys.has(downloadKey)) {
    setButtonState(button, 'loading', true);
    return;
  }

  activeDownloadKeys.add(downloadKey);
  articleStateMap.set(downloadKey, { state: 'loading' });
  setButtonState(button, 'loading', true);

  // ローディングリングを確実に1フレーム描画してから重いDOM走査へ
  await nextPaint();

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
    articleStateMap.set(downloadKey, { state: 'saved', count: media.length });
    setButtonState(button, 'saved');
  } catch (error) {
    articleStateMap.set(downloadKey, { state: 'error' });
    setButtonError(button, getErrorMessage(error));
    window.setTimeout(() => updateButtonStateForArticle(article), ERROR_RESET_MS);
  } finally {
    activeDownloadKeys.delete(downloadKey);
  }
}

function updateButtonStateForArticle(article: HTMLElement, buttonSelector = '.picpick-x-inline-button'): void {
  const button = article.querySelector<HTMLButtonElement>(buttonSelector);
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

function setButtonState(button: HTMLButtonElement, state: ButtonState, skipParticles = false): void {
  const prev = button.dataset.state as ButtonState | undefined;
  button.dataset.state = state;
  delete button.dataset.error;
  // disabled は使わない：pointerdown はdisabled状態でも効くが、UX/アクセシビリティ上不要
  button.innerHTML = getIconSvg(state);

  if (state === 'saved') {
    button.setAttribute('aria-label', 'Picpickで保存済み');
    button.title = `保存済み - クリックで再保存 (${button.dataset.count || '?'}件)`;
    if (!skipParticles && prev !== 'saved') spawnSaveParticles(button);
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
  const fallbackStatusLink = getStatusPathFromLocation();
  const statusPath = statusLink || fallbackStatusLink;
  const postId = statusPath?.match(/\/status\/(\d+)/)?.[1] || 'unknown';
  const creator = statusPath?.match(/^\/([^/]+)\/status\//)?.[1] || extractCreatorFromArticle(article);
  const timeEl = article.querySelector<HTMLTimeElement>('time[datetime]');
  const datetime = timeEl?.getAttribute('datetime');
  const postDate = parseValidDate(datetime) || getDateFromTweetId(postId);

  return {
    creator: creator || 'unknown',
    postId,
    postTitle: '',
    postDate,
    originalFilename: '',
  };
}

function parseValidDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function getDateFromTweetId(postId: string): Date | null {
  if (!/^\d+$/.test(postId)) return null;

  try {
    const twitterEpochMs = 1288834974657n;
    const timestampMs = (BigInt(postId) >> 22n) + twitterEpochMs;
    const date = new Date(Number(timestampMs));
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
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

function getStatusPathFromLocation(): string | null {
  return /^\/[^/]+\/status\/\d+/.test(location.pathname) ? location.pathname : null;
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
      includeDateInFilename: true,  // インラインボタン保存では設定値によらず日付を強制付与
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

function spawnSaveParticles(button: HTMLButtonElement): void {
  const rect = button.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const COUNT = 5;
  const DISTANCE = 18;

  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none;';

  for (let i = 0; i < COUNT; i++) {
    const rad = (Math.PI * 2 * i) / COUNT;
    const dot = document.createElement('span');
    dot.className = 'picpick-x-particle';
    dot.style.left = `${cx}px`;
    dot.style.top = `${cy}px`;
    dot.style.setProperty('--dx', `${(Math.cos(rad) * DISTANCE).toFixed(1)}px`);
    dot.style.setProperty('--dy', `${(Math.sin(rad) * DISTANCE).toFixed(1)}px`);
    layer.appendChild(dot);
  }

  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), 480);
}

function spawnRipple(button: HTMLButtonElement): void {
  button.classList.remove('picpick-x-ripple');
  void button.offsetWidth;
  button.classList.add('picpick-x-ripple');
  window.setTimeout(() => button.classList.remove('picpick-x-ripple'), 300);
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
      position: relative;
      z-index: 1;
      isolation: isolate;
      pointer-events: auto;
    }

    .picpick-x-viewer-slot {
      position: fixed;
      top: 14px;
      right: 70px;
      z-index: 2147483647;
      width: 44px;
      height: 44px;
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
      position: relative;
      z-index: 2;
      pointer-events: auto;
      touch-action: manipulation;
      overflow: hidden;
      transition: background-color 0.15s, color 0.15s;
    }

    .picpick-x-viewer-button {
      width: 44px;
      height: 44px;
      background: rgba(15, 20, 25, 0.72);
      color: #fff;
      backdrop-filter: blur(8px);
    }

    .picpick-x-viewer-button:hover {
      background-color: rgba(29, 155, 240, 0.88);
      color: #fff;
    }

    .picpick-x-inline-button svg,
    .picpick-x-inline-button svg * {
      pointer-events: none;
    }

    .picpick-x-inline-button:hover {
      background-color: rgba(29, 155, 240, 0.1);
      color: rgb(29, 155, 240);
    }

    .picpick-x-inline-button:active {
      transform: scale(0.88);
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

    .picpick-x-inline-button svg:not(.picpick-x-ring) {
      width: 18.75px;
      height: 18.75px;
      fill: currentColor;
    }

    .picpick-x-viewer-button svg:not(.picpick-x-ring),
    .picpick-x-viewer-button .picpick-x-ring {
      width: 21px;
      height: 21px;
    }

    /* ---- 円形プログレスリング ---- */
    .picpick-x-ring {
      width: 18.75px;
      height: 18.75px;
      display: block;
    }

    .picpick-x-ring-arc {
      transform-origin: center;
      animation:
        picpick-x-ring-rotate 1.4s linear infinite,
        picpick-x-ring-dash 1.4s ease-in-out infinite;
    }

    @keyframes picpick-x-ring-rotate {
      to { transform: rotate(360deg); }
    }

    @keyframes picpick-x-ring-dash {
      0%   { stroke-dashoffset: 62; }
      50%  { stroke-dashoffset: 16; }
      100% { stroke-dashoffset: 62; }
    }

    /* ---- クリック瞬間リップル ---- */
    .picpick-x-inline-button::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: currentColor;
      opacity: 0;
      transform: scale(0.4);
      pointer-events: none;
    }

    .picpick-x-inline-button.picpick-x-ripple::after {
      animation: picpick-x-ripple 300ms ease-out;
    }

    @keyframes picpick-x-ripple {
      0%   { opacity: 0.22; transform: scale(0.4); }
      100% { opacity: 0;    transform: scale(1.1); }
    }

    /* ---- 保存完了パーティクル ---- */
    .picpick-x-particle {
      position: fixed;
      width: 4px;
      height: 4px;
      margin: -2px 0 0 -2px;
      border-radius: 9999px;
      background: rgb(0, 186, 124);
      opacity: 1;
      will-change: transform, opacity;
      animation: picpick-x-particle-burst 400ms ease-out forwards;
    }

    @keyframes picpick-x-particle-burst {
      0%   { transform: translate(0, 0) scale(1); opacity: 1; }
      100% { transform: translate(var(--dx), var(--dy)) scale(0.4); opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .picpick-x-ring-arc { animation: picpick-x-ring-rotate 1.4s linear infinite; }
      .picpick-x-particle { display: none; }
      .picpick-x-inline-button.picpick-x-ripple::after { animation: none; }
      .picpick-x-inline-button:active { transform: none; }
    }
  `;
  document.documentElement.appendChild(style);
}

function getIconSvg(state: ButtonState): string {
  if (state === 'saved') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.95 3.8 12.2l1.4-1.4 4.35 4.35L18.8 5.9l1.4 1.4-10.65 10.65Z"/></svg>';
  }

  if (state === 'loading') {
    // 円周 = 2π×10.4 ≈ 65.3。rotate+dashoffset二重アニメで「進行中感」
    return '<svg viewBox="0 0 24 24" class="picpick-x-ring" aria-hidden="true">'
      + '<circle cx="12" cy="12" r="10.4" fill="none" stroke="currentColor" stroke-width="3.2" stroke-opacity="0.2"/>'
      + '<circle class="picpick-x-ring-arc" cx="12" cy="12" r="10.4" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="65.3"/>'
      + '</svg>';
  }

  if (state === 'error') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 7h2v7h-2V7Zm0 9h2v2h-2v-2Zm1-14 10 18H2L12 2Z"/></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4h2v8.17l3.59-3.58L18 10l-6 6-6-6 1.41-1.41L11 12.17V4Zm-6 14h14v2H5v-2Z"/></svg>';
}
