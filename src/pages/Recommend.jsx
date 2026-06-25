import { useState } from 'react';
import { discoverMovies, discoverTVShows, getMoviePosterUrl } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../context/ToastContext';

export default function Recommend() {
  const { showToast } = useToast();
  
  // Wizard steps: 1 = Type, 2 = Genres, 3 = Era, 4 = Min Rating, 5 = Results
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState('movie'); // movie or tv
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [era, setEra] = useState('modern'); // classic, golden, modern
  const [minRating, setMinRating] = useState(7.0); // 6.0, 7.0, 8.0
  
  // Results
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Genre Options depending on media type
  const genreOptions = mediaType === 'movie' 
    ? [
        { id: 28, name: 'Action', icon: 'explosion' },
        { id: 35, name: 'Comedy', icon: 'mood' },
        { id: 18, name: 'Drama', icon: 'theater_comedy' },
        { id: 878, name: 'Sci-Fi', icon: 'rocket_launch' },
        { id: 27, name: 'Horror', icon: 'skull' },
        { id: 53, name: 'Thriller', icon: 'insights' },
        { id: 10749, name: 'Romance', icon: 'favorite' }
      ]
    : [
        { id: 10759, name: 'Action & Adventure', icon: 'explosion' },
        { id: 35, name: 'Comedy', icon: 'mood' },
        { id: 18, name: 'Drama', icon: 'theater_comedy' },
        { id: 10765, name: 'Sci-Fi & Fantasy', icon: 'rocket_launch' },
        { id: 9648, name: 'Mystery', icon: 'visibility' },
        { id: 80, name: 'Crime', icon: 'gavel' },
        { id: 16, name: 'Animation', icon: 'animation' }
      ];

  const handleToggleGenre = (genreId) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(prev => prev.filter(id => id !== genreId));
    } else {
      setSelectedGenres(prev => [...prev, genreId]);
    }
  };

  const getRecommendations = async () => {
    setLoading(true);
    setStep(5);
    try {
      const queryParams = {
        page: 1,
        'vote_average.gte': minRating,
        'vote_count.gte': 150 // Ensure they have enough ratings for quality
      };

      // Set genre filters
      if (selectedGenres.length > 0) {
        queryParams.with_genres = selectedGenres.join(',');
      }

      // Set era date ranges
      if (mediaType === 'movie') {
        if (era === 'classic') {
          queryParams['release_date.lte'] = '1999-12-31';
        } else if (era === 'golden') {
          queryParams['release_date.gte'] = '2000-01-01';
          queryParams['release_date.lte'] = '2015-12-31';
        } else {
          queryParams['release_date.gte'] = '2016-01-01';
        }
      } else {
        if (era === 'classic') {
          queryParams['first_air_date.lte'] = '1999-12-31';
        } else if (era === 'golden') {
          queryParams['first_air_date.gte'] = '2000-01-01';
          queryParams['first_air_date.lte'] = '2015-12-31';
        } else {
          queryParams['first_air_date.gte'] = '2016-01-01';
        }
      }

      let res;
      if (mediaType === 'movie') {
        res = await discoverMovies(queryParams);
      } else {
        res = await discoverTVShows(queryParams);
      }

      // Sort by popularity and take first 8
      const sorted = (res.results || []).sort((a, b) => b.popularity - a.popularity);
      setResults(sorted.slice(0, 8));

      if (sorted.length === 0) {
        showToast('No matches found. Try relaxing your filters!', 'info');
      } else {
        showToast(`Found ${sorted.slice(0, 8).length} matches!`, 'success');
      }

    } catch (err) {
      console.error(err);
      showToast('Error discovering movies/shows.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedGenres([]);
    setEra('modern');
    setMinRating(7.0);
    setResults([]);
  };

  return (
    <div className="bg-level-0 min-h-screen pt-24 pb-stack-lg page-transition text-left">
      <main className="w-full max-w-4xl mx-auto px-margin-mobile">
        
        {/* Header */}
        <div className="border-b border-white/5 pb-4 mb-6">
          <h1 className="text-display-lg-mobile md:text-display-lg font-extrabold text-on-background tracking-tight">
            Recommendation Wizard
          </h1>
          <p className="text-body-md text-secondary mt-1">
            Let's find the perfect title based on your current preferences.
          </p>
        </div>

        {/* Wizard Progress Indicator */}
        {step < 5 && (
          <div className="flex items-center gap-2 mb-8 bg-surface-container/30 px-4 py-3 rounded-full border border-white/5 w-fit">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-primary-container text-white' : 'bg-surface-container text-secondary'}`}>1</span>
            <span className="text-[10px] uppercase font-bold text-secondary">Format</span>
            <span className="text-secondary/30 text-xs">/</span>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-primary-container text-white' : 'bg-surface-container text-secondary'}`}>2</span>
            <span className="text-[10px] uppercase font-bold text-secondary">Genres</span>
            <span className="text-secondary/30 text-xs">/</span>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-primary-container text-white' : 'bg-surface-container text-secondary'}`}>3</span>
            <span className="text-[10px] uppercase font-bold text-secondary">Era</span>
            <span className="text-secondary/30 text-xs">/</span>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-primary-container text-white' : 'bg-surface-container text-secondary'}`}>4</span>
            <span className="text-[10px] uppercase font-bold text-secondary">Rating</span>
          </div>
        )}

        {/* Step 1: Media Type */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-headline-md font-bold text-on-background">What format are you in the mood for?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => { setMediaType('movie'); setStep(2); }}
                className="glass-panel p-8 rounded-3xl flex flex-col items-center gap-4 hover:border-primary-container/40 hover:bg-white/5 cursor-pointer text-center group transition-all duration-300"
              >
                <span className="material-symbols-outlined text-[64px] text-primary-container group-hover:scale-110 transition-transform">movie</span>
                <div>
                  <h3 className="text-body-lg font-bold text-on-background">Feature Movies</h3>
                  <p className="text-xs text-secondary mt-1 max-w-[200px]">Full length cinema movies and stories.</p>
                </div>
              </button>

              <button
                onClick={() => { setMediaType('tv'); setStep(2); }}
                className="glass-panel p-8 rounded-3xl flex flex-col items-center gap-4 hover:border-primary-container/40 hover:bg-white/5 cursor-pointer text-center group transition-all duration-300"
              >
                <span className="material-symbols-outlined text-[64px] text-primary-container group-hover:scale-110 transition-transform">live_tv</span>
                <div>
                  <h3 className="text-body-lg font-bold text-on-background">TV Shows & Series</h3>
                  <p className="text-xs text-secondary mt-1 max-w-[200px]">Episodic series, seasons, and dramas.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Genres */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-headline-md font-bold text-on-background">Which genres speak to you?</h2>
            <p className="text-xs text-secondary -mt-3">Select one or more genres to narrow your recommendations.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {genreOptions.map(g => {
                const isSelected = selectedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => handleToggleGenre(g.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-start gap-3 hover:scale-105 active:scale-95 ${
                      isSelected 
                        ? 'bg-primary-container/10 border-primary-container text-primary-container font-bold shadow-[0_0_15px_rgba(229,9,20,0.15)]' 
                        : 'bg-surface-container border-white/5 text-on-background hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">{g.icon}</span>
                    <span className="text-xs font-bold">{g.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-full border border-outline text-on-surface hover:bg-white/5 font-bold text-xs cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-8 py-3 rounded-full bg-primary-container text-white hover:bg-primary-container/95 font-bold text-xs shadow-lg cursor-pointer transition-transform hover:scale-105"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Vibe/Era */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-headline-md font-bold text-on-background">Choose your timeline vibe</h2>
            
            <div className="flex flex-col gap-3">
              {[
                { id: 'classic', title: 'Vintage Classics', desc: 'Pre-2000 classics, standard film history gold.', icon: 'history' },
                { id: 'golden', title: 'Golden Millennial Era', desc: 'Released between 2000 and 2015, modern blockbusters and series.', icon: 'star' },
                { id: 'modern', title: 'Modern Releases', desc: 'Released from 2016 onwards, state-of-the-art cinematic titles.', icon: 'new_releases' }
              ].map(item => {
                const isSelected = era === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setEra(item.id)}
                    className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                      isSelected 
                        ? 'bg-primary-container/10 border-primary-container text-on-background font-bold shadow-[0_0_15px_rgba(229,9,20,0.15)]' 
                        : 'bg-surface-container border-white/5 text-secondary hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px] text-primary-container mt-1">{item.icon}</span>
                    <div>
                      <h3 className="text-body-md font-bold text-on-background">{item.title}</h3>
                      <p className="text-xs text-secondary mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-full border border-outline text-on-surface hover:bg-white/5 font-bold text-xs cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-8 py-3 rounded-full bg-primary-container text-white hover:bg-primary-container/95 font-bold text-xs shadow-lg cursor-pointer transition-transform hover:scale-105"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Quality/Rating */}
        {step === 4 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-headline-md font-bold text-on-background">Select minimum rating score</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { val: 6.0, title: 'Casual Entertainment', desc: 'Decent, easy watches (6.0+ average)', icon: 'sentiment_satisfied' },
                { val: 7.0, title: 'Certified Good', desc: 'Highly rated, critic-approved (7.0+ average)', icon: 'thumb_up' },
                { val: 8.0, title: 'Cinematic Masterpieces', desc: 'Legendary storytelling only (8.0+ average)', icon: 'emoji_events' }
              ].map(item => {
                const isSelected = minRating === item.val;
                return (
                  <button
                    key={item.val}
                    onClick={() => setMinRating(item.val)}
                    className={`p-6 rounded-2xl border text-center flex flex-col items-center gap-3 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      isSelected 
                        ? 'bg-primary-container/10 border-primary-container text-on-background font-bold shadow-[0_0_15px_rgba(229,9,20,0.15)]' 
                        : 'bg-surface-container border-white/5 text-secondary hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[36px] text-primary-container">{item.icon}</span>
                    <div>
                      <h3 className="text-body-md font-bold text-on-background">{item.title}</h3>
                      <p className="text-xs text-secondary mt-1">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-full border border-outline text-on-surface hover:bg-white/5 font-bold text-xs cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                onClick={getRecommendations}
                className="px-8 py-3 rounded-full bg-primary-container text-white hover:bg-primary-container/95 font-bold text-xs shadow-lg cursor-pointer transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">magic_button</span>
                Discover Matches
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Results Screen */}
        {step === 5 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-headline-md font-extrabold text-on-background">Your Recommendations</h2>
                <p className="text-xs text-secondary mt-0.5">Custom compiled matching matches.</p>
              </div>
              <button
                onClick={handleReset}
                className="glass-panel text-on-background px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Reset survey
              </button>
            </div>

            {loading ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <SkeletonLoader type="home" />
              </div>
            ) : results.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <span className="material-symbols-outlined text-[64px] text-secondary/40">sentiment_dissatisfied</span>
                <h3 className="text-body-lg font-bold text-on-background mt-4">No Matches Found</h3>
                <p className="text-secondary max-w-sm mt-2 text-xs leading-relaxed">
                  Your combination of filters was too strict for our database. Try relaxing the rating or decade era options to discover more entries.
                </p>
                <button
                  onClick={handleReset}
                  className="mt-6 px-6 py-2.5 rounded-full bg-primary-container text-white hover:bg-primary-container/95 font-bold text-xs transition-colors cursor-pointer"
                >
                  Restart Survey
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-gutter mt-2">
                {results.map((item, index) => (
                  <MovieCard key={item.id} movie={item} showRating={true} index={index} />
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
