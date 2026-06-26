import React from 'react';
import { X, ArrowLeftRight, ShoppingCart, Trash2 } from 'lucide-react';
import { useShop } from '../ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

export default function ComparisonModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { comparisonItems, products, toggleComparison, clearComparison, addToCart } = useShop();
  const navigate = useNavigate();

  const selectedProducts = products.filter(p => comparisonItems.includes(p.id));

  React.useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 sm:p-6 lg:p-8 pt-16 md:pt-20 pb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-900 w-full max-w-6xl max-h-[82vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Compare Products</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compare up to 4 items side-by-side</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {comparisonItems.length > 0 && (
                <button
                  onClick={clearComparison}
                  className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={12} />
                  Clear All
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-6 scrollbar-thin">
            {selectedProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <ArrowLeftRight className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-tight">No products selected</h3>
                <p className="text-gray-500 text-sm max-w-xs">Select up to 4 products from the shop to compare their specs and prices.</p>
                <button 
                  onClick={onClose}
                  className="mt-8 bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-xl shadow-black/10 active:scale-95 transform"
                >
                  Return to Shop
                </button>
              </div>
            ) : (
              <div className="min-w-[800px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-1/5 p-4 text-left bg-gray-50 dark:bg-gray-800/50 rounded-tl-2xl"></th>
                      {selectedProducts.map(product => (
                        <th key={product.id} className="w-1/5 p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 relative group">
                          <button 
                            onClick={() => toggleComparison(product.id)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 active:scale-90"
                          >
                            <X size={12} />
                          </button>
                          <div className="flex flex-col items-center text-center">
                            <div className="w-32 h-32 rounded-xl overflow-hidden mb-4 bg-gray-50 dark:bg-gray-800">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <Link to={`/product/${product.id}`} onClick={onClose} className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px]">
                              {product.name}
                            </Link>
                            <p className="text-xs font-bold text-gray-400 mt-1 uppercase">{product.category}</p>
                          </div>
                        </th>
                      ))}
                      {/* Fill empty slots */}
                      {Array.from({ length: Math.max(0, 4 - selectedProducts.length) }).map((_, i) => (
                        <th key={`empty-${i}`} className="w-1/5 p-4 bg-gray-50/30 dark:bg-gray-800/10 border-b border-gray-100 dark:border-gray-800 italic text-gray-300 text-[10px] font-bold uppercase tracking-widest">
                          Add Item
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {/* Price Row */}
                    <tr>
                      <td className="p-4 font-black uppercase tracking-widest text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800/50">Price</td>
                      {selectedProducts.map(product => (
                        <td key={product.id} className="p-4 text-center font-black text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-lg">৳{product.price}</span>
                          {product.oldPrice && (
                            <p className="text-[10px] text-gray-400 line-through">৳{product.oldPrice}</p>
                          )}
                        </td>
                      ))}
                      {Array.from({ length: 4 - selectedProducts.length }).map((_, i) => <td key={i} className="p-4 border-b border-gray-100 dark:border-gray-800"></td>)}
                    </tr>
                    {/* Code Row */}
                    <tr>
                      <td className="p-4 font-black uppercase tracking-widest text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800/50">Product Code</td>
                      {selectedProducts.map(product => (
                        <td key={product.id} className="p-4 text-center font-bold text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                          {product.code || 'N/A'}
                        </td>
                      ))}
                      {Array.from({ length: 4 - selectedProducts.length }).map((_, i) => <td key={i} className="p-4 border-b border-gray-100 dark:border-gray-800"></td>)}
                    </tr>
                    {/* Stock Row */}
                    <tr>
                      <td className="p-4 font-black uppercase tracking-widest text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800/50">Availability</td>
                      {selectedProducts.map(product => {
                        const inStock = (product.stock || 0) > 0;
                        return (
                          <td key={product.id} className={`p-4 text-center font-black uppercase text-[10px] border-b border-gray-100 dark:border-gray-800 ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                            {inStock ? `In Stock (${product.stock})` : 'Out of Stock'}
                          </td>
                        );
                      })}
                      {Array.from({ length: 4 - selectedProducts.length }).map((_, i) => <td key={i} className="p-4 border-b border-gray-100 dark:border-gray-800"></td>)}
                    </tr>
                    {/* Description Row */}
                    <tr>
                      <td className="p-4 font-black uppercase tracking-widest text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800/50">Description</td>
                      {selectedProducts.map(product => (
                        <td key={product.id} className="p-4 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 leading-relaxed min-w-[200px]">
                          <div className="line-clamp-6">{product.description}</div>
                        </td>
                      ))}
                      {Array.from({ length: 4 - selectedProducts.length }).map((_, i) => <td key={i} className="p-4 border-b border-gray-100 dark:border-gray-800"></td>)}
                    </tr>
                    {/* Action Row */}
                    <tr className="bg-gray-50/50 dark:bg-gray-800/20">
                      <td className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-bl-2xl"></td>
                      {selectedProducts.map(product => (
                        <td key={product.id} className="p-6 text-center">
                          <button
                            disabled={(product.stock || 0) <= 0}
                            onClick={() => {
                              onClose();
                              navigate(`/product/${product.id}`);
                            }}
                            className={`w-full py-3 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                              (product.stock || 0) <= 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10'
                            }`}
                          >
                            <ShoppingCart size={14} />
                            Buy Now
                          </button>
                        </td>
                      ))}
                      {Array.from({ length: 4 - selectedProducts.length }).map((_, i) => <td key={i} className="p-4"></td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
