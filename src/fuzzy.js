import Fuse from 'fuse.js';
import { distance } from 'fastest-levenshtein';
import { normalizeAliasKey } from './aliases.js';

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectTitles(entry) {
  const titles = new Set();
  const add = (v) => {
    if (v && typeof v === 'string' && v.trim()) titles.add(v.trim());
  };

  add(entry.title);
  add(entry.title_english);
  add(entry.title_japanese);
  add(entry.title_romaji);
  add(entry.title_native);
  add(entry.title_english_anilist);
  add(entry.title_romaji_anilist);
  add(entry.russian);

  if (Array.isArray(entry.titles)) {
    for (const t of entry.titles) add(t?.title ?? t);
  }
  if (Array.isArray(entry.synonyms)) {
    for (const s of entry.synonyms) add(s);
  }

  return [...titles];
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const naRu = normalizeAliasKey(a);
  const nbRu = normalizeAliasKey(b);
  if (naRu && nbRu && naRu === nbRu) return 0.98;

  if (na.includes(nb) || nb.includes(na)) return 0.92;

  const maxLen = Math.max(na.length, nb.length);
  const dist = distance(na, nb);
  const distRu = distance(naRu, nbRu);
  return Math.max(1 - dist / maxLen, 1 - distRu / Math.max(naRu.length, nbRu.length));
}

function bestCyrillicSimilarity(query, titles) {
  const cyr = titles.filter((t) => /[а-яА-Яіїєґёъыэ]/i.test(t));
  if (!cyr.length) return 0;
  return Math.max(...cyr.map((t) => similarity(query, t)));
}

/**
 * Пріоритет Shikimori для uk/ru — не плутати з англ. результатами Jikan.
 */
export function pickShikimoriMatch(query, shikimoriList) {
  if (!shikimoriList?.length) return null;

  let best = null;
  let bestCyr = 0;

  for (const item of shikimoriList) {
    const titles = collectTitles(item);
    const cyrSim = bestCyrillicSimilarity(query, titles);
    const anySim = Math.max(cyrSim, ...titles.map((t) => similarity(query, t)));

    if (cyrSim >= 0.48 && cyrSim >= bestCyr) {
      bestCyr = cyrSim;
      best = { item, score: cyrSim + 0.2, cyrSim };
    } else if (!best && anySim >= 0.72) {
      best = { item, score: anySim, cyrSim };
    }
  }

  if (!best || best.cyrSim < 0.4 && best.score < 0.75) return null;
  return best.item;
}

export function pickBestMatch(query, jikanList, anilistList, shikimoriList = [], isCyrillic = false) {
  if (isCyrillic) {
    const shikiOnly = pickShikimoriMatch(query, shikimoriList);
    if (shikiOnly) return shikiOnly;
  }

  const byMal = new Map();

  for (const item of jikanList) {
    byMal.set(item.mal_id, {
      mal_id: item.mal_id,
      title: item.title,
      title_english: item.title_english,
      title_japanese: item.title_japanese,
      titles: item.titles?.map((x) => x.title) ?? [],
      synonyms: [],
      score: item.score,
      episodes: item.episodes,
      status: item.status,
      synopsis: item.synopsis,
      source: 'jikan',
    });
  }

  for (const m of anilistList) {
    const malId = m.idMal;
    if (!malId) continue;
    const existing = byMal.get(malId) ?? { mal_id: malId, synonyms: [], titles: [] };
    existing.title_romaji_anilist = m.title?.romaji;
    existing.title_english_anilist = m.title?.english;
    existing.title_native = m.title?.native;
    existing.anilist_status = m.status;
    existing.anilist_score = m.averageScore;
    existing.anilist_episodes = m.episodes;
    existing.anilist_description = m.description;
    existing.synonyms = [...(existing.synonyms ?? []), ...(m.synonyms ?? [])];
    existing.source = existing.source ? 'both' : 'anilist';
    byMal.set(malId, existing);
  }

  for (const item of shikimoriList) {
    const malId = item.mal_id;
    if (!malId) continue;
    const existing = byMal.get(malId) ?? { mal_id: malId, synonyms: [], titles: [] };
    existing.title = existing.title ?? item.title;
    existing.title_english = existing.title_english ?? item.title_english;
    existing.title_japanese = existing.title_japanese ?? item.title_japanese;
    existing.russian = item.russian;
    existing.titles = [...(existing.titles ?? []), ...(item.titles ?? []), item.russian].filter(Boolean);
    existing.score = existing.score ?? item.score;
    existing.episodes = existing.episodes ?? item.episodes;
    existing.status = existing.status ?? item.status;
    existing.source = existing.source ? 'both' : 'shikimori';
    byMal.set(malId, existing);
  }

  const candidates = [...byMal.values()];
  if (!candidates.length) return null;

  const fuseList = candidates.map((c) => ({
    ...c,
    _searchBlob: collectTitles(c).join(' | '),
  }));

  const fuse = new Fuse(fuseList, {
    keys: [
      { name: '_searchBlob', weight: 0.45 },
      { name: 'title', weight: 0.2 },
      { name: 'title_english', weight: 0.15 },
      { name: 'title_romaji_anilist', weight: 0.2 },
    ],
    threshold: isCyrillic ? 0.5 : 0.45,
    ignoreLocation: true,
    includeScore: true,
  });

  const fuseHits = fuse.search(query);
  const scored = candidates.map((c) => {
    const titles = collectTitles(c);
    const cyrSim = bestCyrillicSimilarity(query, titles);
    const bestSim = Math.max(...titles.map((t) => similarity(query, t)), 0);
    const fuseHit = fuseHits.find((h) => h.item.mal_id === c.mal_id);
    const fuseScore = fuseHit ? 1 - (fuseHit.score ?? 1) : 0;

    let combined = bestSim * 0.4 + fuseScore * 0.35 + cyrSim * 0.45;

    if (isCyrillic) {
      if (cyrSim < 0.4) combined *= 0.25;
      else combined += 0.12;
    }

    return { item: c, score: combined, cyrSim, bestSim };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (isCyrillic) {
    if (!best || best.cyrSim < 0.42) return pickShikimoriMatch(query, shikimoriList);
    if (best.cyrSim < 0.42 && best.bestSim < 0.55) return null;
  }

  const minScore = isCyrillic ? 0.35 : 0.38;
  if (!best || best.score < minScore) return null;

  return best.item;
}
