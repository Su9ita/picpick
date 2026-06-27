import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { ImageInfo } from '../types/image-info';
import { getDefaultDownloadFolderLabel, normalizeSettings } from '../utils/settings-normalizer';
import {
  buildPatreonMetadata,
  lastPatreonFetchError,
  patreonImageId,
  patreonItemsToImageInfo,
  PatreonMediaItem,
  PATREON_REFERRER,
} from '../extractors/patreon-api';
import {
  detectPatreonCreatorSlug,
  enumeratePatreonCreatorPosts,
  resolvePatreonCampaignId,
} from '../crawlers/patreon-crawler';
import { getSavedImageIds, markImagesSaved } from '../utils/saved-index';
import { filterImages, filterNearDuplicateImages } from '../utils/image-filter';
import { applyIconGhostState, toggleIconGhostState } from './icon-ghost';

let panelEl: HTMLDivElement | null = null;
let isRunning = false;
let abortRequested = false;

export function initPatreonBatch(): void {
  if (!window.location.hostname.endsWith('patreon.com')) return;
  if (!document.body) return;
  injectButton();
}

function injectButton(): void {
  if (document.getElementById('picpick-patreon-batch-root')) return;

  const root = document.createElement('div');
  root.id = 'picpick-patreon-batch-root';
  root.innerHTML = `
    <style>
      #picpick-patreon-batch-root {
        position: fixed; top: 72px; left: 12px; z-index: 999998;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #picpick-patreon-batch-btn {
        width: 44px; height: 44px; border-radius: 50%;
        background: linear-gradient(135deg, #ff424d 0%, #111827 100%);
        border: none; cursor: pointer; color: #fff;
        box-shadow: 0 4px 12px rgba(255,66,77,0.35);
        display: flex; align-items: center; justify-content: center;
        transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
      }
      #picpick-patreon-batch-btn:hover { transform: scale(1.08); }
      #picpick-patreon-batch-btn.pb-ghosted { opacity: .28; }
      #picpick-patreon-batch-btn.pb-ghosted:hover { opacity: .45; }
      #picpick-patreon-batch-btn svg { width: 22px; height: 22px; fill: #fff; }
      #picpick-patreon-batch-panel {
        position: absolute; top: 52px; left: 0;
        width: 330px; max-width: 90vw;
        background: #fff; border-radius: 12px; padding: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2); display: none;
        color: #1f2937;
      }
      #picpick-patreon-batch-panel.show { display: block; }
      .ppb-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
      .ppb-row { margin-bottom: 10px; }
      .ppb-row label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
      .ppb-row input[type="text"], .ppb-row input[type="number"], .ppb-row input[type="date"] {
        width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;
        font-size: 13px; box-sizing: border-box;
      }
      .ppb-check { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #374151; }
      .ppb-check input { width: auto; margin: 0; }
      .ppb-grid2 { display: flex; gap: 8px; }
      .ppb-grid2 > div { flex: 1; }
      .ppb-segmented { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 10px; }
      .ppb-seg { padding: 7px 4px; border: 1px solid #d1d5db; background: #fff; border-radius: 7px; font-size: 12px; color: #374151; cursor: pointer; }
      .ppb-seg.active { border-color: #ff424d; background: #fff1f2; color: #be123c; font-weight: 600; }
      .ppb-custom-range { display: none; }
      .ppb-custom-range.show { display: flex; }
      .ppb-select { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: #fff; box-sizing: border-box; }
      .ppb-filter-box { margin: 10px 0; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
      .ppb-details { margin-top: 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; }
      .ppb-details summary { cursor: pointer; padding: 9px 10px; font-size: 13px; font-weight: 600; color: #374151; list-style: none; }
      .ppb-details summary::-webkit-details-marker { display: none; }
      .ppb-details-body { padding: 0 10px 10px; }
      .ppb-buttons { display: flex; gap: 8px; margin-top: 12px; }
      .ppb-btn { flex: 1; padding: 9px; border: none; border-radius: 8px; font-size: 13px;
        font-weight: 500; cursor: pointer; }
      .ppb-btn-go { background: linear-gradient(135deg,#ff424d,#111827); color: #fff; }
      .ppb-btn-go:disabled { background: #9ca3af; cursor: not-allowed; }
      .ppb-btn-stop { background: #fee2e2; color: #b91c1c; }
      .ppb-progress { margin-top: 12px; font-size: 12px; color: #374151; min-height: 16px; }
      .ppb-log { margin-top: 8px; max-height: 160px; overflow-y: auto; font-size: 11px;
        color: #6b7280; background: #f9fafb; border-radius: 6px; padding: 8px; line-height: 1.5;
        display: none; }
      .ppb-log.show { display: block; }
    </style>
    <button id="picpick-patreon-batch-btn" title="Patreonクリエイターを一括保存">
      <svg viewBox="0 0 24 24"><path d="M5 4h14a2 2 0 0 1 2 2v5h-2V6H5v12h7v2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 4h10v2H7V8zm0 4h7v2H7v-2zm11 2v3h3v2h-3v3h-2v-3h-3v-2h3v-3h2z"/></svg>
    </button>
    <div id="picpick-patreon-batch-panel">
      <div class="ppb-title">Patreon 一括保存</div>
      <div class="ppb-row">
        <label>creator / campaignId</label>
        <input type="text" id="ppb-creator" placeholder="例: creatorname または 123456">
      </div>
      <div class="ppb-segmented" role="group" aria-label="保存期間">
        <button type="button" class="ppb-seg active" data-range="all">全期間</button>
        <button type="button" class="ppb-seg" data-range="week">7日</button>
        <button type="button" class="ppb-seg" data-range="month">30日</button>
        <button type="button" class="ppb-seg" data-range="custom">指定</button>
      </div>
      <div class="ppb-row ppb-grid2 ppb-custom-range" id="ppb-custom-range">
        <div>
          <label>開始日</label>
          <input type="date" id="ppb-from">
        </div>
        <div>
          <label>終了日</label>
          <input type="date" id="ppb-to">
        </div>
      </div>
      <div class="ppb-row ppb-grid2">
        <div>
          <label>保存先</label>
          <select id="ppb-destination" class="ppb-select"></select>
        </div>
        <div>
          <label>&nbsp;</label>
          <label class="ppb-check"><input type="checkbox" id="ppb-skip" checked> 未保存のみ</label>
        </div>
      </div>
      <details class="ppb-details">
        <summary>詳細設定</summary>
        <div class="ppb-details-body">
          <div class="ppb-row">
            <label>最小横幅 (px)</label>
            <input type="number" id="ppb-minwidth" min="0" value="800">
          </div>
          <label class="ppb-check"><input type="checkbox" id="ppb-reset-index"> 連番を 01 から開始</label>
          <div class="ppb-filter-box">
            <label class="ppb-check"><input type="checkbox" id="ppb-advanced-filters" checked> 自動フィルタを使う</label>
            <div class="ppb-row ppb-grid2" style="margin-top:8px;margin-bottom:0;">
              <div>
                <label>横長画像の除外</label>
                <input type="number" id="ppb-max-aspect" min="0.1" step="0.1" value="3.2">
              </div>
              <div>
                <label>近似重複の強さ</label>
                <input type="number" id="ppb-phash-threshold" min="0" max="32" step="1" value="6">
              </div>
            </div>
          </div>
        </div>
      </details>
      <div class="ppb-buttons">
        <button class="ppb-btn ppb-btn-go" id="ppb-go">開始</button>
        <button class="ppb-btn ppb-btn-stop" id="ppb-stop">中止</button>
      </div>
      <div class="ppb-progress" id="ppb-progress"></div>
      <div class="ppb-log" id="ppb-log"></div>
    </div>
  `;
  document.body.appendChild(root);
  panelEl = root.querySelector('#picpick-patreon-batch-panel');

  const btn = root.querySelector('#picpick-patreon-batch-btn') as HTMLButtonElement;
  applyIconGhostState();
  btn?.addEventListener('click', togglePanel);
  btn?.addEventListener('mousedown', (event) => {
    if (event.button === 1) event.preventDefault();
  });
  btn?.addEventListener('auxclick', (event) => {
    if (event.button !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    toggleIconGhostState();
  });
  (root.querySelector('#ppb-go') as HTMLButtonElement)?.addEventListener('click', () => void runBatch());
  (root.querySelector('#ppb-stop') as HTMLButtonElement)?.addEventListener('click', () => {
    abortRequested = true;
    setProgress('中止しています...');
  });
  root.querySelectorAll<HTMLButtonElement>('.ppb-seg').forEach((button) => {
    button.addEventListener('click', () => applyDateRange(button.dataset.range || 'all'));
  });
  void hydrateDestinationSelect();
}

function togglePanel(): void {
  if (!panelEl) return;
  const show = !panelEl.classList.contains('show');
  panelEl.classList.toggle('show', show);
  if (show) {
    const creatorInput = document.getElementById('ppb-creator') as HTMLInputElement;
    if (creatorInput && !creatorInput.value) {
      creatorInput.value = detectPatreonCreatorSlug() || '';
    }
    void hydrateDestinationSelect();
  }
}

async function hydrateDestinationSelect(): Promise<void> {
  const select = document.getElementById('ppb-destination') as HTMLSelectElement;
  if (!select) return;
  const settings = await getSettings();
  select.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = 'downloads';
  defaultOption.textContent = settings.defaultDownloadFolderPath
    ? `${getDefaultDownloadFolderLabel(settings)} (${settings.defaultDownloadFolderPath})`
    : getDefaultDownloadFolderLabel(settings);
  select.appendChild(defaultOption);

  for (const preset of settings.downloadFolderPresets || []) {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.label || preset.folder;
    select.appendChild(option);
  }

  select.value = Array.from(select.options).some((option) => option.value === settings.selectedDownloadFolderPresetId)
    ? settings.selectedDownloadFolderPresetId || 'downloads'
    : 'downloads';
}

function applyDateRange(range: string): void {
  const fromInput = document.getElementById('ppb-from') as HTMLInputElement;
  const toInput = document.getElementById('ppb-to') as HTMLInputElement;
  const customRange = document.getElementById('ppb-custom-range');
  document.querySelectorAll<HTMLButtonElement>('.ppb-seg').forEach((button) => {
    button.classList.toggle('active', button.dataset.range === range);
  });

  const today = new Date();
  const to = formatDateInput(today);
  if (range === 'week' || range === 'month') {
    const from = new Date(today);
    from.setDate(today.getDate() - (range === 'week' ? 7 : 30));
    fromInput.value = formatDateInput(from);
    toInput.value = to;
    customRange?.classList.remove('show');
  } else if (range === 'custom') {
    customRange?.classList.add('show');
  } else {
    fromInput.value = '';
    toInput.value = '';
    customRange?.classList.remove('show');
  }
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function setProgress(text: string): void {
  const el = document.getElementById('ppb-progress');
  if (el) el.textContent = text;
}

function log(text: string): void {
  const el = document.getElementById('ppb-log');
  if (!el) return;
  el.classList.add('show');
  const line = document.createElement('div');
  line.textContent = text;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

async function runBatch(): Promise<void> {
  if (isRunning) return;

  const creatorInput = document.getElementById('ppb-creator') as HTMLInputElement;
  const minWidthInput = document.getElementById('ppb-minwidth') as HTMLInputElement;
  const skipInput = document.getElementById('ppb-skip') as HTMLInputElement;
  const fromInput = document.getElementById('ppb-from') as HTMLInputElement;
  const toInput = document.getElementById('ppb-to') as HTMLInputElement;
  const advancedFiltersInput = document.getElementById('ppb-advanced-filters') as HTMLInputElement;
  const maxAspectInput = document.getElementById('ppb-max-aspect') as HTMLInputElement;
  const pHashThresholdInput = document.getElementById('ppb-phash-threshold') as HTMLInputElement;
  const resetIndexInput = document.getElementById('ppb-reset-index') as HTMLInputElement;
  const destinationSelect = document.getElementById('ppb-destination') as HTMLSelectElement;
  const goBtn = document.getElementById('ppb-go') as HTMLButtonElement;

  const creator = creatorInput?.value.trim() || detectPatreonCreatorSlug() || '';
  if (!creator) {
    setProgress('creator / campaignId を入力してください');
    return;
  }

  const minWidth = parseInt(minWidthInput?.value || '0', 10) || 0;
  const skipSaved = skipInput?.checked !== false;
  const resetIndex = resetIndexInput?.checked === true;
  const fromTime = fromInput?.value ? new Date(fromInput.value).getTime() : null;
  const toTime = toInput?.value ? new Date(`${toInput.value}T23:59:59`).getTime() : null;

  isRunning = true;
  abortRequested = false;
  if (goBtn) goBtn.disabled = true;

  try {
    const settings = await getSettings();
    settings.activeRuleId = 'patreon';
    settings.selectedDownloadFolderPresetId = destinationSelect?.value || settings.selectedDownloadFolderPresetId || 'downloads';
    settings.minWidth = minWidth;
    settings.advancedImageFiltersEnabled = advancedFiltersInput?.checked !== false;
    settings.maxAspectRatio = parseFloat(maxAspectInput?.value || '') || DEFAULT_SETTINGS.maxAspectRatio;
    settings.pHashDistanceThreshold = parseInt(pHashThresholdInput?.value || '', 10) || DEFAULT_SETTINGS.pHashDistanceThreshold;

    setProgress('campaignId を解決中...');
    const campaignId = await resolvePatreonCampaignId(creator);
    if (!campaignId) {
      setProgress('campaignId を取得できませんでした');
      log('クリエイターページ上で実行するか、campaignId の数値を直接入力してください');
      return;
    }
    log(`campaignId: ${campaignId}`);

    const savedKey = `patreon:${campaignId}`;
    const savedIds = skipSaved ? await getSavedImageIds(savedKey) : new Set<string>();
    if (skipSaved) log(`保存済み: ${savedIds.size}枚（スキップ対象）`);

    setProgress('投稿一覧を取得中...');
    let posts = await enumeratePatreonCreatorPosts(campaignId, (n) => setProgress(`投稿一覧を取得中... ${n}件`));
    posts = posts.filter((post) => withinDateRange(post, fromTime, toTime));

    if (posts.length === 0) {
      setProgress('対象の投稿がありません');
      if (lastPatreonFetchError) {
        log(`API取得失敗: ${lastPatreonFetchError}`);
      } else {
        log('APIは応答しましたが投稿データが0件でした');
      }
      return;
    }
    const visibleCount = posts.filter((post) => post.currentUserCanView).length;
    const imageCandidateCount = posts.reduce((sum, post) => sum + post.images.length, 0);
    log(`対象投稿: ${posts.length}件（閲覧可${visibleCount}, 閲覧不可フラグ${posts.length - visibleCount}, 画像候補${imageCandidateCount}）`);

    let savedTotal = 0;
    let restrictedPosts = 0;

    for (let i = 0; i < posts.length; i++) {
      if (abortRequested) {
        setProgress(`中止しました（${savedTotal}枚保存）`);
        return;
      }

      const post = posts[i];
      setProgress(`[${i + 1}/${posts.length}] ${post.title || post.id}`);

      const allItems = post.images;
      if (!post.currentUserCanView && allItems.length === 0) {
        restrictedPosts++;
        log(`x 閲覧不可・画像候補なし: ${post.title || post.id}`);
        continue;
      }
      if (!post.currentUserCanView) {
        log(`! 閲覧不可フラグあり・候補${allItems.length}枚を試行: ${post.title || post.id}`);
      }
      const metadata = buildPatreonMetadata(post);
      let skippedSaved = 0;
      let skippedSmall = 0;

      const newItems = allItems.filter((item) => {
        if (skipSaved && savedIds.has(patreonImageId(item))) {
          skippedSaved++;
          return false;
        }
        if (minWidth > 0 && item.width != null && item.width < minWidth) {
          skippedSmall++;
          return false;
        }
        return true;
      });

      if (newItems.length === 0) {
        if (allItems.length > 0) {
          log(`- ${post.title || post.id}: 候補0/${allItems.length}枚（保存済み${skippedSaved}, 小サイズ${skippedSmall}）`);
        }
        continue;
      }

      const images = patreonItemsToImageInfo(newItems, metadata);
      const originalPairs = images.map((image, index) => ({ image, item: newItems[index] }));
      const syncFilter = filterImages(images, settings);
      const syncPassed = new Set(syncFilter.passed);
      const syncPairs = originalPairs.filter((pair) => syncPassed.has(pair.image));

      if (syncPairs.length === 0) {
        log(`- ${post.title || post.id}: ルール除外 ${syncFilter.filtered.length}/${newItems.length}枚`);
        continue;
      }

      const prefetched = await prefetchBlobs(syncPairs.map((pair) => pair.image));
      const prefetchedPairs = prefetched.map((image, index) => ({ image, item: syncPairs[index].item }));
      const pHashFilter = await filterNearDuplicateImages(prefetched, settings);
      const pHashPassed = new Set(pHashFilter.passed);
      const finalPairs = prefetchedPairs.filter((pair) => pHashPassed.has(pair.image));

      if (finalPairs.length === 0) {
        log(`- ${post.title || post.id}: pHash除外 ${pHashFilter.filtered.length}/${syncPairs.length}枚`);
        continue;
      }

      const result = await sendDownload(finalPairs.map((pair) => pair.image), settings, resetIndex);
      const succeeded = result.success ?? 0;
      savedTotal += succeeded;

      const ids = finalPairs.map((pair) => patreonImageId(pair.item));
      await markImagesSaved(savedKey, post.id, ids);
      ids.forEach((id) => savedIds.add(id));

      const detail = [
        `候補${newItems.length}/${allItems.length}`,
        syncFilter.filtered.length > 0 ? `ルール除外${syncFilter.filtered.length}` : '',
        pHashFilter.filtered.length > 0 ? `pHash除外${pHashFilter.filtered.length}` : '',
      ].filter(Boolean).join(', ');
      log(`OK ${post.title || post.id}: ${succeeded}/${finalPairs.length}枚（${detail}）`);
      await sleep(500);
    }

    const note = restrictedPosts > 0 ? `（閲覧不可 ${restrictedPosts}件スキップ）` : '';
    setProgress(`完了: 合計 ${savedTotal}枚保存${note}`);
  } catch (error) {
    setProgress(`エラー: ${(error as Error).message}`);
  } finally {
    isRunning = false;
    if (goBtn) goBtn.disabled = false;
  }
}

function withinDateRange(post: { publishedAt: string }, from: number | null, to: number | null): boolean {
  if (from == null && to == null) return true;
  const t = post.publishedAt ? new Date(post.publishedAt).getTime() : NaN;
  if (Number.isNaN(t)) return true;
  if (from != null && t < from) return false;
  if (to != null && t > to) return false;
  return true;
}

async function prefetchBlobs(images: ImageInfo[]): Promise<ImageInfo[]> {
  const result = [...images];
  for (let i = 0; i < result.length; i++) {
    const img = result[i];
    try {
      const response = await fetch(img.url, {
        credentials: 'include',
        cache: 'no-store',
        referrer: PATREON_REFERRER,
        referrerPolicy: 'strict-origin-when-cross-origin',
      });
      if (!response.ok) continue;
      const blobData = await response.arrayBuffer();
      const blobMimeType = response.headers.get('content-type') || 'image/jpeg';
      if (isValidImageResponse(blobMimeType, blobData)) {
        result[i] = { ...img, blobData, blobMimeType, downloadReferrer: PATREON_REFERRER };
      }
    } catch {
      // service worker 側の URL ダウンロードにフォールバックする。
    }
  }
  return result;
}

function isValidImageResponse(contentType: string, buffer: ArrayBuffer): boolean {
  if (contentType.toLowerCase().startsWith('image/')) return true;
  const bytes = new Uint8Array(buffer.slice(0, 12));
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  const isWebp =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return isJpeg || isPng || isGif || isWebp;
}

async function sendDownload(
  images: ImageInfo[],
  settings: Settings,
  resetIndex: boolean
): Promise<{ success?: number; failed?: number; error?: string }> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        {
          type: 'DOWNLOAD_IMAGES',
          images,
          settings,
          saveAs: false,
          resetIndex,
          waitForCompletion: true,
          interDownloadDelayMs: 500,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response || {});
        }
      );
    } catch (error) {
      resolve({ error: (error as Error).message });
    }
  });
}

async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        if (chrome.runtime.lastError || !response || response.error) {
          resolve(normalizeSettings(DEFAULT_SETTINGS));
        } else {
          resolve(normalizeSettings(response));
        }
      });
    } catch {
      resolve(normalizeSettings(DEFAULT_SETTINGS));
    }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
