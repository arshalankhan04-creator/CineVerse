import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getPersonDetails, 
  getPersonCredits, 
  getPersonProfileUrl, 
  getMoviePosterUrl, 
  getPersonExternalIds 
} from '../services/tmdb';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';

export default function PersonDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [rawCredits, setRawCredits] = useState([]);
  const [popularCredits, setPopularCredits] = useState([]);
  const [socialIds, setSocialIds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Custom interactive states
  const [bioExpanded, setBioExpanded] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [availableDepartments, setAvailableDepartments] = useState([]);

  useEffect(() => {
    async function loadPersonData() {
      try {
        setLoading(true);
        setError(null);
        
        const [detailsRes, creditsRes, externalIdsRes] = await Promise.all([
          getPersonDetails(id),
          getPersonCredits(id),
          getPersonExternalIds(id).catch(() => ({}))
        ]);

        setPerson(detailsRes);
        setSocialIds(externalIdsRes);

        // Normalize credits data (cast + crew combined)
        const castCredits = (creditsRes.cast || []).map(item => ({
          ...item,
          department: 'Acting',
          job: item.character ? `as ${item.character}` : 'Actor'
        }));
        
        const crewCredits = (creditsRes.crew || []).map(item => ({
          ...item,
          department: item.department || 'Crew',
          job: item.job || 'Crew'
        }));

        const allCredits = [...castCredits, ...crewCredits];
        setRawCredits(allCredits);

        // Extract available unique departments dynamically
        const depts = new Set();
        allCredits.forEach(c => {
          if (c.department) depts.add(c.department);
        });
        setAvailableDepartments(Array.from(depts).sort());

        // Deduplicate credits by ID for the "Known For" slider
        const uniqueCreditsMap = {};
        allCredits.forEach(item => {
          if (!uniqueCreditsMap[item.id]) {
            uniqueCreditsMap[item.id] = item;
          }
        });
        const uniqueCredits = Object.values(uniqueCreditsMap);

        // Sort by vote count to get the "Popular/Notable" credits
        const sortedByPopular = [...uniqueCredits].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
        setPopularCredits(sortedByPopular.slice(0, 10));

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

  // Calculate age
  const age = person.birthday
    ? new Date().getFullYear() - new Date(person.birthday).getFullYear() - (
        new Date() < new Date(new Date().getFullYear(), new Date(person.birthday).getMonth(), new Date(person.birthday).getDate()) ? 1 : 0
      )
    : null;

  // Biography truncation
  const hasLongBio = person.biography && person.biography.length > 350;
  const displayBio = bioExpanded 
    ? person.biography 
    : (hasLongBio ? `${person.biography.slice(0, 350)}...` : person.biography || `We don't have a biography for ${person.name} yet.`);

  // Dynamically filter combined filmography credits
  const filteredCredits = rawCredits.filter(item => {
    const isTV = item.media_type === 'tv' || (!item.title && item.name);
    
    // Media type filter
    if (selectedMediaType === 'movie' && isTV) return false;
    if (selectedMediaType === 'tv' && !isTV) return false;

    // Department filter
    if (selectedDepartment !== 'all' && item.department !== selectedDepartment) return false;

    return true;
  });

  // Sort filtered timeline chronologically descending
  const sortedTimeline = [...filteredCredits].sort((a, b) => {
    const dateA = new Date(a.release_date || a.first_air_date || '1970-01-01');
    const dateB = new Date(b.release_date || b.first_air_date || '1970-01-01');
    return dateB - dateA;
  });

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

            {/* Social Links */}
            {socialIds && (socialIds.instagram_id || socialIds.twitter_id || socialIds.imdb_id) && (
              <div className="flex items-center gap-5 justify-center w-full py-2 border-b border-white/5 pb-4">
                {socialIds.instagram_id && (
                  <a 
                    href={`https://instagram.com/${socialIds.instagram_id}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-secondary hover:text-primary-container transition-colors"
                    title="Instagram Profile"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                )}
                {socialIds.twitter_id && (
                  <a 
                    href={`https://twitter.com/${socialIds.twitter_id}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-secondary hover:text-primary-container transition-colors"
                    title="Twitter/X Profile"
                  >
                    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
                {socialIds.imdb_id && (
                  <a 
                    href={`https://www.imdb.com/name/${socialIds.imdb_id}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:scale-105 active:scale-95 transition-all shrink-0"
                    title="IMDb Profile"
                  >
                    <span className="font-extrabold text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded font-sans tracking-tighter shadow-md">IMDb</span>
                  </a>
                )}
              </div>
            )}

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
            <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col">
              <h2 className="text-headline-md font-bold text-on-background mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary-container">person</span>
                Biography
              </h2>
              <p className="text-body-md text-secondary leading-relaxed whitespace-pre-line">
                {displayBio}
              </p>
              {hasLongBio && (
                <button 
                  onClick={() => setBioExpanded(!bioExpanded)} 
                  className="text-primary-container hover:underline font-bold text-xs mt-3 self-start flex items-center gap-1 cursor-pointer"
                >
                  <span>{bioExpanded ? 'Read Less' : 'Read More'}</span>
                  <span className="material-symbols-outlined text-[14px]">
                    {bioExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              )}
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
                            {item.job && (
                              <p className="text-[11px] text-secondary truncate mt-0.5" title={item.job}>
                                {item.job}
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

            {/* Filmography Timeline with Dropdown Filters */}
            {rawCredits.length > 0 && (
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 mb-4 gap-4">
                  <h2 className="text-headline-md font-bold text-on-background flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container">history</span>
                    Filmography
                  </h2>

                  {/* Filters dropdown list */}
                  <div className="flex gap-3 items-center">
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[9px] uppercase font-bold text-secondary tracking-wider">Format</label>
                      <select
                        value={selectedMediaType}
                        onChange={(e) => setSelectedMediaType(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] font-bold text-on-background focus:outline-none focus:border-primary-container cursor-pointer transition-colors"
                      >
                        <option value="all" className="bg-level-2 text-on-background">All Formats</option>
                        <option value="movie" className="bg-level-2 text-on-background">Movies</option>
                        <option value="tv" className="bg-level-2 text-on-background">TV Shows</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[9px] uppercase font-bold text-secondary tracking-wider">Department</label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] font-bold text-on-background focus:outline-none focus:border-primary-container cursor-pointer transition-colors"
                      >
                        <option value="all" className="bg-level-2 text-on-background">All Departments</option>
                        {availableDepartments.map(dept => (
                          <option key={dept} value={dept} className="bg-level-2 text-on-background">{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                  {sortedTimeline.length === 0 ? (
                    <p className="text-secondary text-sm text-center py-12">No credits match the selected filters.</p>
                  ) : (
                    sortedTimeline.map((item, index) => {
                      const isTV = item.media_type === 'tv' || (!item.title && item.name);
                      const linkUrl = isTV ? `/tv/${item.id}` : `/movie/${item.id}`;
                      const displayTitle = item.title || item.name;
                      const dateVal = item.release_date || item.first_air_date;
                      const yearVal = dateVal ? new Date(dateVal).getFullYear() : '—';
                      const role = item.job || '';

                      return (
                        <div 
                          key={`${item.media_type || 'credit'}-${item.id}-${index}`}
                          className="flex gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors items-center"
                        >
                          <span className="w-12 text-body-md font-bold text-primary-container font-mono text-center shrink-0">
                            {yearVal}
                          </span>
                          
                          <div className="flex-grow text-left overflow-hidden">
                            <Link 
                              to={linkUrl}
                              className="text-body-md font-bold text-on-background hover:text-primary-container transition-colors block truncate"
                            >
                              {displayTitle}
                            </Link>
                            {role && <p className="text-xs text-secondary mt-0.5 truncate">{role}</p>}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded border border-outline-variant/35 bg-surface-container text-secondary">
                              {item.department}
                            </span>
                            <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-primary-container/10 border border-primary-container/20 text-primary-container">
                              {isTV ? 'TV' : 'Movie'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
