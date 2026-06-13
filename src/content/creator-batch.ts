/**
 * FANBOX クリエイター一括保存 UI（Phase 1）
 *
 * 既存のオーバーレイ（単一投稿スキャン）には手を入れず、独立した
 * ボタン＋パネルを FANBOX 上に追加する。
 *
 * フロー:
 *   1) creatorId の全投稿を API 列挙（fanbox-crawler）
 *   2) 各投稿の画像を API 取得（fanbox-api）
 *   3) サイズフィルタ + 重複台帳（saved-index）で未保存だけ抽出
 *   4) content script 上で原寸画像を prefetch（Referer + Cookie 必須）
 *   5) 既存の DOWNLOAD_IMAGES 経由で保存し、保存済みIDを台帳に記録
 */

import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { ImageInfo } from '../types/image-info';
import { normalizeSettings } from '../utils/settings-normalizer';
import {
  buildFanboxMetadata,
  collectFanboxApiImages,
  fanboxImageId,
  fanboxItemUrl,
  fanboxItemsToImageInfo,
  fetchFanboxPostInfo,
} from '../extractors/fanbox-api';
import {
  detectFanboxCreatorId,
  enumerateCreatorPosts,
  FanboxPostListItem,
} from '../crawlers/fanbox-crawler';
import { getSavedImageIds, markImagesSaved } from '../utils/saved-index';
import { filterImages, filterNearDuplicateImages } from '../utils/image-filter';

let panelEl: HTMLDivElement | null = null;
let isRunning = false;
let abortRequested = false;

export function initCreatorBatch(): void {
  // api.fanbox.cc などDOMを持たないホストでは何もしない
  if (window.location.hostname === 'api.fanbox.cc') return;
  if (!document.body) return;
  injectButton();
}

