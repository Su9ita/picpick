export interface ImageInfo {
  url: string;
  originalUrl: string;
  width: number | null;
  height: number | null;
  index: number;
  metadata: ImageMetadata;
  // content script でプリフェッチした生データ (Referer が必要なサイト用)
  blobData?: ArrayBuffer;
  blobMimeType?: string;
  downloadReferrer?: string;
}

export interface ImageMetadata {
  creator: string;
  postId: string;
  postTitle: string;
  postDate: Date | null;
  originalFilename: string;
}
