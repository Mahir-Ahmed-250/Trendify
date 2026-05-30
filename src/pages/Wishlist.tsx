import React, { useMemo } from 'react';
import { useShop } from '../ShopContext';
import ProductCard from '../components/ProductCard';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Wishlist() {
  const { wishlist, products } = useShop();

  const wishlistedProducts = useMemo(() => {
    return products.filter(p => wishlist.includes(p.id));
  }, [wishlist, products]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 w-full bg-gray-50 dark:bg-gray-950 py-12 min-h-[70vh]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col gap-2">
            <Link to="/shop" className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white text-xs font-bold uppercase tracking-widest transition-colors w-fit">
              <ArrowLeft size={14} />
              Continue Shopping
            </Link>
            <div className="flex items-center gap-4 mt-2">
              <div className="bg-red-500 p-3 rounded-2xl shadow-lg shadow-red-500/20">
                <Heart className="text-white h-6 w-6" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">My Wishlist</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  {wishlistedProducts.length === 0 
                    ? "Your saved items list is empty" 
                    : `You have ${wishlistedProducts.length} items saved`
                  }
                </p>
              </div>
            </div>
          </div>

          <Link 
            to="/shop" 
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            Explore Store
          </Link>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center flex flex-col items-center gap-6 shadow-xl shadow-black/5">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Heart className="text-gray-300 dark:text-gray-600 h-10 w-10" />
            </div>
            <div className="max-w-xs">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-tight">No Saved Items</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Start adding items you love to your wishlist and they will appear here!
              </p>
            </div>
            <Link 
              to="/shop" 
              className="mt-4 border-2 border-black dark:border-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {wishlistedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
