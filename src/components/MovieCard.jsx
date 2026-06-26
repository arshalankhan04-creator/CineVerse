import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMoviePosterUrl } from '../services/tmdb';
import { useToast } from '../context/ToastContext';

export default function MovieCard({ movie, showRating = true, index = -1 }) {
  const { id, title, name, poster_path, vote_average, release_date, first_air_date } = movie;
  const { showToast } = useToast();
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const displayTitle = title || name || 'Unknown Title';
  const year = release_date 
    ? new Date(release_date).getFullYear() 
    : first_air_date 
      ? new Date(first_air_date).getFullYear() 
      : 'N/A';
  
  const rating = vote_average ? vote_average.toFixed(1) : 'N/A';
  const isTVShow = !!first_air_date || (!!name && !title);
  const detailsUrl = isTVShow ? `/tv/${id}` : `/movie/${id}`;

  useEffect(() => {
    const checkWatchlist = () => {
      const list = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]');
      setIsInWatchlist(list.some(item => item.id === id));
    };
    checkWatchlist();
    window.addEventListener('watchlist_updated', checkWatchlist);
    return () => window.removeEventListener('watchlist_updated', checkWatchlist);
  }, [id]);

  const handleToggleWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const list = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]');
    let updatedList;
    if (isInWatchlist) {
      updatedList = list.filter(item => item.id !== id);
      showToast('Removed ✗', 'info');
    } else {
      updatedList = [...list, { id, title, name, poster_path, vote_average, release_date, first_air_date }];
      showToast('Added to Watchlist ✓', 'success');
    }
    localStorage.setItem('cineverse_watchlist', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('watchlist_updated'));
  };

  return (
    <Link 
      to={detailsUrl}
      className="group flex flex-col gap-stack-sm cursor-pointer w-full text-left animate-slide-in"
      style={index >= 0 ? { animationDelay: `${(index % 12) * 50}ms` } : {}}
    >
      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-surface-container transition-all duration-300 group-hover:scale-[1.05] group-hover:-translate-y-2 border border-outline-variant/10 card-hover-shadow">
        <img 
          src={getMoviePosterUrl(poster_path)} 
          alt={displayTitle}
          className="object-cover w-full h-full"
          loading="lazy"
        />
        <div className="absolute inset-0 border border-white/5 rounded-lg pointer-events-none group-hover:border-primary-container/50 transition-colors"></div>
        
        {/* Quick Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 z-10">
          <button
            onClick={handleToggleWatchlist}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer shadow-lg transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-[50ms] ${
              isInWatchlist 
                ? 'bg-transparent border border-outline text-on-surface hover:bg-white/10' 
                : 'bg-primary-container text-white hover:bg-primary-container/90'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isInWatchlist ? 'bookmark_added' : 'bookmark'}
            </span>
            {isInWatchlist ? 'Saved' : 'Watchlist'}
          </button>
          
          <div
            className="glass-panel text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer shadow-lg hover:bg-white/10 transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-[120ms]"
          >
            <span className="material-symbols-outlined text-[16px]">info</span>
            Details
          </div>
        </div>

        {/* Floating rating badge if requested */}
        {showRating && rating !== 'N/A' && (
          <div className="absolute top-2 right-2 glass-panel rounded-full px-2.5 py-1 flex items-center gap-1 z-20 rating-badge-glow border border-transparent">
            <span className="material-symbols-outlined text-[13px] text-tertiary filled-icon">star</span>
            <span className="text-[11px] font-bold text-on-surface">{rating}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-0.5 px-1 mt-1">
        <h3 className="font-body-md text-body-md text-on-background group-hover:text-primary-container transition-colors truncate">
          {displayTitle}
        </h3>
        <div className="flex items-center justify-between font-label-sm text-label-sm">
          {!showRating && rating !== 'N/A' && (
            <span className="flex items-center gap-1 text-tertiary">
              <span className="material-symbols-outlined text-[14px] filled-icon">star</span>
              {rating}
            </span>
          )}
          {showRating && rating !== 'N/A' ? (
            <span className="text-on-surface-variant">{year}</span>
          ) : (
            <>
              <span className="flex items-center gap-1 text-tertiary">
                <span className="material-symbols-outlined text-[14px] filled-icon">star</span>
                {rating}
              </span>
              <span className="text-on-surface-variant">{year}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
