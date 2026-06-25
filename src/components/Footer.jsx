import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full py-stack-lg px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center border-t border-outline-variant/10 bg-surface-container-lowest mt-auto z-10 relative">
      <Link 
        to="/" 
        className="text-label-md font-label-md font-bold text-primary-container mb-4 md:mb-0 hover:scale-105 transition-transform"
      >
        CineVerse
      </Link>
      
      <div className="flex gap-stack-lg mb-4 md:mb-0">
        <a className="text-label-sm font-label-sm text-on-secondary-container hover:text-primary-container transition-colors" href="#">Terms of Service</a>
        <a className="text-label-sm font-label-sm text-on-secondary-container hover:text-primary-container transition-colors" href="#">Privacy Policy</a>
        <a className="text-label-sm font-label-sm text-on-secondary-container hover:text-primary-container transition-colors" href="#">Help Center</a>
      </div>
      
      <div className="text-label-sm font-label-sm text-secondary">
        © 2024 CineVerse. All rights reserved.
      </div>
    </footer>
  );
}
