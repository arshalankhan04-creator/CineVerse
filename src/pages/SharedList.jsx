import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function SharedList() {
  const { listId } = useParams();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchList() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPublicList(listId);
        setList(data);
      } catch (err) {
        console.error('Error loading shared list:', err);
        setError(err.message || 'This collection is private or does not exist.');
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, [listId]);

  const normalizeItems = (items = []) => {
    return items.map(item => ({
      ...item,
      id: item.tmdbId || item.id,
      title: item.title || item.name,
      name: item.name || item.title,
      poster_path: item.posterPath || item.poster_path,
      vote_average: item.rating || item.vote_average,
      media_type: item.mediaType || item.media_type,
    }));
  };

  if (loading) {
    return (
      <div className="bg-level-0 min-h-screen pt-28 pb-16 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary-container/20 border-t-primary-container rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="bg-level-0 min-h-screen pt-28 pb-16 flex items-center justify-center text-center px-4">
        <div className="glass-panel rounded-3xl p-10 max-w-md border border-white/5 shadow-2xl">
          <span className="material-symbols-outlined text-[64px] text-primary-container mb-4">visibility_off</span>
          <h2 className="text-headline-md font-bold text-on-background">Collection Unavailable</h2>
          <p className="text-xs text-secondary mt-2 leading-relaxed">
            {error || 'This collection is either private or does not exist.'}
          </p>
          <Link
            to="/"
            className="mt-6 inline-block px-6 py-2.5 rounded-full bg-primary-container text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  const coverItem = list.items?.[0];
  const normalizedItems = normalizeItems(list.items);

  return (
    <div className="bg-level-0 min-h-screen pt-24 pb-stack-lg page-transition text-left">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col gap-6 animate-fade-in">
        
        {/* List Header Card */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/5 relative overflow-hidden">
          {coverItem && (coverItem.posterPath || coverItem.poster_path) && (
            <div className="absolute inset-0 opacity-10 pointer-events-none blur-md">
              <img
                src={`https://image.tmdb.org/t/p/w500${coverItem.posterPath || coverItem.poster_path}`}
                alt="list cover backdrop"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent"></div>
            </div>
          )}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-container/10 rounded-full blur-[100px]"></div>

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[9px] uppercase font-black px-2.5 py-0.5 rounded bg-primary-container/15 text-primary-container border border-primary-container/20 tracking-wide">
                Shared Collection
              </span>
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-secondary border border-white/10">
                Curated by @{list.user?.username || 'Anonymous'}
              </span>
            </div>
            
            <h1 className="text-display-lg-mobile md:text-headline-lg font-black text-on-background tracking-tight">
              {list.name}
            </h1>
            <p className="text-body-md text-secondary mt-1 max-w-2xl leading-relaxed">
              {list.description}
            </p>
            
            <span className="text-xs font-bold text-secondary bg-white/5 border border-white/10 px-3 py-1 rounded-full mt-3 inline-block">
              {list.items?.length || 0} {list.items?.length === 1 ? 'Title' : 'Titles'}
            </span>
          </div>

          <Link
            to="/"
            className="relative z-10 bg-white/5 border border-white/10 hover:bg-white/10 text-on-background px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer self-start md:self-center shrink-0"
          >
            Explore CineVerse
          </Link>
        </div>

        {/* Collection items grid */}
        {normalizedItems.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <span className="material-symbols-outlined text-[54px] text-secondary/30">playlist_play</span>
            <h3 className="text-body-lg font-bold text-on-background mt-4">Collection is Empty</h3>
            <p className="text-secondary max-w-xs mt-2 text-xs leading-relaxed">
              The curator hasn't added any titles to this collection yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-gutter mt-2">
            {normalizedItems.map((item, index) => (
              <MovieCard key={item.id} movie={item} showRating={true} index={index} />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
