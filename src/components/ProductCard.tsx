import React, { useMemo, useState } from 'react';
import { ShoppingCart, Heart, Star, Check } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../ShopContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function ProductCard({ product }: { product: Product, key?: React.Key }) {
  const { addToCart, wishlist, toggleWishlist, reviews, cart } = useShop();
  const [isAdded, setIsAdded] = useState(false);

  const isOutOfStock = (product.stock || 0) <= 0;
  const isWishlisted = wishlist.includes(product.id);

  const isProductInCart = useMemo(() => {
    return cart ? cart.some(item => item.id === product.id) : false;
  }, [cart, product.id]);

  const productReviews = useMemo(() => {
    return reviews.filter(r => r.productId === product.id && r.status === 'approved');
  }, [reviews, product.id]);

  const averageRating = useMemo(() => {
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / productReviews.length).toFixed(1);
  }, [productReviews]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, margin: "-50px" }}
      transition={{ 
        duration: 0.5,
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      className="bg-white dark:bg-gray-900 p-3 rounded-2xl flex flex-col border border-gray-100 dark:border-gray-800 group relative relative hover:shadow-xl hover:shadow-black/5 transition-shadow"
    >
      <Link to={`/product/${product.id}`} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden block">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 absolute inset-0"
        />
        {product.isHotSale && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider z-10">
            Hot
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute top-[18px] left-[-35px] w-[140px] bg-red-600 text-white text-[10px] font-black uppercase py-1.5 -rotate-45 shadow-xl text-center border-b border-red-700 z-10 select-none">
            Sold Out
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2 right-2 p-2 rounded-full shadow-lg z-10 transition-all transform active:scale-95 ${
            isWishlisted 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 dark:bg-black/80 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-black'
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} className={isWishlisted ? "animate-pulse" : ""} />
        </button>
      </Link>
      <Link to={`/product/${product.id}`} className="flex justify-between items-start block mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase text-gray-400 dark:text-gray-500 mb-1">
            {product.category || 'Basic'} {product.code ? `• ${product.code}` : ''}
          </p>
          <h3 className="text-sm font-bold truncate text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{product.name}</h3>
          
          {/* Stars in Card */}
          {productReviews.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={8} 
                    className={star <= Math.round(Number(averageRating)) ? "fill-amber-400 text-amber-400" : "text-gray-200"} 
                  />
                ))}
              </div>
              <span className="text-[8px] font-black text-gray-400">({productReviews.length})</span>
            </div>
          )}

          {!isOutOfStock && (
            <p className="text-[9px] font-bold text-green-600 dark:text-green-500 uppercase mt-1 tracking-tighter">In Stock: {product.stock} items</p>
          )}
        </div>
        <div className="flex flex-col items-end shrink-0">
          <p className="text-sm font-black text-gray-900 dark:text-gray-100">৳{product.price}</p>
          {product.oldPrice && product.oldPrice > product.price && (
            <div className="flex flex-col items-end">
              <p className="text-[10px] text-gray-400 line-through">৳{product.oldPrice}</p>
              <div className="bg-red-50 text-red-600 text-[8px] font-black px-1 rounded mt-0.5">
                SAVE ৳{product.oldPrice - product.price}
              </div>
            </div>
          )}
        </div>
      </Link>
      <div className="mt-auto flex gap-1.5">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isOutOfStock && !isAdded && !isProductInCart) {
              addToCart(product, 1);
              setIsAdded(true);
              setTimeout(() => setIsAdded(false), 2000);
            }
          }}
          disabled={isOutOfStock || isAdded || isProductInCart}
          className={`flex-1 py-2.5 px-1.5 text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all flex items-center justify-center gap-0.5 border ${
            isOutOfStock 
              ? 'bg-gray-50 border-gray-100 text-gray-300 dark:bg-gray-800 dark:border-gray-700 cursor-not-allowed' 
              : (isAdded || isProductInCart)
                ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700 cursor-default select-none'
                : 'bg-white text-black border-black hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 active:scale-95'
          }`}
        >
          {(isAdded || isProductInCart) ? (
            <>
              <Check size={10} className="shrink-0" />
              <span className="truncate">Added to Cart</span>
            </>
          ) : (
            <>
              <ShoppingCart size={11} className="shrink-0" />
              <span>Cart</span>
            </>
          )}
        </button>
        <Link
          to={isOutOfStock ? '#' : `/product/${product.id}`}
          onClick={(e) => {
            if (isOutOfStock) {
              e.preventDefault();
            }
          }}
          className={`flex-1 py-2.5 px-2 text-[10px] font-black uppercase tracking-tight rounded-lg active:scale-95 transition-all text-center block ${
            isOutOfStock 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {isOutOfStock ? 'Sold Out' : 'Buy Now'}
        </Link>
      </div>
    </motion.div>
  );
}
