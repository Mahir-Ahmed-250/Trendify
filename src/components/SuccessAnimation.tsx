import React, { useEffect, useState } from 'react';

export default function SuccessAnimation() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for the animation
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <svg className="h-10 w-10 animate-spin text-green-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  // Beautiful draw-in custom SVG checkmark fallback
  return (
    <div className="relative mb-6 flex flex-col items-center">
      <div className="bg-green-50 text-green-600 w-24 h-24 rounded-full flex items-center justify-center scale-up-center shadow-lg shadow-green-100/55 dark:shadow-none">
        <svg className="w-12 h-12 text-green-600 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" className="path-draw" />
        </svg>
      </div>
      <style>{`
        .scale-up-center {
          animation: scale-up-center 0.4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
        }
        .path-draw {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: dash 0.8s 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes scale-up-center {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
