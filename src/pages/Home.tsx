import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useShop } from '../ShopContext';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import Swal from 'sweetalert2';

export default function Home() {
  const { products, slides, categoryBanners, lookbook, homeAds, addSubscriber } = useShop();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [subEmail, setSubEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const hotProducts = products.filter(p => p.isHotSale).slice(0, 4);

  useEffect(() => {
    // Simulate initial loading for skeleton effect
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subEmail.trim()) {
      addSubscriber(subEmail.trim());
      setSubEmail('');
      Swal.fire('Success', 'Subscribed successfully!', 'success');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col min-h-0 bg-gray-50"
    >
      {/* Hero Carousel */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 max-w-screen-2xl mx-auto w-full">
        <div className="relative h-[45vh] sm:h-[60vh] w-full overflow-hidden bg-gray-900 rounded-3xl group">
        <AnimatePresence initial={false}>
          {slides.map((slide, index) => (
            index === currentSlide && (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                  <motion.span
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.8 }}
                    className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-6"
                  >
                    {slide.tagText || 'Featured'}
                  </motion.span>
                  <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-2xl sm:text-5xl md:text-7xl font-black text-white leading-none mb-3 sm:mb-4 uppercase"
                  >
                    {slide.title}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-xs sm:text-base md:text-lg text-gray-200 mb-6 sm:mb-8 max-w-2xl font-medium"
                  >
                    {slide.subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  >
                    <Link
                      to={slide.link || "/shop"}
                      className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-gray-200 rounded-xl transition-all shadow-xl"
                    >
                      Shop Now
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
        
        {/* Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
      </div>

      {/* Hot Sales Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-12 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto w-full"
      >
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight uppercase">Hot Sales <motion.span initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }} className="text-red-500 ml-2">•</motion.span></h2>
          <Link to="/shop" className="text-xs font-bold text-gray-400 uppercase underline underline-offset-4 hover:text-black">
            View All
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
             Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : (
            hotProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
        
        <div className="mt-8 sm:hidden flex justify-center">
          <Link to="/shop" className="text-xs font-bold text-gray-400 uppercase underline underline-offset-4 hover:text-black">
            View All
          </Link>
        </div>
      </motion.section>

      {/* Categories / Extra Banners */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-12 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto w-full"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryBanners.map(banner => (
            <div key={banner.id} className="relative h-64 md:h-80 rounded-3xl overflow-hidden group">
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-2">{banner.subtitle}</span>
                <h3 className="text-3xl font-black text-white uppercase leading-none mb-4 whitespace-pre-line">{banner.title}</h3>
                <Link to={banner.link || "/shop"} className="bg-white text-black px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest self-start hover:bg-gray-100 transition-colors">
                  Explore Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Recommended/Latest Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-12 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto w-full"
      >
        <div className="flex items-end justify-between mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold tracking-tight uppercase">Our Collection</h2>
          <Link to="/shop" className="text-xs font-bold text-gray-400 uppercase underline underline-offset-4 hover:text-black hidden sm:block">
            View All
          </Link>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          {loading ? (
             Array(5).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : (
            products
              .filter(p => p.isCollection)
              .sort((a, b) => (a.serial || 0) - (b.serial || 0))
              .slice(0, 5)
              .map(product => (
                <ProductCard key={product.id} product={product} />
              ))
          )}
        </div>
        
        <div className="mt-8 flex justify-center sm:hidden">
         <Link to="/shop" className="text-xs font-bold text-gray-400 uppercase underline underline-offset-4 hover:text-black">
            View All
          </Link>
        </div>
      </motion.section>

      {/* Dynamic Home Promo Ads Section (পাবলিশড হোম পেইজ বিজ্ঞাপনসমূহ) */}
      {homeAds && homeAds.filter(ad => ad.isActive).length > 0 && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="py-8 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {homeAds.filter(ad => ad.isActive).map(ad => (
              <Link 
                key={ad.id} 
                to={ad.linkUrl || "/shop"} 
                className="relative block h-56 sm:h-64 rounded-3xl overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-300 transform"
              >
                <img 
                  src={ad.imageUrl} 
                  alt={ad.title || "Advertisement"} 
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 z-20 flex flex-col justify-end text-white">
                  {ad.title && (
                    <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight leading-tight mb-1 group-hover:translate-x-1 transition-transform">
                      {ad.title}
                    </h3>
                  )}
                  {ad.subtitle && (
                    <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 max-w-xl font-medium tracking-wide">
                      {ad.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-3 font-bold text-[10px] uppercase tracking-widest text-white/90">
                    <span>Shop Highlights</span>
                    <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* Lookbook / Modeling Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 0.8 }}
        className="py-16 bg-white border-t border-gray-100 mt-12"
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col items-center text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Style Inspiration</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">The Lookbook</h2>
            <p className="text-gray-500 font-medium max-w-lg mx-auto mt-4">See how our community styles the latest drops. Tag us to be featured.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...lookbook]
              .sort((a, b) => (a.serial || 0) - (b.serial || 0))
              .map((lb, idx) => (
                <Link 
                  key={lb.id} 
                  to={lb.link || "/shop"} 
                  className={`relative rounded-3xl overflow-hidden group ${lb.className || ''}`}
                >
                  <img src={lb.image} alt={lb.title || "Lookbook"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                  
                  {/* Title overlay */}
                  <div className="absolute bottom-4 left-4 z-10 text-white translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    {lb.title && (
                      <p className="text-sm font-black uppercase tracking-wide drop-shadow-md">{lb.title}</p>
                    )}
                    <span className="text-[9px] font-bold tracking-widest text-gray-300 drop-shadow-sm uppercase">Shop the Style</span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <span className="bg-white text-black px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl">Shop The Look</span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </motion.section>

      {/* Features/Trust markers */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.6 }}
        className="bg-white border-t border-gray-100 py-16 mt-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: 0.1 }}
              className="py-4 md:py-0 px-6 flex flex-col items-center"
            >
              <ShieldCheck className="h-10 w-10 text-gray-900 mb-4" />
              <h3 className="text-xl font-bold mb-2">Premium Quality</h3>
              <p className="text-gray-500 text-sm">Crafted with the finest organic cotton for ultimate comfort.</p>
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               whileInView={{ opacity: 1, scale: 1, y: 0 }}
               viewport={{ once: false }}
               transition={{ delay: 0.2 }}
               className="py-4 md:py-0 px-6 flex flex-col items-center"
            >
              <Truck className="h-10 w-10 text-gray-900 mb-4" />
              <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
              <p className="text-gray-500 text-sm">Nationwide delivery within 2-3 business days.</p>
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               whileInView={{ opacity: 1, scale: 1, y: 0 }}
               viewport={{ once: false }}
               transition={{ delay: 0.3 }}
               className="py-4 md:py-0 px-6 flex flex-col items-center"
            >
              <RotateCcw className="h-10 w-10 text-gray-900 mb-4" />
              <h3 className="text-xl font-bold mb-2">Easy Returns</h3>
              <p className="text-gray-500 text-sm">7-day hassle-free return policy if you change your mind.</p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Newsletter Section */}
      <section className="relative py-24 sm:px-6 lg:px-8 w-full mt-12 overflow-hidden mx-auto" style={{ clipPath: 'polygon(0 8%, 100% 0, 100% 100%, 0 100%)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-gray-900 to-black w-full" />
        <div className="relative z-10 p-8 md:p-16 flex flex-col items-center text-center max-w-screen-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">Join The Club</h2>
          <p className="text-gray-300 font-medium max-w-md mx-auto mb-8">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
          <form className="w-full max-w-md flex flex-col md:flex-row gap-2" onSubmit={handleSubscribe}>
            <input 
              type="email" 
              required
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              placeholder="Enter your email" 
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium"
            />
            <button 
              type="submit" 
              className="bg-white text-black px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-gray-200 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </motion.div>
  );
}
