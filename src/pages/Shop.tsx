import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShop } from '../ShopContext';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { SlidersHorizontal, X } from 'lucide-react';
import { motion } from 'motion/react';

export default function Shop() {
  const { products } = useShop();
  const shopProducts = useMemo(() => products, [products]);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || '';
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show skeletons on initial load or category change
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeCategory, query]);

  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [onlyHotSale, setOnlyHotSale] = useState(false);
  const [sortBy, setSortBy] = useState('none');
  const [showFilters, setShowFilters] = useState(false);

  // Dynamically obtain unique categories
  const categoriesList = useMemo(() => {
    const cats = shopProducts.map(p => p.category ? p.category.trim() : 'General');
    return Array.from(new Set(cats)).filter(Boolean);
  }, [shopProducts]);

  const filteredProducts = useMemo(() => {
    let result = shopProducts;

    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(lowerQuery) || 
             p.description.toLowerCase().includes(lowerQuery) ||
             (p.code && p.code.toLowerCase().includes(lowerQuery))
      );
    }

    if (activeCategory) {
      result = result.filter(
        p => (p.category || 'General').toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (minPrice !== '') {
      result = result.filter(p => p.price >= minPrice);
    }
    
    if (maxPrice !== '') {
      result = result.filter(p => p.price <= maxPrice);
    }

    if (onlyHotSale) {
      result = result.filter(p => p.isHotSale);
    }

    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    } else {
      result = [...result].sort((a, b) => (a.serial || 0) - (b.serial || 0));
    }

    return result;
  }, [products, query, activeCategory, minPrice, maxPrice, onlyHotSale, sortBy]);

  const selectCategory = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setOnlyHotSale(false);
    setSortBy('none');
    setSearchParams({});
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 w-full bg-gray-50 py-12"
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row gap-8">
        
        {/* Mobile Filters Toggle & Drawer */}
        <div className="md:hidden">
          <button 
            onClick={() => setShowFilters(true)}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 py-3 rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter & Sort
          </button>
        </div>

        {showFilters && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowFilters(false)} />
        )}

        {/* Filters Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`
            fixed md:static inset-y-0 right-0 z-50 w-[85vw] max-w-sm md:w-64 shrink-0 
            bg-white md:bg-transparent p-6 md:p-0 border-l border-gray-200 md:border-l-0
            transform transition-transform duration-300 ease-in-out overflow-y-auto
            ${showFilters ? 'translate-x-0' : 'translate-x-[100%] md:translate-x-0'}
          `}
        >
          <div className="flex items-center justify-between md:hidden mb-6">
            <h2 className="text-xl font-black uppercase tracking-tight">Filters</h2>
            <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
          </div>

          <div className="space-y-8">
            <div className="hidden md:flex justify-between items-center mb-2">
               <h3 className="font-bold uppercase tracking-widest text-xs text-gray-900 border-b border-gray-900 pb-1 inline-block">Filters</h3>
               { (minPrice !== '' || maxPrice !== '' || onlyHotSale || sortBy !== 'none') && 
                  <button onClick={clearFilters} className="text-[10px] uppercase font-bold text-gray-500 hover:text-black tracking-widest underline">Clear All</button>
               }
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Sort By</h4>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="none">Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>

            {/* Categories filter */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Categories (ক্যাটাগরি)</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => selectCategory('')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-bold uppercase transition-all ${
                    !activeCategory
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-gray-100 border text-gray-700'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] opacity-60">({shopProducts.length})</span>
                </button>
                {categoriesList.map(cat => {
                  const count = shopProducts.filter(p => (p.category || 'General').toLowerCase() === cat.toLowerCase()).length;
                  const isSel = activeCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => selectCategory(cat)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-bold uppercase transition-all ${
                        isSel
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-gray-100 border text-gray-700'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      <span className="text-[10px] opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Price Range (৳)</h4>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors text-center"
                />
                <span className="text-gray-400 font-bold">-</span>
                <input 
                  type="number" 
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors text-center"
                />
              </div>
            </div>

            <div>
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Collections</h4>
               <label className="flex items-center gap-3 cursor-pointer group">
                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${onlyHotSale ? 'bg-black border-black text-white' : 'border-gray-300 bg-white group-hover:border-black'}`}>
                    {onlyHotSale && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                 </div>
                 <input type="checkbox" className="hidden" checked={onlyHotSale} onChange={(e) => setOnlyHotSale(e.target.checked)} />
                 <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">Hot Sale Only</span>
               </label>
            </div>
            
            <div className="md:hidden pt-4 border-t border-gray-100">
              <button 
                onClick={() => setShowFilters(false)}
                className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform"
              >
                Apply Filters ({filteredProducts.length})
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 w-full"
        >
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="flex flex-col items-start gap-1">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Our Collection</h1>
              {query ? (
                <p className="text-gray-500 text-sm font-medium">
                  Showing results for <span className="font-bold text-gray-900">"{query}"</span>
                  <span className="ml-2 text-xs uppercase tracking-widest font-bold">({filteredProducts.length})</span>
                </p>
              ) : (
                <p className="text-gray-500 text-sm font-medium flex items-center gap-2">
                  Browse our full range of premium collections
                  <span className="text-[10px] uppercase tracking-widest font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                     {filteredProducts.length} Items
                  </span>
                </p>
              )}
            </div>

            {/* Quick Category Action Pills */}
            <div className="flex flex-wrap gap-1.5 scrollbar-thin overflow-x-auto py-1">
              <button 
                onClick={() => selectCategory('')}
                className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                  !activeCategory 
                    ? 'bg-black text-white border-black shadow-md' 
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm'
                }`}
              >
                All
              </button>
              {categoriesList.map(cat => (
                <button 
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                    activeCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-black text-white border-black shadow-md' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No products found matching your criteria.</p>
              { (minPrice !== '' || maxPrice !== '' || onlyHotSale || sortBy !== 'none') && (
                 <button onClick={clearFilters} className="mt-4 text-black font-bold uppercase tracking-widest text-[10px] hover:underline decoration-2 underline-offset-4">Clear All Filters</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {loading ? (
                Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : (
                filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
