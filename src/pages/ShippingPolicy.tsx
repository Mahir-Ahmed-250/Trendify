import React from 'react';
import { motion } from 'motion/react';
import { useShop } from '../ShopContext';
import { Truck } from 'lucide-react';

export default function ShippingPolicy() {
  const { policies } = useShop();
  const shippingPolicy = policies.find(p => p.key === 'shipping_returns');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex-1 w-full bg-gray-50 py-16"
      id="shipping-policy-page"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <Truck className="h-10 w-10 mx-auto text-black mb-4" />
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">
            Shipping & Returns Policy
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            ডেলিভারি ও রিটার্ন নির্দেশিকা
          </p>
        </div>

        {/* Policy Display Card */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm leading-relaxed" id="shipping-policy-card">
          <div className="border-b border-gray-100 pb-5 mb-6 text-center md:text-left">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">
              {shippingPolicy ? shippingPolicy.title : 'Shipping, Delivery & Returns'}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Delivery and Guarantee Details
            </p>
          </div>

          {shippingPolicy ? (
            <div className="space-y-6 text-sm text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">
              {shippingPolicy.content}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 font-medium">Shipping information is currently being updated.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
