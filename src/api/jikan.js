const BASE = 'https://api.jikan.moe/v4';
const DELAY_MS = 260;
const CACHE_TTL_MS = 5 * 60 * 1000;

let lastRequest = 0;
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, exp: Date.now() + CACHE_TTL_MS });
}

async function throttle() {
  const now = Date.now();
  const wait = DELAY_MS - (now - lastRequest);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();
}

async function fetchJson(url, retries = 2) {
  const cached = cacheGet(url);
  if (cached !== null) return cached;

  await throttle();
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      if (!res.ok) return null;
      const json = await res.json();
      cacheSet(url, json);
      return json;
    } catch {
      if (i === retries) return null;
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return null;
}

/** Пошук аніме на MyAnimeList через Jikan */
export async function searchAnime(query, limit = 25) {
  const q = encodeURIComponent(query.trim());
  const data = await fetchJson(`${BASE}/anime?q=${q}&limit=${limit}&sfw=true&order_by=popularity`);
  return data?.data ?? [];
}

/** Повна інформація за MAL id */
export async function getAnimeFull(malId) {
  const data = await fetchJson(`${BASE}/anime/${malId}/full`);
  return data?.data ?? null;
}

/** Короткі дані: тип, серії */
export async function getAnimeBrief(malId) {
  const data = await fetchJson(`${BASE}/anime/${malId}`);
  return data?.data ?? null;
}

/** Зв'язки з іншими сезонами / фільмами */
export async function getAnimeRelations(malId) {
  const data = await fetchJson(`${BASE}/anime/${malId}/relations`);
  return data?.data ?? [];
}

/** Кілька brief-пакетів паралельно (через throttle — швидше ніж цикл for) */
export async function getAnimeBriefBatch(malIds) {
  const unique = [...new Set(malIds)];
  return Promise.all(unique.map((id) => getAnimeBrief(id)));
}
