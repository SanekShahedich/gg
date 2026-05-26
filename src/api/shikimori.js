/**
 * Shikimori — MAL-синхрон; добре знаходить uk/ru назви.
 */
const BASE = 'https://shikimori.one/api';
const HEADERS = { 'User-Agent': 'AnimeTelegramBot/1.0' };

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Пошук за кирилицею / будь-якою мовою */
export async function searchAnime(query, limit = 20) {
  const q = encodeURIComponent(query.trim());
  const list = await fetchJson(`${BASE}/animes?search=${q}&limit=${limit}`);
  if (!Array.isArray(list)) return [];

  return list
    .filter((a) => a.mal_id)
    .map((a) => ({
      mal_id: Number(a.mal_id),
      title: a.name,
      title_english: a.english?.trim() || null,
      title_japanese: a.japanese?.trim() || null,
      titles: [a.russian, a.name, a.english, a.japanese].filter(Boolean),
      russian: a.russian?.trim() || null,
      episodes: a.episodes || a.episodes_aired,
      score: a.score,
      status: a.status,
      synopsis: null,
      source: 'shikimori',
    }));
}

export async function getDescriptionByMalId(malId, titleHint) {
  const q = encodeURIComponent(titleHint?.trim() || String(malId));
  const list = await fetchJson(`${BASE}/animes?search=${q}&limit=15`);
  if (!Array.isArray(list)) return null;
  const found = list.find((a) => Number(a.mal_id) === Number(malId));
  if (!found?.description) return null;
  return stripHtml(found.description) || null;
}
