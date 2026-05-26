import * as jikan from './api/jikan.js';

const CHAIN_RELATIONS = new Set(['Sequel', 'Prequel', 'Parent story', 'Full story']);
const MAX_CHAIN = 10;
const MAX_FETCH = 12;

function normalizeGroups(groups) {
  return groups ?? [];
}

function entriesFromGroups(groups) {
  const out = [];
  for (const g of normalizeGroups(groups)) {
    for (const e of g.entry ?? []) {
      if (e.type === 'anime' && e.mal_id) out.push(e.mal_id);
    }
  }
  return out;
}

async function getRelations(malId, preloaded) {
  if (preloaded) return normalizeGroups(preloaded);
  return jikan.getAnimeRelations(malId);
}

/** Лише сезонна гілка (sequel / prequel) */
async function collectChainIds(rootMalId, rootRelations = null) {
  const chain = new Set([rootMalId]);
  const queue = [rootMalId];
  const preloaded = new Map();
  if (rootRelations) preloaded.set(rootMalId, rootRelations);

  while (queue.length > 0 && chain.size < MAX_CHAIN) {
    const id = queue.shift();
    const groups = await getRelations(id, preloaded.get(id));

    for (const g of groups) {
      if (!CHAIN_RELATIONS.has(g.relation)) continue;
      for (const e of g.entry ?? []) {
        if (e.type !== 'anime' || !e.mal_id || chain.has(e.mal_id)) continue;
        chain.add(e.mal_id);
        queue.push(e.mal_id);
      }
    }
  }

  return [...chain];
}

/** Кандидати на фільми — усі anime-зв'язки від сезонної гілки */
async function collectMovieCandidateIds(chainIds, rootMalId, rootRelations = null) {
  const preloaded = new Map();
  if (rootRelations) preloaded.set(rootMalId, rootRelations);

  const ids = new Set();
  for (const id of chainIds) {
    const groups = await getRelations(id, preloaded.get(id));
    for (const malId of entriesFromGroups(groups)) ids.add(malId);
  }
  return [...ids];
}

function isSeasonType(type) {
  const t = (type ?? '').toUpperCase();
  return t === 'TV' || t === 'ONA';
}

function isMovieType(type) {
  return (type ?? '').toUpperCase() === 'MOVIE';
}

/**
 * @param {number} rootMalId
 * @param {object|null} rootFull — /full уже завантажено (relations всередині)
 */
export async function getFranchiseStats(rootMalId, rootFull = null) {
  const rootRelations = rootFull?.relations ?? null;
  const chainIds = await collectChainIds(rootMalId, rootRelations);
  const candidateIds = await collectMovieCandidateIds(chainIds, rootMalId, rootRelations);

  const toFetch = [...new Set([...chainIds, ...candidateIds])].slice(0, MAX_FETCH);
  const details = (await jikan.getAnimeBriefBatch(toFetch)).filter(Boolean);

  const chainSet = new Set(chainIds);
  const seasons = details.filter((d) => chainSet.has(d.mal_id) && isSeasonType(d.type));
  const movies = details.filter((d) => isMovieType(d.type));

  let totalEpisodes = 0;
  let unknownEpisodes = false;

  for (const s of seasons) {
    if (s.episodes != null && s.episodes > 0) totalEpisodes += s.episodes;
    else unknownEpisodes = true;
  }

  if (seasons.length === 0) {
    const root = details.find((d) => d.mal_id === rootMalId);
    if (root && isSeasonType(root.type) && root.episodes > 0) {
      return {
        totalEpisodes: root.episodes,
        seasonCount: 1,
        movieCount: movies.length,
        partialEpisodes: false,
      };
    }
  }

  return {
    totalEpisodes: unknownEpisodes && totalEpisodes === 0 ? null : totalEpisodes,
    seasonCount: seasons.length || (chainIds.length ? 1 : 0),
    movieCount: movies.length,
    partialEpisodes: unknownEpisodes && totalEpisodes > 0,
  };
}
