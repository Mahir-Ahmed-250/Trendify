import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
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
        // Skip sidebars or specifically excluded layout blocks, but reset standard containers
        if (!el.classList.contains('w-64') && !el.classList.contains('sidebar')) {
          el.scrollTop = 0;
        }
      });
    };

    // Reset immediately
    resetScroll();

    // Repeated fallbacks for asynchronously loaded content or dynamic images
    const intervals = [50, 100, 150, 200, 300, 450, 600, 800];
    const timers = intervals.map((delay) => 
      setTimeout(() => {
        resetScroll();
      }, delay)
    );

    // Restore original scroll behavior once the route change loading is completed
    const restoreTimer = setTimeout(() => {
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    }, 1000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(restoreTimer);
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    };
  }, [pathname]);

  return null;
}
