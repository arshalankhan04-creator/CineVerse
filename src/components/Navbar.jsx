import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const [userInitials, setUserInitials] = useState('AR');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Initialize initials
    const storedName = localStorage.getItem('cineverse_profile_name') || 'Alex Rivera';
    const parts = storedName.split(' ');
    const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    setUserInitials(initials || 'AR');

    const handleProfileUpdate = () => {
      const updatedName = localStorage.getItem('cineverse_profile_name') || 'Alex Rivera';
      const upParts = updatedName.split(' ');
      setUserInitials(upParts.map(p => p[0]).join('').toUpperCase().slice(0, 2));
    };
    window.addEventListener('profile_updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('profile_updated', handleProfileUpdate);
    };
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      className={`fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-margin-desktop transition-all duration-300 ${
        scrolled 
          ? 'py-3 bg-[#131313]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-b border-white/5' 
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="flex items-center gap-10">
        <Link 
          to="/" 
          className="text-headline-md font-headline-md font-extrabold text-primary-container tracking-tight hover:scale-105 active:scale-95 transition-all"
        >
          CineVerse
        </Link>
        
        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className={`text-label-md font-label-md transition-all duration-200 hover:text-white ${
              isActive('/') ? 'text-primary-container font-bold border-b-2 border-primary-container pb-0.5' : 'text-secondary'
            }`}
          >
            Home
          </Link>
          <Link 
            to="/shows" 
            className={`text-label-md font-label-md transition-all duration-200 hover:text-white ${
              isActive('/shows') ? 'text-primary-container font-bold border-b-2 border-primary-container pb-0.5' : 'text-secondary'
            }`}
          >
            TV Shows
          </Link>
          <Link 
            to="/explore" 
            className={`text-label-md font-label-md transition-all duration-200 hover:text-white ${
              isActive('/explore') ? 'text-primary-container font-bold border-b-2 border-primary-container pb-0.5' : 'text-secondary'
            }`}
          >
            Explore
          </Link>
          <Link 
            to="/watchlist" 
            className={`text-label-md font-label-md transition-all duration-200 hover:text-white ${
              isActive('/watchlist') ? 'text-primary-container font-bold border-b-2 border-primary-container pb-0.5' : 'text-secondary'
            }`}
          >
            My Watchlist
          </Link>

          {/* More Dropdown for Desktop */}
          <div className="relative group/dropdown py-1">
            <button 
              className={`text-label-md font-label-md transition-all duration-200 hover:text-white flex items-center gap-0.5 cursor-pointer ${
                ['/compare', '/quiz', '/recommend', '/lists', '/calendar', '/profile/stats'].includes(location.pathname) 
                  ? 'text-primary-container font-bold border-b-2 border-primary-container pb-0.5' 
                  : 'text-secondary'
              }`}
            >
              More
              <span className="material-symbols-outlined text-[16px] transition-transform duration-200 group-hover/dropdown:rotate-180">
                keyboard_arrow_down
              </span>
            </button>
            
            {/* Dropdown Menu Overlay */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 rounded-xl bg-[#131313]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 opacity-0 scale-95 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:scale-100 group-hover/dropdown:pointer-events-auto transition-all duration-200 z-50 flex flex-col gap-1 before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-2">
              <Link 
                to="/compare" 
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-white/5 hover:text-white ${
                  isActive('/compare') ? 'text-primary-container bg-white/5' : 'text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
                Compare Tool
              </Link>
              <Link 
                to="/quiz" 
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-white/5 hover:text-white ${
                  isActive('/quiz') ? 'text-primary-container bg-white/5' : 'text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">quiz</span>
                Trivia Quiz
              </Link>
              <Link 
                to="/recommend" 
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-white/5 hover:text-white ${
                  isActive('/recommend') ? 'text-primary-container bg-white/5' : 'text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">magic_button</span>
                Recommend Me
              </Link>
              <Link 
                to="/lists" 
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-white/5 hover:text-white ${
                  isActive('/lists') ? 'text-primary-container bg-white/5' : 'text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">playlist_play</span>
                Collections
              </Link>
              <Link 
                to="/calendar" 
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-white/5 hover:text-white ${
                  isActive('/calendar') ? 'text-primary-container bg-white/5' : 'text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                Release Calendar
              </Link>
              <Link 
                to="/profile/stats" 
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-white/5 hover:text-white ${
                  isActive('/profile/stats') ? 'text-primary-container bg-white/5' : 'text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">monitoring</span>
                Stats Wrapped
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Link 
          to="/explore"
          className="text-secondary hover:text-primary-container transition-colors p-1"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[24px]">search</span>
        </Link>
        
        <Link 
          to="/profile"
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-200 bg-primary-container shadow-[0_0_10px_rgba(229,9,20,0.3)] border ${
            isActive('/profile') ? 'border-white scale-105' : 'border-outline-variant/30 hover:border-white hover:scale-105'
          }`}
          aria-label="Profile"
        >
          {userInitials}
        </Link>

        {/* Mobile menu toggle */}
        <button 
          className="md:hidden text-secondary hover:text-primary-container transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-[26px]">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#131313] border-b border-white/5 shadow-2xl flex flex-col p-6 gap-4 md:hidden animate-fade-in z-40">
          <Link 
            to="/" 
            className={`text-body-lg py-2 border-b border-white/5 ${isActive('/') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/shows" 
            className={`text-body-lg py-2 border-b border-white/5 ${isActive('/shows') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            TV Shows
          </Link>
          <Link 
            to="/explore" 
            className={`text-body-lg py-2 border-b border-white/5 ${isActive('/explore') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Explore
          </Link>
          <Link 
            to="/watchlist" 
            className={`text-body-lg py-2 border-b border-white/5 ${isActive('/watchlist') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            My Watchlist
          </Link>
          <Link 
            to="/compare" 
            className={`text-body-lg py-2 border-b border-white/5 flex items-center gap-2 ${isActive('/compare') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">compare_arrows</span>
            Compare Tool
          </Link>
          <Link 
            to="/quiz" 
            className={`text-body-lg py-2 border-b border-white/5 flex items-center gap-2 ${isActive('/quiz') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">quiz</span>
            Trivia Quiz
          </Link>
          <Link 
            to="/recommend" 
            className={`text-body-lg py-2 border-b border-white/5 flex items-center gap-2 ${isActive('/recommend') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">magic_button</span>
            Recommend Me
          </Link>
          <Link 
            to="/lists" 
            className={`text-body-lg py-2 border-b border-white/5 flex items-center gap-2 ${isActive('/lists') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">playlist_play</span>
            Collections
          </Link>
          <Link 
            to="/calendar" 
            className={`text-body-lg py-2 border-b border-white/5 flex items-center gap-2 ${isActive('/calendar') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            Release Calendar
          </Link>
          <Link 
            to="/profile/stats" 
            className={`text-body-lg py-2 border-b border-white/5 flex items-center gap-2 ${isActive('/profile/stats') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">monitoring</span>
            Stats Wrapped
          </Link>
          <Link 
            to="/profile" 
            className={`text-body-lg py-2 ${isActive('/profile') ? 'text-primary-container font-bold' : 'text-secondary'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Profile
          </Link>
        </div>
      )}
    </nav>
  );
}
