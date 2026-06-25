import { useState, useEffect, useRef } from 'react';
import { 
  searchMovies, 
  getGenreList, 
  getMoviesByGenre, 
  getPopularMovies,
  searchTVShows,
  getTVGenreList,
  getTVShowsByGenre,
  getPopularTVShows
} from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';

export default function Explore() {
  const [exploreType, setExploreType] = useState('movie'); // 'movie' or 'tv'
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null); // null means "All"
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Infinite Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const sentinelRef = useRef();

  // Fetch genres list depending on type
  useEffect(() => {
    async function loadGenres() {
      try {
        const response = exploreType === 'movie' 
          ? await getGenreList() 
          : await getTVGenreList();
        setGenres(response.genres || []);
        setSelectedGenre(null); // Reset active genre chip on switch
      } catch (err) {
        console.error('Error loading genres:', err);
      }
    }
    loadGenres();
  }, [exploreType]);

  // Debounce search query input (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(handler);
  }, [query]);

  // Reset pagination when search query, genre chip, or media type changes
  useEffect(() => {
    setPage(1);
    setMovies([]);
    setHasMore(true);
  }, [debouncedQuery, selectedGenre, exploreType]);

  // Fetch movies effect (triggered by debouncedQuery, selectedGenre, page, or exploreType)
  useEffect(() => {
    let active = true;
 
    async function fetchMovies() {
      try {
        setLoading(true);
        setError(null);
 
        let response;
        if (debouncedQuery.trim() !== '') {
          response = exploreType === 'movie'
            ? await searchMovies(debouncedQuery, page)
            : await searchTVShows(debouncedQuery, page);
        } else if (selectedGenre) {
          response = exploreType === 'movie'
            ? await getMoviesByGenre(selectedGenre, page)
            : await getTVShowsByGenre(selectedGenre, page);
        } else {
          response = exploreType === 'movie'
            ? await getPopularMovies(page)
            : await getPopularTVShows(page);
        }
 
        if (!active) return;
 
        const results = response.results || [];
        
        // Append or replace results depending on page number
        setMovies(prev => (page === 1 ? results : [...prev, ...results]));
        
        // Check if more pages exist
        setHasMore(response.page < response.total_pages);
      } catch (err) {
        console.error('Error fetching search/explore results:', err);
        if (active) {
          setError(err.message || 'Failed to search database.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
 
    fetchMovies();
 
    return () => {
      active = false;
    };
  }, [debouncedQuery, selectedGenre, page, exploreType]);

  // Setup IntersectionObserver for infinite scroll sentinel
  useEffect(() => {
    if (loading || !hasMore) return;

    const currentSentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage(prevPage => prevPage + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [loading, hasMore]);

  const handleGenreClick = (genreId) => {
    setQuery(''); // Reset search input
    setDebouncedQuery('');
    setSelectedGenre(genreId);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedQuery(query);
  };

  return (
    <div className="bg-level-0 min-h-screen pt-28 pb-16 page-transition">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        
        {/* Search Header & Input */}
        <div className="w-full max-w-3xl mx-auto mb-stack-lg flex flex-col items-center">
          <h1 className="text-headline-lg font-headline-lg text-on-surface mb-stack-md text-center">
            Discover the Cinematic Universe
          </h1>
          <form onSubmit={handleSearchSubmit} className="relative w-full group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary-container transition-colors z-10">
              search
            </span>
            <input 
              className="w-full bg-[#1A1A1A] border border-outline-variant rounded-full py-4 pl-12 pr-12 text-body-lg font-body-lg text-on-surface placeholder:text-on-secondary-container transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              placeholder="Search for movies, actors, or directors..." 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                type="button"
                className="absolute right-14 top-1/2 -translate-y-1/2 text-secondary hover:text-white"
                onClick={() => { setQuery(''); setDebouncedQuery(''); }}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-container text-white rounded-full p-2.5 hover:scale-105 transition-transform flex items-center justify-center shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>
        </div>

        {/* Format Toggle Movies / TV Shows */}
        <div className="flex gap-2 bg-[#1A1A1A] p-1 rounded-full border border-white/5 w-fit mx-auto mb-8">
          <button
            onClick={() => setExploreType('movie')}
            className={`px-6 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              exploreType === 'movie' 
                ? 'bg-primary-container text-white shadow-md' 
                : 'text-secondary hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">movie</span>
            Movies
          </button>
          <button
            onClick={() => setExploreType('tv')}
            className={`px-6 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              exploreType === 'tv' 
                ? 'bg-primary-container text-white shadow-md' 
                : 'text-secondary hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">live_tv</span>
            TV Shows
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-stack-lg max-w-4xl mx-auto">
          <button 
            onClick={() => handleGenreClick(null)}
            className={`px-5 py-1.5 rounded-full text-label-md font-label-md transition-all duration-200 border cursor-pointer ${
              selectedGenre === null 
                ? 'bg-primary-container text-white border-primary-container shadow-[0_0_15px_rgba(229,9,20,0.3)]' 
                : 'border-[#A3A3A3] text-on-secondary-container hover:border-white hover:text-white'
            }`}
          >
            All
          </button>
          {genres.slice(0, 12).map((genre) => (
            <button 
              key={genre.id}
              onClick={() => handleGenreClick(genre.id)}
              className={`px-5 py-1.5 rounded-full text-label-md font-label-md transition-all duration-200 border cursor-pointer ${
                selectedGenre === genre.id 
                  ? 'bg-primary-container text-white border-primary-container shadow-[0_0_15px_rgba(229,9,20,0.3)]' 
                  : 'border-[#A3A3A3] text-on-secondary-container hover:border-white hover:text-white'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-end mb-stack-md border-b border-outline-variant/20 pb-2">
          <h2 className="text-headline-md font-headline-md text-on-surface">
            {debouncedQuery ? 'Search Results' : exploreType === 'movie' ? 'Explore Movies' : 'Explore TV Shows'}
          </h2>
          <span className="text-label-md font-label-md text-secondary">
            {debouncedQuery 
              ? `Showing results for "${debouncedQuery}"` 
              : selectedGenre
                ? `Showing matches in genre`
                : 'Popular Recommendations'
            }
          </span>
        </div>

        {/* Error State */}
        {error && <ErrorDisplay error={error} retryAction={() => setPage(1)} />}

        {/* Movie Grid */}
        {!error && (
          <>
            {movies.length === 0 && !loading ? (
              /* Empty State */
              <div className="w-full flex flex-col items-center justify-center py-16 mt-stack-lg border-t border-outline-variant/10">
                <div className="relative w-24 h-24 mb-4 opacity-40">
                  <span className="material-symbols-outlined text-[90px] text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    movie_filter
                  </span>
                </div>
                <h3 className="text-headline-md font-headline-md text-on-surface mb-2">No results found</h3>
                <p className="text-body-md font-body-md text-secondary text-center max-w-md">
                  We couldn't find any matches. Try adjusting your search query or selecting a different genre.
                </p>
              </div>
            ) : (
              /* Results Grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-gutter mb-stack-lg">
                {movies.map((movie, index) => (
                  <MovieCard key={movie.id} movie={movie} showRating={true} index={index} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Skeletons while loading page */}
        {loading && <SkeletonLoader type="card-grid" count={4} />}

        {/* Infinite Scroll Sentinel */}
        <div ref={sentinelRef} className="h-10 w-full" />

      </main>
    </div>
  );
}
