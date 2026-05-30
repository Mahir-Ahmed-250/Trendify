import { useState, useEffect } from 'react';
import { MessageCircle, ArrowUp } from 'lucide-react';

export default function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">
      <a
        id="whatsapp-button"
        href="https://wa.me/0151515668345"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors"
        aria-label="Contact us on WhatsApp"
      >
        <MessageCircle size={24} />
      </a>
      {showScrollTop && (
        <button
          id="scroll-to-top-button"
          onClick={scrollToTop}
          className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-900 transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}
