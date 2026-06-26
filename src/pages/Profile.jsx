import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getGenreList, getTVGenreList } from '../services/tmdb';

export default function Profile() {
  const { showToast } = useToast();
  const { user, watchlist, watchedStats, setAuthModalOpen, setUser } = useAuth();
  const [favoriteGenres, setFavoriteGenres] = useState(user?.favoriteGenres || []);
  const [availableGenres, setAvailableGenres] = useState([]);

  const GENRES_KEY = 'cineverse_profile_genres';

  // Fetch all genres from TMDB (movie + TV merged)
  useEffect(() => {
    async function loadGenres() {
      try {
        const [movieGenres, tvGenres] = await Promise.all([
          getGenreList(),
          getTVGenreList()
        ]);
        const allNames = new Set();
        [...(movieGenres.genres || []), ...(tvGenres.genres || [])].forEach(g => allNames.add(g.name));
        setAvailableGenres([...allNames].sort());
      } catch (err) {
        console.error('Failed to fetch genres from TMDB:', err);
        // Fallback to a basic set if API fails
        setAvailableGenres([
          'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
          'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'
        ]);
      }
    }
    loadGenres();
  }, []);

  useEffect(() => {
    if (user && user.favoriteGenres && user.favoriteGenres.length > 0) {
      setFavoriteGenres(user.favoriteGenres);
    } else {
      // Fallback to local storage if not logged in or no genres saved
      const savedGenres = localStorage.getItem(GENRES_KEY);
      if (savedGenres) {
        setFavoriteGenres(JSON.parse(savedGenres));
      } else {
        localStorage.setItem(GENRES_KEY, JSON.stringify(['Action', 'Sci-Fi', 'Thriller']));
        setFavoriteGenres(['Action', 'Sci-Fi', 'Thriller']);
      }
    }
  }, [user]);

  const toggleGenre = async (genre) => {
    let updated;
    const isAdding = !favoriteGenres.includes(genre);
    if (favoriteGenres.includes(genre)) {
      updated = favoriteGenres.filter(g => g !== genre);
    } else {
      updated = [...favoriteGenres, genre];
    }
    setFavoriteGenres(updated);
    
    if (user) {
      try {
        await api.updateGenres(updated);
        setUser(prev => ({ ...prev, favoriteGenres: updated }));
      } catch (err) {
        console.error('Failed to sync genres:', err);
      }
    } else {
      localStorage.setItem(GENRES_KEY, JSON.stringify(updated));
    }
    
    showToast(isAdding ? `Added ${genre} to favorites ✓` : `Removed ${genre} from favorites ✗`, 'info');
  };

  const formatWatchTime = (minutes) => {
    if (!minutes) return '0h';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Compute initials for the avatar
  const initials = user ? user.username.slice(0, 2).toUpperCase() : 'AR';
  
  // Format joined date
  const joinedDate = user && user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : 'June 2026';

  // If user is logged out, show premium sign-in prompt placeholder
  if (!user) {
    return (
      <div className="bg-level-0 min-h-screen pt-28 pb-16 page-transition text-left">
        <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center py-20 text-center">
          <div className="glass-panel rounded-3xl p-12 max-w-2xl mx-auto border border-white/5 flex flex-col items-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-container/10 rounded-full blur-[100px]"></div>
            
            <span className="material-symbols-outlined text-[72px] text-primary-container mb-6 drop-shadow-[0_0_20px_rgba(229,9,20,0.3)] animate-pulse">person</span>
            
            <h1 className="text-display-lg-mobile md:text-headline-lg font-black text-on-background tracking-tight mb-4">
              Your CineVerse Profile
            </h1>
            <p className="text-body-lg text-secondary max-w-md mb-8 leading-relaxed">
              Sign in to view your personalized dashboard, manage your favorite genres, track your watchlist stats, and customize your theme.
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

  const badges = [
    {
      id: 'cinephile',
      name: 'Cinephile',
      description: 'Watch more movies to level up',
      icon: 'movie_filter',
      isUnlocked: (watchedStats?.moviesWatchedCount || 0) >= 1,
      tier: (watchedStats?.moviesWatchedCount || 0) >= 30 ? 'Platinum' : (watchedStats?.moviesWatchedCount || 0) >= 15 ? 'Gold' : (watchedStats?.moviesWatchedCount || 0) >= 5 ? 'Silver' : (watchedStats?.moviesWatchedCount || 0) >= 1 ? 'Bronze' : 'Locked',
      requirement: 'Bronze: 1, Silver: 5, Gold: 15, Plat: 30 titles watched',
      progress: `${watchedStats?.moviesWatchedCount || 0} watched`
    },
    {
      id: 'marathoner',
      name: 'Marathoner',
      description: 'Spend 24 hours watching movies/shows',
      icon: 'avg_time',
      isUnlocked: (watchedStats?.totalWatchTimeMinutes || 0) >= 1440,
      tier: (watchedStats?.totalWatchTimeMinutes || 0) >= 1440 ? 'Unlocked' : 'Locked',
      requirement: 'Watch at least 24 hours (1440 mins) of content',
      progress: `${Math.round(watchedStats?.totalWatchTimeMinutes || 0)} / 1440 mins`
    },
    {
      id: 'trivia_master',
      name: 'Trivia Master',
      description: 'Score 10/10 on Medium or Hard trivia',
      icon: 'military_tech',
      isUnlocked: localStorage.getItem('cineverse_badge_trivia_master') === 'true',
      tier: localStorage.getItem('cineverse_badge_trivia_master') === 'true' ? 'Unlocked' : 'Locked',
      requirement: 'Get a perfect 10/10 on Medium/Hard difficulty',
      progress: localStorage.getItem('cineverse_badge_trivia_master') === 'true' ? 'Perfect score' : 'No perfect score yet'
    },
    {
      id: 'genre_explorer',
      name: 'Genre Explorer',
      description: 'Add 5+ favorite genres in preferences',
      icon: 'travel_explore',
      isUnlocked: favoriteGenres.length >= 5,
      tier: favoriteGenres.length >= 5 ? 'Unlocked' : 'Locked',
      requirement: 'Select 5 or more favorite genres in profile',
      progress: `${favoriteGenres.length} / 5 selected`
    },
    {
      id: 'collector',
      name: 'Collector',
      description: 'Build a watchlist of 10+ titles',
      icon: 'library_books',
      isUnlocked: watchlist.length >= 10,
      tier: watchlist.length >= 10 ? 'Unlocked' : 'Locked',
      requirement: 'Add 10 or more titles to your watchlist',
      progress: `${watchlist.length} / 10 titles`
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Answer 3 quiz questions under 3s',
      icon: 'bolt',
      isUnlocked: localStorage.getItem('cineverse_badge_speed_demon') === 'true',
      tier: localStorage.getItem('cineverse_badge_speed_demon') === 'true' ? 'Unlocked' : 'Locked',
      requirement: 'Answer 3 quiz questions under 3 seconds each in one run',
      progress: localStorage.getItem('cineverse_badge_speed_demon') === 'true' ? 'Completed' : 'Locked'
    }
  ];

  return (
    <div className="bg-level-0 min-h-screen pb-stack-lg page-transition">
      <main className="w-full pb-stack-lg pt-16">
        
        {/* Profile Hero Backdrop */}
        <section className="relative w-full h-[35vh] md:h-[45vh] min-h-[250px] flex items-end justify-center md:justify-start overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 opacity-35" 
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1574267431629-2e570f28a11d?q=80&w=1200&auto=format&fit=crop')` 
            }}
          ></div>
          <div className="absolute inset-0 w-full h-full hero-gradient z-10"></div>
          
          {/* Profile Info Row */}
          <div className="relative z-20 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-stack-lg flex flex-col md:flex-row items-center md:items-end gap-stack-lg md:gap-gutter text-center md:text-left">
            
            {/* Initials Avatar (Dynamic) */}
            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-primary-container shadow-[0_10px_30px_rgba(229,9,20,0.45)] flex items-center justify-center bg-primary-container text-[40px] md:text-[52px] font-extrabold text-white select-none shrink-0 group hover:scale-105 transition-transform duration-300">
              {initials}
            </div>

            {/* Text Content */}
            <div className="flex flex-col gap-stack-sm md:mb-2 max-w-full">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-none">
                  {user.username}
                </h1>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2 mt-2 text-xs">
                <span className="inline-flex items-center gap-1 bg-primary-container/10 text-primary-container border border-primary-container/30 px-3.5 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider backdrop-blur-sm w-fit self-center md:self-auto">
                  <span className="material-symbols-outlined text-[14px] filled-icon">stars</span>
                  CineVerse {user.membershipTier || 'Basic'}
                </span>
                <span className="text-secondary font-body-md text-body-md ml-2">{user.email}</span>
                <span className="text-secondary/65 ml-2 hidden md:inline">•</span>
                <span className="text-secondary/65 ml-2">Joined {joinedDate}</span>
              </div>
            </div>

          </div>
        </section>

        <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-stack-lg flex flex-col gap-stack-lg">
          
          {/* Quick Stats Row */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
            <div className="glass-panel rounded-xl p-stack-md flex flex-col items-center sm:items-start hover:scale-[1.02] transition-transform duration-300">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center mb-3 border border-outline-variant/20 text-secondary">
                <span className="material-symbols-outlined text-[20px]">movie</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1">Movies Watched</span>
              <span className="font-headline-md text-headline-md text-on-surface">{watchedStats?.moviesWatchedCount || 0}</span>
            </div>
            
            <div className="glass-panel rounded-xl p-stack-md flex flex-col items-center sm:items-start hover:scale-[1.02] transition-transform duration-300">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center mb-3 border border-outline-variant/20 text-secondary">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1">Watch Time</span>
              <span className="font-headline-md text-headline-md text-on-surface">{formatWatchTime(watchedStats?.totalWatchTimeMinutes)}</span>
            </div>

            <div className="glass-panel rounded-xl p-stack-md flex flex-col items-center sm:items-start hover:scale-[1.02] transition-transform duration-300">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center mb-3 border border-outline-variant/20 text-secondary">
                <span className="material-symbols-outlined text-[20px]">bookmark</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1">Watchlist size</span>
              <span className="font-headline-md text-headline-md text-on-surface">{watchlist.length}</span>
            </div>
          </section>

          {/* Achievements & Badges Shelf */}
          <section className="glass-panel rounded-3xl p-stack-lg flex flex-col gap-6 text-left border border-white/5 relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/10 rounded-full blur-[100px]"></div>
            
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="material-symbols-outlined text-primary-container text-[24px]">military_tech</span>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Achievements & Badges</h2>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-0.5">Showcase your cinematic journey milestones</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-2">
              {badges.map((badge) => {
                const tierColors = {
                  Bronze: 'from-amber-700 to-amber-900 border-amber-600/35 shadow-[0_0_15px_rgba(180,83,9,0.3)] text-amber-300',
                  Silver: 'from-slate-400 to-slate-600 border-slate-400/35 shadow-[0_0_15px_rgba(148,163,184,0.3)] text-slate-200',
                  Gold: 'from-yellow-500 to-amber-600 border-yellow-500/35 shadow-[0_0_15px_rgba(234,179,8,0.4)] text-yellow-100',
                  Platinum: 'from-teal-400 to-cyan-600 border-teal-400/35 shadow-[0_0_15px_rgba(20,184,166,0.4)] text-teal-100',
                  Unlocked: 'from-primary-container to-red-800 border-primary-container/35 shadow-[0_0_15px_rgba(229,9,20,0.3)] text-red-200',
                  Locked: 'from-white/5 to-white/5 border-white/5 text-secondary opacity-35'
                };

                const cardClass = badge.isUnlocked 
                  ? `bg-gradient-to-br ${tierColors[badge.tier || 'Unlocked']}`
                  : `glass-panel ${tierColors['Locked']}`;

                return (
                  <div 
                    key={badge.id}
                    className={`relative rounded-2xl p-4 border text-center flex flex-col items-center justify-between min-h-[140px] group transition-all duration-300 hover:scale-105 ${cardClass}`}
                  >
                    {/* Badge Icon */}
                    <div className="w-12 h-12 rounded-full bg-black/25 flex items-center justify-center relative">
                      {!badge.isUnlocked && (
                        <span className="material-symbols-outlined text-[14px] text-secondary absolute top-0.5 right-0.5">lock</span>
                      )}
                      <span className={`material-symbols-outlined text-[28px] ${badge.isUnlocked ? 'filled-icon' : ''}`}>
                        {badge.icon}
                      </span>
                    </div>

                    {/* Badge Info */}
                    <div className="mt-2 w-full">
                      <h4 className="text-xs font-black truncate">{badge.name}</h4>
                      {badge.isUnlocked && badge.tier !== 'Unlocked' && (
                        <span className="text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 bg-black/35 rounded-full mt-0.5 inline-block">
                          {badge.tier}
                        </span>
                      )}
                      <p className="text-[9px] text-secondary/90 leading-tight mt-1 line-clamp-2 md:group-hover:hidden transition-all">
                        {badge.description}
                      </p>
                      
                      {/* Hover / tooltip requirements */}
                      <div className="hidden md:group-hover:block text-[8px] text-white/95 leading-normal mt-1 transition-all">
                        <div className="font-bold border-t border-white/10 pt-1">Goal:</div>
                        <div>{badge.requirement}</div>
                        <div className="font-bold mt-1 font-mono">{badge.progress}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Preferences and settings Bento Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter text-left">
            
            {/* Left: Preferences */}
            <div className="glass-panel rounded-xl p-stack-lg flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3 mb-stack-md border-b border-outline-variant/20 pb-4">
                  <span className="material-symbols-outlined text-primary-container text-[24px]">tune</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Personalized Preferences</h2>
                </div>
                
                {/* Genres list */}
                <div className="mb-stack-lg mt-stack-sm">
                  <h3 className="font-label-md text-label-md text-secondary mb-4">Favorite Genres</h3>
                  <div className="flex flex-wrap gap-3">
                    {availableGenres.map((genre) => {
                      const isActive = favoriteGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          onClick={() => toggleGenre(genre)}
                          className={`px-4.5 py-1.5 rounded-full font-label-sm text-label-sm transition-all border duration-200 cursor-pointer ${
                            isActive 
                              ? 'bg-primary-container text-white border-primary-container shadow-[0_0_15px_rgba(229,9,20,0.3)]' 
                              : 'border-outline-variant text-secondary hover:border-white hover:text-white'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quality stream toggle */}
              <div className="mt-8 bg-surface-container-low rounded-lg p-stack-md border border-outline-variant/10 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="font-body-md text-body-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">4k</span>
                    Default Streaming Quality
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary">Auto-adjusts based on network speed</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
              </div>

            </div>

            {/* Right: Settings list */}
            <div className="glass-panel rounded-xl p-stack-lg flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-3 mb-stack-md border-b border-outline-variant/20 pb-4">
                  <span className="material-symbols-outlined text-secondary text-[24px]">settings</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Account Settings</h2>
                </div>
                
                <div className="flex flex-col gap-2 mt-stack-sm">
                  {/* Account Security */}
                  <div className="flex items-center justify-between p-stack-md rounded-lg hover:bg-surface-container-high transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/20">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary group-hover:text-primary-container transition-colors">
                        <span className="material-symbols-outlined">security</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-body-md text-body-md text-on-surface">Account Security</span>
                        <span className="font-label-sm text-label-sm text-secondary">Password, 2FA, Logged-in Devices</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </div>

                  {/* Notification Settings */}
                  <div className="flex items-center justify-between p-stack-md rounded-lg hover:bg-surface-container-high transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/20">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary group-hover:text-primary-container transition-colors">
                        <span className="material-symbols-outlined">notifications_active</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-body-md text-body-md text-on-surface">Notification Settings</span>
                        <span className="font-label-sm text-label-sm text-secondary">Email alerts, Mobile push, SMS alerts</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </div>

                  {/* Billing & Subscription */}
                  <div className="flex items-center justify-between p-stack-md rounded-lg hover:bg-surface-container-high transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/20">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary group-hover:text-primary-container transition-colors">
                        <span className="material-symbols-outlined">credit_card</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-body-md text-body-md text-on-surface">Billing & Subscription</span>
                        <span className="font-label-sm text-label-sm text-secondary">Manage billing and tier options</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </div>

                  {/* Help Center */}
                  <div className="flex items-center justify-between p-stack-md rounded-lg hover:bg-surface-container-high transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/20">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary group-hover:text-primary-container transition-colors">
                        <span className="material-symbols-outlined">help</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-body-md text-body-md text-on-surface">Help Center</span>
                        <span className="font-label-sm text-label-sm text-secondary">FAQs, Guides, Live chat support</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </div>

                </div>
              </div>
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}
