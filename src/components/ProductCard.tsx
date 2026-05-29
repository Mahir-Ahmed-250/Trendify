import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../ShopContext';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }: { product: Product, key?: React.Key }) {
  const { addToCart, setIsCartOpen } = useShop();

  const isOutOfStock = (product.stock || 0) <= 0;

  return (
    <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl flex flex-col border border-gray-100 dark:border-gray-800 group relative relative hover:shadow-xl hover:shadow-black/5 transition-shadow">
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
      </Link>
      <Link to={`/product/${product.id}`} className="flex justify-between items-start block mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase text-gray-400 dark:text-gray-500 mb-1">
            {product.category || 'Basic'} {product.code ? `• ${product.code}` : ''}
          </p>
          <h3 className="text-sm font-bold truncate text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{product.name}</h3>
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
      <div className="mt-auto">
        <Link
          to={`/product/${product.id}`}
          className={`w-full py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg active:scale-95 transition-all text-center block ${
            isOutOfStock 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {isOutOfStock ? 'Sold Out' : 'Buy Now'}
        </Link>
      </div>
    </div>
  );
}
