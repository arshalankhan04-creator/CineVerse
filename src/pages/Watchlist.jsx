import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { useAuth } from '../context/AuthContext';

export default function Watchlist() {
  const navigate = useNavigate();
  const { user, watchlist, toggleWatchlist, setAuthModalOpen } = useAuth();

  // Normalize movie structure to support both local storage and database formats
  const normalizedWatchlist = watchlist.map(movie => ({
    ...movie,
    id: movie.id || movie.tmdbId,
    title: movie.title || movie.name,
    name: movie.name || movie.title,
    poster_path: movie.poster_path || movie.posterPath,
    vote_average: movie.vote_average || movie.rating,
    media_type: movie.media_type || movie.mediaType
  }));

  const handleRemove = (e, movie) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(movie);
  };

  return (
    <div className="bg-level-0 min-h-screen pt-28 pb-16 page-transition">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex-grow">
        
        <header className="mb-stack-lg relative">
          <h1 className="text-headline-lg font-headline-lg md:text-display-lg md:font-display-lg font-extrabold text-on-background tracking-tight">
            My Watchlist
          </h1>
          <p className="text-body-lg font-body-lg text-secondary mt-stack-sm max-w-2xl leading-relaxed">
            Your personal curation of cinematic masterpieces. Films you've saved for the perfect viewing experience.
          </p>

          {/* Sync prompt for logged-out users */}
          {!user && watchlist.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-primary-container/10 border border-primary-container/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container text-[22px]">cloud_upload</span>
                <p className="text-xs font-semibold text-secondary">
                  You are viewing your offline watchlist. <button onClick={() => setAuthModalOpen(true)} className="text-primary-container hover:underline font-bold">Sign In</button> to back up and sync your list to the cloud database!
                </p>
              </div>
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-primary-container text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_10px_rgba(229,9,20,0.15)] cursor-pointer self-start sm:self-auto"
              >
                Sync Watchlist
              </button>
            </div>
          )}
        </header>

        {normalizedWatchlist.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 mt-stack-lg text-center glass-panel rounded-xl p-8 max-w-2xl mx-auto border-dashed border-2 border-outline-variant/30">
            <span className="material-symbols-outlined text-[64px] text-secondary mb-4 opacity-50">movie</span>
            <h2 className="text-headline-md font-headline-md font-bold text-on-background mb-2">
              Your watchlist is empty
            </h2>
            <p className="text-body-md font-body-md text-secondary mb-6 max-w-sm">
              Start exploring to save your favorites and build your ultimate watch queue!
            </p>
            <button 
              onClick={() => navigate('/')}
              className="bg-primary-container text-white px-8 py-3 rounded-full font-label-md text-label-md font-bold hover:scale-105 transition-transform duration-200 shadow-[0_4px_14px_rgba(229,9,20,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">explore</span>
              Browse Movies
            </button>
          </div>
        ) : (
          /* Watchlist Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-gutter">
            {normalizedWatchlist.map((movie, index) => (
              <div key={movie.id} className="relative group rounded-lg overflow-hidden border border-outline-variant/10">
                
                {/* Remove button overlay on top right */}
                <button 
                  onClick={(e) => handleRemove(e, movie)}
                  aria-label="Remove from watchlist" 
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center text-secondary hover:text-primary-container hover:bg-surface-container-lowest transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-30 shadow-md cursor-pointer border border-white/5"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>

                <MovieCard movie={movie} showRating={true} index={index} />
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
