import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useShop } from '../ShopContext';
import { X } from 'lucide-react';
import { PopupAd } from '../types';

export default function PopupAdOverlay() {
  const { popupAds } = useShop();
  const location = useLocation();
  const [activeAd, setActiveAd] = useState<PopupAd | null>(null);

  useEffect(() => {
    // Exclude admin panel
    if (location.pathname.startsWith('/admin')) {
      setActiveAd(null);
      return;
    }

    // Find first active ad that targets this page
    const ad = popupAds.find(a => 
      a.isActive && (a.pages.includes('all') || a.pages.includes(location.pathname))
    );
    
    // Check if we already showed it this session for this specific page
    if (ad) {
      const shownKey = `ad_shown_${ad.id}_${location.pathname}`;
      const shown = sessionStorage.getItem(shownKey);
      if (!shown) {
        setActiveAd(ad);
      } else {
        setActiveAd(null);
      }
    } else {
      setActiveAd(null);
    }
  }, [location.pathname, popupAds]);

  const handleClose = () => {
    if (activeAd) {
      sessionStorage.setItem(`ad_shown_${activeAd.id}_${location.pathname}`, 'true');
      setActiveAd(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeAd) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAd, location.pathname]);

  if (!activeAd) return null;

  return (
    <div className="fixed inset-0 z-[180] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-16 md:pt-20 pb-6">
      <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl transition-all">
        <button onClick={handleClose} className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black transition-colors">
          <X className="h-5 w-5" />
        </button>
        {activeAd.linkUrl ? (
          <a href={activeAd.linkUrl} onClick={handleClose} target="_blank" rel="noopener noreferrer">
            <img src={activeAd.imageUrl} alt="Advertisement" className="w-full h-auto max-h-[70vh] object-cover" />
          </a>
        ) : (
          <img src={activeAd.imageUrl} alt="Advertisement" className="w-full h-auto max-h-[70vh] object-cover" />
        )}
      </div>
    </div>
  );
}
