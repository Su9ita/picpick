import {
  buildPatreonCreatorPostsUrl,
  fetchPatreonJson,
  PatreonApiResource,
  patreonResponseToPosts,
  PatreonPostItem,
} from '../extractors/patreon-api';

export function detectPatreonCreatorSlug(): string | null {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return null;
  const parts = path.split('/');
  const reserved = new Set([
    'api',
    'checkout',
    'create',
    'home',
    'login',
    'messages',
    'posts',
    'search',
    'signup',
    'user',
  ]);

  if ((parts[0] === 'c' || parts[0] === 'cw') && parts[1]) return parts[1];
  if (parts[0] === 'profile' && parts[1] === 'creators') return null;
  if (!reserved.has(parts[0])) return parts[0];
  return null;
}

export async function resolvePatreonCampaignId(input: string): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return trimmed;
  if (trimmed.startsWith('id:') && /^\d+$/.test(trimmed.slice(3))) return trimmed.slice(3);

  const fromQuery = new URLSearchParams(window.location.search).get('c')
    || new URLSearchParams(window.location.search).get('campaign_id');
  if (fromQuery && /^\d+$/.test(fromQuery)) return fromQuery;

  const fromVanityApi = await fetchCampaignIdByVanity(trimmed);
  if (fromVanityApi) return fromVanityApi;

  const fromCurrentPage = extractCampaignIdFromDocument(document);
  if (fromCurrentPage) return fromCurrentPage;

  try {
    const response = await fetch(`https://www.patreon.com/${encodeURIComponent(trimmed)}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    return extractCampaignIdFromDocument(parsed) || extractCampaignIdFromText(html);
  } catch {
    return null;
  }
}

async function fetchCampaignIdByVanity(vanity: string): Promise<string | null> {
  try {
    const url = new URL('https://www.patreon.com/api/campaigns');
    url.searchParams.set('filter[vanity]', vanity);
    url.searchParams.set('json-api-version', '1.0');
    const json = await fetchPatreonJson(url.toString());
    const data = json?.data;
    if (Array.isArray(data)) {
      const campaign = data.find((item) => item.type === 'campaign' && item.id);
      return campaign?.id || null;
    }
    return (data as PatreonApiResource | undefined)?.type === 'campaign'
      ? (data as PatreonApiResource).id || null
      : null;
  } catch {
    return null;
  }
}

export async function enumeratePatreonCreatorPosts(
  campaignId: string,
  onProgress?: (collected: number) => void,
  requestDelayMs = 350
): Promise<PatreonPostItem[]> {
  const posts: PatreonPostItem[] = [];
  const seen = new Set<string>();
  let nextUrl: string | null = buildPatreonCreatorPostsUrl(campaignId);
  let guard = 0;

  while (nextUrl && guard < 1000) {
    const json = await fetchPatreonJson(nextUrl);
    if (!json) break;
    for (const post of patreonResponseToPosts(json)) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        posts.push(post);
      }
    }
    onProgress?.(posts.length);
    nextUrl = json.links?.next || null;
    guard++;
    if (nextUrl && requestDelayMs > 0) await sleep(requestDelayMs);
  }

  return posts;
}

function extractCampaignIdFromDocument(doc: Document): string | null {
  const nextData = doc.getElementById('__NEXT_DATA__')?.textContent;
  if (nextData) {
    const id = extractCampaignIdFromJsonText(nextData);
    if (id) return id;
  }

  for (const script of Array.from(doc.scripts)) {
    const text = script.textContent || '';
    if (!text.includes('campaign')) continue;
    const id = extractCampaignIdFromText(text);
    if (id) return id;
  }

  return null;
}

function extractCampaignIdFromJsonText(text: string): string | null {
  try {
    const json = JSON.parse(text) as unknown;
    return findCampaignId(json);
  } catch {
    return extractCampaignIdFromText(text);
  }
}

function findCampaignId(value: unknown, depth = 0): string | null {
  if (!value || depth > 30) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findCampaignId(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const campaign = record.campaign;
  if (campaign && typeof campaign === 'object') {
    const campaignRecord = campaign as Record<string, unknown>;
    const directId = stringId(campaignRecord.id);
    if (directId) return directId;
    const data = campaignRecord.data;
    if (data && typeof data === 'object') {
      const dataId = stringId((data as Record<string, unknown>).id);
      if (dataId) return dataId;
    }
  }

  for (const [key, item] of Object.entries(record)) {
    if ((key === 'campaign_id' || key === 'campaignId' || key === 'campaignID') && stringId(item)) {
      return stringId(item);
    }
    if (key === 'type' && item === 'campaign' && stringId(record.id)) return stringId(record.id);
  }
  for (const item of Object.values(record)) {
    const found = findCampaignId(item, depth + 1);
    if (found) return found;
  }
  return null;
}

function extractCampaignIdFromText(text: string): string | null {
  const patterns = [
    /"campaign"\s*:\s*\{\s*"data"\s*:\s*\{\s*"id"\s*:\s*"(\d+)"/,
    /\\"campaign\\"\s*:\s*\{\s*\\"data\\"\s*:\s*\{\s*\\"id\\"\s*:\s*\\"(\d+)/,
    /"campaign_id"\s*:\s*"?(\d+)"?/,
    /"campaignId"\s*:\s*"?(\d+)"?/,
    /\/campaign\/(\d+)\//,
    /\/creator\/(\d+)(?:[/.?]|%2F)/,
    /campaign_id=(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function stringId(value: unknown): string | null {
  if (typeof value === 'string' && /^\d+$/.test(value)) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
