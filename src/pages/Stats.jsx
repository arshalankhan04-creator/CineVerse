import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMovieDetails, getTVShowDetails, getMoviePosterUrl } from '../services/tmdb';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';
import { useAuth } from '../context/AuthContext';

export default function Stats() {
  const { user, watchedList, watchlist: authWatchlist, setAuthModalOpen } = useAuth();
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

        // Use watched history for logged-in users, fallback to watchlist for guests
        let listToUse;
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
        } else {
          const localList = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]');
          listToUse = localList.map(item => ({
            id: item.id,
            type: (item.first_air_date || (!item.title && item.name)) ? 'tv' : 'movie'
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

  return (
    <div className="bg-level-0 min-h-screen pt-24 pb-stack-lg page-transition text-left">
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
                  style={{ width: `${(stats.movieCount / (stats.movieCount + stats.tvCount)) * 100}%` }}
                  title={`${stats.movieCount} Movies`}
                ></div>
                <div 
                  className="bg-blue-400 h-full transition-all"
                  style={{ width: `${(stats.tvCount / (stats.movieCount + stats.tvCount)) * 100}%` }}
                  title={`${stats.tvCount} TV Shows`}
                ></div>
              </div>
              <p className="text-[10px] text-secondary mt-1">{stats.movieCount} Movies / {stats.tvCount} TV Shows</p>
            </div>
          </div>

          {/* Card 3: Budget Spent (For films) */}
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
          
          {/* Left panel: Genres & Highlights */}
          <div className="flex flex-col gap-6">
            
            {/* Genre breakdown */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5">
              <h3 className="text-body-lg font-bold text-on-background border-b border-white/5 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">theater_comedy</span>
                Favorite Genres
              </h3>
              
              <div className="flex flex-col gap-4 mt-4">
                {sortedGenreEntries.length === 0 ? (
                  <p className="text-secondary text-xs text-center py-6">Genre data not available.</p>
                ) : (
                  sortedGenreEntries.map(([genre, count], idx) => {
                    const percent = ((count / totalGenreHits) * 100).toFixed(0);
                    // Cycle colors
                    const barColors = [
                      'bg-primary-container',
                      'bg-blue-400',
                      'bg-green-400',
                      'bg-purple-400',
                      'bg-amber-400'
                    ];
                    
                    return (
                      <div key={genre}>
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <span className="text-on-background">{genre}</span>
                          <span className="text-secondary font-mono">{count} {count === 1 ? 'Title' : 'Titles'} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all ${barColors[idx % barColors.length]}`}
                            style={{ width: `${(count / itemsList.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
                    <div className="flex items-center gap-3">
                      <img 
                        src={getMoviePosterUrl(stats.highestRatedTitle.poster_path)} 
                        alt="High" 
                        className="w-10 rounded object-cover aspect-[2/3]" 
                      />
                      <div className="text-left overflow-hidden">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider text-amber-400">Highest Rated</span>
                        <h4 className="text-xs font-bold text-on-background truncate max-w-[200px]">{stats.highestRatedTitle.title || stats.highestRatedTitle.name}</h4>
                      </div>
                    </div>
                    <span className="text-xs font-black text-tertiary flex items-center gap-0.5 bg-black/40 px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined filled-icon text-[14px]">star</span>
                      {stats.highestRatedTitle.vote_average?.toFixed(1)}
                    </span>
                  </div>
                )}

                {stats.lowestRatedTitle && stats.lowestRatedTitle.id !== stats.highestRatedTitle?.id && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getMoviePosterUrl(stats.lowestRatedTitle.poster_path)} 
                        alt="Low" 
                        className="w-10 rounded object-cover aspect-[2/3]" 
                      />
                      <div className="text-left overflow-hidden">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider text-secondary">Lowest Rated</span>
                        <h4 className="text-xs font-bold text-on-background truncate max-w-[200px]">{stats.lowestRatedTitle.title || stats.lowestRatedTitle.name}</h4>
                      </div>
                    </div>
                    <span className="text-xs font-black text-secondary flex items-center gap-0.5 bg-black/40 px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined filled-icon text-[14px] text-secondary">star</span>
                      {stats.lowestRatedTitle.vote_average?.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right panel: Timeline eras */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 h-full">
            <h3 className="text-body-lg font-bold text-on-background border-b border-white/5 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">timeline</span>
              Decade Release Distribution
            </h3>

            <div className="flex flex-col gap-4 mt-6">
              {Object.entries(stats.eraCounts).map(([eraName, count]) => {
                const percentage = itemsList.length > 0 ? (count / itemsList.length) * 100 : 0;
                
                return (
                  <div key={eraName} className="flex items-center gap-4">
                    <span className="w-18 text-xs text-secondary font-bold text-left">{eraName}</span>
                    <div className="flex-grow bg-white/5 h-6 rounded-lg overflow-hidden border border-white/5 flex items-center relative pr-2">
                      <div 
                        className="bg-primary-container h-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                      {count > 0 && (
                        <span className="absolute right-3 text-[10px] font-black text-white font-mono z-10">
                          {count} {count === 1 ? 'title' : 'titles'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Ambient aesthetic text */}
            <div className="mt-8 pt-4 border-t border-white/5 text-center text-xs text-secondary italic">
              "Every great movie begins with a blank page and a ticking clock."
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
