import { ImageInfo, ImageMetadata } from '../types/image-info';

export const PATREON_REFERRER = 'https://www.patreon.com/';

export interface PatreonApiResource {
  id?: string;
  type?: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, {
    data?: { id?: string; type?: string } | Array<{ id?: string; type?: string }>;
    links?: { related?: string };
  }>;
}

export interface PatreonApiResponse {
  data?: PatreonApiResource | PatreonApiResource[];
  included?: PatreonApiResource[];
  links?: {
    next?: string | null;
  };
}

export interface PatreonPostItem {
  id: string;
  title: string;
  publishedAt: string;
  currentUserCanView: boolean;
  url?: string;
  campaignName?: string;
  userName?: string;
  images: PatreonMediaItem[];
}

export interface PatreonMediaItem {
  id: string;
  url: string;
  fileName: string;
  width?: number;
  height?: number;
  source: 'image' | 'attachment' | 'content';
}

type IncludedMap = Map<string, PatreonApiResource>;

export let lastPatreonFetchError = '';

export async function fetchPatreonJson(url: string): Promise<PatreonApiResponse | null> {
  lastPatreonFetchError = '';
  try {
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json, application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });
    if (!response.ok) {
      lastPatreonFetchError = `HTTP ${response.status} ${response.statusText || ''}`.trim();
      return null;
    }
    return (await response.json()) as PatreonApiResponse;
  } catch (error) {
    lastPatreonFetchError = (error as Error).message || String(error);
    return null;
  }
}

export async function fetchPatreonPostInfo(postId: string): Promise<PatreonPostItem | null> {
  if (!postId) return null;
  const json = await fetchPatreonJson(buildPatreonPostUrl(postId));
  if (!json || Array.isArray(json.data) || !json.data) return null;
  return patreonResourceToPost(json.data, buildIncludedMap(json.included || []));
}

export function buildPatreonPostUrl(postId: string): string {
  const url = new URL(`https://www.patreon.com/api/posts/${encodeURIComponent(postId)}`);
  addPatreonPostParams(url.searchParams);
  return url.toString();
}

export function buildPatreonCreatorPostsUrl(campaignId: string, cursor = '', sort = '-published_at'): string {
  const url = new URL('https://www.patreon.com/api/posts');
  addPatreonPostParams(url.searchParams);
  url.searchParams.set('filter[campaign_id]', campaignId);
  url.searchParams.set('filter[contains_exclusive_posts]', 'true');
  url.searchParams.set('filter[is_draft]', 'false');
  url.searchParams.set('sort', sort);
  if (cursor) url.searchParams.set('page[cursor]', cursor);
  return url.toString();
}

export function patreonResponseToPosts(json: PatreonApiResponse): PatreonPostItem[] {
  if (!Array.isArray(json.data)) return [];
  const included = buildIncludedMap(json.included || []);
  return json.data
    .map((resource) => patreonResourceToPost(resource, included))
    .filter((post): post is PatreonPostItem => post !== null);
}

export function patreonItemsToImageInfo(items: PatreonMediaItem[], metadata: ImageMetadata): ImageInfo[] {
  return items.map((item, index) => ({
    url: item.url,
    originalUrl: item.url,
    width: item.width ?? null,
    height: item.height ?? null,
    index: index + 1,
    downloadReferrer: PATREON_REFERRER,
    metadata: {
      ...metadata,
      originalFilename: item.fileName || filenameFromUrl(item.url),
    },
  }));
}

export function buildPatreonMetadata(post: PatreonPostItem): ImageMetadata {
  return {
    creator: sanitizePatreonName(post.campaignName || post.userName || ''),
    postId: post.id,
    postTitle: sanitizePatreonName(post.title || 'untitled'),
    postDate: post.publishedAt ? new Date(post.publishedAt) : null,
    originalFilename: '',
  };
}

export function patreonImageId(item: PatreonMediaItem): string {
  if (item.id) return `${item.source}:${item.id}`;
  return `${item.source}:${filenameFromUrl(item.url).replace(/\.[^.]+$/, '') || item.url}`;
}

export function sanitizePatreonName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

function addPatreonPostParams(params: URLSearchParams): void {
  params.set('include', [
    'campaign',
    'attachments',
    'attachments_media',
    'images',
    'media',
    'user',
  ].join(','));
  params.set('fields[campaign]', 'name,url');
  params.set('fields[post]', [
    'content',
    'current_user_can_view',
    'image',
    'published_at',
    'title',
    'url',
    'patreon_url',
    'thumbnail_url',
  ].join(','));
  params.set('fields[user]', 'full_name,url');
  params.set('fields[media]', 'id,image_urls,download_url,metadata,file_name');
  params.set('json-api-version', '1.0');
}

function buildIncludedMap(resources: PatreonApiResource[]): IncludedMap {
  const map: IncludedMap = new Map();
  for (const resource of resources) {
    if (!resource.type || !resource.id) continue;
    map.set(`${resource.type}:${resource.id}`, resource);
  }
  return map;
}

