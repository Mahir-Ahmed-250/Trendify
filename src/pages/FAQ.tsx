import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useShop } from '../ShopContext';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const { faqs } = useShop();
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex-1 w-full bg-gray-50 py-16"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center mb-12">
          <HelpCircle className="h-10 w-10 mx-auto text-black mb-4" />
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            সাধারণ জিজ্ঞাসা ও উত্তরসমূহ
          </p>
        </div>

        {faqs && faqs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center shadow-sm">
            <p className="text-sm text-gray-500 font-medium">No FAQs listed at this moment.</p>
          </div>
        ) : faqs ? (
          <div className="space-y-4">
            {faqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="text-sm font-bold text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <span className="text-gray-4 flex-shrink-0">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-5 text-xs md:text-sm text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-4 bg-gray-50/50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
