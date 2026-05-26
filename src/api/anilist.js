const ENDPOINT = 'https://graphql.anilist.co';

const SEARCH_QUERY = `
  query ($search: String) {
    Page(perPage: 15) {
      media(search: $search, type: ANIME, isAdult: false) {
        id
        idMal
        title { romaji english native }
        status
        episodes
        averageScore
        description(asHtml: false)
        synonyms
      }
    }
  }
`;

async function gql(query, variables) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

/** Пошук на AniList (друге надійне джерело) */
export async function searchAnime(query) {
  const data = await gql(SEARCH_QUERY, { search: query.trim() });
  return data?.Page?.media ?? [];
}

/** Опис з AniList за MAL id */
export async function getByMalId(malId) {
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        id
        idMal
        title { romaji english native }
        status
        episodes
        averageScore
        description(asHtml: false)
        synonyms
      }
    }
  `;
  const data = await gql(query, { idMal: malId });
  return data?.Media ?? null;
}
