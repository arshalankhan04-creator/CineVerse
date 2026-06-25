import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { useToast } from '../context/ToastContext';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const WATCHLIST_KEY = 'cineverse_watchlist';

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
    setWatchlist(saved);

    // Sync state if changed elsewhere (like from card overlay)
    const handleWatchlistChange = () => {
      const updated = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
      setWatchlist(updated);
    };
    window.addEventListener('watchlist_updated', handleWatchlistChange);
    return () => window.removeEventListener('watchlist_updated', handleWatchlistChange);
  }, []);

  const handleRemove = (e, movieId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const updated = watchlist.filter(m => m.id !== movieId);
    setWatchlist(updated);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    showToast('Removed ✗', 'info');
    
    // Dispatch custom event to notify Navbar / other components
    window.dispatchEvent(new Event('watchlist_updated'));
  };

  return (
    <div className="bg-level-0 min-h-screen pt-28 pb-16 page-transition">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex-grow">
        
        <header className="mb-stack-lg">
          <h1 className="text-headline-lg font-headline-lg md:text-display-lg md:font-display-lg font-extrabold text-on-background tracking-tight">
            My Watchlist
          </h1>
          <p className="text-body-lg font-body-lg text-secondary mt-stack-sm max-w-2xl leading-relaxed">
            Your personal curation of cinematic masterpieces. Films you've saved for the perfect viewing experience.
          </p>
        </header>

        {watchlist.length === 0 ? (
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
            {watchlist.map((movie, index) => (
              <div key={movie.id} className="relative group rounded-lg overflow-hidden border border-outline-variant/10">
                
                {/* Remove button overlay on top right */}
                <button 
                  onClick={(e) => handleRemove(e, movie.id)}
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
