export interface ImageInfo {
  url: string;
  originalUrl: string;
  width: number | null;
  height: number | null;
  index: number;
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  creator: string;
  postId: string;
  postTitle: string;
  postDate: Date | null;
  originalFilename: string;
}