function injectButton(): void {
  if (document.getElementById('picpick-batch-root')) return;

  const root = document.createElement('div');
  root.id = 'picpick-batch-root';
  root.innerHTML = `
    <style>
      #picpick-batch-root {
        position: fixed; top: 20px; left: 12px; z-index: 999998;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #picpick-batch-btn {
        width: 44px; height: 44px; border-radius: 50%;
        background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
        border: none; cursor: pointer; color: #fff;
        box-shadow: 0 4px 12px rgba(14,165,233,0.4);
        display: flex; align-items: center; justify-content: center;
        transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
      }
      #picpick-batch-btn:hover { transform: scale(1.08); }
      #picpick-batch-btn.pb-ghosted { opacity: .28; }
      #picpick-batch-btn.pb-ghosted:hover { opacity: .45; }
      #picpick-batch-btn svg { width: 22px; height: 22px; fill: #fff; }
      #picpick-batch-panel {
        position: absolute; top: 52px; left: 0;
        width: 320px; max-width: 90vw;
        background: #fff; border-radius: 12px; padding: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2); display: none;
        color: #1f2937;
      }
      #picpick-batch-panel.show { display: block; }
      .pb-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
      .pb-row { margin-bottom: 10px; }
      .pb-row label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
      .pb-row input[type="text"], .pb-row input[type="number"], .pb-row input[type="date"] {
        width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;
        font-size: 13px; box-sizing: border-box;
      }
      .pb-check { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #374151; }
      .pb-check input { width: auto; margin: 0; }
      .pb-grid2 { display: flex; gap: 8px; }
      .pb-grid2 > div { flex: 1; }
      .pb-filter-box { margin: 10px 0; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
      .pb-buttons { display: flex; gap: 8px; margin-top: 12px; }
      .pb-btn { flex: 1; padding: 9px; border: none; border-radius: 8px; font-size: 13px;
        font-weight: 500; cursor: pointer; }
      .pb-btn-go { background: linear-gradient(135deg,#0ea5e9,#6366f1); color: #fff; }
      .pb-btn-go:disabled { background: #9ca3af; cursor: not-allowed; }
      .pb-btn-stop { background: #fee2e2; color: #b91c1c; }
      .pb-progress { margin-top: 12px; font-size: 12px; color: #374151; min-height: 16px; }
      .pb-log { margin-top: 8px; max-height: 160px; overflow-y: auto; font-size: 11px;
        color: #6b7280; background: #f9fafb; border-radius: 6px; padding: 8px; line-height: 1.5;
        display: none; }
      .pb-log.show { display: block; }
    </style>
    <button id="picpick-batch-btn" title="このクリエイターを一括保存">
      <svg viewBox="0 0 24 24"><path d="M4 5h16v2H4V5zm0 6h16v2H4v-2zm0 6h10v2H4v-2zm14.5-1.5L22 19l-3.5 3.5-1.4-1.4L18.2 20H16v-2h2.2l-1.1-1.1 1.4-1.4z"/></svg>
    </button>
    <div id="picpick-batch-panel">
      <div class="pb-title">クリエイター一括保存</div>
      <div class="pb-row">
        <label>creatorId</label>
        <input type="text" id="pb-creator" placeholder="例: creatorname">
      </div>
      <div class="pb-row pb-grid2">
        <div>
          <label>最小横幅 (px)</label>
          <input type="number" id="pb-minwidth" min="0" value="800">
        </div>
        <div>
          <label>&nbsp;</label>
          <label class="pb-check"><input type="checkbox" id="pb-skip" checked> 未保存のみ</label>
        </div>
      </div>
      <div class="pb-row pb-grid2">
        <div>
          <label>開始日（以降）</label>
          <input type="date" id="pb-from">
        </div>
        <div>
          <label>終了日（以前）</label>
          <input type="date" id="pb-to">
        </div>
      </div>
      <div class="pb-filter-box">
        <label class="pb-check"><input type="checkbox" id="pb-advanced-filters" checked> ルールフィルタ</label>
        <div class="pb-row pb-grid2" style="margin-top:8px;margin-bottom:0;">
          <div>
            <label>横長上限</label>
            <input type="number" id="pb-max-aspect" min="0.1" step="0.1" value="3.2">
          </div>
          <div>
            <label>pHash距離</label>
            <input type="number" id="pb-phash-threshold" min="0" max="32" step="1" value="6">
          </div>
        </div>
      </div>
      <div class="pb-buttons">
        <button class="pb-btn pb-btn-go" id="pb-go">開始</button>
        <button class="pb-btn pb-btn-stop" id="pb-stop">中止</button>
      </div>
      <div class="pb-progress" id="pb-progress"></div>
      <div class="pb-log" id="pb-log"></div>
    </div>
  `;
  document.body.appendChild(root);
  panelEl = root.querySelector('#picpick-batch-panel');

  const btn = root.querySelector('#picpick-batch-btn') as HTMLButtonElement;
  btn?.addEventListener('click', togglePanel);
  btn?.addEventListener('mousedown', (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });
  btn?.addEventListener('auxclick', (event) => {
    if (event.button !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    btn.classList.toggle('pb-ghosted');
  });
  (root.querySelector('#pb-go') as HTMLButtonElement)?.addEventListener('click', () => void runBatch());
  (root.querySelector('#pb-stop') as HTMLButtonElement)?.addEventListener('click', () => {
    abortRequested = true;
    setProgress('中止しています…');
  });
}

function togglePanel(): void {
  if (!panelEl) return;
  const show = !panelEl.classList.contains('show');
  panelEl.classList.toggle('show', show);
  if (show) {
    const creatorInput = document.getElementById('pb-creator') as HTMLInputElement;
    if (creatorInput && !creatorInput.value) {
      creatorInput.value = detectFanboxCreatorId() || '';
    }
  }
}

function setProgress(text: string): void {
  const el = document.getElementById('pb-progress');
  if (el) el.textContent = text;
}

function log(text: string): void {
  const el = document.getElementById('pb-log');
  if (!el) return;
  el.classList.add('show');
  const line = document.createElement('div');
  line.textContent = text;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

async function runBatch(): Promise<void> {
  if (isRunning) return;

  const creatorInput = document.getElementById('pb-creator') as HTMLInputElement;
  const minWidthInput = document.getElementById('pb-minwidth') as HTMLInputElement;
  const skipInput = document.getElementById('pb-skip') as HTMLInputElement;
  const fromInput = document.getElementById('pb-from') as HTMLInputElement;
  const toInput = document.getElementById('pb-to') as HTMLInputElement;
  const advancedFiltersInput = document.getElementById('pb-advanced-filters') as HTMLInputElement;
  const maxAspectInput = document.getElementById('pb-max-aspect') as HTMLInputElement;
  const pHashThresholdInput = document.getElementById('pb-phash-threshold') as HTMLInputElement;
  const goBtn = document.getElementById('pb-go') as HTMLButtonElement;

  const creatorId = creatorInput?.value.trim();
  if (!creatorId) {
    setProgress('creatorId を入力してください');
    return;
  }

  const minWidth = parseInt(minWidthInput?.value || '0', 10) || 0;
  const skipSaved = skipInput?.checked !== false;
  const fromTime = fromInput?.value ? new Date(fromInput.value).getTime() : null;
  const toTime = toInput?.value ? new Date(`${toInput.value}T23:59:59`).getTime() : null;

  isRunning = true;
  abortRequested = false;
  if (goBtn) goBtn.disabled = true;

  try {
    const settings = await getSettings();
    settings.activeRuleId = 'pixiv_fanbox'; // FANBOX用ファイル名プリセットを使う
    settings.minWidth = minWidth;
    settings.advancedImageFiltersEnabled = advancedFiltersInput?.checked !== false;
    settings.maxAspectRatio = parseFloat(maxAspectInput?.value || '') || DEFAULT_SETTINGS.maxAspectRatio;
    settings.pHashDistanceThreshold = parseInt(pHashThresholdInput?.value || '', 10) || DEFAULT_SETTINGS.pHashDistanceThreshold;

    const savedIds = skipSaved ? await getSavedImageIds(creatorId) : new Set<string>();
    if (skipSaved) log(`保存済み: ${savedIds.size}枚（スキップ対象）`);

    setProgress('投稿一覧を取得中…');
    let posts = await enumerateCreatorPosts(creatorId, (n) => setProgress(`投稿一覧を取得中… ${n}件`));

    // 範囲指定（日付）でフィルタ
    posts = posts.filter((p) => withinDateRange(p, fromTime, toTime));

    if (posts.length === 0) {
      setProgress('対象の投稿がありません');
      return;
    }
    log(`対象投稿: ${posts.length}件`);

    let savedTotal = 0;
    let skippedPosts = 0;

    for (let i = 0; i < posts.length; i++) {
      if (abortRequested) {
        setProgress(`中止しました（${savedTotal}枚保存）`);
        return;
      }
      const post = posts[i];
      setProgress(`[${i + 1}/${posts.length}] ${post.title || post.id}`);

      if (post.isRestricted) {
        skippedPosts++;
        log(`× 閲覧不可（プラン外）: ${post.title || post.id}`);
        continue;
      }

      const data = await fetchFanboxPostInfo(post.id);
      if (!data) {
        log(`× 取得失敗: ${post.title || post.id}`);
        continue;
      }

      const metadata = buildFanboxMetadata(data, post.id);
      const allItems = collectFanboxApiImages(data);

      // 重複スキップ + サイズフィルタ
      let skippedSaved = 0;
      let skippedSmall = 0;
      const newItems = allItems.filter((item) => {
        const url = fanboxItemUrl(item);
        if (!url) return false;
        if (skipSaved && savedIds.has(fanboxImageId(item, url))) {
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

      const images = fanboxItemsToImageInfo(newItems, metadata);
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

      const result = await sendDownload(finalPairs.map((pair) => pair.image), settings);
      const succeeded = result.success ?? 0;
      savedTotal += succeeded;

      // 成功有無に関わらず、実際に保存へ渡した画像だけ台帳へ（再試行で二重保存を避ける）。
      const ids = finalPairs.map((pair) => fanboxImageId(pair.item, fanboxItemUrl(pair.item)));
      await markImagesSaved(creatorId, post.id, ids);

      // 新着が含まれる最初の保存以降は savedIds にも反映
      ids.forEach((id) => savedIds.add(id));

      const detail = [
        `候補${newItems.length}/${allItems.length}`,
        syncFilter.filtered.length > 0 ? `ルール除外${syncFilter.filtered.length}` : '',
        pHashFilter.filtered.length > 0 ? `pHash除外${pHashFilter.filtered.length}` : '',
      ].filter(Boolean).join(', ');
      log(`✓ ${post.title || post.id}: ${succeeded}/${finalPairs.length}枚（${detail}）`);
      await sleep(400);
    }

    const skipNote = skippedPosts > 0 ? `（閲覧不可 ${skippedPosts}件スキップ）` : '';
    setProgress(`完了: 合計 ${savedTotal}枚保存${skipNote}`);
  } catch (error) {
    setProgress(`エラー: ${(error as Error).message}`);
  } finally {
    isRunning = false;
    if (goBtn) goBtn.disabled = false;
  }
}

function withinDateRange(post: FanboxPostListItem, from: number | null, to: number | null): boolean {
  if (from == null && to == null) return true;
  const t = post.publishedDatetime ? new Date(post.publishedDatetime).getTime() : NaN;
  if (Number.isNaN(t)) return true; // 日付不明は除外しない
  if (from != null && t < from) return false;
  if (to != null && t > to) return false;
  return true;
}

/**
 * FANBOX 原寸画像（downloads.fanbox.cc）を content script 上で prefetch する。
 * fanbox.cc 上で動作するため Referer と Cookie が正しく付与される。
 */
async function prefetchBlobs(images: ImageInfo[]): Promise<ImageInfo[]> {
  const result = [...images];
  for (let i = 0; i < result.length; i++) {
    const img = result[i];
    if (!isFanboxDownloadUrl(img.url)) continue;
    try {
      const response = await fetch(img.url, {
        credentials: 'include',
        cache: 'no-store',
        referrer: 'https://www.fanbox.cc/',
        referrerPolicy: 'strict-origin-when-cross-origin',
      });
      if (!response.ok) continue;
      const blobData = await response.arrayBuffer();
      const blobMimeType = response.headers.get('content-type') || 'image/jpeg';
      if (isValidImageResponse(blobMimeType, blobData)) {
        result[i] = { ...img, blobData, blobMimeType, downloadReferrer: 'https://www.fanbox.cc/' };
      }
    } catch {
      // service worker 側のダウンロードにフォールバック
    }
  }
  return result;
}

function isFanboxDownloadUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'downloads.fanbox.cc';
  } catch {
    return false;
  }
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
  settings: Settings
): Promise<{ success?: number; failed?: number; error?: string }> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        {
          type: 'DOWNLOAD_IMAGES',
          images,
          settings,
          saveAs: false,
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
