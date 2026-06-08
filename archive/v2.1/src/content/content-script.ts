import { getExtractor, detectSite } from '../extractors';
import { filterImages } from '../utils/image-filter';
import { deepScanImages } from '../utils/deep-image-scanner';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';
import { ImageInfo } from '../types/image-info';
import { initOverlay } from './overlay';

// all_framesで読み込むが、操作UIはトップフレームだけに出す。
if (window.top === window) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOverlay);
  } else {
    initOverlay();
  }
}

// メッセージリスナー（ポップアップからの呼び出し用）
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_IMAGES') {
    extractAndFilter()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }
});

async function extractAndFilter(): Promise<{
  images?: ImageInfo[];
  filteredCount?: number;
  siteInfo?: {
    site: 'patreon' | 'pixiv' | 'fanbox' | 'x' | 'generic' | 'unknown';
    creator: string;
    postTitle: string;
  };
  error?: string;
  supported?: boolean;
}> {
  const url = window.location.href;
  const extractor = getExtractor(url);

  if (!extractor) {
    return {
      error: 'このサイトはサポートされていません',
      supported: false,
    };
  }

  const settings = await getSettingsFromBackground();
  const images = await deepScanImages(extractor);
  const filterResult = filterImages(images, settings);
  const metadata = extractor.extractMetadata();

  return {
    images: filterResult.passed,
    filteredCount: filterResult.filtered.length,
    siteInfo: {
      site: detectSite(url),
      creator: '', // クリエイター名はポップアップで選択
      postTitle: metadata.postTitle,
    },
  };
}

async function getSettingsFromBackground(): Promise<Settings> {
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
