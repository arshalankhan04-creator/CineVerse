async function fetchFromTMDB(endpoint, queryParams = {}) {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    // In local development, fetch directly from TMDB to bypass Node network restrictions.
    // The API key is visible in local dev tools, but it's safe because it's only on your local machine.
    const API_BASE = 'https://api.themoviedb.org/3';
    const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || import.meta.env.REACT_APP_TMDB_KEY;
    const allParams = { api_key: TMDB_KEY, ...queryParams };
    const queryString = new URLSearchParams(allParams).toString();
    const url = `${API_BASE}${endpoint}?${queryString}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.status_message || errData.error || `API request failed with status ${response.status}`);
    }
    return response.json();
  } else {
    // In production (Vercel), route through the serverless function to keep the API key hidden.
    const allParams = { endpoint, ...queryParams };
    const queryString = new URLSearchParams(allParams).toString();
    const url = `/api/tmdb?${queryString}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.status_message || errData.error || `API request failed with status ${response.status}`);
    }
    return response.json();
  }
}

export const getPopularMovies = (page = 1) => fetchFromTMDB('/movie/popular', { page });
export const getTrendingMovies = () => fetchFromTMDB('/trending/movie/week');
export const getTopRatedMovies = () => fetchFromTMDB('/movie/top_rated');
export const searchMovies = (query, page = 1) => fetchFromTMDB('/search/movie', { query, page });
export const searchMulti = (query, page = 1) => fetchFromTMDB('/search/multi', { query, page });
export const getGenreList = () => fetchFromTMDB('/genre/movie/list');
export const getMoviesByGenre = (genreId, page = 1) => fetchFromTMDB('/discover/movie', { with_genres: genreId, page });
export const getMovieDetails = (id) => fetchFromTMDB(`/movie/${id}`);
export const getMovieCredits = (id) => fetchFromTMDB(`/movie/${id}/credits`);
export const getMovieVideos = (id) => fetchFromTMDB(`/movie/${id}/videos`);

// TV Show Endpoints
export const getPopularTVShows = (page = 1) => fetchFromTMDB('/tv/popular', { page });
export const getTrendingTVShows = () => fetchFromTMDB('/trending/tv/week');
export const getTopRatedTVShows = () => fetchFromTMDB('/tv/top_rated');
export const getTVShowDetails = (id) => fetchFromTMDB(`/tv/${id}`);
export const getTVShowCredits = (id) => fetchFromTMDB(`/tv/${id}/credits`);
export const getTVShowVideos = (id) => fetchFromTMDB(`/tv/${id}/videos`);
export const searchTVShows = (query, page = 1) => fetchFromTMDB('/search/tv', { query, page });
export const getTVGenreList = () => fetchFromTMDB('/genre/tv/list');
export const getTVShowsByGenre = (genreId, page = 1) => fetchFromTMDB('/discover/tv', { with_genres: genreId, page });

// Person Endpoints
export const getPersonDetails = (id) => fetchFromTMDB(`/person/${id}`);
export const getPersonCredits = (id) => fetchFromTMDB(`/person/${id}/combined_credits`);

// Discovery Endpoints
export const discoverMovies = (queryParams = {}) => fetchFromTMDB('/discover/movie', queryParams);
export const discoverTVShows = (queryParams = {}) => fetchFromTMDB('/discover/tv', queryParams);

// Recommendations
export const getMovieRecommendations = (id) => fetchFromTMDB(`/movie/${id}/recommendations`);
export const getTVShowRecommendations = (id) => fetchFromTMDB(`/tv/${id}/recommendations`);

// Images
export const getMovieImages = (id) => fetchFromTMDB(`/movie/${id}/images`);
export const getTVShowImages = (id) => fetchFromTMDB(`/tv/${id}/images`);

// Reviews
export const getMovieReviews = (id) => fetchFromTMDB(`/movie/${id}/reviews`);
export const getTVShowReviews = (id) => fetchFromTMDB(`/tv/${id}/reviews`);

// Upcoming/Air
export const getUpcomingMovies = () => fetchFromTMDB('/movie/upcoming');
export const getUpcomingTVShows = () => fetchFromTMDB('/tv/on_the_air');

export const getMoviePosterUrl = (path) => 
  path ? `https://image.tmdb.org/t/p/w500${path}` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop';

export const getMovieBackdropUrl = (path) => 
  path ? `https://image.tmdb.org/t/p/original${path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop';

export const getPersonProfileUrl = (path) =>
  path ? `https://image.tmdb.org/t/p/w342${path}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';

