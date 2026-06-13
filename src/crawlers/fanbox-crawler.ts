/**
 * FANBOX クリエイターの全投稿を API で列挙する。
 *
 * FANBOX は投稿一覧をページ分割で返す API を持つ:
 *   1) post.paginateCreator?creatorId=X
 *        → body: string[]   各要素が post.listCreator のページURL（cursor付き）
 *   2) 各ページURL（post.listCreator 系）
 *        → body.items: 投稿の配列
 *
 * paginateCreator が使えない場合は listCreator の nextUrl を辿るフォールバックを用いる。
 * いずれも content script（fanbox.cc 上）から credentials付きで叩く。
 */

export interface FanboxPostListItem {
  id: string;
  title: string;
  publishedDatetime: string;
  isRestricted: boolean;   // 自分のプランでは閲覧不可（=画像取得不可）
  feeRequired?: number;
}

interface PaginateResponse {
  error?: boolean;
  body?: string[];
}

interface ListCreatorResponse {
  error?: boolean;
  body?: FanboxPostListItem[] | {
    items?: FanboxPostListItem[];
    nextUrl?: string | null;
  };
}

/** 現在のページ URL から creatorId を推定する。判定できなければ null。 */
export function detectFanboxCreatorId(): string | null {
  // www.fanbox.cc/@creator/...
  const atMatch = window.location.pathname.match(/\/@([\w-]+)/);
  if (atMatch) return atMatch[1];

  // creator.fanbox.cc
  const host = window.location.hostname;
  if (host.endsWith('.fanbox.cc')) {
    const sub = host.replace(/\.fanbox\.cc$/, '');
    if (sub && sub !== 'www' && sub !== 'api') return sub;
  }
  return null;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function listCreatorItems(response: ListCreatorResponse | null): FanboxPostListItem[] {
  if (!response?.body) return [];
  if (Array.isArray(response.body)) return response.body;
  return response.body.items || [];
}

function listCreatorNextUrl(response: ListCreatorResponse | null): string | null {
  if (!response?.body || Array.isArray(response.body)) return null;
  return response.body.nextUrl || null;
}

/**
 * creatorId の全投稿（一覧メタデータ）を新しい順で返す。
 * onProgress には累計取得件数を通知する。
 */
export async function enumerateCreatorPosts(
  creatorId: string,
  onProgress?: (collected: number) => void,
  requestDelayMs = 300
): Promise<FanboxPostListItem[]> {
  const items: FanboxPostListItem[] = [];
  const seen = new Set<string>();

  const pushItems = (list?: FanboxPostListItem[]) => {
    for (const it of list || []) {
      if (it && it.id && !seen.has(it.id)) {
        seen.add(it.id);
        items.push(it);
      }
    }
  };

  // 1) paginateCreator でページURL一覧を取得
  const pages = await fetchJson<PaginateResponse>(
    `https://api.fanbox.cc/post.paginateCreator?creatorId=${encodeURIComponent(creatorId)}`
  );

  if (pages?.body && Array.isArray(pages.body) && pages.body.length > 0) {
    for (const pageUrl of pages.body) {
      const list = await fetchJson<ListCreatorResponse>(pageUrl);
      pushItems(listCreatorItems(list));
      onProgress?.(items.length);
      if (requestDelayMs > 0) await sleep(requestDelayMs);
    }
    return items;
  }

  // 2) フォールバック: listCreator を nextUrl で辿る
  let nextUrl: string | null =
    `https://api.fanbox.cc/post.listCreator?creatorId=${encodeURIComponent(creatorId)}&limit=10`;
  let guard = 0;

  while (nextUrl && guard < 1000) {
    const list: ListCreatorResponse | null = await fetchJson<ListCreatorResponse>(nextUrl);
    if (!list?.body) break;
    pushItems(listCreatorItems(list));
    onProgress?.(items.length);
    nextUrl = listCreatorNextUrl(list);
    guard++;
    if (requestDelayMs > 0) await sleep(requestDelayMs);
  }

  return items;
}
