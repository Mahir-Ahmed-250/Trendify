import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useShop } from '../ShopContext';
import { ShieldCheck, Truck, FileText } from 'lucide-react';

export default function Policies({ defaultTab = 'shipping' }: { defaultTab?: 'shipping' | 'privacy' }) {
  const { policies } = useShop();
  const [activePolicyTab, setActivePolicyTab] = React.useState<'shipping' | 'privacy'>(defaultTab);

  React.useEffect(() => {
    setActivePolicyTab(defaultTab);
  }, [defaultTab]);

  const shippingPolicy = policies.find(p => p.key === 'shipping_returns');
  const privacyPolicy = policies.find(p => p.key === 'privacy_policy');

  const selectedPolicy = activePolicyTab === 'shipping' ? shippingPolicy : privacyPolicy;
  const defaultTitle = activePolicyTab === 'shipping' ? 'Shipping & Returns Policy' : 'Privacy Policy';
  const defaultBangla = activePolicyTab === 'shipping' ? 'ডেলিভারি ও রিটার্ন পলিসি' : 'তথ্যের গোপনীয়তা ও নিরাপত্তা';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex-1 w-full bg-gray-50 py-16"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <FileText className="h-10 w-10 mx-auto text-black mb-4" />
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">
            Our Policies
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            টি-বাড়ি ব্রান্ডের গ্রাহক নির্দেশিকা ও নিয়মাবলী
          </p>
        </div>

        {/* Policy Selection Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 max-w-lg mx-auto mb-10 shadow-sm">
          <button
            onClick={() => setActivePolicyTab('shipping')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activePolicyTab === 'shipping' 
                ? 'bg-black text-white' 
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
            }`}
          >
            <Truck className="h-4 w-4" /> Shipping & Returns
          </button>
          <button
            onClick={() => setActivePolicyTab('privacy')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activePolicyTab === 'privacy' 
                ? 'bg-black text-white' 
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Privacy Policy
          </button>
        </div>

        {/* Policy Display Card */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm leading-relaxed">
          <div className="border-b border-gray-100 pb-5 mb-6 text-center md:text-left">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">
              {selectedPolicy ? selectedPolicy.title : defaultTitle}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {defaultBangla}
            </p>
          </div>

          {selectedPolicy ? (
            <div className="space-y-6 text-sm text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">
              {selectedPolicy.content}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 font-medium">Policy details are currently being updated.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
