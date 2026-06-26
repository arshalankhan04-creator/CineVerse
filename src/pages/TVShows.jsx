import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getTrendingTVShows, 
  getPopularTVShows, 
  getTopRatedTVShows, 
  getGenreList,
  getMovieBackdropUrl 
} from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';

export default function TVShows() {
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [genresMap, setGenresMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // Load genres
        const genresResponse = await getGenreList();
        const gMap = {};
        genresResponse.genres.forEach(g => {
          gMap[g.id] = g.name;
        });
        setGenresMap(gMap);

        // Fetch TV Shows
        const [trendingRes, popularRes, topRatedRes] = await Promise.all([
          getTrendingTVShows(),
          getPopularTVShows(),
          getTopRatedTVShows()
        ]);

        setTrending(trendingRes.results || []);
        setPopular(popularRes.results || []);
        setTopRated(topRatedRes.results || []);
      } catch (err) {
        console.error('Error fetching TV shows data:', err);
        setError(err.message || 'Failed to load TV collections.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-rotate hero slider every 5 seconds
  useEffect(() => {
    if (trending.length === 0) return;
    const maxIndex = Math.min(5, trending.length);
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % maxIndex);
    }, 5000);
    return () => clearInterval(timer);
  }, [trending]);

  const handlePrevHero = (e) => {
    e.stopPropagation();
    const maxIndex = Math.min(5, trending.length);
    setActiveHeroIndex((prev) => (prev === 0 ? maxIndex - 1 : prev - 1));
  };

  const handleNextHero = (e) => {
    e.stopPropagation();
    const maxIndex = Math.min(5, trending.length);
    setActiveHeroIndex((prev) => (prev + 1) % maxIndex);
  };

  if (error) {
    return <ErrorDisplay error={error} retryAction={() => window.location.reload()} />;
  }

  return (
    <div className="bg-level-0 min-h-screen flex flex-col page-transition">
      {loading ? (
        <div className="flex flex-col gap-8 pb-12">
          <SkeletonLoader type="hero" />
          <div className="px-6 md:px-margin-desktop max-w-container-max mx-auto w-full flex flex-col gap-8">
            <SkeletonLoader type="row" count={6} />
            <SkeletonLoader type="row" count={6} />
          </div>
        </div>
      ) : (
        <>
          {/* Rotating Hero Banner */}
          {trending.length > 0 && (
            <header className="relative w-full h-screen min-h-[550px] overflow-hidden flex items-end">
              {trending.slice(0, 5).map((show, idx) => {
                const heroGenres = show.genre_ids
                  ? show.genre_ids.map(id => genresMap[id]).filter(Boolean).slice(0, 2).join(' / ')
                  : 'TV Show';
                const heroYear = show.first_air_date 
                  ? new Date(show.first_air_date).getFullYear() 
                  : 'N/A';

                return (
                  <div
                    key={show.id}
                    className={`absolute inset-0 transition-opacity duration-1000 flex items-end ${
                      idx === activeHeroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    {/* Backdrop */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center w-full h-full"
                      style={{ backgroundImage: `url(${getMovieBackdropUrl(show.backdrop_path)})` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/55 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-black/20 z-10"></div>

                    {/* Content */}
                    <div className="relative z-20 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-[60px] md:pb-[80px]">
                      <div className="max-w-2xl flex flex-col gap-stack-md">
                        <h1 className="font-display-lg text-[40px] md:text-display-lg font-extrabold text-on-background leading-tight drop-shadow-md">
                          {show.name || show.title}
                        </h1>
                        
                        <div className="flex items-center gap-stack-md text-label-md font-label-md text-on-surface">
                          <span className="flex items-center gap-1 text-tertiary">
                            <span className="material-symbols-outlined text-[18px] filled-icon">star</span>
                            {show.vote_average?.toFixed(1) || 'N/A'}
                          </span>
                          <span className="text-on-surface-variant">•</span>
                          <span className="px-3 py-0.5 rounded-full border border-outline-variant/50 bg-surface-container/30 backdrop-blur-sm">
                            {heroGenres}
                          </span>
                          <span className="text-on-surface-variant">•</span>
                          <span className="text-on-surface-variant">{heroYear}</span>
                        </div>
                        
                        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3 md:line-clamp-none max-w-xl">
                          {show.overview}
                        </p>
                        
                        <div className="mt-stack-sm">
                          <button 
                            onClick={() => navigate(`/tv/${show.id}`)}
                            className="bg-primary-container text-on-primary-container font-label-md text-label-md px-8 py-3 rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_4px_14px_rgba(229,9,20,0.4)] cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Prev / Next controls */}
              <button 
                onClick={handlePrevHero}
                className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-2xl border border-white/10"
                aria-label="Previous Hero"
              >
                <span className="material-symbols-outlined text-[24px] md:text-[28px] select-none">chevron_left</span>
              </button>
              <button 
                onClick={handleNextHero}
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-2xl border border-white/10"
                aria-label="Next Hero"
              >
                <span className="material-symbols-outlined text-[24px] md:text-[28px] select-none">chevron_right</span>
              </button>

              {/* Slider Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {trending.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveHeroIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === activeHeroIndex ? 'w-8 bg-primary-container' : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  ></button>
                ))}
              </div>
            </header>
          )}

          {/* Main Content Rows */}
          <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-[48px] md:gap-[64px] relative z-20 -mt-[30px]">
            
            {/* Trending Now */}
            <section className="flex flex-col gap-stack-md">
              <h2 className="font-headline-md text-headline-md text-on-background px-1 border-l-4 border-primary-container pl-3 select-none">
                Trending TV Shows
              </h2>
              <div className="flex overflow-x-auto gap-stack-md pt-4 pb-4 snap-x snap-mandatory scrollbar-hide px-1">
                {trending.map((show, index) => (
                  <div key={show.id} className="flex-none w-[140px] md:w-[200px] snap-start">
                    <MovieCard movie={show} showRating={false} index={index} />
                  </div>
                ))}
              </div>
            </section>

            {/* Popular TV Shows */}
            <section className="flex flex-col gap-stack-md">
              <h2 className="font-headline-md text-headline-md text-on-background px-1 border-l-4 border-primary-container pl-3 select-none">
                Popular TV Shows
              </h2>
              <div className="flex overflow-x-auto gap-stack-md pt-4 pb-4 snap-x snap-mandatory scrollbar-hide px-1">
                {popular.map((show, index) => (
                  <div key={show.id} className="flex-none w-[140px] md:w-[200px] snap-start">
                    <MovieCard movie={show} showRating={false} index={index} />
                  </div>
                ))}
              </div>
            </section>

            {/* Top Rated */}
            <section className="flex flex-col gap-stack-md">
              <h2 className="font-headline-md text-headline-md text-on-background px-1 border-l-4 border-primary-container pl-3 select-none">
                Top Rated TV Shows
              </h2>
              <div className="flex overflow-x-auto gap-stack-md pt-4 pb-4 snap-x snap-mandatory scrollbar-hide px-1">
                {topRated.map((show, index) => (
                  <div key={show.id} className="flex-none w-[140px] md:w-[200px] snap-start">
                    <MovieCard movie={show} showRating={false} index={index} />
                  </div>
                ))}
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
}
