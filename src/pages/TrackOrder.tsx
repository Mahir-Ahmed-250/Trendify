import React, { useState } from 'react';
import { useShop } from '../ShopContext';
import { Search, Package, MapPin, Calendar, CreditCard, MessageCircle, Lock, ArrowRight, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import Swal from 'sweetalert2';

export default function TrackOrder() {
  const { orders } = useShop();
  const [searchBy, setSearchBy] = useState<'id' | 'phone'>('id');
  const [query, setQuery] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'results'>('input');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [results, setResults] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleIdSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = query.trim().toUpperCase();
    if (!cleanId) return;

    const found = orders.filter(o => o.id.toUpperCase() === cleanId);
    if (found.length > 0) {
      setResults(found);
      setStep('results');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'অর্ডার পাওয়া যায়নি',
        text: 'দয়া করে সঠিক অর্ডার আইডি দিন।',
      });
    }
  };

  const handleSendOtp = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11) {
      Swal.fire({
        icon: 'error',
        title: 'ভুল নম্বর',
        text: 'দয়া করে সঠিক ১১ ডিজিটের ফোন নম্বর দিন।',
      });
      return;
    }

    const foundOrders = orders.filter(o => o.customer.phone === cleanPhone);
    if (foundOrders.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'অর্ডার পাওয়া যায়নি',
        text: 'এই নম্বরে কোনো অর্ডার খুঁজে পাওয়া যায়নি।',
      });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    console.log(`[SIMULATION] WhatsApp OTP for ${cleanPhone}: ${code}`);
    
    setStep('otp');
    Swal.fire({
      icon: 'success',
      title: 'OTP পাঠানো হয়েছে',
      text: 'আপনার WhatsApp নম্বরে একটি ৬ ডিজিটের কোড পাঠানো হয়েছে। (সিমুলেশন কোড: ' + code + ')',
      timer: 3000
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      const foundOrders = orders.filter(o => o.customer.phone === phone.replace(/[^0-9]/g, ''));
      setResults(foundOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setStep('results');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'ভুল OTP',
        text: 'দয়া করে সঠিক OTP কোডটি দিন।',
      });
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 py-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 w-full">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black uppercase text-slate-900 dark:text-white mb-3 tracking-tighter">
            Track <span className="text-blue-600">Order</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">অর্ডার স্ট্যাটাস দেখতে আপনার আইডি বা ফোন নম্বর ব্যবহার করুন।</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl mb-8">
                  <button
                    onClick={() => setSearchBy('id')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${searchBy === 'id' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Order ID
                  </button>
                  <button
                    onClick={() => setSearchBy('phone')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${searchBy === 'phone' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Phone Number
                  </button>
                </div>

                {searchBy === 'id' ? (
                  <form onSubmit={handleIdSearch} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="অর্ডার আইডি দিন (যেমন: ORD-1234)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl py-5 pl-14 pr-4 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none transition-all dark:text-white font-mono uppercase font-bold"
                      />
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    </div>
                    <button type="submit" className="w-full bg-black dark:bg-slate-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                      Track Order
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="017XXXXXXXX"
                        maxLength={11}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl py-5 pl-14 pr-4 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all dark:text-white font-mono text-lg tracking-widest"
                      />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r border-slate-200 dark:border-slate-600 pr-3">+88</div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 flex items-center justify-center gap-2">
                      Send OTP via WhatsApp
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                <button 
                  onClick={() => setStep('input')}
                  className="mb-6 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2 text-xs font-bold"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                
                <h2 className="text-xl font-bold text-center mb-2 dark:text-white">Verify OTP</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-8">
                  সুকিউরিটি কোডটি <span className="font-bold text-slate-900 dark:text-white">{phone}</span> নম্বরে পাঠানো হয়েছে
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl py-5 text-center focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all dark:text-white font-mono text-3xl tracking-[0.5rem]"
                  />
                  <button type="submit" className="w-full bg-black dark:bg-slate-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-lg active:scale-95">
                    Verify & Access
                  </button>
                  <p className="text-center text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    কোড পাননি? <button type="button" onClick={() => handleSendOtp()} className="text-blue-600 hover:underline">রিসেন্ড করুন</button>
                  </p>
                </form>
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm gap-4">
                <div className="text-center md:text-left">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Search Results</h3>
                  <p className="text-lg font-black dark:text-white">
                    {searchBy === 'phone' ? phone : results[0]?.id} 
                    <span className="text-green-500 ml-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 inline-flex"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                  </p>
                </div>
                <button 
                  onClick={() => { setStep('input'); setPhone(''); setOtp(''); setQuery(''); setResults([]); }}
                  className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100 dark:hover:bg-red-900/20"
                >
                  New Search
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((order) => (
                  <motion.div
                    key={order.id}
                    className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all group overflow-hidden flex flex-col h-full"
                  >
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="bg-slate-50 dark:bg-slate-700 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold mb-1 w-fit">Order ID</div>
                          <h4 className="font-mono font-bold text-slate-900 dark:text-white uppercase truncate max-w-[120px]">{order.id}</h4>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${
                          order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          order.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          order.status === 'shipped' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                          order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-xs">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <p className="text-slate-600 dark:text-slate-400 font-medium">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <p className="text-slate-900 dark:text-white font-black">৳{order.total.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <Package className="h-4 w-4 text-slate-400" />
                          <p className="text-slate-600 dark:text-slate-400 font-medium">{order.items.length} items</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex -space-x-4 mb-3 overflow-hidden">
                          {order.items.slice(0, 4).map((item, i) => (
                            <img 
                              key={i} 
                              src={item.image} 
                              alt="" 
                              className="w-16 h-16 rounded-2xl border-2 border-white dark:border-slate-800 object-cover bg-white shadow-md transition-transform group-hover:scale-110" 
                            />
                          ))}
                          {order.items.length > 4 && (
                            <div className="w-16 h-16 rounded-2xl border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-black text-slate-500 shadow-md">
                              +{order.items.length - 4}
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                          {order.items[0].name}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 mt-auto">
                       <button 
                         onClick={() => setSelectedOrder(order)}
                         className="w-full text-[10px] font-bold py-2 hover:text-blue-600 transition-colors dark:text-white"
                        >
                          View Details
                        </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Improved Detailed Modal for Track Order */}
        <AnimatePresence>
          {selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedOrder(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl border border-white/20"
              >
                <div className="p-6 md:p-10 overflow-y-auto max-h-[90vh] custom-scrollbar">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tighter">Order <span className="text-blue-600">Details</span></h2>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">ID: {selectedOrder.id}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Items ordered
                      </h3>
                      <div className="space-y-4">
                        {selectedOrder.items.map((item, i) => (
                          <div key={i} className="flex gap-6 p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 items-center">
                            <img src={item.image} alt="" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-[1.5rem] shadow-sm bg-white" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-slate-900 dark:text-white uppercase truncate text-lg">{item.name}</h4>
                              <div className="flex gap-2 mt-3">
                                <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg shadow-sm">
                                  Size: {item.selectedSize || 'N/A'}
                                </span>
                                <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase px-3 py-1 rounded-lg shadow-sm border border-black/10">
                                  Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                            <p className="font-black text-slate-900 dark:text-white text-xl">৳{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                       <section className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Summary</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="font-bold dark:text-white text-slate-900">৳{selectedOrder.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Shipping</span>
                            <span className="font-bold dark:text-white text-slate-900">৳{(selectedOrder.total - selectedOrder.subtotal + selectedOrder.discount).toLocaleString()}</span>
                          </div>
                          {selectedOrder.discount > 0 && (
                            <div className="flex justify-between text-red-500">
                              <span>Discount</span>
                              <span className="font-bold">-৳{selectedOrder.discount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                            <span className="font-black uppercase text-slate-900 dark:text-white">Total</span>
                            <span className="font-black text-blue-600 text-lg">৳{selectedOrder.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </section>
                      <section className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Status</h3>
                        <div className="flex items-center gap-3 mb-4">
                           <div className={`w-3 h-3 rounded-full animate-pulse ${
                             selectedOrder.status === 'delivered' ? 'bg-green-500' : 
                             selectedOrder.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                           }`} />
                           <p className="font-black uppercase tracking-widest text-slate-900 dark:text-white">{selectedOrder.status}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                          আপনার অর্ডারটি বর্তমানে <span className="font-black text-blue-600 uppercase">{selectedOrder.status}</span> অবস্থায় আছে। বিস্তারিত জানতে আমাদের সাথে কন্ট্যাক্ট করুন।
                        </p>
                      </section>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
