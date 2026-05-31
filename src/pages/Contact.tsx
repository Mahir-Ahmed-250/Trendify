import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useShop } from '../ShopContext';
import Swal from 'sweetalert2';

export default function Contact() {
  const { addContactMessage } = useShop();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      addContactMessage(formData);
      setFormData({ name: '', email: '', message: '' });
      Swal.fire('Success', "Thanks for your message! We'll be in touch soon.", 'success');
    }
  };
  return (
    <div className="flex-1 w-full bg-gray-50 py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4 uppercase">Contact Us</h1>
          <p className="text-gray-500 font-medium">
            Have a question about our products, sizing, or an existing order? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          <div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 h-full">
              <h2 className="text-2xl font-black uppercase mb-6 border-b border-gray-100 pb-4">Send us a message</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-gray-400">Your Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-black focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-gray-400">Email Address</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-black focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-gray-400">Message</label>
                  <textarea rows={5} required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-black focus:outline-none resize-none"></textarea>
                </div>
                <button type="submit" className="w-full py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-black/10 mt-6 active:scale-95 transition-transform">
                  Send Message
                </button>
              </form>
            </div>
          </div>
                <div className="space-y-8 flex flex-col justify-center bg-white p-8 rounded-2xl border border-gray-100">
            <div className="flex items-start gap-4 border-b border-gray-100 pb-6">
              <div className="bg-gray-100 p-3 rounded-xl text-black">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 uppercase tracking-tight">Our Store (Dhaka)</h3>
                <p className="text-gray-500 text-sm font-medium">123 Fashion Street, Bashundhara R/A<br/>Dhaka, Bangladesh</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 border-b border-gray-100 pb-6">
              <div className="bg-gray-100 p-3 rounded-xl text-black">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 uppercase tracking-tight">Phone / WhatsApp</h3>
                <p className="text-gray-500 text-sm font-medium">+880 1234 567 890</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Mon-Sat, 9am - 8pm</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-3 rounded-xl text-black">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 uppercase tracking-tight">Email</h3>
                <p className="text-gray-500 text-sm font-medium">support@tbari.com</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">We typically reply within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
