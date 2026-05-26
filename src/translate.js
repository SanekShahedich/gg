import { franc } from 'franc-min';

const API = 'https://api.mymemory.translated.net/get';
const cache = new Map();
const CHUNK = 420;

/** Коди мов для MyMemory */
export const LANG_CODES = {
  uk: 'uk',
  ru: 'ru',
  en: 'en',
  de: 'de',
  fr: 'fr',
  es: 'es',
  it: 'it',
  pl: 'pl',
  pt: 'pt',
  nl: 'nl',
  tr: 'tr',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh-CN',
};

function apiLang(code) {
  return LANG_CODES[code] ?? code;
}

function cacheKey(text, from, to) {
  return `${from}|${to}|${text.slice(0, 120)}`;
}

async function callApi(text, from, to) {
  const pair = `${apiLang(from)}|${apiLang(to)}`;
  const url = `${API}?q=${encodeURIComponent(text)}&langpair=${pair}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  const json = await res.json();
  const out = json?.responseData?.translatedText?.trim();
  if (!out || /MYMEMORY WARNING/i.test(out)) return null;
  return out;
}

/** Переклад короткого або довгого тексту */
export async function translateText(text, fromLang, toLang) {
  const raw = text?.trim();
  if (!raw || fromLang === toLang) return text;

  const from = fromLang in LANG_CODES ? fromLang : 'en';
  const to = toLang in LANG_CODES ? toLang : 'en';
  if (from === to) return text;

  if (raw.length <= CHUNK) {
    const key = cacheKey(raw, from, to);
    if (cache.has(key)) return cache.get(key);
    const t = await callApi(raw, from, to);
    if (t) cache.set(key, t);
    return t ?? text;
  }

  const parts = splitChunks(raw, CHUNK);
  const translated = [];
  for (const part of parts) {
    const t = await translateText(part, from, to);
    translated.push(t);
  }
  return translated.join(' ');
}

function splitChunks(text, size) {
  const parts = [];
  let rest = text;
  while (rest.length > size) {
    let cut = rest.lastIndexOf('. ', size);
    if (cut < size * 0.4) cut = rest.lastIndexOf(' ', size);
    if (cut < 1) cut = size;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

export async function translateToEnglish(text, sourceLang) {
  if (!text?.trim()) return text;
  if (sourceLang === 'en') return text;
  return translateText(text, sourceLang, 'en');
}

export async function translateToUserLang(text, userLang) {
  if (!text?.trim() || userLang === 'en') return text;
  return translateText(text, 'en', userLang);
}

/** Чи потрібно перекладати опис на мову користувача */
export function needsTranslation(text, targetLang) {
  if (!text?.trim() || targetLang === 'en') return false;

  if (targetLang === 'uk' || targetLang === 'ru') {
    return !/[а-яА-Яіїєґёъыэ]/.test(text);
  }

  const sample = text.slice(0, 400);
  const detected = franc(sample, { minLength: 12 });
  const want = { de: 'deu', fr: 'fra', es: 'spa', it: 'ita', pl: 'pol', pt: 'por' }[targetLang];
  if (want) return detected !== want;
  return detected === 'eng';
}

/** UI-мова для i18n (uk/ru/en) */
export function uiLang(userLang) {
  if (userLang === 'uk' || userLang === 'ru' || userLang === 'en') return userLang;
  return 'en';
}
