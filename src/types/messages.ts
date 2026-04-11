import { ImageInfo } from './image-info';
import { Settings } from './settings';

export type MessageType =
  | 'EXTRACT_IMAGES'
  | 'DOWNLOAD_IMAGES'
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
  | GetSettingsMessage
  | SaveSettingsMessage
  | ExtractionResultMessage
  | DownloadProgressMessage;
