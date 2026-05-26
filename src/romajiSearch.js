import * as shikimori from './api/shikimori.js';
import { translateText } from './translate.js';

/** Чи схоже на romaji / латиницю (без кирилиці) */
export function isLikelyRomaji(text) {
  const s = text?.trim();
  if (!s) return false;
  if (/[а-яА-Яіїєґёъыэ\u3040-\u30ff\u4e00-\u9fff]/.test(s)) return false;
  return /[a-z]/i.test(s);
}

/** У Shikimori поле name — це romaji для MAL */
export function romajiFromShikimori(results) {
  if (!results?.length) return null;
  const name = results[0].title?.trim();
  return name && isLikelyRomaji(name) ? name : null;
}

/**
 * Знайти romaji-назву для пошуку на MAL.
 * Англійський переклад у Jikan не використовуємо — лише romaji з Shikimori.
 */
export async function resolveRomajiQuery(query, userLang) {
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (isLikelyRomaji(trimmed)) return trimmed;

  let shiki = await shikimori.searchAnime(trimmed);
  let romaji = romajiFromShikimori(shiki);
  if (romaji) return romaji;

  const bridges = [];
  if (userLang === 'uk' || userLang === 'ru') bridges.push('ru');
  if (userLang !== 'en') bridges.push('en');

  for (const lang of bridges) {
    const bridged = await translateText(trimmed, userLang, lang);
    if (!bridged || bridged.toLowerCase() === trimmed.toLowerCase()) continue;
    shiki = await shikimori.searchAnime(bridged);
    romaji = romajiFromShikimori(shiki);
    if (romaji) return romaji;
  }

  return null;
}
