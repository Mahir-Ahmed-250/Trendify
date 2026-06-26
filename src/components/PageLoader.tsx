import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function PageLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Enable loader on page load / route change
    setLoading(true);

    // Force the html document element to disable smooth scroll during route changes
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    const resetScroll = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
      // Reset scroll on any general overflow containers as well
      const scrollableElements = document.querySelectorAll('main, .flex-1, [class*="overflow-y-auto"]');
      scrollableElements.forEach((el) => {
        if (!el.classList.contains('w-64') && !el.classList.contains('sidebar')) {
          el.scrollTop = 0;
        }
      });
    };

    // Scroll to top immediately
    resetScroll();

    // Repeated fallbacks for asynchronously loaded content or dynamic layouts
    const intervals = [50, 100, 150, 200, 300, 450, 600, 750];
    const timers = intervals.map((delay) => 
      setTimeout(() => {
        resetScroll();
      }, delay)
    );

    // Maintain loading overlay for 300ms before smooth fade-out
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 300);

    // Restore original scroll behavior after loading sequence finishes
    const restoreTimer = setTimeout(() => {
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    }, 450);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(loadingTimer);
      clearTimeout(restoreTimer);
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          id="page-loader-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[99999] pointer-events-auto"
        >
          <div className="flex flex-col items-center gap-4">
            {!imageError ? (
              <img 
                id="page-loader-gif"
                src="https://raw.githubusercontent.com/Codelessly/FlutterLoadingGIFs/master/packages/cupertino_activity_indicator.gif" 
                alt="Loading..." 
                className="w-12 h-12 object-contain"
                onError={() => setImageError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <svg 
                id="page-loader-svg" 
                className="animate-spin h-10 w-10 text-black" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 animate-pulse">
              Loading...
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
