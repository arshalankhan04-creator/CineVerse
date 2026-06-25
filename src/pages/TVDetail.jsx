import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getTVShowDetails, 
  getTVShowCredits, 
  getTVShowVideos,
  getMoviePosterUrl,
  getMovieBackdropUrl,
  getTVShowRecommendations,
  getTVShowImages,
  getTVShowReviews
} from '../services/tmdb';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';
import { useToast } from '../context/ToastContext';
import CollectionModal from '../components/CollectionModal';
import MovieCard from '../components/MovieCard';

export default function TVDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  
  // Data states
  const [show, setShow] = useState(null);
  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);
  const [trailerKey, setTrailerKey] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [stills, setStills] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  // Custom reviews
  const [userReviewName, setUserReviewName] = useState('');
  const [userReviewContent, setUserReviewContent] = useState('');
  const [customReviews, setCustomReviews] = useState([]);

  // Modals & controls
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [activeStill, setActiveStill] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const WATCHLIST_KEY = 'cineverse_watchlist';

  useEffect(() => {
    async function loadTVData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch detailed TV info, credits, videos, recommendations, images, and reviews
        const [
          tvDetails, 
          creditsRes, 
          videosRes, 
          recRes, 
          imagesRes, 
          reviewsRes
        ] = await Promise.all([
          getTVShowDetails(id),
          getTVShowCredits(id),
          getTVShowVideos(id),
          getTVShowRecommendations(id),
          getTVShowImages(id),
          getTVShowReviews(id)
        ]);

        setShow(tvDetails);
        setCast(creditsRes.cast?.slice(0, 6) || []);

        // Filter for key crew members (specifically creators/executive producers)
        const keyCrewJobs = ['Executive Producer', 'Director', 'Writer', 'Producer', 'Creator'];
        const keyCrew = creditsRes.crew?.filter(c => keyCrewJobs.includes(c.job)) || [];
        const uniqueCrew = [];
        const seenCrewIds = new Set();
        keyCrew.forEach(c => {
          if (!seenCrewIds.has(c.id)) {
            seenCrewIds.add(c.id);
            uniqueCrew.push(c);
          }
        });
        setCrew(uniqueCrew.slice(0, 6));

        // Find YouTube trailer
        const trailer = videosRes.results?.find(
          v => v.type === 'Trailer' && v.site === 'YouTube'
        ) || videosRes.results?.find(
          v => v.type === 'Trailer'
        );

        if (trailer) {
          setTrailerKey(trailer.key);
        } else {
          setTrailerKey('');
        }

        // Recommendations, stills, and reviews
        setRecommendations(recRes.results?.slice(0, 8) || []);
        setStills(imagesRes.backdrops?.slice(0, 10) || []);
        setReviews(reviewsRes.results || []);

        // Custom reviews
        const localReviews = JSON.parse(localStorage.getItem(`cineverse_reviews_${id}`) || '[]');
        setCustomReviews(localReviews);

        // Check if saved in watchlist
        const savedList = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
        const exists = savedList.some(m => m.id === tvDetails.id);
        setIsSaved(exists);

      } catch (err) {
        console.error('Error fetching TV details:', err);
        setError(err.message || 'Failed to load TV show details.');
      } finally {
        setLoading(false);
      }
    }

    loadTVData();
  }, [id]);

  // Escape key closes modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsTrailerOpen(false);
        setActiveStill(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleWatchlist = () => {
    if (!show) return;
    const savedList = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
    let newList;
    if (isSaved) {
      newList = savedList.filter(m => m.id !== show.id);
      setIsSaved(false);
      showToast('Removed ✗', 'info');
    } else {
      newList = [...savedList, {
        id: show.id,
        name: show.name,
        poster_path: show.poster_path,
        vote_average: show.vote_average,
        first_air_date: show.first_air_date
      }];
      setIsSaved(true);
      showToast('Added to Watchlist ✓', 'success');
    }
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
    window.dispatchEvent(new Event('watchlist_updated'));
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!userReviewName.trim() || !userReviewContent.trim()) return;

    const newReview = {
      id: Date.now().toString(),
      author: userReviewName.trim(),
      content: userReviewContent.trim(),
      created_at: new Date().toISOString(),
      custom: true
    };

    const updated = [newReview, ...customReviews];
    setCustomReviews(updated);
    localStorage.setItem(`cineverse_reviews_${id}`, JSON.stringify(updated));
    
    setUserReviewName('');
    setUserReviewContent('');
    showToast('Review posted successfully!', 'success');
  };

  if (loading) {
    return (
      <div className="bg-level-0 min-h-screen pt-24 pb-12">
        <SkeletonLoader type="detail" />
      </div>
    );
  }

  if (error || !show) {
    return <ErrorDisplay error={error} retryAction={() => window.location.reload()} />;
  }

  const releaseYear = show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A';
  const displayRating = show.vote_average ? show.vote_average.toFixed(1) : 'N/A';

  return (
    <div className="bg-level-0 min-h-screen pb-stack-lg page-transition">
      <main className="w-full relative">
        
        {/* Hero Section with Backdrop */}
        <section className="relative w-full h-[65vh] md:h-[80vh] min-h-[500px] flex items-end">
          {/* Backdrop Image */}
          <div className="absolute inset-0 z-0">
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${getMovieBackdropUrl(show.backdrop_path)})` }}
            ></div>
            <div className="absolute inset-0 hero-gradient z-10"></div>
            <div className="absolute inset-0 bg-black/45 z-10"></div>
          </div>

          {/* Hero Content Area */}
          <div className="relative z-20 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-margin-desktop flex flex-col md:flex-row gap-gutter items-end">
            
            {/* Floating Poster */}
            <div className="w-[200px] md:w-[280px] shrink-0 transform md:translate-y-24 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden border border-outline-variant/20 z-30 hidden md:block aspect-[2/3] bg-surface-container">
              <img 
                alt={`${show.name} Poster`} 
                className="w-full h-full object-cover" 
                src={getMoviePosterUrl(show.poster_path)} 
              />
            </div>

            {/* TV details summary */}
            <div className="flex-1 flex flex-col items-start gap-stack-sm pb-stack-md md:pb-0 text-left">
              <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-on-background drop-shadow-lg leading-tight font-extrabold">
                {show.name}
              </h1>
              
              {show.tagline && (
                <p className="text-[16px] md:text-headline-md font-medium text-secondary italic drop-shadow-md max-w-2xl">
                  "{show.tagline}"
                </p>
              )}

              {/* Meta Info Row */}
              <div className="flex flex-wrap items-center gap-stack-md mt-stack-sm text-label-md font-label-md text-secondary-fixed">
                <span className="px-3 py-1 rounded-full border border-outline/50 bg-black/40 backdrop-blur-md">
                  {releaseYear}
                </span>
                
                {show.number_of_seasons && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                    {show.number_of_seasons} {show.number_of_seasons === 1 ? 'Season' : 'Seasons'}
                  </span>
                )}
                
                <div className="flex flex-wrap items-center gap-2 max-w-[300px] sm:max-w-none">
                  {show.genres?.map((genre, idx) => (
                    <span key={genre.id} className="hover:text-primary-container transition-colors">
                      {genre.name}{idx < show.genres.length - 1 ? ' •' : ''}
                    </span>
                  ))}
                </div>

                {displayRating !== 'N/A' && (
                  <div className="flex items-center gap-1 text-tertiary-fixed font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-tertiary-fixed/30">
                    <span className="material-symbols-outlined filled-icon text-[18px] text-tertiary">star</span>
                    {displayRating}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-stack-md mt-stack-lg w-full">
                <button 
                  onClick={toggleWatchlist}
                  className={`text-label-md font-label-md py-3.5 px-7 rounded-full flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_4px_14px_rgba(0,0,0,0.3)] cursor-pointer ${
                    isSaved 
                      ? 'bg-transparent border border-outline hover:bg-white/5 text-on-surface' 
                      : 'bg-primary-container text-on-primary-container hover:bg-primary-container/95 shadow-[0_0_15px_rgba(229,9,20,0.45)]'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isSaved ? 'filled-icon' : ''}`}>
                    {isSaved ? 'bookmark_added' : 'bookmark'}
                  </span>
                  {isSaved ? 'Saved to List' : 'Add to Watchlist'}
                </button>

                <button 
                  onClick={() => setIsCollectionOpen(true)}
                  className="glass-panel text-on-background text-label-md font-label-md py-3.5 px-4 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer"
                  title="Add to Custom Collection"
                >
                  <span className="material-symbols-outlined text-[20px]">playlist_add</span>
                </button>

                {trailerKey && (
                  <button 
                    onClick={() => setIsTrailerOpen(true)}
                    className="glass-panel text-on-background text-label-md font-label-md py-3.5 px-7 rounded-full flex items-center gap-2 transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined filled-icon text-primary-container">play_circle</span>
                    Play Trailer
                  </button>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Details & Cast Content Row */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-stack-lg md:mt-32 flex flex-col lg:flex-row gap-gutter">
          
          {/* Mobile Floating Poster */}
          <div className="w-full max-w-[200px] mx-auto mb-stack-md block md:hidden rounded-lg overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.7)] aspect-[2/3]">
            <img 
              alt={`${show.name} Poster`} 
              className="w-full h-full object-cover" 
              src={getMoviePosterUrl(show.poster_path)} 
            />
          </div>

          {/* Left Column: Overview & facts */}
          <div className="flex-grow lg:max-w-2xl flex flex-col gap-6 text-left">
            <div className="glass-panel rounded-xl p-stack-lg">
              <h2 className="text-headline-md font-headline-md text-on-background mb-stack-sm flex items-center gap-2 border-b border-white/5 pb-3">
                <span className="material-symbols-outlined text-primary-container">info</span>
                Overview
              </h2>
              <p className="text-[17px] leading-relaxed text-secondary mt-3">
                {show.overview || 'No description available for this TV show.'}
              </p>
            </div>

            {/* TV Show Production Facts */}
            <div className="glass-panel rounded-xl p-stack-lg">
              <h2 className="text-headline-md font-headline-md text-on-background mb-stack-sm flex items-center gap-2 border-b border-white/5 pb-3">
                <span className="material-symbols-outlined text-primary-container">live_tv</span>
                TV Show Metadata
              </h2>
              <div className="grid grid-cols-2 gap-4 mt-4 text-left">
                <div>
                  <h3 className="text-label-sm text-secondary font-bold">Status</h3>
                  <p className="text-body-md text-on-background">{show.status}</p>
                </div>
                <div>
                  <h3 className="text-label-sm text-secondary font-bold">Original Language</h3>
                  <p className="text-body-md text-on-background uppercase">{show.original_language}</p>
                </div>
                <div>
                  <h3 className="text-label-sm text-secondary font-bold">Total Seasons</h3>
                  <p className="text-body-md text-on-background">{show.number_of_seasons}</p>
                </div>
                <div>
                  <h3 className="text-label-sm text-secondary font-bold">Total Episodes</h3>
                  <p className="text-body-md text-on-background">{show.number_of_episodes}</p>
                </div>
                {show.type && (
                  <div>
                    <h3 className="text-label-sm text-secondary font-bold">Show Type</h3>
                    <p className="text-body-md text-on-background">{show.type}</p>
                  </div>
                )}
                {show.first_air_date && (
                  <div>
                    <h3 className="text-label-sm text-secondary font-bold">First Aired</h3>
                    <p className="text-body-md text-on-background">{new Date(show.first_air_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Networks */}
              {show.networks?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-label-sm text-secondary font-bold mb-3">Broadcast Networks</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    {show.networks.slice(0, 4).map(net => (
                      <span key={net.id} className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-secondary font-medium">
                        {net.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Cast & Crew */}
          <div className="flex-[1.2] w-full overflow-hidden flex flex-col gap-6">
            
            {/* Cast Section */}
            <div>
              <h2 className="text-headline-md font-headline-md text-on-background mb-stack-sm px-2 border-b border-white/5 pb-3 ml-2 text-left">
                Top Cast
              </h2>
              {cast.length === 0 ? (
                <p className="text-secondary p-4 text-center">Cast information not available.</p>
              ) : (
                <div 
                  className="flex overflow-x-auto gap-stack-md pb-stack-lg pt-stack-sm px-2 snap-x scrollbar-hide" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {cast.map(member => (
                    <Link 
                      key={member.id} 
                      to={`/person/${member.id}`}
                      className="min-w-[130px] md:min-w-[150px] bg-surface-container-low rounded-lg overflow-hidden shadow-lg snap-start hover:scale-105 transition-transform duration-300 border border-outline-variant/10 group cursor-pointer block shrink-0"
                    >
                      <div className="aspect-[3/4] w-full bg-surface-container overflow-hidden">
                        <img 
                          alt={member.name} 
                          className="w-full h-full object-cover group-hover:opacity-85 transition-opacity" 
                          src={member.profile_path 
                            ? `https://image.tmdb.org/t/p/w185${member.profile_path}` 
                            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
                          } 
                        />
                      </div>
                      <div className="p-stack-sm text-left">
                        <h3 className="text-label-md font-label-md text-on-background truncate group-hover:text-primary-container transition-colors">
                          {member.name}
                        </h3>
                        <p className="text-label-sm font-label-sm text-secondary truncate">
                          {member.character}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Key Crew Section */}
            {crew.length > 0 && (
              <div>
                <h2 className="text-headline-md font-headline-md text-on-background mb-stack-sm px-2 border-b border-white/5 pb-3 ml-2 text-left">
                  Key Crew
                </h2>
                <div className="grid grid-cols-2 gap-3 p-2">
                  {crew.map(c => (
                    <Link to={`/person/${c.id}`} key={`${c.id}-${c.job}`} className="flex items-center gap-3 bg-surface-container-low hover:bg-white/5 p-2 rounded-xl border border-white/5 transition-all">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-surface-container">
                        <img 
                          src={c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                          alt={c.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="overflow-hidden text-left">
                        <h4 className="text-xs font-bold text-on-background truncate">{c.name}</h4>
                        <p className="text-[10px] text-secondary truncate">{c.job}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </section>

        {/* Stills Gallery Section */}
        {stills.length > 0 && (
          <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-stack-lg border-t border-white/5 pt-8 text-left">
            <h2 className="text-headline-md font-bold text-on-background mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">photo_library</span>
              TV Show Stills & Imagery
            </h2>
            <div 
              className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {stills.map((still, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveStill(still.file_path)}
                  className="min-w-[240px] md:min-w-[320px] aspect-video rounded-xl overflow-hidden shadow-md snap-start cursor-pointer hover:scale-102 hover:shadow-2xl border border-white/5 transition-all relative group shrink-0 bg-surface-container"
                >
                  <img 
                    src={`https://image.tmdb.org/t/p/w780${still.file_path}`} 
                    alt={`Still ${idx}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[32px]">fullscreen</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-stack-lg border-t border-white/5 pt-8 text-left">
            <h2 className="text-headline-md font-bold text-on-background mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">movie_filter</span>
              Recommended TV Shows
            </h2>
            <div 
              className="flex overflow-x-auto gap-gutter pt-4 pb-6 snap-x scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {recommendations.map((rec, index) => (
                <div key={rec.id} className="min-w-[160px] sm:min-w-[200px] snap-start flex-none">
                  <MovieCard movie={rec} showRating={true} index={index} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-stack-lg border-t border-white/5 pt-8 pb-12 text-left">
          <h2 className="text-headline-md font-bold text-on-background mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">forum</span>
            User Reviews & Discussions
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
            
            {/* Custom Review Form */}
            <form onSubmit={handleAddReview} className="glass-panel rounded-2xl p-6 flex flex-col gap-4 border border-white/5 text-left">
              <h3 className="text-body-lg font-bold text-on-background">Write a Review</h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-secondary tracking-wider">Your Name</label>
                <input 
                  type="text" 
                  placeholder="Alex Rivera"
                  value={userReviewName}
                  onChange={(e) => setUserReviewName(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-background focus:outline-none focus:border-primary-container transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-secondary tracking-wider">Your Thoughts</label>
                <textarea 
                  placeholder="Share your thoughts about this show..."
                  value={userReviewContent}
                  onChange={(e) => setUserReviewContent(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-background focus:outline-none focus:border-primary-container transition-colors resize-none"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-primary-container text-white text-xs font-bold rounded-xl hover:bg-primary-container/95 transition-all shadow-md active:scale-98 cursor-pointer text-center"
              >
                Post Review
              </button>
            </form>

            {/* List of reviews */}
            <div className="lg:col-span-2 flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
              {[...customReviews, ...reviews].length === 0 ? (
                <p className="text-secondary text-sm text-center py-12 bg-surface-container-low/20 rounded-2xl border border-white/5 border-dashed">
                  No reviews posted yet. Be the first to share your thoughts!
                </p>
              ) : (
                [...customReviews, ...reviews].map(r => (
                  <div key={r.id} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-primary-container">account_circle</span>
                        <span className="text-sm font-bold text-on-background">{r.author || r.author_details?.username}</span>
                        {r.custom && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary-container/15 text-primary-container border border-primary-container/20">CineVerse Critic</span>
                        )}
                      </div>
                      <span className="text-[10px] text-secondary">
                        {new Date(r.created_at || r.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-secondary whitespace-pre-line line-clamp-4 hover:line-clamp-none transition-all cursor-pointer" title="Click to read full review">
                      {r.content}
                    </p>
                  </div>
                ))
              )}
            </div>
            
          </div>
        </section>

      </main>

      {/* Trailer Modal Dialog */}
      {isTrailerOpen && trailerKey && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setIsTrailerOpen(false)}
        >
          <div 
            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 text-white/75 hover:text-white z-10 bg-black/40 hover:bg-black/80 rounded-full w-9 h-9 flex items-center justify-center transition-colors"
              onClick={() => setIsTrailerOpen(false)}
              aria-label="Close trailer"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title={`${show.name} Trailer`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Zoom Still Lightbox Modal */}
      {activeStill && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setActiveStill(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute -top-12 right-0 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              onClick={() => setActiveStill(null)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <img 
              src={`https://image.tmdb.org/t/p/original${activeStill}`} 
              alt="Zoomed TV Still" 
              className="w-full h-full object-contain rounded-lg border border-white/10 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Custom Collection Modal */}
      <CollectionModal 
        isOpen={isCollectionOpen} 
        onClose={() => setIsCollectionOpen(false)} 
        media={show} 
      />
    </div>
  );
}
