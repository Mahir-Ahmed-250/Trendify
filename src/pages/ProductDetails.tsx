import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useShop } from '../ShopContext';
import { ArrowLeft, ShoppingCart, ShieldCheck, Truck, Plus, Minus, X, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart, setIsCartOpen } = useShop();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="flex-1 w-full bg-gray-50 py-20 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase">Product Not Found</h2>
        <button onClick={() => navigate('/shop')} className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
          Back to Shop
        </button>
      </div>
    );
  }

  const isOutOfStock = (product.stock || 0) <= 0;

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    // Add chosen quantity and size to cart and navigate to checkout directly
    addToCart(product, quantity, selectedSize);
    navigate('/checkout');
  };

  const handleIncrease = () => {
    if (quantity < (product.stock || 0)) {
      setQuantity(prev => prev + 1);
    }
  };
  const handleDecrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  // Default fallback size guide image if none uploaded by admin
  const fallbackSizeChart = "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&q=80&w=1000";
  const sizeChartImageUrl = product.sizeChartImage || fallbackSizeChart;

  const galleryImages = Array.from(new Set([product.image, ...(product.images || [])].filter(Boolean)));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 w-full bg-white py-12 relative"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <button onClick={() => navigate(-1)} className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </button>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            <div className="aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden relative border border-gray-100 shadow-sm group">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  src={galleryImages[activeImageIndex]} 
                  alt={product.name} 
                  className="w-full h-full object-cover object-center absolute inset-0"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              {product.isHotSale && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider z-10">
                  Hot Sale
                </div>
              )}

              {/* Prev / Next buttons */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 md:bg-white/60 hover:bg-white text-black p-2 rounded-full shadow-md backdrop-blur-sm transition-all flex items-center justify-center font-bold text-lg w-10 h-10 select-none z-10 hover:scale-105 active:scale-95"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 md:bg-white/60 hover:bg-white text-black p-2 rounded-full shadow-md backdrop-blur-sm transition-all flex items-center justify-center font-bold text-lg w-10 h-10 select-none z-10 hover:scale-105 active:scale-95"
                  >
                    ›
                  </button>

                  {/* Dots indicators inside the carousel */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-[2px]">
                    {galleryImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          activeImageIndex === idx ? 'bg-white w-3.5' : 'bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails list */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
                {galleryImages.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 border bg-gray-50 transition-all ${
                      activeImageIndex === idx 
                        ? 'border-black ring-2 ring-black/10 scale-95' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img 
                      src={imgSrc} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Trendify Exclusive</p>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight leading-none">{product.name}</h1>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-2xl font-black text-gray-900">৳{product.price}</p>
              {product.oldPrice && product.oldPrice > product.price && (
                <div className="flex items-center gap-2">
                  <p className="text-base text-gray-400 line-through">৳{product.oldPrice}</p>
                  <div className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-tighter">
                    SAVE ৳{product.oldPrice - product.price}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-8">
              {isOutOfStock ? (
                <span className="inline-block bg-red-50 text-red-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-red-100">
                  Out of Stock (স্টকে নেই)
                </span>
              ) : (
                <span className="inline-block bg-green-50 text-green-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-green-100">
                  {product.stock} products available in stock (স্টকে আছে)
                </span>
              )}
            </div>

            <div className="prose prose-sm text-gray-500 font-medium mb-8 leading-relaxed">
              <p>{product.description}</p>
            </div>

            {/* Size Selector */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-1">
                  <Ruler className="h-4 w-4" /> Size (সাইজ)
                </h3>
                <button 
                  onClick={() => setIsSizeModalOpen(true)} 
                  className="text-xs font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:opacity-85 transition-opacity"
                >
                  Size Guide (সাইজ গাইড)
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['S', 'M', 'L', 'XL'].map(size => (
                  <button 
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`border rounded-xl py-3 text-sm font-bold transition-all ${
                      selectedSize === size 
                        ? 'border-black bg-black text-white shadow-md' 
                        : 'border-gray-200 hover:border-black text-gray-800'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-3">Quantity (পরিমাণ)</h3>
              <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 w-fit">
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="p-3 text-gray-500 hover:text-black focus:outline-none transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-black text-sm text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  className="p-3 text-gray-500 hover:text-black focus:outline-none transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Buy Now Button */}
            <button 
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl transition-all mb-8 ${
                isOutOfStock 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-black text-white shadow-black/10 active:scale-95 hover:bg-gray-900'
              }`}
            >
              {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-8">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-1">Fast Delivery</h4>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">2-3 Days Nationwide</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-1">Secure Checkout</h4>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Cash on Delivery</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Pop-up Size Guide Modal */}
      <AnimatePresence>
        {isSizeModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center px-4">
            {/* Backdrop with motion fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Content modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative max-w-xl w-full max-h-[85vh] flex flex-col z-[260]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase text-gray-900">Size Chart Guide</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">মাপের সঠিক পরিমাপ নির্দেশিকা</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSizeModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chart Image */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 flex items-center justify-center">
                <img
                  src={sizeChartImageUrl}
                  alt="Size Measurement Chart"
                  className="max-h-[50vh] w-auto object-contain rounded-2xl border border-gray-100 bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Footer info */}
              <div className="p-5 bg-white border-t border-gray-50 text-center">
                <p className="text-[11px] text-gray-400 uppercase font-black tracking-wider">
                  * All measurements are in inches. Please check carefully before purchasing.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
