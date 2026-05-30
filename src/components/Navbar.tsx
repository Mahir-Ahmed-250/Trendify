import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, ChevronRight, Moon, Sun, UserCog, Heart } from 'lucide-react';
import { useShop } from '../ShopContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { cart, products, isDarkMode, toggleDarkMode, setIsCartOpen, isAdminAuth, wishlist } = useShop();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lower = searchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower) || (p.code && p.code.toLowerCase().includes(lower))).slice(0, 5);
  }, [searchQuery, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
      setIsMobileMenuOpen(false);
      setShowDropdown(false);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/shop?q=${encodeURIComponent(searchQuery)}`); // Navigate to shop or product details
    setShowDropdown(false);
    setSearchQuery('');
  };

  return (
    <nav className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[100] transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto w-full py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-2xl font-black tracking-tighter text-black dark:text-white">
              TRENDIFY
            </Link>
          </div>
 
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-500">
            <Link to="/" className="text-black dark:text-white">Home</Link>
            <Link to="/shop" className="hover:text-black dark:hover:text-white transition-colors">Shop</Link>
            <Link to="/contact" className="hover:text-black dark:hover:text-white transition-colors">Contact</Link>
            <Link to="/track-order" className="hover:text-black dark:hover:text-white transition-colors">Track Order</Link>
          </div>
 
          {/* Search */}
          <div className="hidden md:block flex-1 max-w-md mx-10 relative" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search your style..."
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-full py-2 px-10 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none dark:text-white"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            </form>
            
            <AnimatePresence>
              {showDropdown && searchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 flex flex-col max-h-96 transition-colors"
                >
                  <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-800 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Search Results for "{searchQuery}"
                  </div>
                  <div className="flex-1 overflow-y-auto hide-scrollbar">
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500 font-medium dark:text-gray-400">No products found.</div>
                    ) : (
                      <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                        {searchResults.map(p => (
                          <li key={p.id}>
                            <button
                              onClick={() => handleProductClick(p.id)}
                              className="w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                            >
                              <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover bg-gray-100 dark:bg-gray-800 mr-3" />
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">৳{p.price}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <button
                      onClick={handleSearch}
                      className="p-3 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-center text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors uppercase tracking-widest"
                    >
                      View All Results
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
 
          {/* Cart, Admin */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/wishlist" className="text-gray-400 hover:text-red-500 transition-colors relative">
              <Heart className="h-6 w-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>
            {isAdminAuth && (
              <Link 
                to="/admin" 
                className="text-gray-400 hover:text-black dark:hover:text-white transition-transform hover:scale-105 flex items-center gap-1.5"
                title="Admin Dashboard"
              >
                <UserCog className="h-5 w-5" />
              </Link>
            )}
            <button onClick={() => setIsCartOpen(true)} className="text-gray-900 dark:text-white hover:text-black relative flex items-center">
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black dark:bg-white text-white dark:text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
 
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/wishlist" className="text-gray-900 dark:text-white relative">
              <Heart className="h-6 w-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>
            {isAdminAuth && (
              <Link 
                to="/admin" 
                className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center"
                title="Admin Dashboard"
              >
                <UserCog className="h-5 w-5" />
              </Link>
            )}
            <button onClick={() => setIsCartOpen(true)} className="text-gray-900 dark:text-white relative">
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black dark:bg-white text-white dark:text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
 
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950"
          >
            <div className="px-4 sm:px-6 pt-4 pb-6 space-y-4">
              <form onSubmit={handleSearch} className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-full py-2 px-10 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none dark:text-white"
                />
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              </form>
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-800 dark:text-gray-200 font-bold py-2">Home</Link>
              <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-800 dark:text-gray-200 font-bold py-2">Shop</Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-800 dark:text-gray-200 font-bold py-2">Contact</Link>
              <Link to="/track-order" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-800 dark:text-gray-200 font-bold py-2">Track Order</Link>
              {isAdminAuth && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-[10px] uppercase tracking-widest font-black text-gray-400 dark:text-gray-500 py-2">Admin Dashboard</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
