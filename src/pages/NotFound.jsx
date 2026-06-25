import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="bg-[#0F0F0F] text-on-surface min-h-screen flex flex-col font-body-md relative overflow-x-hidden">
      
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center pt-32 pb-16 px-margin-mobile md:px-margin-desktop relative z-10">
        {/* Abstract cinematic glow behind 404 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-2xl aspect-square rounded-full bg-primary-container/10 blur-[120px] pointer-events-none"></div>
        
        <div className="text-center max-w-2xl relative">
          <h1 className="text-[120px] md:text-[200px] font-extrabold leading-none tracking-tighter text-primary-container mb-stack-md select-none drop-shadow-[0_0_40px_rgba(229,9,20,0.4)]">
            404
          </h1>
          <h2 className="text-headline-lg font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-stack-sm text-on-surface">
            Looks like this scene got cut.
          </h2>
          <p className="text-body-lg font-body-lg text-secondary mb-stack-lg max-w-md mx-auto">
            The content you're looking for has been removed, or the link is broken. Let's get you back to the main feature.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center bg-primary-container text-white px-8 py-4 rounded-full font-label-md text-label-md font-bold hover:scale-105 transition-transform duration-200 active:scale-95 shadow-[0_10px_30px_rgba(229,9,20,0.3)] gap-2 group cursor-pointer"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Back to Home
          </Link>
        </div>
      </main>

    </div>
  );
}
