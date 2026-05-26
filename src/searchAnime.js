import * as jikan from './api/jikan.js';
import * as anilist from './api/anilist.js';
import * as shikimori from './api/shikimori.js';
import { pickBestMatch, pickShikimoriMatch } from './fuzzy.js';
import { resolveAliasMalId } from './aliases.js';
import { resolveRomajiQuery, isLikelyRomaji, romajiFromShikimori } from './romajiSearch.js';

const CYRILLIC = /[а-яА-Яіїєґёъыэ]/;

function hasCyrillic(text) {
  return CYRILLIC.test(text);
}

async function buildMatchFromMalId(malId) {
  const brief = await jikan.getAnimeBrief(malId);
  if (!brief) return { mal_id: malId, title: `MAL #${malId}` };
  return {
    mal_id: malId,
    title: brief.title,
    title_english: brief.title_english,
    title_japanese: brief.title_japanese,
    titles: brief.titles?.map((x) => x.title) ?? [],
    score: brief.score,
    episodes: brief.episodes,
    status: brief.status,
    source: 'alias',
  };
}

/** Пошук на MAL за romaji (+ збіг з оригінальним запитом) */
async function searchByRomaji(romaji, originalQuery, shikiResults = null) {
  const shiki = shikiResults ?? (await shikimori.searchAnime(romaji));
  const [jikanResults, anilistResults] = await Promise.all([
    jikan.searchAnime(romaji),
    anilist.searchAnime(romaji),
  ]);
  const cyrillic = hasCyrillic(originalQuery);
  return pickBestMatch(originalQuery, jikanResults, anilistResults, shiki, cyrillic);
}

/** uk/ru: alias → Shikimori → romaji → MAL */
async function runSearchCyrillic(trimmed) {
  const aliasId = resolveAliasMalId(trimmed);
  if (aliasId) return buildMatchFromMalId(aliasId);

  const shikiResults = await shikimori.searchAnime(trimmed);
  const shikiPick = pickShikimoriMatch(trimmed, shikiResults);
  if (shikiPick) return shikiPick;

  const romaji = romajiFromShikimori(shikiResults) ?? (await resolveRomajiQuery(trimmed, 'uk'));
  if (romaji) {
    const match = await searchByRomaji(romaji, trimmed, shikiResults);
    if (match) return match;
  }

  if (shikiResults.length > 0) {
    return pickShikimoriMatch(trimmed, shikiResults) ?? shikiResults[0];
  }

  return null;
}

/** Латиниця: прямий пошук → Shikimori → romaji → MAL */
async function runSearchLatin(trimmed, userLang) {
  const shikiFirst = await shikimori.searchAnime(trimmed);
  const romajiDirect = romajiFromShikimori(shikiFirst);

  if (romajiDirect && !isLikelyRomaji(trimmed)) {
    const viaRomaji = await searchByRomaji(romajiDirect, trimmed, shikiFirst);
    if (viaRomaji) return viaRomaji;
  }

  const [jikanResults, anilistResults] = await Promise.all([
    jikan.searchAnime(trimmed),
    anilist.searchAnime(trimmed),
  ]);

  let match = pickBestMatch(trimmed, jikanResults, anilistResults, shikiFirst, false);
  if (match) return match;

  const romaji = romajiDirect ?? (await resolveRomajiQuery(trimmed, userLang));
  if (romaji && romaji.toLowerCase() !== trimmed.toLowerCase()) {
    match = await searchByRomaji(romaji, trimmed);
    if (match) return match;
  }

  return pickShikimoriMatch(trimmed, shikiFirst);
}

async function runSearch(trimmed, cyrillic, userLang) {
  const aliasId = resolveAliasMalId(trimmed);
  if (aliasId) return buildMatchFromMalId(aliasId);

  if (cyrillic) return runSearchCyrillic(trimmed);
  return runSearchLatin(trimmed, userLang);
}

/**
 * Пошук: alias → Shikimori → romaji → Jikan/AniList.
 * Замість перекладу на англійську для MAL — беремо romaji з Shikimori.
 */
export async function searchAllSources(query, userLang = 'en') {
  const trimmed = query.trim();
  const cyrillic = hasCyrillic(trimmed);

  const match = await runSearch(trimmed, cyrillic, userLang);
  return { match: match?.mal_id ? match : null };
}