function patreonResourceToPost(resource: PatreonApiResource, included: IncludedMap): PatreonPostItem | null {
  if (!resource.id) return null;
  const attributes = resource.attributes || {};
  const campaign = firstRelated(resource, included, 'campaign');
  const user = firstRelated(resource, included, 'user');
  const relationshipImages = [
    ...relatedMedia(resource, included, 'images', 'image'),
    ...relatedMedia(resource, included, 'media', 'image'),
  ];
  const images = [
    ...relationshipImages,
    ...(relationshipImages.length === 0 ? mediaFromPostImage(attributes) : []),
    ...relatedMedia(resource, included, 'attachments_media', 'attachment'),
    ...relatedMedia(resource, included, 'attachments', 'attachment'),
    ...contentImages(getString(attributes.content)),
  ];

  return {
    id: resource.id,
    title: getString(attributes.title) || 'untitled',
    publishedAt: getString(attributes.published_at),
    currentUserCanView: getBoolean(attributes.current_user_can_view, true),
    url: getString(attributes.url) || getString(attributes.patreon_url),
    campaignName: getString(campaign?.attributes?.name),
    userName: getString(user?.attributes?.full_name),
    images: dedupeMedia(images),
  };
}

function firstRelated(resource: PatreonApiResource, included: IncludedMap, key: string): PatreonApiResource | null {
  const data = resource.relationships?.[key]?.data;
  const ref = Array.isArray(data) ? data[0] : data;
  if (!ref?.type || !ref.id) return null;
  return included.get(`${ref.type}:${ref.id}`) || null;
}

function relatedMedia(
  resource: PatreonApiResource,
  included: IncludedMap,
  key: string,
  source: PatreonMediaItem['source']
): PatreonMediaItem[] {
  const data = resource.relationships?.[key]?.data;
  const refs = Array.isArray(data) ? data : data ? [data] : [];
  const items: PatreonMediaItem[] = [];

  for (const ref of refs) {
    if (!ref.type || !ref.id) continue;
    const media = included.get(`${ref.type}:${ref.id}`);
    const item = mediaResourceToItem(media, source);
    if (item) items.push(item);
  }

  return items;
}

function mediaResourceToItem(
  resource: PatreonApiResource | null | undefined,
  source: PatreonMediaItem['source']
): PatreonMediaItem | null {
  const attributes = resource?.attributes || {};
  const url = bestMediaUrl(attributes, source);
  if (!url) return null;
  const metadata = getRecord(attributes.metadata);
  const dimensions = getRecord(metadata?.dimensions);
  const width = getNumber(metadata?.width)
    ?? getNumber(metadata?.dimensions_width)
    ?? getNumber(dimensions?.w)
    ?? getNumber(dimensions?.width);
  const height = getNumber(metadata?.height)
    ?? getNumber(metadata?.dimensions_height)
    ?? getNumber(dimensions?.h)
    ?? getNumber(dimensions?.height);

  return {
    id: getString(attributes.id) || resource?.id || '',
    url,
    fileName: getString(attributes.file_name) || filenameFromUrl(url),
    width,
    height,
    source,
  };
}

function mediaFromPostImage(attributes: Record<string, unknown>): PatreonMediaItem[] {
  // post.image はカード/表示用の縮小画像であることが多い。
  // 原寸は relationships.images/media の image_urls.original から取得する。
  return [];
}

function bestMediaUrl(attributes: Record<string, unknown>, source: PatreonMediaItem['source']): string {
  const imageUrls = getRecord(attributes.image_urls);
  const originalUrl = imageUrls ? getOriginalImageUrl(imageUrls) : '';
  if (originalUrl) return originalUrl;

  if (source === 'image' && imageUrls) {
    return '';
  }

  const candidates = [
    getString(attributes.download_url),
    getString(attributes.url),
  ];
  return candidates.find((candidate) => candidate.includes('patreonusercontent.com')) || candidates.find(Boolean) || '';
}

function getOriginalImageUrl(imageUrls: Record<string, unknown>): string {
  const preferredKeys = ['original', 'full', 'source', 'download', 'default_original'];
  for (const key of preferredKeys) {
    const value = getString(imageUrls[key]);
    if (value) return value;
  }
  return '';
}

function contentImages(content: string): PatreonMediaItem[] {
  if (!content) return [];
  const doc = new DOMParser().parseFromString(content, 'text/html');
  const items: PatreonMediaItem[] = [];
  doc.querySelectorAll<HTMLImageElement>('img[src*="patreonusercontent.com"]').forEach((img, index) => {
    const url = img.src;
    items.push({
      id: img.getAttribute('media_id') || `content:${index}:${url}`,
      url,
      fileName: filenameFromUrl(url),
      width: img.naturalWidth || getDimension(img.getAttribute('width')),
      height: img.naturalHeight || getDimension(img.getAttribute('height')),
      source: 'content',
    });
  });
  return items;
}

function dedupeMedia(items: PatreonMediaItem[]): PatreonMediaItem[] {
  const seen = new Set<string>();
  const result: PatreonMediaItem[] = [];
  for (const item of items) {
    const key = patreonMediaDedupeKey(item.url) || item.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function patreonMediaDedupeKey(url: string): string {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    const mediaRoot = parts.findIndex((part) => part === 'patreon-media');
    if (mediaRoot >= 0 && parts.length >= mediaRoot + 7) {
      const scope = parts[mediaRoot + 2];
      const owner = parts[mediaRoot + 3];
      const mediaHash = parts[mediaRoot + 4];
      const filename = parts[parts.length - 1];
      return `${urlObj.hostname}/${scope}/${owner}/${mediaHash}/${filename}`;
    }
    return `${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    return url.split('?')[0] || url;
  }
}

export function filenameFromUrl(url: string): string {
  try {
    const pathName = new URL(url).pathname;
    return pathName.split('/').pop() || 'image';
  } catch {
    return 'image';
  }
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function getBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getDimension(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
