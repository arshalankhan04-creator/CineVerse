import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, loginUser, registerUser } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  // Form Inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const modalRef = useRef(null);

  // Reset form states when modal toggles
  useEffect(() => {
    if (authModalOpen) {
      setError('');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      document.body.style.overflow = 'hidden'; // Lock background scroll
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [authModalOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && authModalOpen) {
        setAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, setAuthModalOpen]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setAuthModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isLoginTab) {
      if (!username.trim()) {
        setError('Username is required for registration.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLoginTab) {
        await loginUser(email.trim(), password);
      } else {
        await registerUser(username.trim(), email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!authModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="glass-panel w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col p-8 relative animate-scale-up"
        style={{ background: 'rgba(20, 20, 20, 0.85)' }}
      >
        {/* Close Button */}
        <button 
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-secondary hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-white/10 mb-8 mt-2">
          <button 
            type="button"
            onClick={() => { setIsLoginTab(true); setError(''); }}
            className={`flex-1 pb-3 text-sm font-bold tracking-wide transition-all border-b-2 ${
              isLoginTab 
                ? 'text-primary-container border-primary-container' 
                : 'text-secondary border-transparent hover:text-white'
            }`}
          >
            SIGN IN
          </button>
          <button 
            type="button"
            onClick={() => { setIsLoginTab(false); setError(''); }}
            className={`flex-1 pb-3 text-sm font-bold tracking-wide transition-all border-b-2 ${
              !isLoginTab 
                ? 'text-primary-container border-primary-container' 
                : 'text-secondary border-transparent hover:text-white'
            }`}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-950/50 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2 animate-shake">
            <span className="material-symbols-outlined text-[16px] text-red-400 flex-shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username (Register Only) */}
          {!isLoginTab && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Username</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-secondary">person</span>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. cinephile99"
                  className="w-full bg-white/5 border border-white/10 focus:border-primary-container rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-secondary/50 outline-none transition-all focus:bg-white/10"
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Email Address</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-secondary">mail</span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 focus:border-primary-container rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-secondary/50 outline-none transition-all focus:bg-white/10"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Password</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-secondary">lock</span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLoginTab ? "••••••••" : "At least 6 characters"}
                className="w-full bg-white/5 border border-white/10 focus:border-primary-container rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-secondary/50 outline-none transition-all focus:bg-white/10"
                required
              />
            </div>
          </div>

          {/* Confirm Password (Register Only) */}
          {!isLoginTab && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Confirm Password</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-secondary">lock_reset</span>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-white/5 border border-white/10 focus:border-primary-container rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-secondary/50 outline-none transition-all focus:bg-white/10"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-primary-container text-white py-3.5 rounded-xl text-sm font-bold tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,9,20,0.2)] hover:shadow-[0_0_25px_rgba(229,9,20,0.45)] cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>{isLoginTab ? 'SIGN IN' : 'CREATE ACCOUNT'}</span>
            )}
          </button>
        </form>

        {/* Footer text */}
        <p className="text-[11px] text-secondary/60 text-center mt-6 leading-relaxed">
          {isLoginTab 
            ? "Access your watchlists and scores securely. We'll synchronize any local offline content automatically." 
            : "By creating an account, you can sync your watchlists and compete in the movie trivia rankings."
          }
        </p>
      </div>
    </div>
  );
}
