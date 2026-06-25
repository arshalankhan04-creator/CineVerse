import { Link } from 'react-router-dom';

export default function ErrorDisplay({ error, retryAction }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="glass-panel p-8 rounded-xl max-w-md border-primary-container/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <span className="material-symbols-outlined text-[64px] text-primary-container mb-4">
          error
        </span>
        <h2 className="text-headline-md font-bold mb-2 text-on-surface">
          Connection Interrupted
        </h2>
        <p className="text-secondary mb-6 text-body-md leading-relaxed">
          {error || 'We had trouble communicating with the server. Please verify your internet connection or check your TMDB API key.'}
        </p>
        <div className="flex gap-4 justify-center">
          {retryAction && (
            <button 
              onClick={retryAction}
              className="bg-primary-container text-white px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all font-bold text-label-md shadow-[0_4px_14px_rgba(229,9,20,0.4)] cursor-pointer"
            >
              Try Again
            </button>
          )}
          <Link 
            to="/" 
            className="glass-panel text-on-surface px-6 py-2.5 rounded-full hover:bg-white/5 hover:scale-105 active:scale-95 transition-all font-bold text-label-md cursor-pointer"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
