import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingMovies, getUpcomingTVShows, getMoviePosterUrl } from '../services/tmdb';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';
import { useToast } from '../context/ToastContext';

export default function Calendar() {
  const { showToast } = useToast();
  const [timeline, setTimeline] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const REMINDERS_KEY = 'cineverse_calendar_reminders';

  useEffect(() => {
    // Load reminders
    const saved = JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]');
    setReminders(saved);

    async function loadCalendarData() {
      try {
        setLoading(true);
        setError(null);

        const [moviesRes, tvRes] = await Promise.all([
          getUpcomingMovies(),
          getUpcomingTVShows()
        ]);

        const movies = (moviesRes.results || []).map(m => ({
          ...m,
          media_type: 'movie',
          release_date: m.release_date || 'N/A'
        }));

        const tv = (tvRes.results || []).map(t => ({
          ...t,
          media_type: 'tv',
          release_date: t.first_air_date || 'N/A' // Map TV date to release_date for sorting
        }));

        // Combine and filter out items without valid dates
        const combined = [...movies, ...tv].filter(item => item.release_date && item.release_date !== 'N/A');

        // Sort chronologically ascending (future first)
        const sorted = combined.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
        
        // Filter out release dates older than, say, 2 weeks ago to focus on fresh/upcoming releases
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        const freshReleases = sorted.filter(item => new Date(item.release_date) >= twoWeeksAgo);

        setTimeline(freshReleases.slice(0, 20)); // Limit to top 20 upcoming

      } catch (err) {
        console.error('Error fetching calendar data:', err);
        setError('Failed to load upcoming release calendar.');
      } finally {
        setLoading(false);
      }
    }

    loadCalendarData();
  }, []);

  const handleToggleReminder = (e, item) => {
    e.preventDefault();
    e.stopPropagation();

    const isReminded = reminders.some(r => r.id === item.id);
    let updated;
    if (isReminded) {
      updated = reminders.filter(r => r.id !== item.id);
      showToast(`Reminder removed for "${item.title || item.name}"`, 'info');
    } else {
      updated = [...reminders, { id: item.id, title: item.title || item.name, date: item.release_date, type: item.media_type }];
      showToast(`Reminder set! We'll alert you on release.`, 'success');
    }
    setReminders(updated);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    return { day, month, weekday };
  };

  if (loading) {
    return (
      <div className="bg-level-0 min-h-screen pt-24 pb-12">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <h1 className="text-display-lg-mobile md:text-display-lg font-black text-on-background text-left">Loading release timeline...</h1>
          <SkeletonLoader type="home" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} retryAction={() => window.location.reload()} />;
  }

  return (
    <div className="bg-level-0 min-h-screen pt-24 pb-stack-lg page-transition text-left">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        
        {/* Header */}
        <div className="border-b border-white/5 pb-4 mb-8">
          <h1 className="text-display-lg-mobile md:text-display-lg font-extrabold text-on-background tracking-tight">
            Release Calendar
          </h1>
          <p className="text-body-md text-secondary mt-1">
            Stay up to date with theatrical premieres and upcoming television seasons.
          </p>
        </div>

        {timeline.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
            <span className="material-symbols-outlined text-[64px] text-secondary/35">calendar_today</span>
            <h2 className="text-headline-md font-bold text-on-background mt-4">Calendar is Empty</h2>
            <p className="text-secondary max-w-sm mt-2 text-sm leading-relaxed">
              No upcoming releases could be fetched right now. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
            
            {/* Timeline Column */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {timeline.map((item) => {
                const isReminded = reminders.some(r => r.id === item.id);
                const { day, month, weekday } = formatDate(item.release_date);
                const displayTitle = item.title || item.name;
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                
                return (
                  <Link
                    key={`${item.media_type}-${item.id}`}
                    to={item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`}
                    className="flex gap-4 md:gap-6 bg-surface-container-low/40 border border-white/5 hover:border-primary-container/30 hover:bg-white/5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-2xl p-4 transition-all duration-300 items-center group cursor-pointer"
                  >
                    {/* Calendar Badge */}
                    <div className="w-14 h-16 md:w-16 md:h-18 rounded-xl bg-surface-container border border-white/10 flex flex-col items-center justify-center font-mono shrink-0 shadow-inner group-hover:border-primary-container/50 transition-colors">
                      <span className="text-[10px] md:text-label-sm uppercase font-bold text-primary-container">{month}</span>
                      <span className="text-headline-md md:text-headline-lg font-black text-on-background -mt-0.5 leading-none">{day}</span>
                      <span className="text-[8px] md:text-[9px] text-secondary uppercase font-bold mt-0.5">{weekday}</span>
                    </div>

                    {/* Poster thumbnail */}
                    <div className="w-12 h-18 rounded overflow-hidden border border-white/5 shrink-0 bg-surface-container aspect-[2/3]">
                      <img src={getMoviePosterUrl(item.poster_path)} alt={displayTitle} className="w-full h-full object-cover" />
                    </div>

                    {/* Movie Info Details */}
                    <div className="flex-grow overflow-hidden text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-secondary">
                          {item.media_type === 'tv' ? 'TV' : 'Movie'}
                        </span>
                        {rating !== 'N/A' && rating !== '0.0' && (
                          <span className="text-[10px] font-bold text-tertiary flex items-center gap-0.5">
                            <span className="material-symbols-outlined filled-icon text-[11px]">star</span>
                            {rating}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-body-md font-bold text-on-background group-hover:text-primary-container transition-colors truncate mt-1">
                        {displayTitle}
                      </h3>
                      
                      <p className="text-xs text-secondary line-clamp-1 mt-0.5 leading-normal">
                        {item.overview || 'No overview description available.'}
                      </p>
                    </div>

                    {/* Set Reminder Button */}
                    <button
                      onClick={(e) => handleToggleReminder(e, item)}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 shadow-md ${
                        isReminded 
                          ? 'bg-primary-container text-white border-primary-container shadow-[0_0_15px_rgba(229,9,20,0.35)]' 
                          : 'bg-transparent border-white/10 text-secondary hover:text-white hover:border-white/20'
                      }`}
                      title={isReminded ? 'Reminder Active' : 'Set Release Reminder'}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${isReminded ? 'filled-icon' : ''}`}>
                        {isReminded ? 'notifications_active' : 'notifications'}
                      </span>
                    </button>

                  </Link>
                );
              })}
            </div>

            {/* Sidebar Active Reminders List */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5 text-left h-full">
              <h3 className="text-body-lg font-bold text-on-background border-b border-white/5 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">notifications</span>
                Your Active Reminders
              </h3>
              
              <div className="flex flex-col gap-3 mt-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                {reminders.length === 0 ? (
                  <p className="text-secondary text-xs text-center py-8">
                    No active release alerts set. Toggle the bell icon on the timeline to get notified!
                  </p>
                ) : (
                  reminders.map(rem => (
                    <div 
                      key={`${rem.type}-${rem.id}`} 
                      className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-left hover:bg-white/10 transition-colors"
                    >
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-on-background truncate max-w-[160px]">{rem.title}</h4>
                        <p className="text-[10px] text-secondary mt-0.5">
                          Releasing: {new Date(rem.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-[9px] font-black uppercase text-primary-container px-2 py-0.5 rounded bg-primary-container/15 border border-primary-container/20 tracking-wider">
                        {rem.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
