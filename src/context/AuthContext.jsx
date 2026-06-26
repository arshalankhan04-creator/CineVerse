import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [watchedList, setWatchedList] = useState([]);
  const [watchedStats, setWatchedStats] = useState({ moviesWatchedCount: 0, totalWatchTimeMinutes: 0 });
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('cineverse_token');
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          
          // Fetch watchlist
          const list = await api.getWatchlist();
          setWatchlist(list);
          
          // Fetch watched data
          const wList = await api.getWatched();
          setWatchedList(wList);
          const wStats = await api.getWatchedStats();
          setWatchedStats(wStats);
          
          // Apply theme if saved in user profile
          if (profile.profileTheme && profile.profileTheme !== 'default') {
            applyThemeClass(profile.profileTheme);
          }
        } catch (err) {
          console.error('Session validation failed:', err.message);
          localStorage.removeItem('cineverse_token');
          setUser(null);
          setWatchlist([]);
          setWatchedList([]);
          setWatchedStats({ moviesWatchedCount: 0, totalWatchTimeMinutes: 0 });
        }
      } else {
        const localList = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]');
        setWatchlist(localList);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  useEffect(() => {
    const handleWatchlistUpdated = () => {
      if (!user) {
        const localList = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]');
        setWatchlist(localList);
      }
    };
    window.addEventListener('watchlist_updated', handleWatchlistUpdated);
    return () => {
      window.removeEventListener('watchlist_updated', handleWatchlistUpdated);
    };
  }, [user]);

  const applyThemeClass = (themeId) => {
    const THEMES = ['theme-emerald', 'theme-ocean', 'theme-amber', 'theme-purple'];
    THEMES.forEach(t => document.documentElement.classList.remove(t));
    if (themeId && themeId !== 'default') {
      document.documentElement.classList.add(`theme-${themeId}`);
    }
  };

  /**
   * Sync existing localStorage data to the cloud database on login/register
   */
  const syncLocalStorageData = async () => {
    // 1. Sync Watchlist
    const localWatchlist = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]');
    if (localWatchlist.length > 0) {
      try {
        for (const item of localWatchlist) {
          const formattedItem = {
            tmdbId: item.id,
            mediaType: item.mediaType || (item.title ? 'movie' : 'tv'),
            title: item.title || item.name,
            posterPath: item.poster_path || item.posterPath,
            rating: item.vote_average || item.rating,
          };
          await api.addToWatchlist(formattedItem);
        }
        localStorage.removeItem('cineverse_watchlist');
        showToast('Synced local watchlist to your account!', 'success');
      } catch (err) {
        console.error('Failed to sync watchlist:', err.message);
      }
    }

    // 2. Sync Custom Lists
    const localLists = JSON.parse(localStorage.getItem('cineverse_custom_lists') || '[]');
    if (localLists.length > 0) {
      try {
        for (const list of localLists) {
          const created = await api.createList(list.name, list.description);
          if (list.items && list.items.length > 0) {
            const formattedItems = list.items.map(item => ({
              tmdbId: item.id,
              mediaType: item.mediaType || (item.title ? 'movie' : 'tv'),
              title: item.title || item.name,
              posterPath: item.poster_path || item.posterPath,
            }));
            await api.updateListItems(created._id, formattedItems);
          }
        }
        localStorage.removeItem('cineverse_custom_lists');
        showToast('Synced custom collections to your account!', 'success');
      } catch (err) {
        console.error('Failed to sync lists:', err.message);
      }
    }
  };

  const loginUser = async (email, password) => {
    try {
      const hasLocalWatchlist = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]').length > 0;
      
      const data = await api.login(email, password);
      localStorage.setItem('cineverse_token', data.token);
      setUser(data.user);
      
      // Fetch user's watchlist and watched history
      const list = await api.getWatchlist();
      setWatchlist(list);
      const wList = await api.getWatched();
      setWatchedList(wList);
      const wStats = await api.getWatchedStats();
      setWatchedStats(wStats);

      // Apply user theme preference
      if (data.user.profileTheme) {
        applyThemeClass(data.user.profileTheme);
        localStorage.setItem('cineverse_theme', data.user.profileTheme);
      }

      showToast(`Welcome back, ${data.user.username}!`, 'success');
      setAuthModalOpen(false);

      // Perform local storage data sync
      await syncLocalStorageData();
      
      // Refresh watchlist from database after sync
      if (hasLocalWatchlist) {
        const syncedList = await api.getWatchlist();
        setWatchlist(syncedList);
      }

      // Dispatch event to notify layout/pages
      window.dispatchEvent(new Event('profile_updated'));
      window.dispatchEvent(new Event('watchlist_updated'));
      window.dispatchEvent(new Event('lists_updated'));
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const registerUser = async (username, email, password) => {
    try {
      const data = await api.register(username, email, password);
      localStorage.setItem('cineverse_token', data.token);
      setUser(data.user);
      setWatchlist([]);

      showToast(`Account created! Welcome, ${data.user.username}!`, 'success');
      setAuthModalOpen(false);

      // Sync local storage items if any exist
      await syncLocalStorageData();

      // Dispatch events
      window.dispatchEvent(new Event('profile_updated'));
      window.dispatchEvent(new Event('watchlist_updated'));
      window.dispatchEvent(new Event('lists_updated'));
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('cineverse_token');
    setUser(null);
    setWatchlist([]);
    setWatchedList([]);
    setWatchedStats({ moviesWatchedCount: 0, totalWatchTimeMinutes: 0 });
    showToast('Logged out successfully', 'info');
    
    // Clear theme
    document.documentElement.classList.remove('theme-emerald', 'theme-ocean', 'theme-amber', 'theme-purple');
    localStorage.removeItem('cineverse_theme');

    // Trigger local updates
    window.dispatchEvent(new Event('profile_updated'));
    window.dispatchEvent(new Event('watchlist_updated'));
    window.dispatchEvent(new Event('lists_updated'));
  };

  const updateProfileTheme = async (themeId) => {
    try {
      await api.updateProfileTheme(themeId);
      setUser(prev => prev ? { ...prev, profileTheme: themeId } : prev);
      applyThemeClass(themeId);
    } catch (err) {
      showToast(err.message || 'Failed to update theme', 'error');
    }
  };

  const toggleWatchlist = async (movie) => {
    const movieId = movie.id || movie.tmdbId;
    const titleText = movie.title || movie.name;
    const posterPath = movie.poster_path || movie.posterPath;
    const ratingValue = movie.vote_average || movie.rating;
    const mediaType = movie.media_type || movie.mediaType || (movie.first_air_date || movie.name ? 'tv' : 'movie');

    if (!user) {
      // Local Storage Toggle
      const list = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]');
      const isAlreadyIn = list.some(item => item.id === movieId);
      let updated;
      if (isAlreadyIn) {
        updated = list.filter(item => item.id !== movieId);
        showToast('Removed from Watchlist ✗', 'info');
      } else {
        updated = [...list, { 
          id: movieId, 
          title: movie.title, 
          name: movie.name, 
          poster_path: posterPath, 
          vote_average: ratingValue, 
          release_date: movie.release_date, 
          first_air_date: movie.first_air_date 
        }];
        showToast('Added to Watchlist ✓', 'success');
      }
      localStorage.setItem('cineverse_watchlist', JSON.stringify(updated));
      setWatchlist(updated);
      window.dispatchEvent(new Event('watchlist_updated'));
      return;
    }

    // Database Toggle
    const isAlreadyInDb = watchlist.some(item => item.tmdbId === movieId);
    try {
      if (isAlreadyInDb) {
        await api.removeFromWatchlist(movieId);
        setWatchlist(prev => prev.filter(item => item.tmdbId !== movieId));
        showToast('Removed from Watchlist ✗', 'info');
      } else {
        const newItem = {
          tmdbId: movieId,
          mediaType,
          title: titleText,
          posterPath,
          rating: ratingValue || 0
        };
        await api.addToWatchlist(newItem);
        setWatchlist(prev => [...prev, newItem]);
        showToast('Added to Watchlist ✓', 'success');
      }
      window.dispatchEvent(new Event('watchlist_updated'));
    } catch (err) {
      showToast(err.message || 'Failed to update watchlist', 'error');
    }
  };

  const toggleWatched = async (movie, runtime = 0) => {
    if (!user) {
      showToast('Please sign in to track watched history', 'info');
      setAuthModalOpen(true);
      return;
    }

    const movieId = movie.id || movie.tmdbId;
    const isAlreadyWatched = watchedList.some(item => item.tmdbId === movieId);
    
    try {
      if (isAlreadyWatched) {
        await api.removeFromWatched(movieId);
        setWatchedList(prev => prev.filter(item => item.tmdbId !== movieId));
        showToast('Removed from Watched History', 'info');
      } else {
        const titleText = movie.title || movie.name;
        const posterPath = movie.poster_path || movie.posterPath;
        const mediaType = movie.media_type || movie.mediaType || (movie.first_air_date || movie.name ? 'tv' : 'movie');

        const newItem = await api.addToWatched({
          tmdbId: movieId,
          mediaType,
          title: titleText,
          posterPath,
          runtime
        });
        setWatchedList(prev => [newItem, ...prev]);
        showToast('Marked as Watched ✓', 'success');
      }
      
      // Update stats
      const stats = await api.getWatchedStats();
      setWatchedStats(stats);
      window.dispatchEvent(new Event('watched_updated'));
    } catch (err) {
      showToast(err.message || 'Failed to update watched history', 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        watchlist,
        loading,
        authModalOpen,
        setAuthModalOpen,
        loginUser,
        registerUser,
        logoutUser,
        toggleWatchlist,
        toggleWatched,
        watchedList,
        watchedStats,
        setUser,
        updateProfileTheme
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
