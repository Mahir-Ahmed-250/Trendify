import React, { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useShop } from '../ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import ComparisonModal from './ComparisonModal';

export default function CompareButton() {
  const { comparisonItems } = useShop();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (comparisonItems.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsModalOpen(true)}
          className="relative bg-blue-600 text-white p-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-colors flex items-center gap-2 group"
          aria-label="View comparison"
        >
          <ArrowLeftRight size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-xs font-black uppercase tracking-widest">
            Compare ({comparisonItems.length})
          </span>
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-md">
            {comparisonItems.length}
          </div>
        </motion.button>
      </div>

      <ComparisonModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
