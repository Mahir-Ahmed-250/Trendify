/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ShopProvider } from './ShopContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PopupAdOverlay from './components/PopupAdOverlay';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import TrackOrder from './pages/TrackOrder';
import AdminDashboard from './pages/Admin';
import ProductDetails from './pages/ProductDetails';
import FAQ from './pages/FAQ';
import Policies from './pages/Policies';
import ShippingPolicy from './pages/ShippingPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Wishlist from './pages/Wishlist';
import NotFound from './pages/NotFound';
import CartSidebar from './components/CartSidebar';

import FloatingButtons from './components/FloatingButtons';

function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white transition-colors duration-300">
      <Navbar />
      <CartSidebar />
      <main className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <ScrollToTop />
        <PopupAdOverlay />
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="contact" element={<Contact />} />
            <Route path="track-order" element={<TrackOrder />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="policies" element={<Policies />} />
            <Route path="shipping-policy" element={<ShippingPolicy />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* Admin has its own layout without standard footer if we want, but let's keep it simple. */}
          <Route path="/admin" element={<div className="flex flex-col min-h-screen bg-white transition-colors duration-300"><Navbar /><div className="flex-1 flex min-h-0"><AdminDashboard /></div></div>} />
        </Routes>
      </BrowserRouter>
    </ShopProvider>
  );
}
