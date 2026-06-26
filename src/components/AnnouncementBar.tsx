import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useShop } from '../ShopContext';
import { Link } from 'react-router-dom';

const AnnouncementBar: React.FC = () => {
  const { announcements } = useShop();
  const activeAnnouncements = announcements.filter(a => {
    if (!a.isActive) return false;
    const now = new Date();
    if (a.startDate && now < new Date(a.startDate)) return false;
    if (a.endDate && now > new Date(a.endDate)) return false;
    return true;
  });

  if (activeAnnouncements.length === 0) return null;

  const announcement = activeAnnouncements[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="w-full overflow-hidden"
      >
        <div 
          className="relative py-2 px-4 text-center text-[11px] font-bold uppercase tracking-widest flex items-center justify-center min-h-[36px]"
          style={{ 
            backgroundColor: announcement.backgroundColor || '#000000', 
            color: announcement.textColor || '#ffffff' 
          }}
        >
          {announcement.isMarquee ? (
            <div className="flex w-full overflow-hidden whitespace-nowrap relative group">
              <div
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '3rem', 
                  width: 'max-content',
                  animation: 'marquee 25s linear infinite'
                }}
                className="group-hover:[animation-play-state:paused]"
              >
                {/* Triple content for seamless loop on all screen sizes */}
                {[...Array(3)].map((_, groupIndex) => (
                  <div key={groupIndex} className="flex items-center gap-12">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <React.Fragment key={`${groupIndex}-${i}`}>
                        {announcement.link ? (
                          <Link to={announcement.link} className="hover:underline flex items-center gap-2">
                            {announcement.text}
                          </Link>
                        ) : (
                          <span>{announcement.text}</span>
                        )}
                        <span className="opacity-30">•</span>
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
              <style>{`
                @keyframes marquee {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-33.33%); }
                }
              `}</style>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              {announcement.link ? (
                <Link to={announcement.link} className="hover:underline flex items-center gap-1.5">
                  {announcement.text}
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </Link>
              ) : (
                <span>{announcement.text}</span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBar;
