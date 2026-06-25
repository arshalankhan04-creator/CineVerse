import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPersonDetails, getPersonCredits, getPersonProfileUrl, getMoviePosterUrl } from '../services/tmdb';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';

export default function PersonDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState([]);
  const [popularCredits, setPopularCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPersonData() {
      try {
        setLoading(true);
        setError(null);
        
        const [detailsRes, creditsRes] = await Promise.all([
          getPersonDetails(id),
          getPersonCredits(id)
        ]);

        setPerson(detailsRes);

        // Sort credits by popularity/vote_count to show top ones
        const allCredits = [...(creditsRes.cast || []), ...(creditsRes.crew || [])];
        
        // Remove duplicates (e.g. if acted and crewed in same project)
        const uniqueCreditsMap = {};
        allCredits.forEach(item => {
          if (!uniqueCreditsMap[item.id]) {
            uniqueCreditsMap[item.id] = item;
          }
        });
        const uniqueCredits = Object.values(uniqueCreditsMap);

        // Sort by vote count to get the "Popular/Famous" credits
        const sortedByPopular = [...uniqueCredits].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
        setPopularCredits(sortedByPopular.slice(0, 10));

        // Filmography: sort by release date or first air date descending
        const sortedByDate = [...uniqueCredits].sort((a, b) => {
          const dateA = new Date(a.release_date || a.first_air_date || '1970-01-01');
          const dateB = new Date(b.release_date || b.first_air_date || '1970-01-01');
          return dateB - dateA;
        });
        setCredits(sortedByDate);

      } catch (err) {
        console.error('Error fetching person details:', err);
        setError(err.message || 'Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    }

    loadPersonData();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-level-0 min-h-screen pt-24 pb-12">
        <SkeletonLoader type="detail" />
      </div>
    );
  }

  if (error || !person) {
    return <ErrorDisplay error={error} retryAction={() => window.location.reload()} />;
  }

  const age = person.birthday
    ? new Date().getFullYear() - new Date(person.birthday).getFullYear() - (
        new Date() < new Date(new Date().getFullYear(), new Date(person.birthday).getMonth(), new Date(person.birthday).getDate()) ? 1 : 0
      )
    : null;

  return (
    <div className="bg-level-0 min-h-screen pt-24 pb-stack-lg page-transition">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        
        {/* Main profile row */}
        <div className="flex flex-col lg:flex-row gap-gutter mt-6">
          
          {/* Left Column: Image and Sidebar Info */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col items-center lg:items-start gap-stack-lg">
            
            {/* Profile Photo */}
            <div className="w-[220px] md:w-[280px] lg:w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-outline-variant/20 bg-surface-container">
              <img 
                src={getPersonProfileUrl(person.profile_path)} 
                alt={person.name} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Profile Stats Cards */}
            <div className="w-full glass-panel rounded-2xl p-6 flex flex-col gap-4 text-left">
              <h3 className="text-body-lg font-bold text-on-background border-b border-white/5 pb-2">
                Personal Info
              </h3>
              
              {person.known_for_department && (
                <div>
                  <h4 className="text-label-sm text-secondary font-medium">Known For</h4>
                  <p className="text-body-md text-on-background">{person.known_for_department}</p>
                </div>
              )}

              {person.birthday && (
                <div>
                  <h4 className="text-label-sm text-secondary font-medium">Born</h4>
                  <p className="text-body-md text-on-background">
                    {person.birthday} {age && `(Age ${age})`}
                  </p>
                </div>
              )}

              {person.deathday && (
                <div>
                  <h4 className="text-label-sm text-secondary font-medium">Died</h4>
                  <p className="text-body-md text-on-background">{person.deathday}</p>
                </div>
              )}

              {person.place_of_birth && (
                <div>
                  <h4 className="text-label-sm text-secondary font-medium">Place of Birth</h4>
                  <p className="text-body-md text-on-background">{person.place_of_birth}</p>
                </div>
              )}

              {person.popularity && (
                <div>
                  <h4 className="text-label-sm text-secondary font-medium">TMDB Score</h4>
                  <p className="text-body-md text-primary-container font-extrabold flex items-center gap-1">
                    <span className="material-symbols-outlined filled-icon text-[18px]">trending_up</span>
                    {person.popularity.toFixed(1)}
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Bio, Popular Credits, Filmography */}
          <div className="flex-1 flex flex-col gap-gutter text-left overflow-hidden">
            
            {/* Header info */}
            <div>
              <h1 className="text-display-lg-mobile md:text-display-lg font-extrabold text-on-background drop-shadow-md leading-tight">
                {person.name}
              </h1>
              {person.also_known_as && person.also_known_as.length > 0 && (
                <p className="text-label-md text-secondary font-medium mt-1">
                  Alias: {person.also_known_as.slice(0, 3).join(', ')}
                </p>
              )}
            </div>

            {/* Biography */}
            <div className="glass-panel rounded-2xl p-6 md:p-8">
              <h2 className="text-headline-md font-bold text-on-background mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary-container">person</span>
                Biography
              </h2>
              <p className="text-body-md text-secondary leading-relaxed whitespace-pre-line">
                {person.biography || `We don't have a biography for ${person.name} yet.`}
              </p>
            </div>

            {/* Known For Carousel */}
            {popularCredits.length > 0 && (
              <div>
                <h2 className="text-headline-md font-bold text-on-background mb-4 flex items-center gap-2 px-1">
                  <span className="material-symbols-outlined text-primary-container">star</span>
                  Known For
                </h2>
                
                <div 
                  className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {popularCredits.map(item => {
                    const isTV = item.media_type === 'tv' || (!item.title && item.name);
                    const linkUrl = isTV ? `/tv/${item.id}` : `/movie/${item.id}`;
                    const displayTitle = item.title || item.name;
                    const creditYear = item.release_date || item.first_air_date 
                      ? new Date(item.release_date || item.first_air_date).getFullYear() 
                      : '';
                    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

                    return (
                      <Link 
                        key={`${item.media_type || 'credit'}-${item.id}`} 
                        to={linkUrl}
                        className="min-w-[130px] md:min-w-[160px] bg-surface-container-low rounded-xl overflow-hidden shadow-lg snap-start hover:scale-105 transition-all duration-300 border border-outline-variant/10 group cursor-pointer flex flex-col"
                      >
                        <div className="aspect-[2/3] w-full bg-surface-container overflow-hidden relative">
                          <img 
                            src={getMoviePosterUrl(item.poster_path)} 
                            alt={displayTitle}
                            className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
                            loading="lazy"
                          />
                          {rating !== 'N/A' && (
                            <div className="absolute top-2 right-2 glass-panel rounded-full px-2 py-0.5 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px] text-tertiary filled-icon">star</span>
                              <span className="text-[10px] font-bold text-on-surface">{rating}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between text-left">
                          <div>
                            <h3 className="text-label-md font-bold text-on-background line-clamp-1 group-hover:text-primary-container transition-colors">
                              {displayTitle}
                            </h3>
                            {item.character && (
                              <p className="text-[11px] text-secondary truncate mt-0.5" title={item.character}>
                                as {item.character}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] text-secondary-fixed mt-1">{creditYear || 'N/A'}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filmography Timeline */}
            {credits.length > 0 && (
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-headline-md font-bold text-on-background mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                  <span className="material-symbols-outlined text-primary-container">history</span>
                  Filmography
                </h2>
                
                <div className="flex flex-col mt-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                  {credits.map((item, index) => {
                    const isTV = item.media_type === 'tv' || (!item.title && item.name);
                    const linkUrl = isTV ? `/tv/${item.id}` : `/movie/${item.id}`;
                    const displayTitle = item.title || item.name;
                    const dateVal = item.release_date || item.first_air_date;
                    const yearVal = dateVal ? new Date(dateVal).getFullYear() : '—';
                    const role = item.character ? `as ${item.character}` : item.job ? `(${item.job})` : '';

                    return (
                      <div 
                        key={`${item.media_type || 'credit'}-${item.id}-${index}`}
                        className="flex gap-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors items-center"
                      >
                        <span className="w-12 text-body-md font-bold text-primary-container font-mono text-center">
                          {yearVal}
                        </span>
                        
                        <div className="flex-1 text-left">
                          <Link 
                            to={linkUrl}
                            className="text-body-md font-bold text-on-background hover:text-primary-container transition-colors block"
                          >
                            {displayTitle}
                          </Link>
                          {role && <p className="text-xs text-secondary mt-0.5">{role}</p>}
                        </div>

                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-outline-variant/35 bg-surface-container text-secondary">
                          {isTV ? 'TV' : 'Movie'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
