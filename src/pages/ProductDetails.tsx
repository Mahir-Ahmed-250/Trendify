import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useShop } from '../ShopContext';
import { ArrowLeft, ShoppingCart, ShieldCheck, Truck, Plus, Minus, X, Ruler, Star, MessageSquare, CheckCircle, Calendar, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import Swal from 'sweetalert2';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart, setIsCartOpen, reviews, addReview, cart, updateCartQuantity, getProductPriceForSize, getProductStockForSize } = useShop();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this product on NeonThread: ${product?.name}`);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const shareOnTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this product on NeonThread: ${product?.name}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  // Review form state
  const [reviewOrderLine, setReviewOrderLine] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const product = products.find(p => p.id === id);

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    return getProductPriceForSize(product, selectedSize);
  }, [product, selectedSize, getProductPriceForSize]);

  const productReviews = useMemo(() => {
    return reviews.filter(r => r.productId === id && r.status === 'approved');
  }, [reviews, id]);

  const averageRating = useMemo(() => {
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / productReviews.length).toFixed(1);
  }, [productReviews]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');

    const result = addReview({
      productId: product.id,
      orderId: reviewOrderLine.trim().toUpperCase(),
      userName: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
    });

    if (result.success) {
      setReviewSuccess(result.message);
      setReviewOrderLine('');
      setReviewName('');
      setReviewRating(5);
      setReviewComment('');
    } else {
      setReviewError(result.message);
    }
    setReviewLoading(false);
  };

  if (!product) {
    return (
      <div className="flex-1 w-full bg-gray-50 py-20 flex flex-col items-center justify-center text-center">
        <Helmet>
          <title>Product Not Found | NeonThread</title>
          <meta name="description" content="Look for the latest fashion trends at NeonThread." />
        </Helmet>
        <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase">Product Not Found</h2>
        <button onClick={() => navigate('/shop')} className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
          Back to Shop
        </button>
      </div>
    );
  }

  const isOutOfStock = getProductStockForSize(product, selectedSize) <= 0;

  const isProductInCart = useMemo(() => {
    return cart.some(item => item.id === product?.id && (item.selectedSize || 'M') === selectedSize);
  }, [cart, product?.id, selectedSize]);

  const cartItem = useMemo(() => {
    return cart.find(item => item.id === product?.id && (item.selectedSize || 'M') === selectedSize);
  }, [cart, product?.id, selectedSize]);

  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity);
    } else {
      setQuantity(1);
    }
  }, [cartItem]);

  const handleAddToCart = () => {
    if (!product || isOutOfStock || isAdded || isProductInCart) return;
    addToCart(product, quantity, selectedSize);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (isProductInCart) {
      // If the product is already in the cart, do not add the quantity again to prevent duplicating/doubling.
      // Simply ensure the quantity matches the current selection and navigate to checkout.
      updateCartQuantity(product.id, quantity, selectedSize);
    } else {
      addToCart(product, quantity, selectedSize);
    }
    navigate('/checkout');
  };

  const handleIncrease = () => {
    const maxStock = getProductStockForSize(product, selectedSize);
    if (quantity < maxStock) {
      const newQty = quantity + 1;
      setQuantity(newQty);
      if (isProductInCart) {
        updateCartQuantity(product.id, newQty, selectedSize);
      }
    } else {
      Swal.fire({
        title: 'স্টকে নাই',
        text: `দুঃখিত, এই প্রোডাক্টটি সাইজ ${selectedSize} সর্বোচ্চ ${maxStock} টি স্টকে আছে।`,
        icon: 'warning',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      const newQty = quantity - 1;
      setQuantity(newQty);
      if (isProductInCart) {
        updateCartQuantity(product.id, newQty, selectedSize);
      }
    }
  };

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
      <Helmet>
        <title>{product.name} | NeonThread</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={`${product.name} | NeonThread`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.image} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="product" />
      </Helmet>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <button onClick={() => navigate(-1)} className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </button>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            <div 
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              className="aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden relative border border-gray-100 shadow-sm group cursor-zoom-in"
            >
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1,
                    scale: isZooming ? 2.5 : 1
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.3, ease: "easeOut" }
                  }}
                  style={{ 
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` 
                  }}
                  src={galleryImages[activeImageIndex]} 
                  alt={product.name} 
                  className="w-full h-full object-cover object-center absolute inset-0 pointer-events-none"
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
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">NeonThread Exclusive</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-gray-100">
                  <button onClick={shareOnFacebook} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors rounded-lg" title="Share on Facebook">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </button>
                  <button onClick={shareOnWhatsApp} className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors rounded-lg" title="Share on WhatsApp">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </button>
                  <button onClick={shareOnTwitter} className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-black transition-colors rounded-lg" title="Share on X">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z"/></svg>
                  </button>
                </div>
                <button 
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100"
                >
                  {isCopied ? (
                    <>
                      <Check size={12} className="text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight leading-none">{product.name}</h1>
            
            {/* Top Rating Summary */}
            {productReviews.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={14} 
                      className={star <= Math.round(Number(averageRating)) ? "fill-amber-400 text-amber-400" : "text-gray-200"} 
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-gray-900">{averageRating}</span>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">({productReviews.length} Reviews)</span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-2">
              <p className="text-2xl font-black text-gray-900">৳{currentPrice}</p>
              {product.oldPrice && product.oldPrice > currentPrice && (
                <div className="flex items-center gap-2">
                  <p className="text-base text-gray-400 line-through">৳{product.oldPrice}</p>
                  <div className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-tighter">
                    SAVE ৳{product.oldPrice - currentPrice}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-8">
              {isOutOfStock ? (
                <span className="inline-block bg-red-50 text-red-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-red-100">
                  Size {selectedSize}: Out of Stock (এই সাইজটি স্টকে নেই)
                </span>
              ) : (
                <span className="inline-block bg-green-50 text-green-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-green-100">
                  Size {selectedSize}: {getProductStockForSize(product, selectedSize)} products available in stock (স্টকে আছে)
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
              <div className="grid grid-cols-6 gap-2">
                {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map(size => (
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

            {/* Add to Cart and Buy Now Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button 
                type="button"
                disabled={isOutOfStock || isAdded || isProductInCart}
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border ${
                  isOutOfStock 
                    ? 'bg-gray-50 border-gray-100 text-gray-300 dark:bg-gray-800 dark:border-gray-700 cursor-not-allowed' 
                    : (isAdded || isProductInCart)
                      ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700 font-bold cursor-default select-none'
                      : 'bg-white text-black border-black hover:bg-gray-50 dark:bg-gray-950 dark:text-white dark:border-gray-800 dark:hover:bg-gray-800 active:scale-95'
                }`}
              >
                {(isAdded || isProductInCart) ? (
                  <>
                    <Check className="h-4.5 w-4.5" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4.5 w-4.5" />
                    Add to Cart
                  </>
                )}
              </button>

              <button 
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl transition-all ${
                  isOutOfStock 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-black text-white shadow-black/10 active:scale-95 hover:bg-gray-900'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
              </button>
            </div>

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

        {/* Full Reviews Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6 }}
          className="mt-24 border-t border-gray-100 pt-24 max-w-4xl mx-auto w-full"
        >
          <div className="flex flex-col gap-16">
            {/* Header & Stats Summary */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-3">Community Reviews</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-md mx-auto md:mx-0">
                  Join the conversation! Hear real experiences from verified purchasers of this product.
                </p>
              </div>
              
              <div className="bg-gray-50 px-10 py-8 rounded-[32px] border border-gray-100 flex flex-col items-center gap-4 text-center min-w-[240px] shadow-sm">
                <div className="text-6xl font-black text-gray-900 tracking-tight leading-none">
                  {averageRating}
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={20} 
                      className={star <= Math.round(Number(averageRating)) ? "fill-amber-400 text-amber-400" : "text-gray-200"} 
                    />
                  ))}
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                   {productReviews.length} Verified Reviews
                </p>
              </div>
            </div>

            {/* FULL WIDTH: Review List */}
            <div className="w-full space-y-12 pb-12">
              <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight"> Customer Reviews</h3>
                <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Showing {Math.min(productReviews.length, 10)} of {productReviews.length}</span>
              </div>
              
              {productReviews.length === 0 ? (
                <div className="bg-gray-50 p-20 rounded-[40px] border border-gray-100 flex flex-col items-center text-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-black/5 flex items-center justify-center">
                    <MessageSquare size={32} className="text-gray-300" />
                  </div>
                  <div className="max-w-xs">
                    <h4 className="text-lg font-black text-gray-900 uppercase mb-1">No Reviews Yet</h4>
                    <p className="text-gray-400 font-bold text-xs">Be the first customer to share your thoughts on this item!</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {productReviews.slice(0, 10).map((review) => (
                    <div key={review.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-black/10">
                            {review.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="text-sm font-black text-gray-900">{review.userName}</h5>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle size={10} className="text-green-500" />
                              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Verified Purchaser</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={12} 
                              className={star <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-100"} 
                            />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm font-medium leading-relaxed italic border-l-2 border-gray-100 pl-4 py-1">
                        "{review.comment}"
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                         <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center gap-2">
                           <Calendar size={12} />
                           {new Date(review.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {productReviews.length > 10 && (
                <button className="w-full py-5 border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:border-black transition-all bg-white">
                  Load More Community Reviews
                </button>
              )}
            </div>

            {/* FULL WIDTH: Add Review Form */}
            <div className="w-full">
              <div className="bg-white p-8 md:p-12 rounded-[40px] border-2 border-gray-100 relative overflow-hidden shadow-2xl shadow-black/[0.03]">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 transform pointer-events-none">
                  <MessageSquare size={240} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex flex-col gap-2 mb-10">
                    <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Share Your Experience</h4>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Only verified buyers can leave a review</p>
                  </div>
                  
                  <motion.form 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleReviewSubmit} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    <div className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Your Rating</label>
                        <div className="flex gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 w-fit">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none transition-all hover:scale-110 active:scale-95"
                            >
                              <Star 
                                size={28} 
                                className={star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-gray-300"} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Full Name</label>
                        <input 
                          required
                          type="text" 
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Order ID (Important)</label>
                        <input 
                          required
                          type="text" 
                          value={reviewOrderLine}
                          onChange={(e) => setReviewOrderLine(e.target.value)}
                          placeholder="Ex: TND-168545..."
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black tracking-widest focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all focus:bg-white uppercase placeholder:normal-case placeholder:font-bold"
                        />
                        <p className="text-[9px] text-gray-400 font-bold uppercase ml-1 italic leading-tight">Must match the exact order ID provided in your invoice.</p>
                      </div>
                    </div>

                    <div className="space-y-6 flex flex-col">
                      <div className="space-y-1.5 flex-1 flex flex-col">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Detailed Review</label>
                        <textarea 
                          required
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="How is the product quality? Would you recommend it?"
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all focus:bg-white resize-none flex-1 min-h-[160px]"
                        ></textarea>
                      </div>

                      <div className="space-y-4">
                        {reviewError && (
                          <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-xl border border-red-100 animate-shake flex items-center gap-2">
                             <X size={14} /> {reviewError}
                          </div>
                        )}

                        {reviewSuccess && (
                          <div className="p-4 bg-green-50 text-green-700 text-xs font-black uppercase rounded-xl border border-green-100 flex items-center gap-3">
                            <CheckCircle size={18} className="flex-shrink-0" />
                            {reviewSuccess}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={reviewLoading}
                          className="w-full bg-black text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                          {reviewLoading ? (
                            "Processing..."
                          ) : (
                            <>
                              Submit Your Feedback
                              <ArrowLeft size={16} className="rotate-180" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.form>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
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
