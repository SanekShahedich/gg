import * as jikan from './api/jikan.js';
import * as anilist from './api/anilist.js';
import * as shikimori from './api/shikimori.js';
import { searchAllSources } from './searchAnime.js';
import { detectLanguage } from './language.js';
import { t, statusLabel } from './i18n.js';
import { getFranchiseStats } from './franchiseStats.js';
import { formatEpisodesLine, formatMoviesLine } from './episodeFormat.js';
import {
  translateToUserLang,
  needsTranslation,
  uiLang,
} from './translate.js';

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function truncate(text, max = 900) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function pickRomaji(malFull, match) {
  return (
    match?.title_romaji_anilist ??
    malFull?.title ??
    match?.title ??
    malFull?.title_english ??
    match?.title_english ??
    ''
  );
}

function formatTitle(lang, malFull, match, query) {
  const romaji = pickRomaji(malFull, match);
  const english = malFull?.title_english ?? match?.title_english ?? match?.title_english_anilist;
  const defaultTitle = malFull?.title ?? match?.title ?? romaji;

  let display = defaultTitle;
  if (lang === 'uk' || lang === 'ru') {
    const fromSynonyms = (malFull?.titles ?? [])
      .map((x) => x.title)
      .find((t) => /[а-яА-Яіїєґёъыэ]/i.test(t));
    const fromMatch = match?.russian ?? match?.titles?.find((t) => /[а-яА-Яіїєґёъыэ]/i.test(t));
    if (fromSynonyms) display = fromSynonyms;
    else if (fromMatch) display = fromMatch;
    else if (english && /[a-z]/i.test(query)) display = english;
    else display = romaji || defaultTitle;
  } else {
    display = english || defaultTitle || romaji;
  }

  if (romaji && normalizeForCompare(display) !== normalizeForCompare(romaji)) {
    return `${display} (${romaji})`;
  }
  return display;
}

function normalizeForCompare(s) {
  return (s ?? '').toLowerCase().replace(/\s+/g, '');
}

async function localizeTitle(titleLine, lang) {
  if (lang === 'en' || !titleLine) return titleLine;
  const main = titleLine.replace(/\s*\([^)]+\)\s*$/, '').trim();
  const romajiMatch = titleLine.match(/\(([^)]+)\)\s*$/);
  const romaji = romajiMatch?.[1];

  if (!needsTranslation(main, lang)) return titleLine;

  const translated = await translateToUserLang(main, lang);
  if (!translated || translated === main) return titleLine;
  return romaji ? `${translated} (${romaji})` : translated;
}

async function localizeDescription(description, lang, shikiDesc) {
  if (lang === 'uk' || lang === 'ru') {
    if (shikiDesc && /[а-яА-Яіїєґёъыэ]/.test(shikiDesc)) return shikiDesc;
    if (description && /[а-яА-Яіїєґёъыэ]/.test(description)) return description;
  }
  if (!description || lang === 'en') return description;
  if (!needsTranslation(description, lang)) return description;
  const translated = await translateToUserLang(description, lang);
  return translated || description;
}

function pickRating(malFull, match, anilistMedia) {
  const mal = malFull?.score ?? match?.score;
  const ani = anilistMedia?.averageScore ?? match?.anilist_score;
  if (mal != null && mal > 0) return `${mal}/10 (MAL)`;
  if (ani != null && ani > 0) return `${(ani / 10).toFixed(2)}/10 (AniList)`;
  return null;
}

function pickDescription(malFull, anilistMedia, match) {
  const malSyn = stripHtml(malFull?.synopsis ?? match?.synopsis);
  const aniDesc = stripHtml(anilistMedia?.description ?? match?.anilist_description);
  return malSyn || aniDesc || '';
}

export async function lookupAnime(query) {
  const lang = detectLanguage(query);
  const labels = uiLang(lang);
  const trimmed = query.trim();

  const { match } = await searchAllSources(trimmed, lang);
  if (!match?.mal_id) {
    return { ok: false, lang, reason: 'not_found' };
  }

  const needShikiDesc = lang === 'uk' || lang === 'ru';

  const malFullPromise = jikan.getAnimeFull(match.mal_id);

  const [malFull, anilistMedia, franchiseStats, shikiDesc] = await Promise.all([
    malFullPromise,
    anilist.getByMalId(match.mal_id),
    malFullPromise.then((full) => getFranchiseStats(match.mal_id, full)),
    needShikiDesc
      ? shikimori.getDescriptionByMalId(match.mal_id, match.russian ?? match.title ?? trimmed)
      : Promise.resolve(null),
  ]);

  let titleLine = formatTitle(lang, malFull, match, trimmed);
  titleLine = await localizeTitle(titleLine, lang);

  const status = statusLabel(
    labels,
    malFull?.status ?? match?.status,
    anilistMedia?.status ?? match?.anilist_status,
  );
  const rating = pickRating(malFull, match, anilistMedia);
  let episodesLine = formatEpisodesLine(labels, franchiseStats);
  let moviesLine = formatMoviesLine(labels, franchiseStats);

  if (franchiseStats.seasonCount === 0) {
    const eps =
      malFull?.episodes ?? match?.episodes ?? anilistMedia?.episodes ?? match?.anilist_episodes;
    if (eps != null && eps > 0) episodesLine = String(eps);
  }

  const rootIsMovie = (malFull?.type ?? '').toUpperCase() === 'MOVIE';
  if (rootIsMovie && franchiseStats.movieCount <= 1) moviesLine = null;

  let description = pickDescription(malFull, anilistMedia, match);
  description = await localizeDescription(description, lang, shikiDesc);
  description = truncate(description);

  const message = formatMessage(labels, {
    titleLine,
    status,
    rating,
    episodesLine,
    moviesLine,
    description,
  });

  return { ok: true, lang, message, malId: match.mal_id, titleLine };
}

function formatMessage(lang, { titleLine, status, rating, episodesLine, moviesLine, description }) {
  const ratingStr = rating ?? t(lang, 'noRating');
  const descStr = description || t(lang, 'noDescription');

  let block =
    `<b>${escapeHtml(titleLine)}</b>\n\n` +
    `📊 <b>${t(lang, 'status')}:</b> ${escapeHtml(status)}\n` +
    `⭐ <b>${t(lang, 'rating')}:</b> ${escapeHtml(ratingStr)}\n` +
    `📺 <b>${t(lang, 'episodes')}:</b> ${escapeHtml(episodesLine)}`;

  if (moviesLine) {
    block += `\n🎬 <b>${t(lang, 'movies')}:</b> ${escapeHtml(moviesLine)}`;
  }

  block += `\n\n📝 <b>${t(lang, 'description')}:</b>\n${escapeHtml(descStr)}`;
  return block;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
