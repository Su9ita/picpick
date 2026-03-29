// オーバーレイUIを作成・管理
import { getExtractor, detectSite } from '../extractors';
import { filterImages } from '../utils/image-filter';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { ImageInfo } from '../types/image-info';

let overlayContainer: HTMLDivElement | null = null;
let isDownloading = false;

// 対応サイトかチェックしてオーバーレイを表示
export function initOverlay(): void {
  const url = window.location.href;
  const extractor = getExtractor(url);
  
  if (!extractor) return; // 非対応サイトでは何もしない
  
  createOverlay();
}

function createOverlay(): void {
  if (overlayContainer) return;
  
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'picpick-overlay';
  overlayContainer.innerHTML = `
    <style>
      #picpick-overlay {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #picpick-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      #picpick-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
      }
      #picpick-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
        transform: none;
      }
      #picpick-btn svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
      #picpick-status {
        position: absolute;
        right: 0;
        top: 64px;
        background: white;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 13px;
        min-width: 180px;
        display: none;
      }
      #picpick-status.show {
        display: block;
      }
      .picpick-progress {
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
      }
      .picpick-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
        transition: width 0.3s ease;
      }
      @keyframes picpick-spin {
        to { transform: rotate(360deg); }
      }
      .picpick-loading svg {
        animation: picpick-spin 1s linear infinite;
      }
    </style>
    <button id="picpick-btn" title="画像を一括保存">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
    </button>
    <div id="picpick-status">
      <div id="picpick-status-text">準備中...</div>
      <div class="picpick-progress">
        <div class="picpick-progress-bar" id="picpick-progress-bar" style="width: 0%"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlayContainer);
  
  const btn = document.getElementById('picpick-btn');
  btn?.addEventListener('click', handleDownloadClick);
}

async function handleDownloadClick(): Promise<void> {
  if (isDownloading) return;
  
  const btn = document.getElementById('picpick-btn') as HTMLButtonElement;
  const status = document.getElementById('picpick-status');
  const statusText = document.getElementById('picpick-status-text');
  const progressBar = document.getElementById('picpick-progress-bar');
  
  if (!btn || !status || !statusText || !progressBar) return;
  
  isDownloading = true;
  btn.disabled = true;
  btn.classList.add('picpick-loading');
  status.classList.add('show');
  statusText.textContent = 'スキャン中...';
  
  try {
    // 画像を抽出
    const url = window.location.href;
    const extractor = getExtractor(url);
    if (!extractor) throw new Error('非対応サイト');
    
    const images = await extractor.extractImages();
    
    // 設定を取得
    const settings = await getSettings();
    
    // フィルタリング
    const filterResult = filterImages(images, settings);
    const filteredImages = filterResult.passed;
    
    if (filteredImages.length === 0) {
      statusText.textContent = '画像が見つかりませんでした';
      setTimeout(() => status.classList.remove('show'), 2000);
      return;
    }
    
    statusText.textContent = `${filteredImages.length}枚をダウンロード中...`;
    
    // ダウンロード実行
    const result = await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_IMAGES',
      images: filteredImages,
      settings,
    });
    
    if (result.error) {
      statusText.textContent = `エラー: ${result.error}`;
    } else {
      const { success, failed } = result;
      statusText.textContent = failed > 0 
        ? `完了: ${success}枚成功, ${failed}枚失敗`
        : `${success}枚のダウンロード完了!`;
      progressBar.style.width = '100%';
    }
    
    setTimeout(() => {
      status.classList.remove('show');
      progressBar.style.width = '0%';
    }, 3000);
    
  } catch (error) {
    statusText.textContent = `エラー: ${(error as Error).message}`;
    setTimeout(() => status.classList.remove('show'), 3000);
  } finally {
    isDownloading = false;
    btn.disabled = false;
    btn.classList.remove('picpick-loading');
  }
}

async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response && !response.error) {
        resolve(response);
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  });
}

// 進捗更新リスナー
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'DOWNLOAD_PROGRESS') {
    const progressBar = document.getElementById('picpick-progress-bar');
    const statusText = document.getElementById('picpick-status-text');
    if (progressBar && statusText) {
      const percent = (message.current / message.total) * 100;
      progressBar.style.width = `${percent}%`;
      statusText.textContent = `ダウンロード中... ${message.current}/${message.total}`;
    }
  }
});
