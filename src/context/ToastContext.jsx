import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    // Reset toast after 3 seconds
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-in">
          <div className="glass-panel px-6 py-3.5 rounded-full flex items-center gap-2.5 border border-primary-container/30 bg-[#161616]/95 shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-on-surface">
            <span className={`material-symbols-outlined text-[20px] filled-icon ${
              toast.type === 'success' ? 'text-green-500' 
              : toast.type === 'error' ? 'text-primary-container' 
              : 'text-blue-400'
            }`}>
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'cancel' : 'info'}
            </span>
            <span className="font-label-md text-label-md font-bold select-none">
              {toast.message}
            </span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
