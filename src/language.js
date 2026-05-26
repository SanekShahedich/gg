import { franc } from 'franc-min';

const FRANC_MAP = {
  ukr: 'uk',
  rus: 'ru',
  eng: 'en',
  deu: 'de',
  fra: 'fr',
  spa: 'es',
  ita: 'it',
  pol: 'pl',
  por: 'pt',
  nld: 'nl',
  tur: 'tr',
  jpn: 'ja',
  kor: 'ko',
  cmn: 'zh',
  zho: 'zh',
};

/** Визначає мову запиту користувача */
export function detectLanguage(text) {
  const sample = text.trim();
  if (!sample) return 'en';

  if (/[іїєґ]/i.test(sample)) return 'uk';
  if (/[ёъыэ]/i.test(sample)) return 'ru';
  if (/[а-яА-Я]/.test(sample) && !/[іїєґ]/i.test(sample)) return 'ru';

  const iso = franc(sample, { minLength: 2 });
  return FRANC_MAP[iso] ?? 'en';
}
