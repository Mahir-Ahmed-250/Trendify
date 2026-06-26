import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  // Reset index when product changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [product, isOpen, onClose]);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBuyNow = () => {
    onClose();
    navigate(`/product/${product.id}`);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-2xl relative flex flex-col md:flex-row z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full shadow-lg hover:bg-white dark:hover:bg-black transition-colors group"
              id="quick-view-close"
            >
              <X className="h-5 w-5 text-gray-900 dark:text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Left: Image Carousel */}
            <div className="md:w-1/2 relative bg-gray-50 dark:bg-gray-800 flex items-center justify-center min-h-[300px] md:min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex]}
                  alt={product.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-full shadow-md hover:bg-white dark:hover:bg-black transition-all"
                    id="quick-view-prev"
                  >
                    <ChevronLeft className="h-5 w-5 dark:text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-full shadow-md hover:bg-white dark:hover:bg-black transition-all"
                    id="quick-view-next"
                  >
                    <ChevronRight className="h-5 w-5 dark:text-white" />
                  </button>

                  {/* Pagination Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full">
                    {images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right: Product Details */}
            <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center overflow-y-auto">
              <div className="mb-2">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-full">
                  {product.category}
                </span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                {product.name}
              </h2>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  ৳{product.price}
                </span>
                {product.oldPrice && (
                  <span className="text-lg text-gray-400 line-through font-medium">
                    ৳{product.oldPrice}
                  </span>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2"></h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-4">
                  {product.description}
                </p>
              </div>

              <div className="mt-auto">
                <button
                  onClick={handleBuyNow}
                  id="quick-view-buy-now"
                  className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-black dark:hover:bg-gray-200 transition-all active:scale-[0.98] shadow-xl shadow-gray-200 dark:shadow-none"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>Buy Now (অর্ডার করুন)</span>
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-tighter">
                  Click to view full details and available sizes
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default QuickViewModal;
