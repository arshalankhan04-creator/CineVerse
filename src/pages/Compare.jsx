import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchMulti, getMovieDetails, getTVShowDetails, getMoviePosterUrl } from '../services/tmdb';
import { useToast } from '../context/ToastContext';

export default function Compare() {
  const { showToast } = useToast();
  
  // Slot states
  const [slotA, setSlotA] = useState(null);
  const [slotB, setSlotB] = useState(null);
  
  // Search query states
  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');
  
  // Search results states
  const [resultsA, setResultsA] = useState([]);
  const [resultsB, setResultsB] = useState([]);
  
  // Search loading states
  const [loadingSearchA, setLoadingSearchA] = useState(false);
  const [loadingSearchB, setLoadingSearchB] = useState(false);

  // Dropdown open states
  const [isOpenA, setIsOpenA] = useState(false);
  const [isOpenB, setIsOpenB] = useState(false);

  const containerRefA = useRef(null);
  const containerRefB = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRefA.current && !containerRefA.current.contains(e.target)) {
        setIsOpenA(false);
      }
      if (containerRefB.current && !containerRefB.current.contains(e.target)) {
        setIsOpenB(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Search handlers
  useEffect(() => {
    if (queryA.trim().length < 2) {
      setResultsA([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoadingSearchA(true);
      try {
        const res = await searchMulti(queryA);
        // Filter out people, only keep movie and tv
        const filtered = (res.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');
        setResultsA(filtered.slice(0, 5));
        setIsOpenA(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSearchA(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [queryA]);

  useEffect(() => {
    if (queryB.trim().length < 2) {
      setResultsB([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoadingSearchB(true);
      try {
        const res = await searchMulti(queryB);
        const filtered = (res.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');
        setResultsB(filtered.slice(0, 5));
        setIsOpenB(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSearchB(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [queryB]);

  // Load details
  const selectMedia = async (item, slot) => {
    try {
      let details;
      if (item.media_type === 'movie') {
        details = await getMovieDetails(item.id);
        details.type = 'movie';
      } else {
        details = await getTVShowDetails(item.id);
        details.type = 'tv';
      }

      if (slot === 'A') {
        setSlotA(details);
        setQueryA('');
        setIsOpenA(false);
      } else {
        setSlotB(details);
        setQueryB('');
        setIsOpenB(false);
      }
      showToast(`Selected "${details.title || details.name}"`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch details.', 'error');
    }
  };

  const clearSlot = (slot) => {
    if (slot === 'A') {
      setSlotA(null);
    } else {
      setSlotB(null);
    }
  };

  const swapSlots = () => {
    const temp = slotA;
    setSlotA(slotB);
    setSlotB(temp);
  };

  // Compare stats
  const ratingA = slotA?.vote_average || 0;
  const ratingB = slotB?.vote_average || 0;

  const runtimeA = slotA ? (slotA.runtime || (slotA.episode_run_time && slotA.episode_run_time[0]) || 0) : 0;
  const runtimeB = slotB ? (slotB.runtime || (slotB.episode_run_time && slotB.episode_run_time[0]) || 0) : 0;

  const dateA = slotA ? (slotA.release_date || slotA.first_air_date || '') : '';
  const dateB = slotB ? (slotB.release_date || slotB.first_air_date || '') : '';

  const popularityA = slotA?.popularity || 0;
  const popularityB = slotB?.popularity || 0;

  const formatCurrency = (val) => {
    if (!val) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-level-0 min-h-screen pt-24 pb-stack-lg page-transition">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-left">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
          <div>
            <h1 className="text-display-lg-mobile md:text-display-lg font-extrabold text-on-background tracking-tight">
              Compare Tool
            </h1>
            <p className="text-body-md text-secondary mt-1">
              Select two movies or TV shows to compare side-by-side.
            </p>
          </div>
          
          {slotA && slotB && (
            <button
              onClick={swapSlots}
              className="glass-panel text-on-background px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer hover:bg-white/10 shrink-0 self-start md:self-auto"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              Swap Slots
            </button>
          )}
        </div>

        {/* Input Slots Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-8">
          
          {/* Slot A Input */}
          <div ref={containerRefA} className="relative">
            <h2 className="text-body-lg font-bold text-on-background mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center text-[11px] font-black">A</span>
              Slot A
            </h2>
            {slotA ? (
              <div className="flex items-center justify-between bg-surface-container/60 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <img src={getMoviePosterUrl(slotA.poster_path)} alt={slotA.title || slotA.name} className="w-12 h-18 object-cover rounded-lg" />
                  <div>
                    <h3 className="text-body-md font-bold text-on-background truncate max-w-[200px] sm:max-w-xs">{slotA.title || slotA.name}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-secondary mt-1 inline-block">
                      {slotA.type === 'tv' ? 'TV' : 'Movie'}
                    </span>
                  </div>
                </div>
                <button onClick={() => clearSlot('A')} className="text-secondary hover:text-white transition-colors p-2">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary">search</span>
                <input
                  type="text"
                  placeholder="Search first title..."
                  value={queryA}
                  onChange={(e) => setQueryA(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-on-background focus:outline-none focus:border-primary-container transition-colors"
                />
                {loadingSearchA && <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined animate-spin text-secondary">sync</span>}

                {/* Dropdown results */}
                {isOpenA && resultsA.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 rounded-2xl bg-[#131313]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-30 flex flex-col gap-1">
                    {resultsA.map(item => (
                      <button
                        key={item.id}
                        onClick={() => selectMedia(item, 'A')}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/5 text-left transition-colors"
                      >
                        <img src={getMoviePosterUrl(item.poster_path)} alt={item.title || item.name} className="w-8 h-12 object-cover rounded" />
                        <div>
                          <p className="text-xs font-bold text-on-background truncate max-w-[260px]">{item.title || item.name}</p>
                          <span className="text-[9px] uppercase font-bold px-1 rounded bg-white/5 border border-white/10 text-secondary mt-0.5 inline-block">
                            {item.media_type === 'tv' ? 'TV' : 'Movie'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Slot B Input */}
          <div ref={containerRefB} className="relative">
            <h2 className="text-body-lg font-bold text-on-background mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center text-[11px] font-black">B</span>
              Slot B
            </h2>
            {slotB ? (
              <div className="flex items-center justify-between bg-surface-container/60 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <img src={getMoviePosterUrl(slotB.poster_path)} alt={slotB.title || slotB.name} className="w-12 h-18 object-cover rounded-lg" />
                  <div>
                    <h3 className="text-body-md font-bold text-on-background truncate max-w-[200px] sm:max-w-xs">{slotB.title || slotB.name}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-secondary mt-1 inline-block">
                      {slotB.type === 'tv' ? 'TV' : 'Movie'}
                    </span>
                  </div>
                </div>
                <button onClick={() => clearSlot('B')} className="text-secondary hover:text-white transition-colors p-2">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary">search</span>
                <input
                  type="text"
                  placeholder="Search second title..."
                  value={queryB}
                  onChange={(e) => setQueryB(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-on-background focus:outline-none focus:border-primary-container transition-colors"
                />
                {loadingSearchB && <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined animate-spin text-secondary">sync</span>}

                {/* Dropdown results */}
                {isOpenB && resultsB.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 rounded-2xl bg-[#131313]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-30 flex flex-col gap-1">
                    {resultsB.map(item => (
                      <button
                        key={item.id}
                        onClick={() => selectMedia(item, 'B')}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/5 text-left transition-colors"
                      >
                        <img src={getMoviePosterUrl(item.poster_path)} alt={item.title || item.name} className="w-8 h-12 object-cover rounded" />
                        <div>
                          <p className="text-xs font-bold text-on-background truncate max-w-[260px]">{item.title || item.name}</p>
                          <span className="text-[9px] uppercase font-bold px-1 rounded bg-white/5 border border-white/10 text-secondary mt-0.5 inline-block">
                            {item.media_type === 'tv' ? 'TV' : 'Movie'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Comparison Dashboard */}
        {!slotA || !slotB ? (
          <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
            <span className="material-symbols-outlined text-[64px] text-secondary/40 animate-pulse">compare</span>
            <h2 className="text-headline-md font-bold text-on-background mt-4">Awaiting Selection</h2>
            <p className="text-secondary max-w-sm mt-2 text-sm leading-relaxed">
              Search and select titles in both Slot A and Slot B to dynamically compile a comprehensive side-by-side comparison.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            {/* Main Visual Row: posters & details */}
            <div className="grid grid-cols-2 gap-6 bg-surface-container-low/40 rounded-3xl p-6 border border-white/5">
              {/* Card A */}
              <div className="flex flex-col items-center gap-4 text-center border-r border-white/5 pr-3">
                <div className="w-[140px] sm:w-[200px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/5">
                  <img src={getMoviePosterUrl(slotA.poster_path)} alt={slotA.title || slotA.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <Link to={slotA.type === 'tv' ? `/tv/${slotA.id}` : `/movie/${slotA.id}`} className="text-body-lg font-bold text-on-background hover:text-primary-container transition-all block">
                    {slotA.title || slotA.name}
                  </Link>
                  <p className="text-xs text-secondary mt-1 italic">"{slotA.tagline || 'No tagline available'}"</p>
                </div>
              </div>
              
              {/* Card B */}
              <div className="flex flex-col items-center gap-4 text-center pl-3">
                <div className="w-[140px] sm:w-[200px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/5">
                  <img src={getMoviePosterUrl(slotB.poster_path)} alt={slotB.title || slotB.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <Link to={slotB.type === 'tv' ? `/tv/${slotB.id}` : `/movie/${slotB.id}`} className="text-body-lg font-bold text-on-background hover:text-primary-container transition-all block">
                    {slotB.title || slotB.name}
                  </Link>
                  <p className="text-xs text-secondary mt-1 italic">"{slotB.tagline || 'No tagline available'}"</p>
                </div>
              </div>
            </div>

            {/* Structured Table Stats */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-5">
              
              {/* Stat: Rating */}
              <div className="grid grid-cols-5 gap-2 items-center py-2.5 border-b border-white/5">
                <div className={`col-span-2 text-center text-body-md font-bold px-4 py-2.5 rounded-xl transition-all border ${
                  ratingA > ratingB 
                    ? 'text-primary-container bg-primary-container/10 border-primary-container/30 shadow-[0_0_15px_rgba(229,9,20,0.15)] font-black' 
                    : 'text-secondary bg-transparent border-transparent'
                }`}>
                  <div className="flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined filled-icon text-[16px] text-tertiary">star</span>
                    {ratingA.toFixed(1)} / 10
                  </div>
                </div>
                <div className="col-span-1 text-center text-xs font-bold text-secondary-fixed uppercase tracking-wider">Rating</div>
                <div className={`col-span-2 text-center text-body-md font-bold px-4 py-2.5 rounded-xl transition-all border ${
                  ratingB > ratingA 
                    ? 'text-primary-container bg-primary-container/10 border-primary-container/30 shadow-[0_0_15px_rgba(229,9,20,0.15)] font-black' 
                    : 'text-secondary bg-transparent border-transparent'
                }`}>
                  <div className="flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined filled-icon text-[16px] text-tertiary">star</span>
                    {ratingB.toFixed(1)} / 10
                  </div>
                </div>
              </div>

              {/* Stat: Runtime */}
              <div className="grid grid-cols-5 gap-2 items-center py-2.5 border-b border-white/5">
                <div className={`col-span-2 text-center text-body-md font-bold px-4 py-2.5 rounded-xl transition-all border ${
                  runtimeA > runtimeB 
                    ? 'text-primary-container bg-primary-container/10 border-primary-container/30 font-black' 
                    : 'text-secondary bg-transparent border-transparent'
                }`}>
                  {runtimeA} mins
                </div>
                <div className="col-span-1 text-center text-xs font-bold text-secondary-fixed uppercase tracking-wider">Runtime</div>
                <div className={`col-span-2 text-center text-body-md font-bold px-4 py-2.5 rounded-xl transition-all border ${
                  runtimeB > runtimeA 
                    ? 'text-primary-container bg-primary-container/10 border-primary-container/30 font-black' 
                    : 'text-secondary bg-transparent border-transparent'
                }`}>
                  {runtimeB} mins
                </div>
              </div>

              {/* Stat: Release Date */}
              <div className="grid grid-cols-5 gap-2 items-center py-2.5 border-b border-white/5">
                <div className="col-span-2 text-center text-body-md text-on-background px-2">
                  {dateA ? new Date(dateA).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </div>
                <div className="col-span-1 text-center text-xs font-bold text-secondary-fixed uppercase tracking-wider">Release</div>
                <div className="col-span-2 text-center text-body-md text-on-background px-2">
                  {dateB ? new Date(dateB).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </div>
              </div>

              {/* Stat: Type & Details */}
              <div className="grid grid-cols-5 gap-2 items-center py-2.5 border-b border-white/5">
                <div className="col-span-2 text-center text-body-md text-on-background px-2 font-medium">
                  {slotA.type === 'tv' ? `${slotA.number_of_seasons} Seasons (${slotA.number_of_episodes} eps)` : 'Feature Film'}
                </div>
                <div className="col-span-1 text-center text-xs font-bold text-secondary-fixed uppercase tracking-wider">Format</div>
                <div className="col-span-2 text-center text-body-md text-on-background px-2 font-medium">
                  {slotB.type === 'tv' ? `${slotB.number_of_seasons} Seasons (${slotB.number_of_episodes} eps)` : 'Feature Film'}
                </div>
              </div>

              {/* Stat: Budget (Movie Only) */}
              <div className="grid grid-cols-5 gap-2 items-center py-2.5 border-b border-white/5">
                <div className="col-span-2 text-center text-body-md text-on-background px-2 font-medium">
                  {slotA.type === 'movie' ? formatCurrency(slotA.budget) : 'N/A (TV Show)'}
                </div>
                <div className="col-span-1 text-center text-xs font-bold text-secondary-fixed uppercase tracking-wider">Budget</div>
                <div className="col-span-2 text-center text-body-md text-on-background px-2 font-medium">
                  {slotB.type === 'movie' ? formatCurrency(slotB.budget) : 'N/A (TV Show)'}
                </div>
              </div>

              {/* Stat: Revenue (Movie Only) */}
              <div className="grid grid-cols-5 gap-2 items-center py-2.5 border-b border-white/5">
                <div className={`col-span-2 text-center text-body-md font-bold px-4 py-2.5 rounded-xl transition-all border ${
                  slotA.type === 'movie' && slotB.type === 'movie' && slotA.revenue > slotB.revenue
                    ? 'text-primary-container bg-primary-container/10 border-primary-container/30 font-black'
                    : 'text-secondary bg-transparent border-transparent'
                }`}>
                  {slotA.type === 'movie' ? formatCurrency(slotA.revenue) : 'N/A'}
                </div>
                <div className="col-span-1 text-center text-xs font-bold text-secondary-fixed uppercase tracking-wider">Revenue</div>
                <div className={`col-span-2 text-center text-body-md font-bold px-4 py-2.5 rounded-xl transition-all border ${
                  slotA.type === 'movie' && slotB.type === 'movie' && slotB.revenue > slotA.revenue
                    ? 'text-primary-container bg-primary-container/10 border-primary-container/30 font-black'
                    : 'text-secondary bg-transparent border-transparent'
                }`}>
                  {slotB.type === 'movie' ? formatCurrency(slotB.revenue) : 'N/A'}
                </div>
              </div>

              {/* Stat: Popularity */}
              <div className="grid grid-cols-5 gap-2 items-center py-2.5 border-b border-white/5">
                <div className={`col-span-2 text-center text-body-md font-bold px-4 py-2.5 rounded-xl transition-all border ${
                  popularityA > popularityB 
                    ? 'text-primary-container bg-primary-container/10 border-primary-container/30 font-black' 
                    : 'text-secondary bg-transparent border-transparent'
                }`}>
                  {popularityA.toFixed(0)}
                </div>
                <div className="col-span-1 text-center text-xs font-bold text-secondary-fixed uppercase tracking-wider">Popularity</div>
                <div className={`col-span-2 text-center text-body-md font-bold px-4 py-2.5 rounded-xl transition-all border ${
                  popularityB > popularityA 
                    ? 'text-primary-container bg-primary-container/10 border-primary-container/30 font-black' 
                    : 'text-secondary bg-transparent border-transparent'
                }`}>
                  {popularityB.toFixed(0)}
                </div>
              </div>

              {/* Stat: Genres */}
              <div className="grid grid-cols-5 gap-2 items-center py-2.5 border-b border-white/5">
                <div className="col-span-2 text-center flex flex-wrap justify-center gap-1 px-2">
                  {slotA.genres?.map(g => (
                    <span key={g.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5 bg-white/5 text-secondary">{g.name}</span>
                  ))}
                </div>
                <div className="col-span-1 text-center text-xs font-bold text-secondary-fixed uppercase tracking-wider">Genres</div>
                <div className="col-span-2 text-center flex flex-wrap justify-center gap-1 px-2">
                  {slotB.genres?.map(g => (
                    <span key={g.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5 bg-white/5 text-secondary">{g.name}</span>
                  ))}
                </div>
              </div>

              {/* Stat: Overview */}
              <div className="grid grid-cols-5 gap-2 py-2">
                <div className="col-span-2 text-xs leading-relaxed text-secondary px-2 max-h-[120px] overflow-y-auto pr-1 text-left">
                  {slotA.overview}
                </div>
                <div className="col-span-1 text-center text-xs font-bold text-secondary-fixed uppercase tracking-wider mt-1">Overview</div>
                <div className="col-span-2 text-xs leading-relaxed text-secondary px-2 max-h-[120px] overflow-y-auto pr-1 text-left">
                  {slotB.overview}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
