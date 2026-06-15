import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, X } from 'lucide-react';
import { useShop } from '../ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

export default function CartSidebar() {
  const { cart, products, removeFromCart, updateCartQuantity, updateCartItemSize, isCartOpen, setIsCartOpen, clearCart } = useShop();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop with elegant fade */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 z-[110]"
            onClick={() => setIsCartOpen(false)}
          />
          
          {/* Cart Panel with smooth sliding right-to-left transition */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 max-w-md w-full bg-white dark:bg-gray-950 z-[120] shadow-2xl flex flex-col"
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black uppercase tracking-tight dark:text-white">Your Cart</h2>
                {cart.length > 0 && (
                  <button 
                    onClick={() => {
                      clearCart();
                    }}
                    className="text-[9px] font-black text-red-500 hover:text-red-750 dark:text-red-400 dark:hover:text-red-350 uppercase tracking-widest border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 px-2 py-0.5 rounded-md transition-all active:scale-95"
                    title="Clear entire cart"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase">Empty Cart</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium text-xs">Add some amazing products to your cart.</p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/shop');
                    }}
                    className="bg-black dark:bg-white dark:text-black text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-colors shadow-xl"
                  >
                    Shop Now
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cart.map(item => (
                    <li key={item.id + (item.selectedSize || '')} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg bg-gray-50 dark:bg-gray-900 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h3 className="font-bold text-[11px] line-clamp-1 dark:text-white uppercase truncate pr-2">{item.name}</h3>
                          <button
                            onClick={() => removeFromCart(item.id, item.selectedSize)}
                            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          {item.selectedSize && (
                            <div className="relative inline-block">
                              <select
                                value={item.selectedSize || 'M'}
                                onChange={(e) => {
                                  const newSize = e.target.value;
                                  updateCartItemSize(item.id, item.selectedSize || 'M', newSize);
                                  updateCartQuantity(item.id, 1, newSize);
                                  
                                  const product = products.find(p => p.id === item.id);
                                  const stock = product ? (product.sizeStocks ? product.sizeStocks[newSize] : product.stock) : 0;
                                  
                                  if (1 > (stock || 0)) {
                                    addToast(`স্টক সীমিত। প্রোডাক্টের পরিমাণ ১ তে কমিয়ে দেওয়া হয়েছে।`, 'error');
                                  }
                                }}
                                className="text-[9px] font-black uppercase text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded px-1 py-0.5 leading-none focus:outline-none focus:border-black dark:focus:border-white cursor-pointer"
                              >
                                {['S', 'M', 'L', 'XL', 'XXL', '3XL']
                                  .filter(sz => {
                                    const product = products.find(p => p.id === item.id);
                                    const stock = product ? (product.sizeStocks ? product.sizeStocks[sz] : product.stock) : 0;
                                    return (stock || 0) > 0;
                                  })
                                  .map(sz => (
                                  <option key={sz} value={sz} className="bg-white dark:bg-gray-900 text-gray-950 dark:text-gray-100">
                                    Size: {sz}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-gray-900 dark:text-gray-200">৳{item.price}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-auto">
                           <div className="flex items-center border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1, item.selectedSize)}
                              className="p-1 px-1.5 text-gray-500 hover:text-black dark:hover:text-white focus:outline-none"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <span className="w-6 text-center font-bold text-[10px] dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => {
                                const product = products.find(p => p.id === item.id);
                                const stock = product ? (product.sizeStocks ? product.sizeStocks[item.selectedSize || 'M'] : product.stock) : 0;
                                if (item.quantity >= (stock || 0)) {
                                  addToast(`দুঃখিত, এই প্রোডাক্টটি সর্বোচ্চ ${stock} টি স্টকে আছে।`, 'error');
                                } else {
                                  updateCartQuantity(item.id, item.quantity + 1, item.selectedSize);
                                }
                              }}
                              className="p-1 px-1.5 text-gray-500 hover:text-black dark:hover:text-white focus:outline-none"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>
                          <p className="font-black text-xs ml-auto dark:text-white">৳{item.price * item.quantity}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium uppercase tracking-widest text-[9px]">Subtotal</span>
                    <span className="font-black text-black dark:text-white">৳{subtotal.toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Shipping calculated at checkout</p>
                </div>
                <button
                  onClick={() => {
                    const outOfStockItems = cart.filter(item => {
                      const product = products.find(p => p.id === item.id);
                      if (!product) return true;
                      const stock = product.sizeStocks ? product.sizeStocks[item.selectedSize || 'M'] : product.stock;
                      return item.quantity > (stock || 0) || item.quantity <= 0;
                    });

                    if (outOfStockItems.length > 0) {
                      addToast('কার্টে পর্যাপ্ত স্টক নেই অথবা প্রোডাক্টের পরিমাণ ঠিক নেই।', 'error');
                      return;
                    }
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full py-4 bg-black dark:bg-white dark:text-black text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-black/10 dark:shadow-white/5 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2.5 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[9px] mt-1 hover:text-black dark:hover:text-white transition-colors"
                >
                  Close & Continue
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
