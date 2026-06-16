/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShopProvider } from './ShopContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Breadcrumbs from './components/Breadcrumbs';
import Footer from './components/Footer';
import LoadingBar from './components/LoadingBar';
import PopupAdOverlay from './components/PopupAdOverlay';
import ScrollToTop from './components/ScrollToTop';
import CartSidebar from './components/CartSidebar';
import CompareButton from './components/CompareButton';

import FloatingButtons from './components/FloatingButtons';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Contact = lazy(() => import('./pages/Contact'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const AdminDashboard = lazy(() => import('./pages/Admin'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Policies = lazy(() => import('./pages/Policies'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white transition-colors duration-300">
      <Navbar />
      <Breadcrumbs />
      <CartSidebar />
      <CompareButton />
      <main className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<RootLayout />}>
              <Route index element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><Home /></motion.div>} />
              <Route path="shop" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><Shop /></motion.div>} />
              <Route path="product/:id" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><ProductDetails /></motion.div>} />
              <Route path="checkout" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><Checkout /></motion.div>} />
              <Route path="contact" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><Contact /></motion.div>} />
              <Route path="track-order" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><TrackOrder /></motion.div>} />
              <Route path="faq" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><FAQ /></motion.div>} />
              <Route path="policies" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><Policies /></motion.div>} />
              <Route path="shipping-policy" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><ShippingPolicy /></motion.div>} />
              <Route path="privacy-policy" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><PrivacyPolicy /></motion.div>} />
              <Route path="wishlist" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><Wishlist /></motion.div>} />
              <Route path="*" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><NotFound /></motion.div>} />
            </Route>
            <Route path="/admin" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col min-h-screen bg-white transition-colors duration-300"><Navbar /><Breadcrumbs /><div className="flex-1 flex min-h-0"><AdminDashboard /></div></motion.div>} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ShopProvider>
        <BrowserRouter>
          <LoadingBar />
          <ScrollToTop />
          <PopupAdOverlay />
          <AnimatedRoutes />
        </BrowserRouter>
      </ShopProvider>
    </ToastProvider>
  );
}

