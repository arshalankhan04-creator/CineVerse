import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPopularPeople, getPersonProfileUrl } from '../services/tmdb';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';
import { useToast } from '../context/ToastContext';

export default function People() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadInitialPeople() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPopularPeople(1);
        setPeople(data.results || []);
        setTotalPages(data.total_pages || 1);
      } catch (err) {
        console.error('Error fetching popular people:', err);
        setError('Failed to load popular people. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    loadInitialPeople();
  }, []);

  const handleLoadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await getPopularPeople(nextPage);
      setPeople((prev) => [...prev, ...(data.results || [])]);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more people:', err);
      showToast('Failed to load more people.', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-level-0 min-h-screen pt-28 pb-16">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-left">
          <h1 className="text-headline-lg font-headline-lg md:text-display-lg md:font-display-lg font-extrabold text-on-background tracking-tight mb-8">
            Popular People
          </h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-gutter">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-[2/3] w-full bg-surface-container rounded-2xl animate-pulse"></div>
                <div className="h-4 bg-surface-container rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-surface-container rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} retryAction={() => window.location.reload()} />;
  }

  return (
    <div className="bg-level-0 min-h-screen pt-28 pb-16 page-transition text-left">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex-grow">
        
        {/* Header */}
        <header className="mb-stack-lg relative">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-container/10 rounded-full blur-[100px]"></div>
          <h1 className="text-headline-lg font-headline-lg md:text-display-lg md:font-display-lg font-extrabold text-on-background tracking-tight">
            Popular People
          </h1>
          <p className="text-body-lg font-body-lg text-secondary mt-stack-sm max-w-2xl leading-relaxed">
            Discover the trending actors, directors, and crew shaping the landscape of cinema and television today.
          </p>
        </header>

        {/* People Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-gutter">
          {people.map((person) => {
            const knownForTitles = (person.known_for || [])
              .map((item) => item.title || item.name)
              .filter(Boolean)
              .join(', ');

            return (
              <div 
                key={person.id}
                onClick={() => navigate(`/person/${person.id}`)}
                className="group bg-surface-container-low rounded-2xl overflow-hidden shadow-lg hover:scale-[1.03] transition-all duration-300 border border-outline-variant/10 cursor-pointer flex flex-col justify-between"
              >
                {/* Person Photo */}
                <div className="aspect-[2/3] w-full bg-surface-container overflow-hidden relative">
                  <img 
                    src={getPersonProfileUrl(person.profile_path)} 
                    alt={person.name} 
                    className="w-full h-full object-cover group-hover:opacity-85 transition-opacity duration-300"
                    loading="lazy"
                  />
                  {person.popularity && (
                    <div className="absolute top-3 right-3 glass-panel rounded-full px-2 py-0.5 flex items-center gap-0.5 text-[10px] font-bold text-primary-container shadow-md border border-primary-container/20">
                      <span className="material-symbols-outlined text-[12px] filled-icon">trending_up</span>
                      <span>{Math.round(person.popularity)}</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-gradient-to-b from-transparent to-black/10">
                  <div>
                    <h3 className="text-label-lg font-bold text-on-background group-hover:text-primary-container transition-colors duration-200 line-clamp-1">
                      {person.name}
                    </h3>
                    <p className="text-[11px] text-secondary font-medium mt-1 line-clamp-2 leading-relaxed" title={knownForTitles}>
                      {knownForTitles || person.known_for_department}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination/Load More */}
        {page < totalPages && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3.5 rounded-full bg-surface-container border border-white/10 hover:border-white/20 text-on-background hover:bg-white/5 font-bold text-xs tracking-wider uppercase transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-background/25 border-t-on-background rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  <span>Load More Personalities</span>
                </>
              )}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
