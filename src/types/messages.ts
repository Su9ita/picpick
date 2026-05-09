import { ImageInfo } from './image-info';
import { Settings } from './settings';

export type MessageType =
  | 'EXTRACT_IMAGES'
  | 'DOWNLOAD_IMAGES'
  | 'GET_X_TWEET_MEDIA'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'RESET_SETTINGS'
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
  saveAs?: boolean;     // 今回だけ保存場所を選ぶ
}

export interface XTweetMedia {
  url: string;
  originalUrl: string;
  width: number | null;
  height: number | null;
  mediaType: 'video' | 'animated_gif';
  originalFilename: string;
}

export interface GetXTweetMediaMessage {
  type: 'GET_X_TWEET_MEDIA';
  postId: string;
}

export interface GetSettingsMessage {
  type: 'GET_SETTINGS';
}

export interface SaveSettingsMessage {
  type: 'SAVE_SETTINGS';
  settings: Settings;
}

export interface ResetSettingsMessage {
  type: 'RESET_SETTINGS';
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
  | GetXTweetMediaMessage
  | GetSettingsMessage
  | SaveSettingsMessage
  | ResetSettingsMessage
  | ExtractionResultMessage
  | DownloadProgressMessage;
