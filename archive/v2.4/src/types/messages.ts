import { ImageInfo } from './image-info';
import { Settings } from './settings';

export type MessageType =
  | 'EXTRACT_IMAGES'
  | 'DOWNLOAD_IMAGES'
  | 'START_NETWORK_CAPTURE'
  | 'STOP_NETWORK_CAPTURE'
  | 'FETCH_IMAGE_URLS'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'EXTRACTION_RESULT'
  | 'DOWNLOAD_PROGRESS';

export interface ExtractImagesMessage {
  type: 'EXTRACT_IMAGES';
}

export interface DownloadImagesMessage {
  type: 'DOWNLOAD_IMAGES';
  images: ImageInfo[];
  settings: Settings;
  customName?: string;  // カスタム名モード時のファイル名
}

export interface StartNetworkCaptureMessage {
  type: 'START_NETWORK_CAPTURE';
}

export interface StopNetworkCaptureMessage {
  type: 'STOP_NETWORK_CAPTURE';
}

export interface FetchImageUrlsMessage {
  type: 'FETCH_IMAGE_URLS';
  urls: string[];
  ajaxRequests?: Array<{
    url: string;
    body: Record<string, string>;
  }>;
}

export interface GetSettingsMessage {
  type: 'GET_SETTINGS';
}

export interface SaveSettingsMessage {
  type: 'SAVE_SETTINGS';
  settings: Settings;
}

export interface ExtractionResultMessage {
  type: 'EXTRACTION_RESULT';
  images: ImageInfo[];
  filteredCount: number;
  siteInfo: {
    site: 'patreon' | 'pixiv' | 'fanbox' | 'unknown';
    creator: string;
    postTitle: string;
  };
}

export interface DownloadProgressMessage {
  type: 'DOWNLOAD_PROGRESS';
  current: number;
  total: number;
}

export type Message =
  | ExtractImagesMessage
  | DownloadImagesMessage
  | StartNetworkCaptureMessage
  | StopNetworkCaptureMessage
  | FetchImageUrlsMessage
  | GetSettingsMessage
  | SaveSettingsMessage
  | ExtractionResultMessage
  | DownloadProgressMessage;
