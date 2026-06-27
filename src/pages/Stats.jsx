import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMovieDetails, getTVShowDetails, getMoviePosterUrl } from '../services/tmdb';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';
import { useAuth } from '../context/AuthContext';

export default function Stats() {
  const { user, loading: authLoading, watchedList, watchlist: authWatchlist, setAuthModalOpen } = useAuth();
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Aggregate stats states
  const [stats, setStats] = useState({
    totalMinutes: 0,
    movieCount: 0,
    tvCount: 0,
    genreCounts: {},
    eraCounts: { 'Pre-1990': 0, '1990s': 0, '2000s': 0, '2010s': 0, '2020s': 0 },
    totalBudget: 0,
    totalRevenue: 0,
    topDirectors: [],
    highestRatedTitle: null,
    lowestRatedTitle: null
  });

  useEffect(() => {
    async function calculateStats() {
      try {
        setLoading(true);
        setError(null);

        // Use watched history for logged-in users, fallback to watchlist
        let listToUse = [];
        if (user && watchedList.length > 0) {
          listToUse = watchedList.map(item => ({
            id: item.tmdbId,
            type: item.mediaType
          }));
        } else if (user) {
          // Fallback to watchlist if no watched history yet
          listToUse = authWatchlist.map(item => ({
            id: item.tmdbId,
            type: item.mediaType
          }));
        }

        setItemsList(listToUse);

        if (listToUse.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch detailed data for all items in parallel
        const detailedItems = await Promise.all(
          listToUse.map(async (item) => {
            const isTV = item.type === 'tv';
            try {
              if (isTV) {
                const data = await getTVShowDetails(item.id);
                data.type = 'tv';
                return data;
              } else {
                const data = await getMovieDetails(item.id);
                data.type = 'movie';
                return data;
              }
            } catch (err) {
              console.error(`Failed to fetch details for ${item.id}`, err);
              return { ...item, type: isTV ? 'tv' : 'movie' }; // Fallback
            }
          })
        );

        // Aggregate statistics
        let totalMin = 0;
        let movieC = 0;
        let tvC = 0;
        const genres = {};
        const eras = { 'Pre-1990': 0, '1990s': 0, '2000s': 0, '2010s': 0, '2020s': 0 };
        let budgetTotal = 0;
        let revenueTotal = 0;
        let highest = null;
        let lowest = null;

        detailedItems.forEach(item => {
          // 1. Media count
          if (item.type === 'movie') {
            movieC++;
            totalMin += item.runtime || 0;
            budgetTotal += item.budget || 0;
            revenueTotal += item.revenue || 0;
          } else {
            tvC++;
            const run = (item.episode_run_time && item.episode_run_time[0]) || 45; // Default 45 mins
            const episodes = item.number_of_episodes || (item.number_of_seasons * 10) || 10;
            totalMin += run * episodes;
          }

          // 2. Rating High / Low
          if (item.vote_average) {
            if (!highest || item.vote_average > highest.vote_average) {
              highest = item;
            }
            if (!lowest || item.vote_average < lowest.vote_average) {
              lowest = item;
            }
          }

          // 3. Genres count
          item.genres?.forEach(g => {
            genres[g.name] = (genres[g.name] || 0) + 1;
          });

          // 4. Era counts
          const dateStr = item.release_date || item.first_air_date;
          if (dateStr) {
            const year = new Date(dateStr).getFullYear();
            if (year < 1990) eras['Pre-1990']++;
            else if (year < 2000) eras['1990s']++;
            else if (year < 2010) eras['2000s']++;
            else if (year < 2020) eras['2010s']++;
            else eras['2020s']++;
          }
        });

        setStats({
          totalMinutes: totalMin,
          movieCount: movieC,
          tvCount: tvC,
          genreCounts: genres,
          eraCounts: eras,
          totalBudget: budgetTotal,
          totalRevenue: revenueTotal,
          highestRatedTitle: highest,
          lowestRatedTitle: lowest
        });

      } catch (err) {
        console.error('Error calculating statistics:', err);
        setError('Failed to compute personal cinema statistics.');
      } finally {
        setLoading(false);
      }
    }

    calculateStats();
  }, [user, watchedList, authWatchlist]);

  const formatWatchTime = (totalMins) => {
    if (!totalMins) return '0h';
    const days = Math.floor(totalMins / (24 * 60));
    const remainingMins = totalMins % (24 * 60);
    const hrs = Math.floor(remainingMins / 60);
    
    if (days > 0) {
      return `${days}d ${hrs}h`;
    }
    return `${hrs}h`;
  };

  if (authLoading) {
    return (
      <div className="bg-level-0 min-h-screen pt-24 pb-12">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop animate-pulse">
          <h1 className="text-display-lg-mobile md:text-display-lg font-black text-on-background text-left">Verifying session...</h1>
          <SkeletonLoader type="home" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-level-0 min-h-screen pt-28 pb-16 page-transition text-left">
        <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center py-20 text-center">
          <div className="glass-panel rounded-3xl p-12 max-w-2xl mx-auto border border-white/5 flex flex-col items-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-container/10 rounded-full blur-[100px]"></div>
            
            <span className="material-symbols-outlined text-[72px] text-primary-container mb-6 drop-shadow-[0_0_20px_rgba(229,9,20,0.3)] animate-pulse">monitoring</span>
            
            <h1 className="text-display-lg-mobile md:text-headline-lg font-black text-on-background tracking-tight mb-4">
              CineVerse Stats Wrapped
            </h1>
            <p className="text-body-lg text-secondary max-w-md mb-8 leading-relaxed">
              Sign in to view your personalized viewing statistics, see your favorite genres, track total watch time, and look at your budget/revenue overview.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-primary-container text-white px-8 py-3.5 rounded-full text-sm font-bold tracking-wide hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(229,9,20,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              Sign In / Register
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-level-0 min-h-screen pt-24 pb-12">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <h1 className="text-display-lg-mobile md:text-display-lg font-black text-on-background text-left">Calculating stats...</h1>
          <SkeletonLoader type="home" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} retryAction={() => window.location.reload()} />;
  }

  // Determine the data source label
  const dataSourceLabel = user && watchedList.length > 0 
    ? 'watched history' 
    : 'watchlist';

  if (itemsList.length === 0) {
    return (
      <div className="bg-level-0 min-h-screen pt-24 pb-stack-lg page-transition text-left">
        <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <h1 className="text-display-lg-mobile md:text-display-lg font-extrabold text-on-background border-b border-white/5 pb-4">
            Stats Wrapped
          </h1>
          
          <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px] mt-8">
            <span className="material-symbols-outlined text-[64px] text-secondary/35 animate-pulse">monitoring</span>
            <h2 className="text-headline-md font-bold text-on-background mt-4">
              {user ? 'No Watched History Yet' : 'Awaiting Watchlist Entries'}
            </h2>
            <p className="text-secondary max-w-sm mt-2 text-sm leading-relaxed">
              {user 
                ? 'Mark movies and TV shows as watched using the 👁 button on any title page to build your personal stats dashboard.'
                : 'Your Stats Wrapped dashboard compiles summary insights from titles saved in your My Watchlist. Add some movies and TV shows first!'
              }
            </p>
            <Link
              to="/explore"
              className="mt-6 px-6 py-2.5 rounded-full bg-primary-container text-white font-bold text-xs hover:bg-primary-container/95 transition-all shadow-md active:scale-95"
            >
              Explore Titles
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Calculate top genres percentages
  const totalGenreHits = Object.values(stats.genreCounts).reduce((a, b) => a + b, 0);
  const sortedGenreEntries = Object.entries(stats.genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Pad genres to 5 for radar chart
  const paddedGenreEntries = [...sortedGenreEntries];
  while (paddedGenreEntries.length < 5) {
    paddedGenreEntries.push(['-', 0]);
  }

  // Radar calculations
  const radarCenter = 100;
  const radarRadius = 65;
  const radarPointsCount = 5;
  
  // Calculate max value for scaling
  const maxGenreVal = sortedGenreEntries.length > 0 
    ? Math.max(...sortedGenreEntries.map(e => e[1]), 1) 
    : 1;

  // Concentric pentagons for background grid (25%, 50%, 75%, 100%)
  const gridScales = [0.25, 0.5, 0.75, 1.0];
  const gridPolygons = gridScales.map(scale => {
    return Array.from({ length: radarPointsCount }).map((_, i) => {
      const angle = (i * 2 * Math.PI) / radarPointsCount - Math.PI / 2;
      const x = radarCenter + radarRadius * scale * Math.cos(angle);
      const y = radarCenter + radarRadius * scale * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  });

  // Calculate coordinates for the user's favorite genres polygon
  const radarUserPoints = paddedGenreEntries.map(([genre, count], i) => {
    const angle = (i * 2 * Math.PI) / radarPointsCount - Math.PI / 2;
    const scale = maxGenreVal > 0 ? count / maxGenreVal : 0;
    const x = radarCenter + radarRadius * scale * Math.cos(angle);
    const y = radarCenter + radarRadius * scale * Math.sin(angle);
    return { x, y, genre, count, angle };
  });

  const radarPolygonPoints = radarUserPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Decade Release calculations
  const maxEraCount = Math.max(...Object.values(stats.eraCounts), 1);
  const eraData = Object.entries(stats.eraCounts);

  // Library Format Split calculations (Doughnut)
  const totalLibraryCount = stats.movieCount + stats.tvCount;
  const moviePercent = totalLibraryCount > 0 ? (stats.movieCount / totalLibraryCount) * 100 : 0;
  const tvPercent = totalLibraryCount > 0 ? (stats.tvCount / totalLibraryCount) * 100 : 0;

  const donutRadius = 30;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~188.49
  const movieStrokeDash = (moviePercent / 100) * donutCircumference;
  const tvStrokeDash = (tvPercent / 100) * donutCircumference;

  // Get anchor alignment for text label
  const getAnchor = (angle) => {
    const cos = Math.cos(angle);
    if (Math.abs(cos) < 0.1) return 'middle';
    return cos > 0 ? 'start' : 'end';
  };

  return (
    <div className="bg-level-0 min-h-screen pt-24 pb-stack-lg page-transition text-left">
      {/* SVG Definitions for Gradients and Filters */}
      <svg className="absolute w-0 h-0 invisible">
        <defs>
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(229, 9, 20, 0.45)" />
            <stop offset="90%" stopColor="rgba(59, 130, 246, 0.15)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
          </radialGradient>
          <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(229, 9, 20, 1)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 1)" />
          </linearGradient>
          <linearGradient id="movieSegmentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e50914" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <linearGradient id="tvSegmentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        
        {/* Header */}
        <div className="border-b border-white/5 pb-4 mb-8">
          <h1 className="text-display-lg-mobile md:text-display-lg font-extrabold text-on-background tracking-tight">
            Stats Wrapped
          </h1>
          <p className="text-body-md text-secondary mt-1">
            Summary insights compiled from {itemsList.length} titles in your {dataSourceLabel}.
          </p>
        </div>

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Total Watch Time */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 flex items-center gap-5 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl"></div>
            <div className="w-14 h-14 rounded-2xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container shrink-0">
              <span className="material-symbols-outlined text-[32px]">schedule</span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-secondary tracking-widest">Total Watch Time</p>
              <h2 className="text-display-lg-mobile md:text-headline-lg font-black text-on-background font-mono mt-0.5">
                {formatWatchTime(stats.totalMinutes)}
              </h2>
              <p className="text-[11px] text-secondary mt-0.5">{stats.totalMinutes.toLocaleString()} total minutes</p>
            </div>
          </div>

          {/* Card 2: Formats Ratio */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 flex items-center gap-5 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <span className="material-symbols-outlined text-[32px]">movie</span>
            </div>
            <div className="flex-grow">
              <p className="text-[10px] uppercase font-bold text-secondary tracking-widest">Library Split</p>
              <h2 className="text-display-lg-mobile md:text-headline-lg font-black text-on-background mt-0.5 font-mono">
                {stats.movieCount}:{stats.tvCount}
              </h2>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-1.5 flex">
                <div 
                  className="bg-primary-container h-full transition-all"
                  style={{ width: `${(stats.movieCount / (stats.movieCount + stats.tvCount || 1)) * 100}%` }}
                  title={`${stats.movieCount} Movies`}
                ></div>
                <div 
                  className="bg-blue-400 h-full transition-all"
                  style={{ width: `${(stats.tvCount / (stats.movieCount + stats.tvCount || 1)) * 100}%` }}
                  title={`${stats.tvCount} TV Shows`}
                ></div>
              </div>
              <p className="text-[10px] text-secondary mt-1">{stats.movieCount} Movies / {stats.tvCount} TV Shows</p>
            </div>
          </div>

          {/* Card 3: Budget Spent */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 flex items-center gap-5 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
              <span className="material-symbols-outlined text-[32px]">payments</span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-secondary tracking-widest">Film Cost of Production</p>
              <h2 className="text-display-lg-mobile md:text-headline-lg font-black text-on-background mt-0.5 font-mono">
                ${(stats.totalBudget / 1000000).toFixed(0)}M
              </h2>
              <p className="text-[11px] text-secondary mt-0.5">Box office: ${(stats.totalRevenue / 1000000).toFixed(0)}M</p>
            </div>
          </div>

        </div>

        {/* Breakdown section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Genres & Highlights */}
          <div className="flex flex-col gap-6">
            
            {/* Genre Radar Chart Card */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
              <h3 className="text-body-lg font-bold text-on-background border-b border-white/5 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">theater_comedy</span>
                Favorite Genres Radar
              </h3>
              
              {sortedGenreEntries.length === 0 ? (
                <p className="text-secondary text-xs text-center py-12">Genre data not available.</p>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-around gap-6 mt-2">
                  {/* Radar Chart SVG */}
                  <div className="w-[180px] h-[180px] shrink-0">
                    <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                      {/* Concentric grid pentagons */}
                      {gridPolygons.map((points, scaleIdx) => (
                        <polygon
                          key={scaleIdx}
                          points={points}
                          className="fill-none stroke-white/5"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Radial spokes */}
                      {Array.from({ length: radarPointsCount }).map((_, i) => {
                        const angle = (i * 2 * Math.PI) / radarPointsCount - Math.PI / 2;
                        const x = radarCenter + radarRadius * Math.cos(angle);
                        const y = radarCenter + radarRadius * Math.sin(angle);
                        return (
                          <line
                            key={i}
                            x1={radarCenter}
                            y1={radarCenter}
                            x2={x}
                            y2={y}
                            className="stroke-white/5"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* User Polygon Area */}
                      {sortedGenreEntries.length > 0 && (
                        <polygon
                          points={radarPolygonPoints}
                          fill="url(#radarGrad)"
                          stroke="rgba(229, 9, 20, 0.85)"
                          strokeWidth="2"
                          filter="url(#glow)"
                          className="transition-all duration-700 ease-out"
                        />
                      )}

                      {/* Polygon Points and Labels */}
                      {radarUserPoints.map((p, i) => {
                        if (p.genre === '-') return null;
                        
                        // Push labels outward
                        const labelRadius = radarRadius + 14;
                        const lx = radarCenter + labelRadius * Math.cos(p.angle);
                        const ly = radarCenter + labelRadius * Math.sin(p.angle);
                        
                        return (
                          <g key={i}>
                            {/* Glowing Vertex point */}
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="3.5"
                              className="fill-primary-container stroke-white"
                              strokeWidth="1"
                            />
                            {/* Text label */}
                            <text
                              x={lx}
                              y={ly + 3}
                              textAnchor={getAnchor(p.angle)}
                              className="fill-on-background text-[9px] font-extrabold uppercase tracking-wide select-none"
                            >
                              {p.genre}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Sidebar stats legend */}
                  <div className="flex-grow flex flex-col gap-2.5 w-full">
                    {sortedGenreEntries.map(([genre, count], idx) => {
                      const percent = ((count / totalGenreHits) * 100).toFixed(0);
                      const bulletColors = [
                        'bg-red-500',
                        'bg-blue-400',
                        'bg-green-400',
                        'bg-purple-400',
                        'bg-amber-400'
                      ];
                      
                      return (
                        <div key={genre} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-2 text-xs font-bold text-on-background">
                            <span className={`w-2 h-2 rounded-full ${bulletColors[idx % bulletColors.length]}`}></span>
                            <span>{genre}</span>
                          </div>
                          <span className="text-[11px] text-secondary font-mono font-bold">
                            {count} {count === 1 ? 'Title' : 'Titles'} ({percent}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quality Highlights: Highest and Lowest Rated */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5">
              <h3 className="text-body-lg font-bold text-on-background border-b border-white/5 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">military_tech</span>
                Library Highlights
              </h3>
              
              <div className="flex flex-col gap-4 mt-4">
                {stats.highestRatedTitle && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3 text-left">
                      <img 
                        src={getMoviePosterUrl(stats.highestRatedTitle.poster_path)} 
                        alt="High" 
                        className="w-10 rounded object-cover aspect-[2/3]" 
                      />
                      <div className="overflow-hidden">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider text-amber-400">Highest Rated</span>
                        <h4 className="text-xs font-bold text-on-background truncate max-w-[200px]">{stats.highestRatedTitle.title || stats.highestRatedTitle.name}</h4>
                      </div>
                    </div>
                    <span className="text-xs font-black text-tertiary flex items-center gap-0.5 bg-black/40 px-2 py-1 rounded-lg shrink-0">
                      <span className="material-symbols-outlined filled-icon text-[14px]">star</span>
                      {stats.highestRatedTitle.vote_average?.toFixed(1)}
                    </span>
                  </div>
                )}

                {stats.lowestRatedTitle && stats.lowestRatedTitle.id !== stats.highestRatedTitle?.id && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3 text-left">
                      <img 
                        src={getMoviePosterUrl(stats.lowestRatedTitle.poster_path)} 
                        alt="Low" 
                        className="w-10 rounded object-cover aspect-[2/3]" 
                      />
                      <div className="overflow-hidden">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider text-secondary">Lowest Rated</span>
                        <h4 className="text-xs font-bold text-on-background truncate max-w-[200px]">{stats.lowestRatedTitle.title || stats.lowestRatedTitle.name}</h4>
                      </div>
                    </div>
                    <span className="text-xs font-black text-secondary flex items-center gap-0.5 bg-black/40 px-2 py-1 rounded-lg shrink-0">
                      <span className="material-symbols-outlined filled-icon text-[14px] text-secondary">star</span>
                      {stats.lowestRatedTitle.vote_average?.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Decade Release & Doughnut Split */}
          <div className="flex flex-col gap-6 w-full">
            
            {/* Decade Release Bar Chart Card */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5">
              <h3 className="text-body-lg font-bold text-on-background border-b border-white/5 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">timeline</span>
                Decade Release Distribution
              </h3>

              <div className="mt-4 flex justify-center">
                <svg viewBox="0 0 350 200" className="w-full max-w-sm overflow-visible">
                  {/* Grid Lines */}
                  {[0.25, 0.5, 0.75, 1.0].map((scale, i) => (
                    <line
                      key={i}
                      x1={75 + scale * 220}
                      y1="10"
                      x2={75 + scale * 220}
                      y2="180"
                      className="stroke-white/5"
                      strokeDasharray="3 3"
                    />
                  ))}

                  {/* Horizontal Bars */}
                  {eraData.map(([era, count], idx) => {
                    const barWidth = count > 0 ? (count / maxEraCount) * 220 : 0;
                    const yPos = 18 + idx * 34;
                    
                    return (
                      <g key={era} className="group">
                        {/* Era Label */}
                        <text
                          x="10"
                          y={yPos + 13}
                          className="fill-secondary text-[10px] font-extrabold uppercase tracking-wide select-none"
                        >
                          {era}
                        </text>
                        {/* Bar Track Background */}
                        <rect
                          x="75"
                          y={yPos}
                          width="220"
                          height="18"
                          rx="5"
                          className="fill-white/5 stroke stroke-white/5"
                        />
                        {/* Glowing Active Bar */}
                        {barWidth > 0 && (
                          <rect
                            x="75"
                            y={yPos}
                            width={barWidth}
                            height="18"
                            rx="5"
                            fill="url(#barGrad)"
                            className="transition-all duration-700 ease-out"
                          />
                        )}
                        {/* Count number label */}
                        {count > 0 && (
                          <text
                            x={75 + barWidth + 8}
                            y={yPos + 13}
                            className="fill-on-background text-[9px] font-black font-mono"
                          >
                            {count}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Library Split Doughnut Chart Card */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
              <h3 className="text-body-lg font-bold text-on-background border-b border-white/5 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">donut_large</span>
                Format Ratio Split
              </h3>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 mt-2">
                {/* SVG Doughnut */}
                <div className="w-[120px] h-[120px] shrink-0 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Background Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      className="fill-none stroke-white/5"
                      strokeWidth="11"
                    />

                    {/* Movie Segment */}
                    {moviePercent > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        className="fill-none stroke-[url(#movieSegmentGrad)] transition-all duration-700"
                        strokeWidth="11"
                        strokeDasharray={`${movieStrokeDash} ${donutCircumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                    )}

                    {/* TV Show Segment */}
                    {tvPercent > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        className="fill-none stroke-[url(#tvSegmentGrad)] transition-all duration-700"
                        strokeWidth="11"
                        strokeDasharray={`${tvStrokeDash} ${donutCircumference}`}
                        strokeDashoffset={-movieStrokeDash}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>

                  {/* Inner text inside circle */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-black text-on-background font-mono leading-none">
                      {totalLibraryCount}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-secondary font-bold mt-1">
                      Titles
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-grow flex flex-col gap-2.5 w-full">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-bold text-on-background">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                      <span>Movies</span>
                    </div>
                    <span className="text-[11px] text-secondary font-mono font-bold">
                      {stats.movieCount} titles ({moviePercent.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-bold text-on-background">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span>TV Shows</span>
                    </div>
                    <span className="text-[11px] text-secondary font-mono font-bold">
                      {stats.tvCount} titles ({tvPercent.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ambient aesthetic text */}
            <div className="glass-panel rounded-3xl p-4 border border-white/5 text-center text-xs text-secondary italic">
              "Every great movie begins with a blank page and a ticking clock."
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
