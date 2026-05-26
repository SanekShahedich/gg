import { t } from './i18n.js';

function pluralSeasons(n, lang) {
  if (lang === 'uk') {
    if (n % 10 === 1 && n % 100 !== 11) return `${n} сезон`;
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return `${n} сезони`;
    return `${n} сезонів`;
  }
  if (lang === 'ru') {
    if (n % 10 === 1 && n % 100 !== 11) return `${n} сезон`;
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return `${n} сезона`;
    return `${n} сезонов`;
  }
  return n === 1 ? '1 season' : `${n} seasons`;
}

function pluralMovies(n, lang) {
  if (lang === 'uk') {
    if (n % 10 === 1 && n % 100 !== 11) return `${n} фільм`;
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return `${n} фільми`;
    return `${n} фільмів`;
  }
  if (lang === 'ru') {
    if (n % 10 === 1 && n % 100 !== 11) return `${n} фильм`;
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return `${n} фильма`;
    return `${n} фильмов`;
  }
  return n === 1 ? '1 movie' : `${n} movies`;
}

/** Рядок «серії + сезони» */
export function formatEpisodesLine(lang, stats) {
  if (!stats || stats.seasonCount === 0) {
    return t(lang, 'episodesUnknown');
  }

  const eps =
    stats.totalEpisodes != null && stats.totalEpisodes > 0
      ? String(stats.totalEpisodes)
      : t(lang, 'episodesUnknown');

  const seasons =
    stats.seasonCount > 0 ? ` (${pluralSeasons(stats.seasonCount, lang)})` : '';

  return `${eps}${seasons}`;
}

/** Рядок про фільми або null, якщо фільмів немає */
export function formatMoviesLine(lang, stats) {
  if (!stats || stats.movieCount <= 0) return null;
  return pluralMovies(stats.movieCount, lang);
}
