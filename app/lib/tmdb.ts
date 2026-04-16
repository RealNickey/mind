export const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
  genre_ids: number[];
  runtime?: number;
}

export interface TMDBShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  overview: string;
  first_air_date: string;
  number_of_seasons?: number;
}

export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB Movie Search Error:', error);
    return [];
  }
}

export async function getMovieDetails(id: number): Promise<TMDBMovie | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('TMDB Movie Details Error:', error);
    return null;
  }
}

export async function searchTVShows(query: string): Promise<TMDBShow[]> {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(`${BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB TV Search Error:', error);
    return [];
  }
}

export async function getTVShowDetails(id: number): Promise<TMDBShow | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(`${BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('TMDB TV Details Error:', error);
    return null;
  }
}
