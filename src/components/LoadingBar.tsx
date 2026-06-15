import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function LoadingBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(30);

    const timer = setTimeout(() => {
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(hideTimer);
    }, 500);

    return () => clearTimeout(timer);
  }, [location]);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 h-1 bg-black z-[9999]"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      exit={{ opacity: 0 }}
    />
  );
}
