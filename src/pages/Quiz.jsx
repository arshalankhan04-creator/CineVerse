import { useState, useEffect } from 'react';
import { getTrendingMovies, getMoviePosterUrl } from '../services/tmdb';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Quiz() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const data = await api.getLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err.message);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    // Load highscore
    const savedHighScore = localStorage.getItem('cineverse_quiz_highscore') || '0';
    setHighScore(parseInt(savedHighScore, 10));
    fetchLeaderboard();

    async function loadTrendingData() {
      try {
        setLoading(true);
        setError(null);
        const res = await getTrendingMovies();
        const validMovies = (res.results || []).filter(m => m.poster_path && m.overview && m.release_date && m.vote_average);
        setMovies(validMovies);
      } catch (err) {
        console.error('Error loading data for quiz:', err);
        setError('Failed to load movie database for quiz.');
      } finally {
        setLoading(false);
      }
    }
    loadTrendingData();
  }, []);

  const generateQuiz = () => {
    if (movies.length < 5) {
      showToast('Not enough movies to generate quiz.', 'error');
      return;
    }

    const generatedQuestions = [];
    const totalQuestions = 10;
    
    for (let i = 0; i < totalQuestions; i++) {
      // Pick a random question type: 0 = Higher rating, 1 = Older release, 2 = Guess by Overview, 3 = Guess the Year
      const type = Math.floor(Math.random() * 4);
      
      if (type === 0) {
        // Compare Ratings
        const movieA = movies[Math.floor(Math.random() * movies.length)];
        let movieB = movies[Math.floor(Math.random() * movies.length)];
        while (movieB.id === movieA.id || movieB.vote_average === movieA.vote_average) {
          movieB = movies[Math.floor(Math.random() * movies.length)];
        }

        const isACorrect = movieA.vote_average > movieB.vote_average;
        generatedQuestions.push({
          type: 0,
          text: `Which movie has a higher average rating?`,
          choices: [
            { id: 'A', text: movieA.title, movie: movieA },
            { id: 'B', text: movieB.title, movie: movieB }
          ],
          correctId: isACorrect ? 'A' : 'B',
          explanation: `"${movieA.title}" has a rating of ${movieA.vote_average.toFixed(1)} while "${movieB.title}" is rated ${movieB.vote_average.toFixed(1)}.`
        });
      } 
      else if (type === 1) {
        // Compare Release Dates (Which is older?)
        const movieA = movies[Math.floor(Math.random() * movies.length)];
        let movieB = movies[Math.floor(Math.random() * movies.length)];
        while (movieB.id === movieA.id || new Date(movieB.release_date).getFullYear() === new Date(movieA.release_date).getFullYear()) {
          movieB = movies[Math.floor(Math.random() * movies.length)];
        }

        const dateA = new Date(movieA.release_date);
        const dateB = new Date(movieB.release_date);
        const isAOlder = dateA < dateB;
        
        generatedQuestions.push({
          type: 1,
          text: `Which movie was released first (older)?`,
          choices: [
            { id: 'A', text: movieA.title, movie: movieA },
            { id: 'B', text: movieB.title, movie: movieB }
          ],
          correctId: isAOlder ? 'A' : 'B',
          explanation: `"${movieA.title}" was released in ${dateA.getFullYear()} and "${movieB.title}" was released in ${dateB.getFullYear()}.`
        });
      }
      else if (type === 2) {
        // Guess by Overview
        const targetMovie = movies[Math.floor(Math.random() * movies.length)];
        const choicesPool = [targetMovie];
        
        while (choicesPool.length < 4) {
          const rand = movies[Math.floor(Math.random() * movies.length)];
          if (!choicesPool.some(m => m.id === rand.id)) {
            choicesPool.push(rand);
          }
        }

        // Shuffle choices
        const shuffledChoices = choicesPool
          .map((m, idx) => ({ key: idx, m }))
          .sort(() => Math.random() - 0.5)
          .map((item, idx) => ({
            id: String.fromCharCode(65 + idx), // A, B, C, D
            text: item.m.title,
            movie: item.m
          }));

        const correctChoice = shuffledChoices.find(c => c.movie.id === targetMovie.id);

        generatedQuestions.push({
          type: 2,
          text: `Identify the movie from this description:\n"${targetMovie.overview.slice(0, 160)}..."`,
          choices: shuffledChoices,
          correctId: correctChoice.id,
          explanation: `This describes "${targetMovie.title}".`
        });
      }
      else {
        // Guess the Year
        const targetMovie = movies[Math.floor(Math.random() * movies.length)];
        const correctYear = new Date(targetMovie.release_date).getFullYear();
        
        // Generate 3 alternate years
        const years = new Set([correctYear]);
        while (years.size < 4) {
          const shift = Math.floor(Math.random() * 9) - 4; // -4 to +4 years
          years.add(correctYear + shift);
        }

        const shuffledYears = Array.from(years)
          .sort(() => Math.random() - 0.5)
          .map((y, idx) => ({
            id: String.fromCharCode(65 + idx),
            text: String(y),
            isCorrect: y === correctYear
          }));

        const correctChoice = shuffledYears.find(c => c.isCorrect);

        generatedQuestions.push({
          type: 3,
          text: `In what year was the movie "${targetMovie.title}" released?`,
          choices: shuffledYears,
          correctId: correctChoice.id,
          explanation: `"${targetMovie.title}" was released in ${correctYear}.`
        });
      }
    }

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setQuizFinished(false);
    setIsPlaying(true);
  };

  const handleSelectAnswer = (choiceId) => {
    if (isAnswered) return;
    setSelectedAnswer(choiceId);
    setIsAnswered(true);

    const question = questions[currentIndex];
    const isCorrect = choiceId === question.correctId;
    if (isCorrect) {
      setScore(prev => prev + 1);
      showToast('Correct! +1 Point', 'success');
    } else {
      showToast('Incorrect answer!', 'info');
    }
  };

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Finish Quiz
      setIsPlaying(false);
      setQuizFinished(true);
      
      // Update highscore
      if (score > highScore) {
        localStorage.setItem('cineverse_quiz_highscore', score.toString());
        setHighScore(score);
        showToast('New High Score! 🎉', 'success');
      }

      // Submit score to database if logged in
      if (user) {
        try {
          await api.submitScore(score, 'Movie Trivia');
          fetchLeaderboard();
        } catch (err) {
          console.error('Failed to submit score to server:', err.message);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-level-0 min-h-screen pt-24 pb-12">
        <SkeletonLoader type="home" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} retryAction={() => window.location.reload()} />;
  }

  return (
    <div className="bg-level-0 min-h-screen pt-24 pb-stack-lg page-transition text-left">
      <main className="w-full max-w-2xl mx-auto px-margin-mobile">
        
        {/* State 1: Dashboard / Start Screen */}
        {!isPlaying && !quizFinished && (
          <div className="glass-panel rounded-3xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[400px] border border-white/5 relative overflow-hidden">
            {/* Ambient Red Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-container/20 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary-container/10 rounded-full blur-[100px]"></div>

            <span className="material-symbols-outlined text-[72px] text-primary-container drop-shadow-[0_0_15px_rgba(229,9,20,0.5)]">quiz</span>
            
            <h1 className="text-display-lg-mobile md:text-display-lg font-extrabold text-on-background mt-4 tracking-tight">
              CineVerse Trivia
            </h1>
            
            <p className="text-body-md text-secondary mt-2 max-w-sm leading-relaxed">
              Test your cinema knowledge! Identify trends, match release dates, and recognize summaries from the movie database.
            </p>

            {/* Stats Row */}
            <div className="flex gap-10 mt-6 mb-6">
              <div className="text-center">
                <p className="text-label-sm text-secondary font-bold uppercase tracking-wider">High Score</p>
                <p className="text-display-lg-mobile font-black text-primary-container font-mono">{highScore} / 10</p>
              </div>
            </div>

            <button
              onClick={generateQuiz}
              className="bg-primary-container text-white text-label-md font-bold px-10 py-4 rounded-full shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_30px_rgba(229,9,20,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              Start Playing
            </button>

            {/* Leaderboard Table */}
            <div className="w-full mt-10 text-left border-t border-white/10 pt-8">
              <h3 className="text-body-md font-bold text-on-background mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px] filled-icon">leaderboard</span>
                Global Leaderboard
              </h3>
              
              {loadingLeaderboard ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-primary-container/20 border-t-primary-container rounded-full animate-spin"></div>
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-xs text-secondary/60 text-center py-4">No scores posted yet. Be the first!</p>
              ) : (
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-black/10">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-secondary border-b border-white/5 font-bold uppercase tracking-wider text-[9px]">
                        <th className="px-4 py-2.5 text-center w-16">Rank</th>
                        <th className="px-4 py-2.5">Player</th>
                        <th className="px-4 py-2.5 text-right w-24">Score</th>
                        <th className="px-4 py-2.5 text-right w-24">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.slice(0, 5).map((entry, idx) => {
                        const date = new Date(entry.playedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        const isFirst = idx === 0;
                        const isSecond = idx === 1;
                        const isThird = idx === 2;
                        
                        return (
                          <tr key={entry._id || idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-2.5 text-center font-bold">
                              {isFirst ? (
                                <span className="text-[14px]">🥇</span>
                              ) : isSecond ? (
                                <span className="text-[14px]">🥈</span>
                              ) : isThird ? (
                                <span className="text-[14px]">🥉</span>
                              ) : (
                                <span className="text-secondary/70">{idx + 1}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-on-background">{entry.username}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-primary-container">{entry.score} / 10</td>
                            <td className="px-4 py-2.5 text-right text-secondary/50">{date}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* State 2: Active Playing Screen */}
        {isPlaying && questions.length > 0 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header info / progress */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-label-sm text-secondary uppercase font-bold tracking-wider">CineVerse Trivia</p>
                <h2 className="text-headline-md font-extrabold text-on-background mt-1">
                  Question {currentIndex + 1} of {questions.length}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-label-sm text-secondary font-bold uppercase">Score</p>
                <p className="text-headline-lg font-black font-mono text-primary-container">{score}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary-container h-full transition-all duration-300 shadow-[0_0_10px_rgba(229,9,20,0.5)]"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            {/* Question Card */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 border border-white/5">
              <p className="text-body-lg md:text-[20px] font-bold text-on-background leading-relaxed whitespace-pre-line">
                {questions[currentIndex].text}
              </p>

              {/* Poster comparisons if type 0 or 1 */}
              {(questions[currentIndex].type === 0 || questions[currentIndex].type === 1) && (
                <div className="grid grid-cols-2 gap-4 my-2">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/5 bg-surface-container relative">
                    <img 
                      src={getMoviePosterUrl(questions[currentIndex].choices[0].movie.poster_path)} 
                      alt="Choice A" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center font-bold text-white border border-white/10 text-xs">
                      A
                    </div>
                  </div>
                  <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/5 bg-surface-container relative">
                    <img 
                      src={getMoviePosterUrl(questions[currentIndex].choices[1].movie.poster_path)} 
                      alt="Choice B" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center font-bold text-white border border-white/10 text-xs">
                      B
                    </div>
                  </div>
                </div>
              )}

              {/* Choice Buttons */}
              <div className="flex flex-col gap-3">
                {questions[currentIndex].choices.map(choice => {
                  const isCorrectAnswer = choice.id === questions[currentIndex].correctId;
                  const isUserSelection = choice.id === selectedAnswer;
                  
                  let buttonStyle = 'bg-surface-container border-white/5 text-on-background hover:bg-white/5 hover:border-white/20';
                  
                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      buttonStyle = 'bg-green-600/25 border-green-500 text-green-200 shadow-[0_0_15px_rgba(34,197,94,0.15)]';
                    } else if (isUserSelection) {
                      buttonStyle = 'bg-red-600/20 border-red-500 text-red-200 animate-shake';
                    } else {
                      buttonStyle = 'bg-transparent border-white/5 text-secondary opacity-60';
                    }
                  }

                  return (
                    <button
                      key={choice.id}
                      disabled={isAnswered}
                      onClick={() => handleSelectAnswer(choice.id)}
                      className={`w-full py-4 px-5 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between cursor-pointer ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center font-mono text-xs text-secondary-fixed">
                          {choice.id}
                        </span>
                        <span>{choice.text}</span>
                      </div>
                      
                      {isAnswered && isCorrectAnswer && (
                        <span className="material-symbols-outlined text-green-400">check_circle</span>
                      )}
                      {isAnswered && isUserSelection && !isCorrectAnswer && (
                        <span className="material-symbols-outlined text-red-400">cancel</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation section */}
              {isAnswered && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 animate-fade-in mt-2">
                  <h4 className="text-label-sm uppercase font-bold text-primary-container">Explanation</h4>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    {questions[currentIndex].explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Next Button */}
            {isAnswered && (
              <button
                onClick={handleNextQuestion}
                className="w-full py-4 rounded-2xl bg-primary-container text-white font-bold text-sm shadow-[0_4px_12px_rgba(229,9,20,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>
        )}

        {/* State 3: Game Over Screen */}
        {quizFinished && (
          <div className="glass-panel rounded-3xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[400px] border border-white/5 relative overflow-hidden animate-fade-in">
            {/* Ambient Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-container/20 rounded-full blur-[100px]"></div>

            <span className="material-symbols-outlined text-[72px] text-tertiary drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] filled-icon">
              {score >= 8 ? 'emoji_events' : score >= 5 ? 'military_tech' : 'sentiment_neutral'}
            </span>

            <h1 className="text-display-lg-mobile md:text-display-lg font-black text-on-background mt-4 tracking-tight">
              {score >= 8 ? 'Masterpiece!' : score >= 5 ? 'Not Bad!' : 'Keep Practicing!'}
            </h1>
            
            <p className="text-body-md text-secondary mt-1">
              You scored <span className="font-bold text-on-background">{score}</span> out of <span className="font-bold text-on-background">10</span> questions.
            </p>

            {/* Score Ring */}
            <div className="relative w-36 h-36 flex items-center justify-center my-8 bg-surface-container rounded-full border border-white/5 shadow-inner">
              <span className="text-display-lg font-black font-mono text-primary-container drop-shadow-md">
                {score * 10}%
              </span>
            </div>

            {/* High score comparison */}
            {score === highScore && score > 0 && (
              <div className="bg-primary-container/10 border border-primary-container/30 px-6 py-2 rounded-full text-xs font-bold text-primary-container flex items-center gap-1.5 mb-6 animate-pulse">
                <span className="material-symbols-outlined text-[16px]">celebration</span>
                New High Score Reached!
              </div>
            )}

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setQuizFinished(false)}
                className="flex-1 py-3.5 rounded-full border border-outline text-on-surface hover:bg-white/5 font-bold text-xs transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
              <button
                onClick={generateQuiz}
                className="flex-1 py-3.5 rounded-full bg-primary-container text-white hover:bg-primary-container/95 shadow-lg font-bold text-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
