import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Legend } from 'recharts';
import { useShop } from '../ShopContext';
import { Package, ShoppingBag, Ticket, Trash2, Plus, Edit, LogOut, Layout, Image, Camera, X, Users, Mail, MonitorPlay, Printer, HelpCircle, ShieldCheck, Ruler, ShoppingBasket, Home, TrendingUp, DollarSign, PackageCheck, UserCircle, Settings, Megaphone, MessageSquare, Search, Calendar, MapPin, Truck, CheckCircle, XCircle, Download, Clock, Bell } from 'lucide-react';
import { Product, PopupAd, FAQItem, PolicyItem, HomeAd, AdminUser, LookbookImage, CategoryBanner, Coupon, Order, AdminPermissions } from '../types';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { compressImage, fileToBase64 } from '../lib/imageUtils';

const SummaryCard = ({ title, count, icon: Icon, alert }: { title: string, count: number, icon: any, alert?: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
    <div className="p-3 bg-gray-50 rounded-2xl">
      <Icon className="h-6 w-6 text-gray-900" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{title}</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-black">{count}</p>
        {alert}
      </div>
    </div>
  </div>
);

// Helper for DD/MM/YYYY
const formatDate = (date: string | number | Date) => new Date(date).toLocaleDateString('en-GB');
const formatTime = (date: string | number | Date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    uri_configured: boolean;
    database: string;
    collection: string;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    fetch('/api/db/status')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(err => console.error('Error fetching db status:', err));
  }, []);
  const { products, orders, coupons, slides, updateSlide, categoryBanners, updateCategoryBanner, lookbook, subscribers, contactMessages, popupAds, homeAds, faqs, policies, addProduct, updateProduct, deleteProduct, updateOrderStatus, updateOrderNotes, deleteOrder, addCoupon, updateCoupon, deleteCoupon, addSlide, deleteSlide, addCategoryBanner, deleteCategoryBanner, addLookbookImage, updateLookbookImage, deleteLookbookImage, deleteSubscriber, deleteContactMessage, addPopupAd, deletePopupAd, updatePopupAd, addHomeAd, deleteHomeAd, updateHomeAd, addFAQ, updateFAQ, deleteFAQ, addPolicy, updatePolicy, deletePolicy, isAdminAuth, loginAdmin, logoutAdmin, currentAdmin, admins, addAdmin, updateAdmin, deleteAdmin } = useShop();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'shop' | 'collection' | 'orders' | 'coupons' | 'slides' | 'categories' | 'lookbook' | 'subscribers' | 'messages' | 'ads' | 'faqs' | 'policies' | 'admins' | 'profile'>('dashboard');
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [newFAQ, setNewFAQ] = useState<Omit<FAQItem, 'id'>>({ question: '', answer: '' });

  // Date range picker states
  const [chartTimeframe, setChartTimeframe] = useState<'this-month' | 'last-30-days' | 'custom'>('last-30-days');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Order internal notes state
  const [orderNotes, setOrderNotes] = useState('');

  // Notification states
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'orders' | 'stock'>('orders');
  const [readOrderIds, setReadOrderIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_read_order_ids') || '[]');
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('admin_read_order_ids', JSON.stringify(readOrderIds));
  }, [readOrderIds]);

  const changeTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const today = new Date().toDateString();
  const todaysNewOrders = orders.filter(o => new Date(o.date).toDateString() === today).length;
  const totalPendingOrders = orders.filter(o => o.status === 'pending').length;

  // Analytics
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const orderItems = deliveredOrders.flatMap(o => o.items);
  const salesMap = orderItems.reduce((acc, item) => {
    acc[item.id] = (acc[item.id] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const bestSellingProducts = products
    .map(p => ({ ...p, totalSold: salesMap[p.id] || 0 }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);

  const lowStockProducts = products.filter(p => (p.stock || 0) < 5);
  const lowStockCount = lowStockProducts.length;
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const unreadPendingOrders = orders.filter(o => o.status === 'pending' && !readOrderIds.includes(o.id));

  const getFilteredOrdersForTrend = () => {
    const now = new Date();
    let startLimit = new Date(0);
    let endLimit = new Date();

    if (chartTimeframe === 'this-month') {
      startLimit = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (chartTimeframe === 'last-30-days') {
      startLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (chartTimeframe === 'custom') {
      if (customStartDate) {
        startLimit = new Date(customStartDate);
        startLimit.setHours(0, 0, 0, 0);
      }
      if (customEndDate) {
        endLimit = new Date(customEndDate);
        endLimit.setHours(23, 59, 59, 999);
      }
    }

    const filtered = orders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= startLimit && orderDate <= endLimit;
    });

    const dailyData: { [key: string]: number } = {};
    filtered.forEach(o => {
      const formatted = formatDate(o.date);
      dailyData[formatted] = (dailyData[formatted] || 0) + o.total;
    });

    const dates = Object.keys(dailyData);
    const sortedDaily = dates
      .map(dStr => {
        const orderForDate = filtered.find(o => formatDate(o.date) === dStr);
        return {
          date: dStr,
          total: dailyData[dStr],
          timestamp: orderForDate ? new Date(orderForDate.date).getTime() : 0
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    if (sortedDaily.length === 0) {
      return [{ date: 'No Data', total: 0, timestamp: 0 }];
    }

    return sortedDaily;
  };

  const handleImageUpload = async (file: File | null, callback: (url: string) => void) => {
    if (!file) return;
    try {
      Swal.fire({
        title: 'প্রসেসিং হচ্ছে...',
        text: 'ইমেজ কম্প্রেস করা হচ্ছে, দয়া করে অপেক্ষা করুন।',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      const base64 = await fileToBase64(file);
      const compressed = await compressImage(base64);
      callback(compressed);
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'সফল!',
        text: 'ইমেজ আপলোড সম্পন্ন হয়েছে।',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Upload failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'ব্যর্থ!',
        text: 'ইমেজ আপলোড করা সম্ভব হয়নি।',
      });
    }
  };

  const handlePrintInvoice = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Swal.fire({
        title: 'পপআপ ব্লকড!',
        text: 'অনুগ্রহ করে পপআপ উইন্ডো চালু করুন ইনভয়েস প্রিন্ট করার জন্য।',
        icon: 'warning',
        confirmButtonColor: '#000'
      });
      return;
    }

    const hasDhaka = order.customer.address.includes('District: Dhaka') || order.customer.address.toLowerCase().includes('dhaka');
    const shippingCharge = hasDhaka ? 70 : 120;

    const itemsHtml = order.items.map((item: any) => `
      <tr>
        <td style="padding: 4px 6px; border-bottom: 1px solid #eaeaea;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${item.image}" alt="${item.name}" style="width: 24px; height: 24px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;" referrerPolicy="no-referrer" />
            <div>
              <span style="font-weight: bold; font-size: 9px; color: #111; display: block;">${item.name} ${item.selectedSize ? `(Size: ${item.selectedSize})` : ''}</span>
              <span style="font-size: 8px; color: #888;">ID: ${item.id}${item.code ? ` | Code: ${item.code}` : ''}</span>
            </div>
          </div>
        </td>
        <td style="padding: 4px 6px; border-bottom: 1px solid #eaeaea; text-align: center; font-weight: bold; font-family: monospace; color: #555; font-size: 9px;">x${item.quantity}</td>
        <td style="padding: 4px 6px; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold; color: #111; font-size: 9px;">৳${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const singleInvoiceHtml = `
      <div class="invoice-box">
        <table class="header-table">
          <tr>
            <td>
              <h1 class="company">TRENDIFY</h1>
            </td>
            <td class="label">INVOICE (মেমো)</td>
          </tr>
        </table>

        <div class="info-bar">
          <div>
            <p style="margin: 2px 0; font-size: 9px;"><strong>Order ID:</strong> #${order.id}</p>
            <p style="margin: 2px 0; font-size: 8px; color: #555;"><strong>Invoice Date:</strong> ${new Date(order.date).toLocaleString()}</p>
          </div>
          <div style="font-size: 9px; text-transform: uppercase; font-weight: bold; color: #888;">Customer Copy / গ্রাহক কপি</div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th style="padding: 4px 6px;">Item Description</th>
              <th style="padding: 4px 6px; text-align: center; width: 40px;">Qty</th>
              <th style="padding: 4px 6px; text-align: right; width: 80px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="flex-row">
          <div class="card">
            <h3>Shipping Address (ডেলিভারি ঠিকানা)</h3>
            <p><strong>Name:</strong> ${order.customer.name}</p>
            <p><strong>Phone:</strong> ${order.customer.phone}</p>
            <p><strong>Email:</strong> ${order.customer.email}</p>
            <p><strong>District:</strong> ${order.customer.district || 'N/A'}</p>
            <p><strong>Address:</strong> ${order.customer.address}</p>
          </div>
          
          <div class="totals">
            <div class="total-row">
              <span style="color: #666;">Subtotal:</span>
              <strong>৳${order.subtotal.toFixed(2)}</strong>
            </div>
            ${order.discount > 0 ? `
              <div class="total-row" style="color: #16a34a;">
                <span>Discount:</span>
                <strong>- ৳${order.discount.toFixed(2)}</strong>
              </div>
            ` : ''}
            <div class="total-row">
              <span style="color: #666;">Shipping:</span>
              <strong>৳${shippingCharge.toFixed(2)}</strong>
            </div>
            <div class="total-row grand-total">
              <span>Total Amount:</span>
              <strong style="color: #000; font-size: 11px;">৳${order.total.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div class="footer-info">
          <p style="font-size: 9px; font-weight: bold; color: #111; margin: 0;">Thank you for shopping with TRENDIFY!</p>
          <p style="font-size: 8px; color: #999; margin: 1px 0 0 0;">This is a computer-generated document. No signature is required.</p>
        </div>
      </div>
    `;

    const officeInvoiceHtml = `
      <div class="invoice-box">
        <table class="header-table">
          <tr>
            <td>
              <h1 class="company">TRENDIFY</h1>
            </td>
            <td class="label">INVOICE (মেমো)</td>
          </tr>
        </table>

        <div class="info-bar">
          <div>
            <p style="margin: 2px 0; font-size: 9px;"><strong>Order ID:</strong> #${order.id}</p>
            <p style="margin: 2px 0; font-size: 8px; color: #555;"><strong>Invoice Date:</strong> ${new Date(order.date).toLocaleString()}</p>
          </div>
          <div style="font-size: 9px; text-transform: uppercase; font-weight: bold; color: #888;">Office Copy / অফিস কপি</div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th style="padding: 4px 6px;">Item Description</th>
              <th style="padding: 4px 6px; text-align: center; width: 40px;">Qty</th>
              <th style="padding: 4px 6px; text-align: right; width: 80px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="flex-row">
          <div class="card">
            <h3>Shipping Address (ডেলিভারি ঠিকানা)</h3>
            <p><strong>Name:</strong> ${order.customer.name}</p>
            <p><strong>Phone:</strong> ${order.customer.phone}</p>
            <p><strong>Email:</strong> ${order.customer.email}</p>
            <p><strong>District:</strong> ${order.customer.district || 'N/A'}</p>
            <p><strong>Address:</strong> ${order.customer.address}</p>
          </div>
          
          <div class="totals">
            <div class="total-row">
              <span style="color: #666;">Subtotal:</span>
              <strong>৳${order.subtotal.toFixed(2)}</strong>
            </div>
            ${order.discount > 0 ? `
              <div class="total-row" style="color: #16a34a;">
                <span>Discount:</span>
                <strong>- ৳${order.discount.toFixed(2)}</strong>
              </div>
            ` : ''}
            <div class="total-row">
              <span style="color: #666;">Shipping:</span>
              <strong>৳${shippingCharge.toFixed(2)}</strong>
            </div>
            <div class="total-row grand-total">
              <span>Total Amount:</span>
              <strong style="color: #000; font-size: 11px;">৳${order.total.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div class="footer-info">
          <p style="font-size: 9px; font-weight: bold; color: #111; margin: 0;">Thank you for shopping with TRENDIFY!</p>
          <p style="font-size: 8px; color: #999; margin: 1px 0 0 0;">This is a computer-generated document. No signature is required.</p>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - Order #${order.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #222; background-color: #fff; }
            .print-container { width: 210mm; height: 297mm; margin: auto; padding: 4mm 8mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
            .invoice-box { width: 194mm; height: 133mm; padding: 10px; border: 1px solid #eaeaea; font-size: 10px; line-height: 1.35; border-radius: 6px; box-sizing: border-box; background: #fff; display: flex; flex-direction: column; justify-content: space-between; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; border-bottom: 2px solid #111; padding-bottom: 2px; }
            .company { font-size: 18px; font-weight: 950; letter-spacing: -1px; text-transform: uppercase; margin: 0; color: #000; }
            .label { font-size: 12px; color: #666; font-weight: bold; text-align: right; text-transform: uppercase; letter-spacing: 1px; }
            
            .info-bar { margin-bottom: 4px; display: flex; justify-content: space-between; align-items: flex-end; }
            
            table.items { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
            table.items th { padding: 4px 6px; font-size: 9px; text-transform: uppercase; text-align: left; background-color: #f7f7f7; color: #444; font-weight: bold; border-top: 1px solid #eaeaea; border-bottom: 1px solid #eaeaea; }
            table.items td { padding: 3px 6px; border-bottom: 1px solid #eaeaea; font-size: 9px; }
            
            .flex-row { display: flex; gap: 12px; justify-content: space-between; align-items: flex-start; }
            .card { background: #fafafa; padding: 6px; border-radius: 4px; border: 1px solid #eee; flex: 1.2; min-width: 0; }
            .card h3 { margin: 0 0 2px 0; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 1px solid #eaeaea; padding-bottom: 2px; }
            .card p { margin: 1px 0; font-size: 9px; color: #333; }
            
            .totals { width: 180px; font-size: 9px; flex: 0.8; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .grand-total { border-top: 1.5px solid #111; padding-top: 3px; margin-top: 3px; font-size: 10px; font-weight: bold; color: #000; }
            
            .footer-info { text-align: center; border-top: 1px solid #eaeaea; padding-top: 4px; }
            
            .tear-line {
              width: 194mm;
              text-align: center;
              margin: 4px 0;
              border-top: 1px dashed #777;
              position: relative;
              height: 10px;
            }
            .tear-line .text {
              position: absolute;
              top: -8px;
              left: 50%;
              transform: translateX(-50%);
              background: #fff;
              padding: 0 10px;
              font-size: 8px;
              font-weight: bold;
              color: #555;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            
            .no-print { display: none !important; }

            @media print {
              @page { size: A4 portrait; margin: 0; }
              body { margin: 0; padding: 0; background: #fff; }
              .print-container {
                width: 210mm;
                height: 297mm;
                padding: 4mm 8mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .invoice-box {
                width: 194mm;
                height: 133mm;
                border: 1px solid #eee !important;
                box-shadow: none !important;
                padding: 8px !important;
                margin: 0 !important;
                box-sizing: border-box;
              }
            }
          </style>
        </head>
        <body>
          <button class="no-print" onclick="window.print()" style="position: fixed; top: 15px; right: 20px; background: #000; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 11px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999;">Print / ডাউনলোড</button>
          
          <div class="print-container">
            ${singleInvoiceHtml}
            
            <div class="tear-line">
              <span class="text">✂ CUT OR TEAR HERE (এখান থেকে ছিড়ে নিন) ✂</span>
            </div>
            
            ${officeInvoiceHtml}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Admin Management state
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminPermissions, setNewAdminPermissions] = useState({
    dashboard: true,
    products: true,
    orders: true,
    coupons: true,
    slides: true,
    categories: true,
    lookbook: true,
    subscribers: true,
    messages: true,
    ads: true,
    faqs: true,
    policies: true
  });

  // Auto-routing for general admin depending on permissions
  useEffect(() => {
    if (currentAdmin && currentAdmin.role !== 'super') {
      const activeTabMap: Record<string, keyof AdminPermissions> = {
        dashboard: 'dashboard',
        shop: 'products',
        categories: 'categories',
        lookbook: 'lookbook',
        orders: 'orders',
        coupons: 'coupons',
        slides: 'slides',
        ads: 'ads',
        faqs: 'faqs',
        subscribers: 'subscribers',
        messages: 'messages',
        policies: 'policies'
      };

      const requiredPermission = activeTabMap[activeTab];
      if (requiredPermission && !currentAdmin.permissions?.[requiredPermission]) {
        // Redirection logic
        const permissibleTabs: typeof activeTab[] = [];
        if (currentAdmin.permissions?.dashboard) permissibleTabs.push('dashboard');
        if (currentAdmin.permissions?.products) permissibleTabs.push('shop');
        if (currentAdmin.permissions?.categories) permissibleTabs.push('categories');
        if (currentAdmin.permissions?.lookbook) permissibleTabs.push('lookbook');
        if (currentAdmin.permissions?.orders) permissibleTabs.push('orders');
        if (currentAdmin.permissions?.coupons) permissibleTabs.push('coupons');
        if (currentAdmin.permissions?.slides) permissibleTabs.push('slides');
        if (currentAdmin.permissions?.ads) permissibleTabs.push('ads');
        if (currentAdmin.permissions?.faqs) permissibleTabs.push('faqs');
        if (currentAdmin.permissions?.subscribers) permissibleTabs.push('subscribers');
        if (currentAdmin.permissions?.messages) permissibleTabs.push('messages');
        if (currentAdmin.permissions?.policies) permissibleTabs.push('policies');

        if (permissibleTabs.length > 0) {
          setActiveTab(permissibleTabs[0]);
        } else {
          setActiveTab('profile');
        }
      }
    }
  }, [currentAdmin, activeTab]);

  // Form states
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, oldPrice: 0, image: '', description: '', isHotSale: false, isCollection: false, sizeChartImage: '', category: 'Basic', code: '', images: [''] as string[], serial: 0, stock: 50 });
  const [newCoupon, setNewCoupon] = useState({ code: '', discountValue: 0, discountType: 'percentage' as 'percentage' | 'amount', isActive: true, startDate: '', expiryDate: '' });
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [newSlide, setNewSlide] = useState({ title: '', subtitle: '', image: '', tagText: '', link: '' });
  const [editingSlide, setEditingSlide] = useState<any | null>(null);
  const [newCategoryBanner, setNewCategoryBanner] = useState({ title: '', subtitle: '', image: '', link: '' });
  const [newLookbook, setNewLookbook] = useState({ image: '', link: '', className: '', widthPercent: '100%', heightPercent: 'auto', serial: 1, title: '' });
  const [editingLookbook, setEditingLookbook] = useState<LookbookImage | null>(null);
  const [newPopupAd, setNewPopupAd] = useState({ imageUrl: '', linkUrl: '', isActive: true, pagesString: 'all' });
  const [newHomeAd, setNewHomeAd] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', isActive: true });
  
  // Order search & date filter states
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderDateRange, setOrderDateRange] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState<'all' | 'today' | 'yesterday' | 'this-week'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | Order['status']>('all');
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Order notes loader effect
  useEffect(() => {
    if (selectedOrderForView) {
      setOrderNotes(selectedOrderForView.notes || '');
    }
  }, [selectedOrderForView?.id]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [tempOrdersPerPage, setTempOrdersPerPage] = useState(10);

// Audit Logs State
  const [auditLogs] = useState<{ action: string; date: string }[]>([
    { action: 'Admin logged in', date: new Date().toISOString() },
    { action: 'Updated product #123', date: new Date(Date.now() - 3600000).toISOString() },
    { action: 'Deleted order #456', date: new Date(Date.now() - 7200000).toISOString() },
    { action: 'Updated category banner', date: new Date(Date.now() - 10800000).toISOString() },
    { action: 'Added new coupon SALE10', date: new Date(Date.now() - 14400000).toISOString() }
  ].slice(0, 10));

  const [appliedOrderQuery, setAppliedOrderQuery] = useState('');
  const [appliedOrderDateFilter, setAppliedOrderDateFilter] = useState<'all' | 'today' | 'yesterday' | 'this-week'>('all');
  const [appliedOrderDateRange, setAppliedOrderDateRange] = useState('');
  const [appliedOrderStatusFilter, setAppliedOrderStatusFilter] = useState<'all' | Order['status']>('all');

  // Policy Forms State
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ key: 'custom', title: '', content: '' });
  const [editingPolicy, setEditingPolicy] = useState<PolicyItem | null>(null);

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [isAddingCategoryBanner, setIsAddingCategoryBanner] = useState(false);
  const [isAddingLookbook, setIsAddingLookbook] = useState(false);
  const [isAddingPopupAd, setIsAddingPopupAd] = useState(false);
  const [isAddingHomeAd, setIsAddingHomeAd] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategoryBanner, setEditingCategoryBanner] = useState<CategoryBanner | null>(null);

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailModalType, setEmailModalType] = useState<'newsletter' | 'contact'>('newsletter');
  const [emailTarget, setEmailTarget] = useState<string>('all');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [newsletterImage, setNewsletterImage] = useState('');

  const [editingPopupAd, setEditingPopupAd] = useState<PopupAd | null>(null);
  const [editingHomeAd, setEditingHomeAd] = useState<HomeAd | null>(null);
  const [adsSubTab, setAdsSubTab] = useState<'popup' | 'home'>('home');

  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('all');
  const [adminHotSaleFilter, setAdminHotSaleFilter] = useState('all');
  const [adminSortBy, setAdminSortBy] = useState('newest');

  const adminCategories = React.useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['all', ...Array.from(list)];
  }, [products]);

  const filteredAdminProducts = React.useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = 
          p.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
          (p.code && p.code.toLowerCase().includes(adminSearchQuery.toLowerCase())) ||
          (p.category && p.category.toLowerCase().includes(adminSearchQuery.toLowerCase())) ||
          p.id.toLowerCase().includes(adminSearchQuery.toLowerCase());
        
        const matchesCategory = adminCategoryFilter === 'all' || p.category === adminCategoryFilter;
        
        const matchesHotSale = 
          adminHotSaleFilter === 'all' ||
          (adminHotSaleFilter === 'yes' && p.isHotSale) ||
          (adminHotSaleFilter === 'no' && !p.isHotSale);

        return matchesSearch && matchesCategory && matchesHotSale;
      })
      .sort((a, b) => {
        if (adminSortBy === 'price-asc') return a.price - b.price;
        if (adminSortBy === 'price-desc') return b.price - a.price;
        return (a.serial || 0) - (b.serial || 0);
      });
  }, [products, adminSearchQuery, adminCategoryFilter, adminHotSaleFilter, adminSortBy]);

  const filteredCollectionProducts = React.useMemo(() => {
    return products
      .filter(p => p.isCollection)
      .sort((a, b) => (a.serial || 0) - (b.serial || 0));
  }, [products]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(email, password);
    if (!success) {
      setLoginError('Invalid email or password');
    } else {
      setLoginError('');
      setEmail('');
      setPassword('');
    }
  };

  if (!isAdminAuth) {
    return (
      <div className="flex-1 w-full bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 max-w-sm w-full shadow-sm text-center">
          <div className="w-32  mx-auto mb-6">
           
          </div>
          <h1 className="text-2xl font-black uppercase mb-2">Admin Login</h1>
         
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Email Admin</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-black focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Password</label>
              <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-black focus:outline-none" />
            </div>
            
            {/* Show Password Option */}
            <div className="flex items-center gap-2 py-1">
              <input 
                id="showPassword"
                type="checkbox" 
                checked={showPassword} 
                onChange={e => setShowPassword(e.target.checked)} 
                className="rounded border-gray-300 text-black focus:ring-black cursor-pointer h-4 w-4" 
              />
              <label htmlFor="showPassword" className="text-xs font-bold text-gray-500 select-none cursor-pointer">
                Show Password
              </label>
            </div>

            {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-black text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-black/10 mt-2 active:scale-95 transition-transform">
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // collection limit check - Max 5
    if (newProduct.isCollection) {
      const collectionCount = products.filter(p => p.isCollection).length;
      if (collectionCount >= 5) {
        Swal.fire({
          title: 'Limit Reached!',
          text: 'কালেকশনে সর্বোচ্চ ৫টি প্রোডাক্ট রাখা যাবে। (Maximum 5 products allowed in collection)',
          icon: 'warning',
          confirmButtonColor: '#000000',
        });
        return;
      }
    }

    const additionalImages = (newProduct.images || []).map(img => img.trim()).filter(Boolean);
    addProduct({
      name: newProduct.name,
      price: newProduct.price,
      oldPrice: newProduct.oldPrice,
      image: newProduct.image,
      description: newProduct.description,
      isHotSale: newProduct.isHotSale,
      isCollection: newProduct.isCollection,
      sizeChartImage: newProduct.sizeChartImage,
      category: newProduct.category || 'Basic',
      code: newProduct.code,
      images: additionalImages,
      serial: newProduct.serial,
      stock: newProduct.stock
    });
    setIsAddingProduct(false);
    setNewProduct({ name: '', price: 0, oldPrice: 0, image: '', description: '', isHotSale: false, isCollection: false, sizeChartImage: '', category: 'Basic', code: '', images: [''], serial: 0, stock: 50 });
    Swal.fire({
      title: 'Success!',
      text: 'Product has been added successfully with SweetAlert.',
      icon: 'success',
      confirmButtonColor: '#000000',
    });
  };

  const handleAddHomeAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHomeAd) {
      updateHomeAd({
        id: editingHomeAd.id,
        title: newHomeAd.title,
        subtitle: newHomeAd.subtitle,
        imageUrl: newHomeAd.imageUrl,
        linkUrl: newHomeAd.linkUrl,
        isActive: newHomeAd.isActive
      });
      setEditingHomeAd(null);
      Swal.fire('Success', 'Ad updated successfully', 'success');
    } else {
      addHomeAd({
        title: newHomeAd.title,
        subtitle: newHomeAd.subtitle,
        imageUrl: newHomeAd.imageUrl,
        linkUrl: newHomeAd.linkUrl,
        isActive: newHomeAd.isActive
      });
      Swal.fire('Success', 'Ad created successfully', 'success');
    }
    setIsAddingHomeAd(false);
    setNewHomeAd({ title: '', subtitle: '', imageUrl: '', linkUrl: '', isActive: true });
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      // collection limit check - Max 5
      // Only check if it's being CHANGED to isCollection: true
      const wasCollection = products.find(p => p.id === editingProduct.id)?.isCollection;
      if (editingProduct.isCollection && !wasCollection) {
        const collectionCount = products.filter(p => p.isCollection).length;
        if (collectionCount >= 5) {
          Swal.fire({
            title: 'Limit Reached!',
            text: 'কালেকশনে সর্বোচ্চ ৫টি প্রোডাক্ট রাখা যাবে। (Maximum 5 products allowed in collection)',
            icon: 'warning',
            confirmButtonColor: '#000000',
          });
          return;
        }
      }

      updateProduct(editingProduct);
      setEditingProduct(null);
      Swal.fire({
        title: 'Updated!',
        text: 'Product information has been updated successfully.',
        icon: 'success',
        confirmButtonColor: '#000000',
      });
    }
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoupon) {
      updateCoupon({ ...editingCoupon, code: newCoupon.code, discountValue: newCoupon.discountValue, discountType: newCoupon.discountType, isActive: newCoupon.isActive, startDate: newCoupon.startDate, expiryDate: newCoupon.expiryDate });
      setEditingCoupon(null);
      Swal.fire('Updated!', 'Coupon information has been updated successfully.', 'success');
    } else {
      addCoupon(newCoupon);
      Swal.fire('Success!', 'New coupon has been created successfully.', 'success');
    }
    setIsAddingCoupon(false);
    setNewCoupon({ code: '', discountValue: 0, discountType: 'percentage', isActive: true, startDate: '', expiryDate: '' });
  };

  const exportOrdersToExcel = (filteredOrders: any[]) => {
    const data = filteredOrders.flatMap(order => 
      order.items.map((item: any) => ({
        'Order ID': order.id,
        'Date': formatDate(order.date),
        'Customer Name': order.customer.name,
        'Phone': order.customer.phone,
        'Email': order.customer.email,
        'District': order.customer.district || 'N/A',
        'Address': order.customer.address,
        'Product Name': item.name,
        'Size': item.selectedSize || 'N/A',
        'Quantity': item.quantity,
        'Unit Price': item.price,
        'Item Total': item.price * item.quantity,
        'Coupon': order.couponCode || 'None',
        'Subtotal': order.subtotal,
        'Discount': order.discount,
        'Shipping': order.total - order.subtotal + order.discount,
        'Total Payable': order.total,
        'Order Status': order.status.toUpperCase(),
        'Payment Status': 'COD'
      }))
    );
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detailed Orders');
    
    // Auto-size columns
    const max_width = data.reduce((w, r) => Math.max(w, Object.values(r).join('').length), 10);
    ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 25 }));
    
    XLSX.writeFile(wb, `TRENDIFY_Detailed_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleAddSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSlide) {
      updateSlide({ ...editingSlide, ...newSlide });
      setEditingSlide(null);
    } else {
      addSlide(newSlide);
    }
    setIsAddingSlide(false);
    setNewSlide({ title: '', subtitle: '', image: '', tagText: '', link: '' });
  };

  const handleAddCategoryBanner = (e: React.FormEvent) => {
    e.preventDefault();
    addCategoryBanner(newCategoryBanner);
    setIsAddingCategoryBanner(false);
    setNewCategoryBanner({ title: '', subtitle: '', image: '', link: '' });
  };

  const handleUpdateCategoryBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategoryBanner) {
      updateCategoryBanner(editingCategoryBanner);
      setEditingCategoryBanner(null);
      Swal.fire({
        title: 'Updated!',
        text: 'Category banner has been updated successfully.',
        icon: 'success',
        confirmButtonColor: '#000000',
      });
    }
  };

  const handleAddLookbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLookbook) {
      updateLookbookImage({
        id: editingLookbook.id,
        image: newLookbook.image,
        link: newLookbook.link,
        className: newLookbook.className,
        widthPercent: newLookbook.widthPercent,
        heightPercent: newLookbook.heightPercent,
        serial: Number(newLookbook.serial) || 1,
        title: newLookbook.title
      });
      setEditingLookbook(null);
    } else {
      addLookbookImage({
        image: newLookbook.image,
        link: newLookbook.link,
        className: newLookbook.className,
        widthPercent: newLookbook.widthPercent,
        heightPercent: newLookbook.heightPercent,
        serial: Number(newLookbook.serial) || 1,
        title: newLookbook.title
      });
    }
    setIsAddingLookbook(false);
    setNewLookbook({ image: '', link: '', className: '', widthPercent: '100%', heightPercent: 'auto', serial: 1, title: '' });
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailSubject && emailBody) {
      
      Swal.fire({
        title: emailTarget === 'all' ? 'Sending Newsletter...' : 'Sending Email...',
        text: `Delivering to ${emailTarget === 'all' ? 'all subscribers' : emailTarget}...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const response = await fetch('/api/send-newsletter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: emailTarget,
            subject: emailSubject,
            body: emailBody,
            image: newsletterImage,
            subscribers: subscribers.map(s => s.email)
          })
        });

        const data = await response.json();

        if (response.ok) {
          Swal.fire('Sent!', emailTarget === 'all' ? 'Newsletter successfully sent!' : 'Email successfully sent!', 'success');
          setIsSendingEmail(false);
          setEmailSubject('');
          setEmailBody('');
          setNewsletterImage('');
          setEmailTarget('all');
        } else {
          Swal.fire('Error', data.error || (emailTarget === 'all' ? 'Failed to send newsletter.' : 'Failed to send email.'), 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'An unexpected error occurred.', 'error');
      }
    }
  };

  const handleAddPopupAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPopupAd) {
      updatePopupAd(editingPopupAd.id, {
        imageUrl: newPopupAd.imageUrl,
        linkUrl: newPopupAd.linkUrl,
        isActive: newPopupAd.isActive,
        pages: newPopupAd.pagesString.split(',').map(s => s.trim()).filter(Boolean)
      });
      setEditingPopupAd(null);
    } else {
      addPopupAd({
        imageUrl: newPopupAd.imageUrl,
        linkUrl: newPopupAd.linkUrl,
        isActive: newPopupAd.isActive,
        pages: newPopupAd.pagesString.split(',').map(s => s.trim()).filter(Boolean)
      });
    }
    setIsAddingPopupAd(false);
    setNewPopupAd({ imageUrl: '', linkUrl: '', isActive: true, pagesString: 'all' });
  };

  const handleAddFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFAQ) {
      updateFAQ({ ...editingFAQ, question: newFAQ.question, answer: newFAQ.answer });
      setEditingFAQ(null);
      Swal.fire('Success', 'FAQ updated successfully', 'success');
    } else {
      addFAQ(newFAQ);
      Swal.fire('Success', 'FAQ created successfully', 'success');
    }
    setNewFAQ({ question: '', answer: '' });
    setIsAddingFAQ(false);
  };

  const handleAddPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPolicy) {
      updatePolicy({ ...editingPolicy, title: newPolicy.title, content: newPolicy.content });
      setEditingPolicy(null);
      Swal.fire('Success', 'Policy updated successfully', 'success');
    } else {
      addPolicy({ key: newPolicy.key, title: newPolicy.title, content: newPolicy.content });
      Swal.fire('Success', 'Policy created successfully', 'success');
    }
    setNewPolicy({ key: 'custom', title: '', content: '' });
    setIsAddingPolicy(false);
  };

  return (
    <div className="flex-1 w-full bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row min-h-screen transition-colors duration-300">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col h-screen overflow-y-auto sticky top-0"
          >
            <div className="border-b dark:border-gray-800 pb-4 mb-4">
              <div className="flex flex-col items-center mb-10">
                <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 group-hover:text-blue-600 transition-colors">Admin Panel</h2>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 w-16 h-16 rounded-full border-2 border-gray-100 p-0.5 overflow-hidden shadow-sm"
                >
                  {currentAdmin?.image ? (
                    <img src={currentAdmin.image} alt="Admin" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                      <UserCircle className="w-8 h-8" />
                    </div>
                  )}
                </motion.div>
                <div className="text-center mt-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{currentAdmin?.name || 'Main Admin'}</p>
                </div>
              </div>
              {currentAdmin && (
                <div className="mt-2 text-xs">
                  <span className="font-bold text-gray-400 block uppercase tracking-wide">Logged in as:</span>
                  <span className="font-extrabold text-black block truncate text-[11px]" title={currentAdmin.email}>{currentAdmin.email}</span>
                  {currentAdmin.role === 'super' ? (
                    <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 border border-amber-200">
                      👑 Super Admin
                    </span>
                  ) : (
                    <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 border border-blue-200">
                      💼 Staff Admin
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {/* Dashboard Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.dashboard) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Home className="h-4.5 w-4.5" /> Dashboard
                </motion.button>
              )}
    
              {/* Product Management Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.products) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('shop')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'shop' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Package className="h-4.5 w-4.5" /> Product Management
                </motion.button>
              )}
    
              {/* Categories Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.categories) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('categories')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Image className="h-4.5 w-4.5" /> Categories
                </motion.button>
              )}
    
              {/* Lookbook Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.lookbook) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('lookbook')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'lookbook' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Camera className="h-4.5 w-4.5" /> Lookbook
                </motion.button>
              )}
    
              {/* Orders Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.orders) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'orders' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ShoppingBag className="h-4.5 w-4.5" /> Orders
                </motion.button>
              )}
    
              {/* Coupons Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.coupons) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('coupons')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'coupons' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Ticket className="h-4.5 w-4.5" /> Coupons
                </motion.button>
              )}
    
              {/* Slides Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.slides) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('slides')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'slides' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Layout className="h-4.5 w-4.5" /> Slides
                </motion.button>
              )}
    
              {/* Ads Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.ads) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('ads')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'ads' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Megaphone className="h-4.5 w-4.5" /> Ads
                </motion.button>
              )}
    
              {/* FAQs Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.faqs) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('faqs')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'faqs' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <MessageSquare className="h-4.5 w-4.5" /> FAQs
                </motion.button>
              )}
    
              {/* Subscribers Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.subscribers) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('subscribers')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'subscribers' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Users className="h-4.5 w-4.5" /> Subscribers
                </motion.button>
              )}
    
              {/* Messages Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.messages) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('messages')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'messages' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Mail className="h-4.5 w-4.5" /> Messages
                </motion.button>
              )}
    
              {/* Policies Button */}
              {(currentAdmin?.role === 'super' || currentAdmin?.permissions?.policies) && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('policies')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'policies' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ShieldCheck className="h-4.5 w-4.5" /> Policies
                </motion.button>
              )}
    
              {/* Manage Admins Button (SUPER ADMIN ONLY) */}
              {currentAdmin?.role === 'super' && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('admins')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'admins' ? 'bg-amber-600 text-white' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'}`}
                >
                  <Users className="h-4.5 w-4.5 text-amber-600 animate-pulse" /> Manage Admins ⭐
                </motion.button>
              )}
    
              {/* Personal Section */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <span className="px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Settings & Profile</span>
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <UserCircle className="h-4.5 w-4.5" /> My Profile
                </motion.button>
              </div>
            </nav>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={logoutAdmin} 
              className="mt-6 flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 font-bold hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" /> Logout
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10 hide-scrollbar overflow-auto relative bg-gray-50 dark:bg-gray-950 transition-colors">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          {/* Toggle Sidebar Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-all shadow-sm active:scale-95"
            title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            <Layout className="h-4 w-4" /> {isSidebarOpen ? "Minimize Sidebar" : "Expand Menu"}
          </button>

          {/* Premium Notification Center */}
          <div className="relative">
            {/* Notification Bell Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-3 rounded-xl border transition-all flex items-center justify-center ${
                isNotifOpen 
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md' 
                  : 'bg-white dark:bg-gray-950 text-gray-750 dark:text-gray-300 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white shadow-sm'
              }`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {/* Glowing Indicator Badge - Green for New/Pending Orders, Red for Low Stock Alerts */}
              {(unreadPendingOrders.length + lowStockProducts.length) > 0 && (
                <span className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-black text-white border border-white dark:border-gray-900 animate-pulse ${
                  unreadPendingOrders.length > 0 ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {unreadPendingOrders.length + lowStockProducts.length}
                </span>
              )}
            </motion.button>

            {/* Notification Dropdown Panel */}
            <AnimatePresence>
              {isNotifOpen && (
                <>
                  {/* Overlay Click-Away Trap */}
                  <div className="fixed inset-0 z-30 pointer-events-auto" onClick={() => setIsNotifOpen(false)} />
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl z-40 overflow-hidden text-left"
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white">Notification Center</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">অ্যালার্ট ও নোটিফিকেশন</p>
                      </div>
                      
                      {/* Subtitle / Mark All */}
                      {notifTab === 'orders' && unreadPendingOrders.length > 0 && (
                        <button 
                          onClick={() => {
                            const unreadIds = pendingOrders.filter(o => !readOrderIds.includes(o.id)).map(o => o.id);
                            setReadOrderIds(prev => [...prev, ...unreadIds]);
                          }}
                          className="text-[10px] font-black uppercase text-gray-500 hover:text-black dark:hover:text-white tracking-wider bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg transition-colors border border-gray-100 dark:border-gray-700"
                        >
                          Mark All Read
                        </button>
                      )}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-gray-100 dark:border-gray-800 text-xs font-black uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                      <button
                        onClick={() => setNotifTab('orders')}
                        className={`flex-1 py-3 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                          notifTab === 'orders'
                            ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white bg-white dark:bg-gray-950/40 font-black'
                            : 'border-transparent text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        New Orders 
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                          unreadPendingOrders.length > 0 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                        }`}>
                          {unreadPendingOrders.length}
                        </span>
                      </button>
                      
                      <button
                        onClick={() => setNotifTab('stock')}
                        className={`flex-1 py-3 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                          notifTab === 'stock'
                            ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white bg-white dark:bg-gray-950/40 font-black'
                            : 'border-transparent text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        Stock Alerts
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                          lowStockProducts.length > 0 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                        }`}>
                          {lowStockProducts.length}
                        </span>
                      </button>
                    </div>

                    {/* Scrollable Content Container */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 p-2">
                      {/* TAB 1: NEW/PENDING ORDERS */}
                      {notifTab === 'orders' && (
                        <>
                          {pendingOrders.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                              <ShoppingBag className="h-8 w-8 opacity-20" />
                              <p className="font-bold uppercase tracking-wider text-[10px]">সব অর্ডার প্রসেস করা হয়েছে! 🎉</p>
                              <p className="text-[9px] opacity-70">No pending orders waiting for you.</p>
                            </div>
                          ) : (
                            pendingOrders.map(order => {
                              const isUnread = !readOrderIds.includes(order.id);
                              return (
                                <div 
                                  key={order.id}
                                  onClick={() => {
                                    if (isUnread) {
                                      setReadOrderIds(prev => [...prev, order.id]);
                                    }
                                    setOrderSearchQuery(order.id);
                                    setAppliedOrderQuery(order.id);
                                    setOrderStatusFilter('all');
                                    setAppliedOrderStatusFilter('all');
                                    setSelectedOrderForView(order);
                                    setActiveTab('orders');
                                    setIsNotifOpen(false);
                                  }}
                                  className={`p-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all flex justify-between items-center gap-3 border ${
                                    isUnread 
                                      ? 'bg-green-50/40 border-green-150 dark:bg-green-950/10 dark:border-green-900/30' 
                                      : 'border-transparent bg-white dark:bg-gray-900'
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-black text-xs text-gray-900 dark:text-white">#{order.id}</span>
                                      {isUnread && (
                                        <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase truncate">{order.customer.name}</p>
                                    <p className="text-[9px] text-gray-500 flex items-center gap-1.5 mt-0.5 font-bold">
                                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      {formatDate(order.date)} • {formatTime(order.date)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-black text-gray-900 dark:text-white">৳{order.total}</p>
                                    <span className="text-[8px] font-black uppercase text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded mt-1 inline-block">Pending</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </>
                      )}

                      {/* TAB 2: INVENTORY STOCK ALERTS */}
                      {notifTab === 'stock' && (
                        <>
                          {lowStockProducts.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                              <PackageCheck className="h-8 w-8 opacity-20" />
                              <p className="font-bold uppercase tracking-wider text-[10px]">স্টক লেভেল একদম ঠিক আছে! 👍</p>
                              <p className="text-[9px] opacity-70">No products have critically low inventory.</p>
                            </div>
                          ) : (
                            lowStockProducts.map(p => {
                              return (
                                <div 
                                  key={p.id}
                                  onClick={() => {
                                    setIsAddingProduct(false);
                                    setEditingProduct(p);
                                    setActiveTab(p.isCollection ? 'collection' : 'shop');
                                    setIsNotifOpen(false);
                                    
                                    // Smooth scroll to the product form block
                                    setTimeout(() => {
                                      const element = document.getElementById('edit-product-form') || document.querySelector('form');
                                      if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      }
                                    }, 200);
                                  }}
                                  className="p-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all flex items-center gap-3 bg-white dark:bg-gray-900 border border-transparent"
                                >
                                  <img 
                                    src={p.image} 
                                    alt={p.name} 
                                    className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100 dark:border-gray-800 shrink-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">{p.name}</h4>
                                    <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">Code: {p.code || 'None'} • {p.category}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
                                      {p.stock <= 0 ? 'Stock Out' : `${p.stock} Left`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {/* Dashboard Tab Content */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Welcome Dashboard Animation */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
              <div className="w-48 h-48 shrink-0">
              <img src="https://www.nottingham.ac.uk/Brand/LegacyAssets/images-multimedia/2022/Illustration/Scale500x500.jpg" alt="Welcome" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Welcome, {currentAdmin?.name.split('@')[0]}!</h1>
                <p className="mt-2 text-gray-500 font-medium max-w-xl">
                  Welcome to your TRENDIFY administration dashboard. Here you can manage your shop products, track customer orders, update your lookbook styles, and manage your hero banners seamlessly. 
                </p>
                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">System Online</span>
                    </div>
                    <div className="px-4 py-2 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Role: {currentAdmin?.role} Admin</span>
                    </div>

                    {dbStatus?.connected ? (
                      <div className="px-4 py-2 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2" title="Data is synchronized with cloud database">
                        <span className="w-2 h-2 bg-green-600 rounded-full animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Database Connected</span>
                      </div>
                    ) : (
                            <>
                              {/* <div className="px-4 py-2 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-2" title="Data stored in local file fallback DB">
                        <span className="w-2 h-2 bg-rose-600 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-700">⚠️ Database Not Connected</span>
                              </div> */}
                            </>
                    )}
                  </div>

                  {/* MongoDB Diagnostics Widget when not connected
                  {!dbStatus?.connected && (
                    <div className="mt-2 text-left bg-rose-50/50 border border-rose-100 p-5 rounded-2xl max-w-2xl">
                      <h4 className="text-xs font-black uppercase tracking-widest text-rose-800 flex items-center gap-2">
                        <span>⚠️ MongoDB কানেকশন সমস্যা ও সমাধান গাইড</span>
                      </h4>
                      <p className="mt-1 text-xs text-rose-600 font-medium">
                        আপনার কানেকশন স্ট্রিংটি সেটআপ করা হয়েছে কিন্তু ক্লাউড ডাটাবেজ কানেক্ট করা যায়নি। নিচের বিষয়গুলো চেক করুন:
                      </p>
                      
                      {dbStatus?.error && (
                        <div className="mt-3 bg-white/80 border border-rose-100 p-3 rounded-xl font-mono text-[10px] text-rose-700 overflow-x-auto whitespace-pre-wrap">
                          <strong>Error details:</strong> {dbStatus.error}
                        </div>
                      )}

                      <ul className="mt-3 space-y-2 text-xs text-gray-600 list-disc list-inside">
                        <li>
                          <strong className="text-gray-900">Network IP Access (খুবই গুরুত্বপূর্ণ):</strong> MongoDB Atlas ড্যাশবোর্ডে যান, বাম পাশের মেনু থেকে <span className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">Network Access</span> এ ক্লিক করুন। এরপর <span className="font-bold">Add IP Address</span> এ চাপ দিয়ে <span className="text-rose-700 font-black">Allow Access From Anywhere (0.0.0.0/0)</span> সিলেক্ট করে Confirm করুন। (অন্যথায় ক্লাউড রান সার্ভারটি ব্লক হয়ে থাকবে)।
                        </li>
                        <li>
                          <strong className="text-gray-900">পাসওয়ার্ড চেক করুন:</strong> কানেকশন স্ট্রিং এ পাসওয়ার্ড ঠিক আছে কিনা তা নিশ্চিত করুন (যেমন <span className="bg-gray-100 px-1 py-0.5 rounded font-mono">&lt;db_password&gt;</span> লেখাটি মুছে শুধু আপনার পাসওয়ার্ড যেমন <span className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">rtyfghcvb</span> লিখুন)।
                        </li>
                        <li>
                          <strong className="text-gray-900">ডাটা সিঙ্ক্রোনাইজেশন:</strong> কানেকশন সফল হলেই আপনার লোকাল ডাটার ফাইল থেকে সমস্ত প্রোডাক্ট ও অর্ডার ডাটাবেজে স্বয়ংক্রিয়ভাবে আপলোড (Auto Migrate) হয়ে যাবে!
                        </li>
                      </ul>
                    </div>
                  )} */}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <SummaryCard title="Orders" count={orders.length} icon={ShoppingBag} />
              <SummaryCard title="Pending" count={orders.filter(o => o.status === 'pending').length} icon={Package} />
              <SummaryCard title="Processing" count={orders.filter(o => o.status === 'processing').length} icon={Clock} />
              <SummaryCard title="Shipped" count={orders.filter(o => o.status === 'shipped').length} icon={Truck} />
              <SummaryCard title="Delivered" count={orders.filter(o => o.status === 'delivered').length} icon={CheckCircle} />
              <SummaryCard title="Cancelled" count={orders.filter(o => o.status === 'cancelled').length} icon={XCircle} />
              <SummaryCard title="Total Items" count={products.length} icon={ShoppingBasket} />
              <SummaryCard 
                title="Total Stock" 
                count={products.reduce((sum, p) => sum + (p.stock || 0), 0)} 
                icon={PackageCheck} 
                alert={lowStockCount > 0 ? (
                  <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse" title={`${lowStockCount} product(s) below 5 items left`}>
                    ⚠️ {lowStockCount} Low
                  </span>
                ) : undefined}
              />
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl">
                    <DollarSign className="h-6 w-6 text-gray-900" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sales</p>
                   <p className="text-xl font-black">৳{orders.reduce((acc, o) => acc + o.total, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Status Breakdown Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Order Status Distribution</h3>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Pending', count: orders.filter(o => o.status === 'pending').length, color: '#94a3b8' },
                        { name: 'Processing', count: orders.filter(o => o.status === 'processing').length, color: '#3b82f6' },
                        { name: 'Shipped', count: orders.filter(o => o.status === 'shipped').length, color: '#a855f7' },
                        { name: 'Delivered', count: orders.filter(o => o.status === 'delivered').length, color: '#10b981' },
                        { name: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length, color: '#ef4444' },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={8} fontWeight={700} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} textAnchor="middle" height={40} />
                      <YAxis fontSize={8} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {[
                          { name: 'Pending', count: orders.filter(o => o.status === 'pending').length, color: '#94a3b8' },
                          { name: 'Processing', count: orders.filter(o => o.status === 'processing').length, color: '#3b82f6' },
                          { name: 'Shipped', count: orders.filter(o => o.status === 'shipped').length, color: '#a855f7' },
                          { name: 'Delivered', count: orders.filter(o => o.status === 'delivered').length, color: '#10b981' },
                          { name: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length, color: '#ef4444' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Order Trend Area Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
              >
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Recent Sales Trend</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">টাকার বিক্রয় বিশ্লেষণ ও প্রবৃদ্ধি</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select 
                      value={chartTimeframe}
                      onChange={(e) => setChartTimeframe(e.target.value as any)}
                      className="text-xs bg-gray-50 border border-gray-150 hover:border-gray-400 dark:bg-gray-905 dark:border-gray-800 rounded-xl px-3 py-2 font-black cursor-pointer transition-all outline-none"
                    >
                      <option value="last-30-days">Last 30 Days</option>
                      <option value="this-month">This Month</option>
                      <option value="custom">Custom Range</option>
                    </select>

                    {chartTimeframe === 'custom' && (
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-1.5 rounded-xl">
                        <input 
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="bg-transparent text-[11px] font-bold border-none outline-none text-gray-700 dark:text-gray-300 focus:ring-0 p-1"
                        />
                        <span className="text-[10px] uppercase font-black text-gray-400">to</span>
                        <input 
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="bg-transparent text-[11px] font-bold border-none outline-none text-gray-700 dark:text-gray-300 focus:ring-0 p-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={getFilteredOrdersForTrend()}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" fontSize={8} fontWeight={700} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                      <YAxis fontSize={8} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                        formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Total Sales']}
                      />
                      <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Best Selling Products */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Best Selling Products</h3>
                <ShoppingBasket className="h-4 w-4 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {bestSellingProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 cursor-pointer hover:border-black transition-all" onClick={() => window.open(`/product/${product.id}`, '_blank')}>
                    <span className="text-xl font-black text-gray-300">#{index + 1}</span>
                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold">{product.totalSold} Sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Category distribution chart */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Product Categories Distribution</h3>
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Array.from(new Set(products.map(p => p.category))).map(cat => ({
                          name: cat,
                          value: products.filter(p => p.category === cat).length
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {Array.from(new Set(products.map(p => p.category))).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && currentAdmin && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-8">
              <div className="flex flex-col md:flex-row items-center gap-8 border-b border-gray-50 pb-8 mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 bg-gray-100 flex items-center justify-center">
                    {currentAdmin.image ? (
                      <img src={currentAdmin.image} alt={currentAdmin.name || currentAdmin.email} className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-16 h-16 text-gray-300" />
                    )}
                  </div>
                  {/* <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full cursor-pointer shadow-lg"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.div> */}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-black text-gray-900">{currentAdmin.name || 'Admin User'}</h2>
                  <p className="text-gray-500 font-medium">{currentAdmin.email}</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-full border border-amber-100">
                      {currentAdmin.role} Role
                    </span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-full border border-blue-100">
                      Active Account
                    </span>
                  </div>
                </div>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;
                  const email = formData.get('email') as string;
                  const image = formData.get('image') as string;
                  const password = formData.get('password') as string;

                  updateAdmin({
                    ...currentAdmin,
                    name,
                    email,
                    image,
                    password: password || currentAdmin.password
                  });
                  Swal.fire('Updated!', 'Profile updated successfully.', 'success');
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                  <input name="name" defaultValue={currentAdmin.name} placeholder="Your Name" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                  <input name="email" defaultValue={currentAdmin.email} type="email" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Profile Image URL</label>
                  <input name="image" defaultValue={currentAdmin.image} placeholder="https://..." className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">New Password (Leave blank to keep current)</label>
                  <input name="password" type="password" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all" />
                </div>
                <div className="md:col-span-2 pt-4">
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit" 
                    className="px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-black/10 transition-all hover:bg-gray-900"
                  >
                    Save Profile Changes
                  </motion.button>
                </div>
              </form>
            </div>

            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Security Note</h4>
                <p className="text-xs text-amber-700 font-medium leading-relaxed mt-1">
                  You are logged in with {currentAdmin.role} permissions. Any changes you make to your profile will be reflected across the administrative dashboard. Please ensure your new password meets security guidelines.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Product Management Modals (Shared for Shop and Collection) */}
        {isAddingProduct && (activeTab === 'shop' || activeTab === 'collection') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
              <div className="w-full md:w-2/5 flex flex-col gap-4">
                <div className="aspect-[4/5] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                  {newProduct.image ? (
                    <img src={newProduct.image} alt={newProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Image className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Image Preview</span>
                </div>
              </div>

              <form onSubmit={handleAddProduct} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                <div className="md:col-span-2 flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-black uppercase text-xl text-gray-900">{newProduct.isCollection ? 'Add to Collection' : 'Add New Product'}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Fill in the details below</p>
                  </div>
                  <button type="button" onClick={() => setIsAddingProduct(false)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors self-start -mt-2 -mr-2">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Name</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Original Price (৳)</label><input type="number" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newProduct.oldPrice || 0} onChange={e=>setNewProduct({...newProduct, oldPrice: Number(e.target.value)})} placeholder="মেইন প্রাইস (ঐচ্ছিক)" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Selling Price (৳)</label><input type="number" required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: Number(e.target.value)})} /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Stock Quantity</label><input type="number" required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newProduct.stock} onChange={e=>setNewProduct({...newProduct, stock: Number(e.target.value)})} /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Serial Number</label><input type="number" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newProduct.serial} onChange={e=>setNewProduct({...newProduct, serial: Number(e.target.value)})} /></div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Main Image</label>
                  <div className="flex gap-2">
                    <input required className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newProduct.image} onChange={e=>setNewProduct({...newProduct, image: e.target.value})} placeholder="URL or Base64" />
                    <label className="cursor-pointer bg-black text-white px-4 rounded-xl flex items-center hover:bg-gray-800 transition-colors">
                      <Camera className="h-4 w-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e.target.files?.[0] || null, (url) => setNewProduct({...newProduct, image: url}))} />
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2 border border-gray-100 p-4 rounded-2xl bg-gray-50/50">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Product Images Collection (প্রোডাক্টের অন্যান্য ছবিসমূহ)</label>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {(newProduct.images || []).map((imgUrl, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          className="flex-1 border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-none bg-white transition-colors" 
                          value={imgUrl} 
                          onChange={e=>{
                            const updated = [...newProduct.images];
                            updated[idx] = e.target.value;
                            setNewProduct({...newProduct, images: updated});
                          }} 
                          placeholder={`Image URL #${idx + 1}`} 
                        />
                        <label className="cursor-pointer bg-black text-white p-2.5 rounded-xl hover:bg-gray-800 transition-colors">
                          <Camera className="h-3 w-3" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e.target.files?.[0] || null, (url) => {
                            const updated = [...newProduct.images];
                            updated[idx] = url;
                            setNewProduct({...newProduct, images: updated});
                          })} />
                        </label>
                        <button 
                          type="button" 
                          onClick={()=>{
                            const updated = newProduct.images.filter((_, i) => i !== idx);
                            setNewProduct({...newProduct, images: updated});
                          }} 
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {(newProduct.images || []).length === 0 && (
                      <p className="text-xs text-gray-400 italic">No additional images added yet.</p>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={()=>{
                      setNewProduct({...newProduct, images: [...(newProduct.images || []), '']});
                    }} 
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-gray-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add Image Field (প্লাস বাটন)
                  </button>
                </div>
                <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Description</label><textarea required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors h-20 resize-none" value={newProduct.description} onChange={e=>setNewProduct({...newProduct, description: e.target.value})} /></div>
                <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category: e.target.value})} placeholder="যেমন- Basic, Cotton, Sleeveless, Oversized, Winter" /></div>
                <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Product Code (Optional)</label><input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newProduct.code || ''} onChange={e=>setNewProduct({...newProduct, code: e.target.value})} placeholder="যেমন- TS-1001 (ঐচ্ছিক)" /></div>
                <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Size Chart Image URL</label><input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newProduct.sizeChartImage || ''} onChange={e=>setNewProduct({...newProduct, sizeChartImage: e.target.value})} placeholder="Optional size guide image URL (যেমন- https://...)" /></div>
                <div className="md:col-span-2 flex items-center gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2 font-bold uppercase tracking-widest text-xs">
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="add-regular" 
                      name="product-type"
                      checked={!newProduct.isHotSale && !newProduct.isCollection} 
                      onChange={() => setNewProduct({...newProduct, isHotSale: false, isCollection: false})} 
                      className="w-4 h-4 text-black focus:ring-black"
                    />
                    <label htmlFor="add-regular" className="cursor-pointer">Regular</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="add-hotsale" 
                      name="product-type"
                      checked={newProduct.isHotSale} 
                      onChange={() => setNewProduct({...newProduct, isHotSale: true, isCollection: false})} 
                      className="w-4 h-4 text-black focus:ring-black"
                    />
                    <label htmlFor="add-hotsale" className="cursor-pointer">Hot Sale</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="add-collection" 
                      name="product-type"
                      checked={newProduct.isCollection} 
                      onChange={() => {
                        const col = true;
                        setNewProduct({...newProduct, isCollection: col, isHotSale: false});
                      }} 
                      className="w-4 h-4 text-black focus:ring-black"
                    />
                    <label htmlFor="add-collection" className="cursor-pointer">Our Collection</label>
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-3 justify-end pt-2 mt-auto">
                  <button type="button" onClick={() => setIsAddingProduct(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                  <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">Save Product</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingProduct && (activeTab === 'shop' || activeTab === 'collection') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
              
              {/* Image Preview */}
              <div className="w-full md:w-2/5 flex flex-col gap-4">
                <div className="aspect-[4/5] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                  {editingProduct.image ? (
                    <img src={editingProduct.image} alt={editingProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Image className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Image Preview</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateProduct} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                <div className="md:col-span-2 flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-black uppercase text-xl text-gray-900">{editingProduct.isCollection ? 'Edit Collection Item' : 'Edit Product'}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Update details for {editingProduct.name}</p>
                  </div>
                  <button type="button" onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors self-start -mt-2 -mr-2">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Name</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingProduct.name} onChange={e=>setEditingProduct({...editingProduct, name: e.target.value})} /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Original Price (৳)</label><input type="number" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingProduct.oldPrice || 0} onChange={e=>setEditingProduct({...editingProduct, oldPrice: Number(e.target.value)})} placeholder="মেইন প্রাইস (ঐচ্ছিক)" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Selling Price (৳)</label><input type="number" required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingProduct.price} onChange={e=>setEditingProduct({...editingProduct, price: Number(e.target.value)})} /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Stock Quantity</label><input type="number" required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingProduct.stock || 0} onChange={e=>setEditingProduct({...editingProduct, stock: Number(e.target.value)})} /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Serial Number</label><input type="number" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingProduct.serial || 0} onChange={e=>setEditingProduct({...editingProduct, serial: Number(e.target.value)})} /></div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Main Image</label>
                  <div className="flex gap-2">
                    <input required className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingProduct.image} onChange={e=>setEditingProduct({...editingProduct, image: e.target.value})} placeholder="URL or Base64" />
                    <label className="cursor-pointer bg-black text-white px-4 rounded-xl flex items-center hover:bg-gray-800 transition-colors">
                      <Camera className="h-4 w-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e.target.files?.[0] || null, (url) => setEditingProduct({...editingProduct, image: url}))} />
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2 border border-gray-100 p-4 rounded-2xl bg-gray-50/50">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Product Images Collection (প্রোডাক্টের অন্যান্য ছবিসমূহ)</label>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {(editingProduct.images || []).map((imgUrl, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          className="flex-1 border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-none bg-white transition-colors" 
                          value={imgUrl} 
                          onChange={e=>{
                            const updated = [...(editingProduct.images || [])];
                            updated[idx] = e.target.value;
                            setEditingProduct({...editingProduct, images: updated});
                          }} 
                          placeholder={`Image URL #${idx + 1}`} 
                        />
                        <label className="cursor-pointer bg-black text-white p-2.5 rounded-xl hover:bg-gray-800 transition-colors">
                          <Camera className="h-3 w-3" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e.target.files?.[0] || null, (url) => {
                            const updated = [...(editingProduct.images || [])];
                            updated[idx] = url;
                            setEditingProduct({...editingProduct, images: updated});
                          })} />
                        </label>
                        <button 
                          type="button" 
                          onClick={()=>{
                            const updated = (editingProduct.images || []).filter((_, i) => i !== idx);
                            setEditingProduct({...editingProduct, images: updated});
                          }} 
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {(editingProduct.images || []).length === 0 && (
                      <p className="text-xs text-gray-400 italic">No additional images added yet.</p>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={()=>{
                      setEditingProduct({...editingProduct, images: [...(editingProduct.images || []), '']});
                    }} 
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-gray-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add Image Field (প্লাস বাটন)
                  </button>
                </div>
                <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Description</label><textarea required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors h-20 resize-none" value={editingProduct.description} onChange={e=>setEditingProduct({...editingProduct, description: e.target.value})} /></div>
                <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingProduct.category || ''} onChange={e=>setEditingProduct({...editingProduct, category: e.target.value})} placeholder="যেমন- Basic, Cotton, Sleeveless, Oversized, Winter" /></div>
                <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Product Code</label><input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingProduct.code || ''} onChange={e=>setEditingProduct({...editingProduct, code: e.target.value})} placeholder="যেমন- TS-1001" /></div>
                <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Size Chart Image URL</label><input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingProduct.sizeChartImage || ''} onChange={e=>setEditingProduct({...editingProduct, sizeChartImage: e.target.value})} placeholder="Optional size guide image URL (যেমন- https://...)" /></div>
                <div className="md:col-span-2 flex items-center gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2 font-bold uppercase tracking-widest text-xs">
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="edit-regular" 
                      name="edit-product-type"
                      checked={!editingProduct.isHotSale && !editingProduct.isCollection} 
                      onChange={() => setEditingProduct({...editingProduct, isHotSale: false, isCollection: false})} 
                      className="w-4 h-4 text-black focus:ring-black"
                    />
                    <label htmlFor="edit-regular" className="cursor-pointer">Regular</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="edit-hotsale" 
                      name="edit-product-type"
                      checked={editingProduct.isHotSale} 
                      onChange={() => setEditingProduct({...editingProduct, isHotSale: true, isCollection: false})} 
                      className="w-4 h-4 text-black focus:ring-black"
                    />
                    <label htmlFor="edit-hotsale" className="cursor-pointer">Hot Sale</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="edit-collection" 
                      name="edit-product-type"
                      checked={editingProduct.isCollection} 
                      onChange={() => {
                        const col = true;
                        setEditingProduct({...editingProduct, isCollection: col, isHotSale: false});
                      }} 
                      className="w-4 h-4 text-black focus:ring-black"
                    />
                    <label htmlFor="edit-collection" className="cursor-pointer">Our Collection</label>
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-3 justify-end pt-2 mt-auto">
                  <button type="button" onClick={() => setEditingProduct(null)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                  <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product Management Tab */}
        {activeTab === 'shop' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-black uppercase">Product Management</h1>
              <button 
                onClick={() => { 
                  if (!isAddingProduct) {
                    const productsInShop = products.filter(p => !p.isCollection);
                    const maxSerial = Math.max(...productsInShop.map(p => p.serial || 0), 0);
                    setNewProduct({...newProduct, serial: maxSerial + 1, isCollection: false});
                  }
                  setIsAddingProduct(!isAddingProduct); 
                  setEditingProduct(null); 
                }}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 tracking-widest text-[10px] font-bold uppercase transition-colors"
              >
                {isAddingProduct ? 'Cancel' : <><Plus className="h-4 w-4"/> Add Product</>}
              </button>
            </div>





            {/* Filters Dashboard Panel */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {/* Search input field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search Product (সার্চ করুন)</label>
                <input 
                  type="text" 
                  value={adminSearchQuery} 
                  onChange={e => setAdminSearchQuery(e.target.value)} 
                  placeholder="নাম, আইডি বা প্রোডাক্ট কোড..." 
                  className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                />
              </div>

              {/* Category dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category (ক্যাটাগরি)</label>
                <select 
                  value={adminCategoryFilter} 
                  onChange={e => setAdminCategoryFilter(e.target.value)} 
                  className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                >
                  {adminCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All (সকল ক্যাটাগরি)' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hot Sale filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hot Sale (হট সেল)</label>
                <select 
                  value={adminHotSaleFilter} 
                  onChange={e => setAdminHotSaleFilter(e.target.value)} 
                  className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                >
                  <option value="all">All (সকল)</option>
                  <option value="yes">Hot Sale Only (শুধুমাত্র হট সেল)</option>
                  <option value="no">Regular Items (সাধারণ প্রোডাক্ট)</option>
                </select>
              </div>

              {/* Sort selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sort By (সর্ট করুন)</label>
                <select 
                  value={adminSortBy} 
                  onChange={e => setAdminSortBy(e.target.value)} 
                  className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                >
                  <option value="newest">Newest First (নতুন প্রোডাক্ট আগে)</option>
                  <option value="price-asc">Price: Low to High (মূল্য: কম থেকে বেশি)</option>
                  <option value="price-desc">Price: High to Low (মূল্য: বেশি থেকে কম)</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Serial</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Product</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Inventory</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Price</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Hot Sale</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAdminProducts.map(p => (
                    <tr key={p.id}>
                      <td className="p-4">{p.serial || 0}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <img src={p.image} className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 shadow-sm transition-transform hover:scale-110" alt="" />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{p.name}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.category} • {p.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className={`w-16 border border-gray-100 rounded-lg p-1.5 text-xs font-black text-center ${
                              p.stock <= 0 
                                ? 'bg-red-50 text-red-600 border-red-200' 
                                : p.stock < 5 
                                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                : 'bg-gray-50 text-gray-900'
                            }`}
                            value={p.stock || 0}
                            onChange={(e) => updateProduct({ ...p, stock: Number(e.target.value) })}
                          />
                          {p.stock <= 0 ? (
                            <span className="text-[8px] font-black uppercase text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 whitespace-nowrap">Stock Out</span>
                          ) : p.stock < 5 ? (
                            <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 whitespace-nowrap animate-pulse">Low Stock</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4 font-black">৳{p.price}</td>
                      <td className="p-4">{p.isHotSale ? <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">YES</span> : '-'}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => { setEditingProduct(p); setIsAddingProduct(false); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg mr-2"><Edit className="h-5 w-5"/></button>
                        <button onClick={async () => {
                          const result = await Swal.fire({
                            title: 'Are you sure?',
                            text: "Delete this product from general list?",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#000',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Yes, delete it!'
                          });
                          if (result.isConfirmed) {
                            deleteProduct(p.id);
                            Swal.fire('Deleted!', 'Product has been deleted.', 'success');
                          }
                        }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="h-5 w-5"/></button>
                      </td>
                    </tr>
                  ))}
                  {filteredAdminProducts.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No products found holding those search/filter values.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Collection Tab */}
        {activeTab === 'collection' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-black uppercase">Collection</h1>
              <button 
                onClick={() => { 
                  if (!isAddingProduct) {
                    const collectionProducts = products.filter(p => p.isCollection);
                    const maxSerial = Math.max(...collectionProducts.map(p => p.serial || 0), 0);
                    setNewProduct({...newProduct, serial: maxSerial + 1, isCollection: true});
                  }
                  setIsAddingProduct(!isAddingProduct); 
                  setEditingProduct(null); 
                }}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 tracking-widest text-[10px] font-bold uppercase transition-colors"
              >
                {isAddingProduct ? 'Cancel' : <><Plus className="h-4 w-4"/> Add to Collection</>}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Serial</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Product</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Inventory</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Price</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCollectionProducts.map(p => (
                    <tr key={p.id}>
                      <td className="p-4">{p.serial || 0}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <img src={p.image} className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 shadow-sm transition-transform hover:scale-110" alt="" />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 font-sans tracking-tight">{p.name}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.category} • {p.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className={`w-16 border border-gray-100 rounded-lg p-1.5 text-xs font-black text-center ${
                              p.stock <= 0 
                                ? 'bg-red-50 text-red-600 border-red-200' 
                                : p.stock < 5 
                                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                : 'bg-gray-50 text-gray-900'
                            }`}
                            value={p.stock || 0}
                            onChange={(e) => updateProduct({ ...p, stock: Number(e.target.value) })}
                          />
                          {p.stock <= 0 ? (
                            <span className="text-[8px] font-black uppercase text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 whitespace-nowrap">Stock Out</span>
                          ) : p.stock < 5 ? (
                            <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 whitespace-nowrap animate-pulse">Low Stock</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4 font-black">৳{p.price}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => { setEditingProduct(p); setIsAddingProduct(false); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg mr-2"><Edit className="h-5 w-5"/></button>
                        <button onClick={async () => {
                          const result = await Swal.fire({
                            title: 'Are you sure?',
                            text: "Delete this product from collection?",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#000',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Yes, delete it!'
                          });
                          if (result.isConfirmed) {
                            deleteProduct(p.id);
                            Swal.fire('Deleted!', 'Product has been deleted.', 'success');
                          }
                        }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="h-5 w-5"/></button>
                      </td>
                    </tr>
                  ))}
                  {filteredCollectionProducts.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No products found in the collection.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (() => {
          const filteredOrders = (orders || [])
            .filter(order => {
              // 1. Search Query: ID / Phone / Name
              const query = appliedOrderQuery.trim().toLowerCase();
              const matchesSearch = !query || 
                order.id.toLowerCase().includes(query) ||
                (order.customer.phone && order.customer.phone.toLowerCase().includes(query)) ||
                (order.customer.name && order.customer.name.toLowerCase().includes(query));

              // 2. Date Filtering
              let matchesDate = true;
              if (appliedOrderDateRange) {
                const orderDateStr = order.date.substring(0, 10); // "YYYY-MM-DD"
                matchesDate = orderDateStr === appliedOrderDateRange;
              } else if (appliedOrderDateFilter !== 'all') {
                const orderDate = new Date(order.date);
                const today = new Date();
                const orderTime = orderDate.getTime();
                const oneDayMs = 24 * 60 * 60 * 1000;

                if (appliedOrderDateFilter === 'today') {
                  matchesDate = orderDate.toDateString() === today.toDateString();
                } else if (appliedOrderDateFilter === 'yesterday') {
                  const yesterday = new Date(today.getTime() - oneDayMs);
                  matchesDate = orderDate.toDateString() === yesterday.toDateString();
                } else if (appliedOrderDateFilter === 'this-week') {
                  const sevenDaysAgo = today.getTime() - (7 * oneDayMs);
                  matchesDate = orderTime >= sevenDaysAgo;
                }
              }

              // 3. Status Filtering
              const matchesStatus = appliedOrderStatusFilter === 'all' || order.status === appliedOrderStatusFilter;

              return matchesSearch && matchesDate && matchesStatus;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const handleOrderSearch = () => {
            setIsSearchingOrders(true);
            setTimeout(() => {
              setAppliedOrderQuery(orderSearchQuery);
              setAppliedOrderDateFilter(orderDateFilter);
              setAppliedOrderDateRange(orderDateRange);
              setAppliedOrderStatusFilter(orderStatusFilter);
              setOrdersPerPage(tempOrdersPerPage); // Apply pagination count on search
              setOrdersPage(1);
              setIsSearchingOrders(false);
            }, 800);
          };

          const currentPageOrders = filteredOrders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);
          const areAllSelected = currentPageOrders.length > 0 && currentPageOrders.every(o => selectedOrderIds.includes(o.id));

          const handleToggleSelectAll = () => {
            if (areAllSelected) {
              const currentPageIds = currentPageOrders.map(o => o.id);
              setSelectedOrderIds(prev => prev.filter(id => !currentPageIds.includes(id)));
            } else {
              const currentPageIds = currentPageOrders.map(o => o.id);
              setSelectedOrderIds(prev => {
                const newSelection = [...prev];
                currentPageIds.forEach(id => {
                  if (!newSelection.includes(id)) {
                    newSelection.push(id);
                  }
                });
                return newSelection;
              });
            }
          };

          const handleToggleOrderSelection = (orderId: string) => {
            setSelectedOrderIds(prev =>
              prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
            );
          };

          const handleBulkStatusUpdate = (status: Order['status']) => {
            selectedOrderIds.forEach(id => {
              updateOrderStatus(id, status);
            });
            setSelectedOrderIds([]); // Clear selection after action
            Swal.fire({
              title: 'Success',
              text: `Successfully updated ${selectedOrderIds.length} orders to ${status}!`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          };

          return (
            <div className="relative">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h1 className="text-2xl font-black uppercase">Orders</h1>
                <div className="flex gap-2">
                  <button 
                    onClick={() => exportOrdersToExcel(filteredOrders)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 tracking-widest text-[10px] font-bold uppercase transition-colors shadow-lg"
                  >
                    <Download className="h-4 w-4"/> Export
                  </button>
                </div>
              </div>

              {/* Advanced search and filter controls */}
              <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 mb-6 grid grid-cols-1 md:grid-cols-6 gap-4 shadow-sm items-end transition-colors">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">অর্ডার সার্চ (ID/ফোন/নাম)</label>
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">টাইম ফিল্টার</label>
                  <select
                    value={orderDateFilter}
                    onChange={(e) => {
                      setOrderDateFilter(e.target.value as any);
                      setOrderDateRange('');
                    }}
                    className="w-full text-xs font-bold border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 dark:text-white focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="this-week">Last 7 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Order Date</label>
                  <input
                    type="date"
                    value={orderDateRange}
                    onChange={(e) => {
                      setOrderDateRange(e.target.value);
                      setOrderDateFilter('all');
                    }}
                    className="w-full text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 dark:text-white focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Status</label>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                    className="w-full text-xs font-bold border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 dark:text-white focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Per Page</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={tempOrdersPerPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setTempOrdersPerPage(val);
                    }}
                    className="w-full text-xs font-bold border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 dark:text-white focus:bg-white focus:outline-none text-center"
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleOrderSearch}
                    disabled={isSearchingOrders}
                    className="flex-1 bg-black dark:bg-white dark:text-black text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-black uppercase text-[10px] tracking-widest disabled:opacity-50 shadow-lg shadow-black/10"
                  >
                    {isSearchingOrders ? (
                      <div className="h-4 w-4 border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black rounded-full animate-spin" />
                    ) : (
                      <Search className="h-4 w-4"/>
                    )}
                    Search
                  </button>
                </div>
              </div>

              <div className="relative min-h-[400px]">
                {isSearchingOrders && (
                   <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 animate-pulse">Searching Orders...</p>
                      </div>
                   </div>
                )}

                {selectedOrderIds.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-black text-white px-6 py-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-xl border border-gray-800 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white/15 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-green-400">
                        {selectedOrderIds.length} Selected
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-gray-300">Bulk Update Status:</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleBulkStatusUpdate('pending')}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('processing')}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                      >
                        Processing
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('shipped')}
                        className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                      >
                        Shipped
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('delivered')}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                      >
                        Delivered
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('cancelled')}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                      >
                        Cancelled
                      </button>
                      <button
                        onClick={() => setSelectedOrderIds([])}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
                      >
                        Deselect All
                      </button>
                    </div>
                  </motion.div>
                )}

                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 flex flex-col items-center gap-4">
                    <Package className="h-12 w-12 opacity-10" />
                    <p className="font-bold uppercase tracking-widest text-xs">No matching orders found.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-300">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 dark:bg-gray-850 dark:border-gray-800 text-gray-500 font-bold">
                            <th className="py-4 px-6 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={areAllSelected}
                                onChange={handleToggleSelectAll}
                                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer accent-black"
                              />
                            </th>
                            <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest">Order ID</th>
                            <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest">Customer</th>
                            <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest">Date & Time</th>
                            <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest">Items</th>
                            <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest">Total</th>
                            <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {currentPageOrders.map(order => {
                            const isSelected = selectedOrderIds.includes(order.id);
                            return (
                              <tr 
                                key={order.id} 
                                className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/55 transition-colors ${isSelected ? 'bg-gray-50/30 dark:bg-gray-800/10' : ''}`}
                              >
                                <td className="py-4 px-6 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleOrderSelection(order.id)}
                                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer accent-black"
                                  />
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-col">
                                    <span className="font-mono font-black text-gray-900 dark:text-white">#{order.id}</span>
                                    {order.notes && (
                                      <span className="text-[9px] bg-amber-50 text-amber-700 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 w-fit">
                                        Has Notes
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-col max-w-[200px]">
                                    <span className="font-bold text-gray-900 dark:text-white truncate">{order.customer.name}</span>
                                    <span className="text-[11px] text-gray-500 font-mono mt-0.5">{order.customer.phone}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-col">
                                    <span className="text-gray-900 dark:text-white font-medium text-xs">{formatDate(order.date)}</span>
                                    <span className="text-[10px] text-gray-400 font-medium mt-0.5">{formatTime(order.date)}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex -space-x-3 overflow-hidden">
                                    {order.items.slice(0, 3).map((item, i) => (
                                      <img 
                                        key={i} 
                                        src={item.image} 
                                        className="w-8 h-8 rounded-lg border-2 border-white dark:border-gray-950 object-cover shadow bg-white shrink-0" 
                                        alt=""
                                      />
                                    ))}
                                    {order.items.length > 3 && (
                                      <div className="w-8 h-8 rounded-lg border-2 border-white dark:border-gray-950 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] font-black text-gray-500 dark:text-gray-300 shadow shrink-0">
                                        +{order.items.length - 3}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="font-black text-gray-900 dark:text-white text-sm">৳{order.total.toLocaleString()}</span>
                                </td>
                                                                <td className="py-4 px-4 font-bold">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block ${
                                    order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    order.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    order.status === 'shipped' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                    order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                                    'bg-red-50 text-red-600 border-red-100'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedOrderForView(order);
                                      if (!readOrderIds.includes(order.id)) {
                                        setReadOrderIds(prev => [...prev, order.id]);
                                      }
                                    }}
                                    className="px-3.5 py-1.5 bg-gray-950 dark:bg-gray-800 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-gray-800 dark:hover:bg-gray-750 transition-colors shadow-sm cursor-pointer"
                                  >
                                    View Order
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Pagination Controls */}
                {filteredOrders.length > ordersPerPage && (
                  <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                    <button 
                      onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
                      disabled={ordersPage === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                      Page {ordersPage} of {Math.ceil(filteredOrders.length / ordersPerPage)}
                    </span>
                    <button 
                      onClick={() => setOrdersPage(Math.min(Math.ceil(filteredOrders.length / ordersPerPage), ordersPage + 1))}
                      disabled={ordersPage === Math.ceil(filteredOrders.length / ordersPerPage)}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Order Detail View Modal */}
              <AnimatePresence>
                {selectedOrderForView && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center md:p-8"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-6xl md:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col"
                    >
                      {/* Header */}
                      <div className="bg-gray-900 p-6 md:p-8 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <PackageCheck className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Order Details</h2>
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                selectedOrderForView.status === 'pending' ? 'bg-amber-500 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' :
                                selectedOrderForView.status === 'processing' ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                                selectedOrderForView.status === 'shipped' ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' :
                                selectedOrderForView.status === 'delivered' ? 'bg-green-500 text-white border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' :
                                'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                              }`}>
                                {selectedOrderForView.status}
                              </span>
                            </div>
                            <p className="text-sm uppercase font-black text-white/60 tracking-widest mt-1">ID: {selectedOrderForView.id}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedOrderForView(null)}
                          className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                          {/* Left Column: Items */}
                          <div className="lg:col-span-2 space-y-8">
                            <section>
                              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> Ordered Items ({selectedOrderForView.items.length})
                              </h3>
                              <div className="space-y-4">
                                {selectedOrderForView.items.map((item, idx) => (
                                  <div key={idx} className="flex gap-6 p-5 rounded-[2rem] border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50/30">
                                    <img src={item.image} alt={item.name} className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-[1.5rem] shadow-md bg-white shrink-0" />
                                    <div className="flex-1 flex flex-col justify-center min-w-0">
                                      <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate text-lg uppercase">{item.name}</h4>
                                      <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg">
                                          Size: {item.selectedSize || 'N/A'}
                                        </span>
                                        <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg">
                                          Qty: {item.quantity}
                                        </span>
                                        {item.code && (
                                          <span className="bg-purple-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg">
                                            Code: {item.code}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex justify-between items-center mt-4">
                                        <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Unit: ৳{item.price}</p>
                                        <p className="font-black text-gray-900 text-xl">৳{(item.price * item.quantity).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <section className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                  <Ticket className="w-3.5 h-3.5" /> Order Summary
                                </h3>
                                <div className="space-y-3">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Subtotal</span>
                                    <span className="font-bold">৳{selectedOrderForView.subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Coupon Discount</span>
                                    <span className="font-bold text-red-500">-৳{selectedOrderForView.discount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Shipping Charge</span>
                                    <span className="font-bold">৳{(selectedOrderForView.total - (selectedOrderForView.subtotal - selectedOrderForView.discount)).toFixed(2)}</span>
                                  </div>
                                  <div className="h-px bg-gray-200 my-2" />
                                  <div className="flex justify-between items-center text-lg">
                                    <span className="font-black uppercase tracking-tighter">Total</span>
                                    <span className="font-black text-blue-600">৳{selectedOrderForView.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </section>

                              <section className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Quick Status Update</h3>
                                <div className="flex flex-wrap gap-2">
                                  {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as Order['status'][]).map(st => (
                                    <button 
                                      key={st}
                                      onClick={() => {
                                        updateOrderStatus(selectedOrderForView.id, st);
                                        setSelectedOrderForView({...selectedOrderForView, status: st});
                                      }}
                                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                        selectedOrderForView.status === st 
                                        ? st === 'pending' ? 'bg-amber-500 text-white border-amber-400 shadow-lg scale-105' :
                                          st === 'processing' ? 'bg-blue-500 text-white border-blue-400 shadow-lg scale-105' :
                                          st === 'shipped' ? 'bg-purple-500 text-white border-purple-400 shadow-lg scale-105' :
                                          st === 'delivered' ? 'bg-green-500 text-white border-green-400 shadow-lg scale-105' :
                                          'bg-red-500 text-white border-red-400 shadow-lg scale-105'
                                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </section>
                            </div>
                          </div>

                          {/* Right Column: Customer & Actions */}
                          <div className="space-y-6">
                            <section className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <UserCircle className="w-4 h-4" /> Customer Information
                              </h3>
                              <div className="space-y-5">
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                                  <p className="font-bold text-lg">{selectedOrderForView.customer.name}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact Number</p>
                                  <p className="font-bold font-mono text-lg">{selectedOrderForView.customer.phone}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                                  <p className="text-gray-300 font-medium text-sm">{selectedOrderForView.customer.email || 'No email provided'}</p>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                  <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
                                    <div>
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivery Address</p>
                                      <p className="text-sm font-medium leading-relaxed">
                                        <span className="block font-black text-white mb-0.5">{selectedOrderForView.customer.district || 'General'}</span>
                                        {selectedOrderForView.customer.address}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </section>

                            {/* Internal Notes Panel */}
                            <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Internal Notes
                              </h3>
                              <div>
                                <textarea
                                  value={orderNotes}
                                  onChange={(e) => setOrderNotes(e.target.value)}
                                  placeholder="Add private updates or internal notes for this order here..."
                                  rows={3}
                                  className="w-full text-xs p-3.5 border border-gray-100 hover:border-gray-250 focus:border-black focus:ring-0 rounded-2xl outline-none resize-none transition-colors bg-gray-50/50 text-gray-900"
                                />
                                <div className="flex justify-end mt-2">
                                  <button
                                    onClick={() => {
                                      updateOrderNotes(selectedOrderForView.id, orderNotes);
                                      setSelectedOrderForView({ ...selectedOrderForView, notes: orderNotes });
                                      Swal.fire({
                                        title: 'Saved',
                                        text: 'Order notes successfully updated!',
                                        icon: 'success',
                                        timer: 1500,
                                        showConfirmButton: false,
                                        toast: true,
                                        position: 'top-end'
                                      });
                                    }}
                                    className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm active:scale-95 cursor-pointer"
                                  >
                                    Save Notes
                                  </button>
                                </div>
                              </div>
                            </section>

                            <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => handlePrintInvoice(selectedOrderForView)}
                                className="w-full bg-blue-600 text-white p-5 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 group"
                              >
                                <Printer className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Print Invoice</span>
                              </button>
                              <button 
                                onClick={() => {
                                  Swal.fire({
                                    title: 'Are you sure?',
                                    text: "You won't be able to revert this!",
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#ef4444',
                                    cancelButtonColor: '#111',
                                    confirmButtonText: 'Yes, delete it!'
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      deleteOrder(selectedOrderForView.id);
                                      setSelectedOrderForView(null);
                                      Swal.fire('Deleted!', 'Order has been deleted.', 'success');
                                    }
                                  });
                                }}
                                className="w-full bg-red-50 text-red-600 p-5 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-red-100 transition-all border border-red-100 shadow-xl shadow-red-600/5 group"
                              >
                                <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Delete Order</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-black uppercase">Coupons</h1>
              <button 
                onClick={() => {
                  setEditingCoupon(null);
                  setNewCoupon({ code: '', discountValue: 0, discountType: 'percentage', isActive: true, startDate: '', expiryDate: '' });
                  setIsAddingCoupon(!isAddingCoupon);
                }}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 tracking-widest text-[10px] font-bold uppercase transition-colors"
              >
                {isAddingCoupon ? 'Cancel' : <><Plus className="h-4 w-4"/> Add Coupon</>}
              </button>
            </div>

            {isAddingCoupon && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative">
                  <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="font-black uppercase text-xl text-gray-900">{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h3>
                      </div>
                      <button type="button" onClick={() => setIsAddingCoupon(false)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors self-start -mt-2 -mr-2">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Coupon Code</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm uppercase focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newCoupon.code} onChange={e=>setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} /></div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Discount Type</label>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setNewCoupon({...newCoupon, discountType: 'percentage'})}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${newCoupon.discountType === 'percentage' ? 'bg-yellow-400 border-yellow-500 text-black' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                        >
                          Percentage (%)
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setNewCoupon({...newCoupon, discountType: 'amount'})}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${newCoupon.discountType === 'amount' ? 'bg-yellow-400 border-yellow-500 text-black' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                        >
                          Fixed Amount (৳)
                        </button>
                      </div>
                    </div>
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Discount Value</label><input type="number" required min="1" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newCoupon.discountValue} onChange={e=>setNewCoupon({...newCoupon, discountValue: Number(e.target.value)})} /></div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Start Date & Time</label>
                      <input 
                        type="datetime-local" 
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" 
                        value={newCoupon.startDate || ''} 
                        onChange={e=>setNewCoupon({...newCoupon, startDate: e.target.value})} 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Expiry Date & Time</label>
                      <input 
                        type="datetime-local" 
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" 
                        value={newCoupon.expiryDate || ''} 
                        onChange={e=>setNewCoupon({...newCoupon, expiryDate: e.target.value})} 
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
                      <input type="checkbox" id="isactive" checked={newCoupon.isActive} onChange={e=>setNewCoupon({...newCoupon, isActive: e.target.checked})} className="w-4 h-4 text-black focus:ring-black" />
                      <label htmlFor="isactive" className="text-xs font-bold uppercase tracking-widest text-gray-900 cursor-pointer select-none">Active</label>
                    </div>
                    <div className="md:col-span-2 flex gap-3 justify-end pt-2 mt-4">
                      <button type="button" onClick={() => { setIsAddingCoupon(false); setEditingCoupon(null); }} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                      <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">Save Coupon</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Code</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Discount</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-center">Expiry</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Status</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map(c => {
                    const now = new Date();
                    const isExpired = c.expiryDate && new Date(c.expiryDate) < now;
                    const isStarted = !c.startDate || new Date(c.startDate) <= now;
                    return (
                      <tr key={c.id}>
                        <td className="p-4"><span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-lg font-mono font-black tracking-wider text-sm shadow-sm">{c.code}</span></td>
                        <td className="p-4 text-gray-900 font-extrabold">{c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `৳${c.discountValue} FLAT`}</td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col gap-1">
                            {c.startDate && (
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold uppercase text-gray-400">Starts</span>
                                <span className={`text-[10px] font-bold ${!isStarted ? 'text-blue-500' : 'text-gray-600'}`}>
                                  {new Date(c.startDate).toLocaleDateString()} {new Date(c.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                            {c.expiryDate && (
                              <div className="flex flex-col border-t border-gray-100 pt-1">
                                <span className="text-[8px] font-bold uppercase text-gray-400">Expires</span>
                                <span className={`text-[10px] font-bold ${isExpired ? 'text-red-500' : 'text-gray-600'}`}>
                                  {new Date(c.expiryDate).toLocaleDateString()} {new Date(c.expiryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                            {!c.startDate && !c.expiryDate && <span className="text-gray-400 text-xs">No Limits</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          {isExpired ? (
                            <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase px-2 py-0.5 rounded">Expired</span>
                          ) : !isStarted ? (
                            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase px-2 py-0.5 rounded">Upcoming</span>
                          ) : c.isActive ? (
                            <span className="bg-green-50 text-green-600 border border-green-100 text-[10px] font-black uppercase px-2 py-0.5 rounded">Active</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-black uppercase px-2 py-0.5 rounded">Inactive</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => {
                              setEditingCoupon(c);
                              setNewCoupon({ code: c.code, discountValue: c.discountValue, discountType: c.discountType, isActive: c.isActive, startDate: c.startDate || '', expiryDate: c.expiryDate || '' });
                              setIsAddingCoupon(true);
                            }} 
                            className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg mr-2"
                          >
                            <Edit className="h-5 w-5"/>
                          </button>
                          <button onClick={async () => {
                            const result = await Swal.fire({
                              title: 'Are you sure?',
                              text: "You won't be able to revert this!",
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#000',
                              cancelButtonColor: '#d33',
                              confirmButtonText: 'Yes, delete it!'
                            });
                            if (result.isConfirmed) {
                              deleteCoupon(c.id);
                              Swal.fire('Deleted!', 'Coupon has been deleted.', 'success');
                            }
                          }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="h-5 w-5"/></button>
                        </td>
                      </tr>
                    );
                  })}
                  {coupons.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No coupons found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Slides Tab */}
        {activeTab === 'slides' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-black uppercase">Hero Banners</h1>
              <button 
                onClick={() => setIsAddingSlide(!isAddingSlide)}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 tracking-widest text-[10px] font-bold uppercase transition-colors"
              >
                {isAddingSlide ? 'Cancel' : <><Plus className="h-4 w-4"/> Add Slide</>}
              </button>
            </div>

            {isAddingSlide && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
                  <div className="w-full md:w-2/5 flex flex-col gap-4">
                    <div className="aspect-[4/5] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                      {newSlide.image ? (
                        <img src={newSlide.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Image className="h-12 w-12 opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Image Preview</span>
                    </div>
                  </div>

                  <form onSubmit={handleAddSlide} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                    <div className="md:col-span-2 flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="font-black uppercase text-xl text-gray-900">Add Hero Banner</h3>
                      </div>
                      <button type="button" onClick={() => setIsAddingSlide(false)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors self-start -mt-2 -mr-2">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Title</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newSlide.title} onChange={e=>setNewSlide({...newSlide, title: e.target.value})} placeholder="e.g. Summer Collection" /></div>
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Subtitle</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newSlide.subtitle} onChange={e=>setNewSlide({...newSlide, subtitle: e.target.value})} placeholder="e.g. 50% Off Everything" /></div>
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Tag Text</label><input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newSlide.tagText} onChange={e=>setNewSlide({...newSlide, tagText: e.target.value})} placeholder="e.g. New Arrivals" /></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Auto Category Link</label>
                        <select 
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                          onChange={e => {
                            if (e.target.value) {
                              setNewSlide({...newSlide, link: `/shop?category=${encodeURIComponent(e.target.value)}`});
                            }
                          }}
                        >
                          <option key="slide-cat" value="">-- Choose Category --</option>
                          {adminCategories.filter(c => c !== 'all').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Destination URL Link</label>
                        <input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newSlide.link} onChange={e=>setNewSlide({...newSlide, link: e.target.value})} placeholder="e.g. /shop" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Slide Image</label>
                      <div className="flex gap-2">
                        <input required className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newSlide.image} onChange={e=>setNewSlide({...newSlide, image: e.target.value})} placeholder="URL or Base64" />
                        <label className="cursor-pointer bg-black text-white px-4 rounded-xl flex items-center hover:bg-gray-800 transition-colors">
                          <Camera className="h-4 w-4" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e.target.files?.[0] || null, (url) => setNewSlide({...newSlide, image: url}))} />
                        </label>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 flex gap-3 justify-end pt-2 mt-auto">
                      <button type="button" onClick={() => setIsAddingSlide(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                      <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">Save Slide</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Image & Title</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Subtitle</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {slides.map(s => (
                    <tr key={s.id}>
                      <td className="p-4 flex items-center gap-3">
                        <img src={s.image} className="w-16 h-10 rounded object-cover" alt="" />
                        <span className="font-medium">{s.title}</span>
                      </td>
                      <td className="p-4">{s.subtitle}</td>
                      <td className="p-4 text-right flex gap-3 justify-end">
                        <button 
                          onClick={() => {
                            setEditingSlide(s);
                            setNewSlide({ title: s.title, subtitle: s.subtitle, image: s.image, tagText: s.tagText || '', link: s.link || '' });
                            setIsAddingSlide(true);
                          }}
                          className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"
                        >
                          <Edit className="h-5 w-5"/>
                        </button>
                        <button onClick={async () => {
                          const result = await Swal.fire({
                            title: 'Are you sure?',
                            text: "Delete this slide?",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#000',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Yes, delete it!'
                          });
                          if (result.isConfirmed) {
                            deleteSlide(s.id);
                            Swal.fire('Deleted!', 'Slide has been deleted.', 'success');
                          }
                        }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="h-5 w-5"/></button>
                      </td>
                    </tr>
                  ))}
                  {slides.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-500">No slides found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-black uppercase">Category Banners</h1>
              <button 
                onClick={() => setIsAddingCategoryBanner(!isAddingCategoryBanner)}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 tracking-widest text-[10px] font-bold uppercase transition-colors"
               >
                {isAddingCategoryBanner ? 'Cancel' : <><Plus className="h-4 w-4"/> Add Category</>}
              </button>
            </div>

            {isAddingCategoryBanner && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
                  <div className="w-full md:w-2/5 flex flex-col gap-4">
                    <div className="aspect-[4/5] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                      {newCategoryBanner.image ? (
                        <img src={newCategoryBanner.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Image className="h-12 w-12 opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Image Preview</span>
                    </div>
                  </div>

                  <form onSubmit={handleAddCategoryBanner} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                    <div className="md:col-span-2 flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="font-black uppercase text-xl text-gray-950">Add Category</h3>
                      </div>
                      <button type="button" onClick={() => setIsAddingCategoryBanner(false)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors self-start -mt-2 -mr-2">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Title (Use \n for break)</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newCategoryBanner.title} onChange={e=>setNewCategoryBanner({...newCategoryBanner, title: e.target.value})} placeholder="e.g. Basic\nTees" /></div>
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Subtitle</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newCategoryBanner.subtitle} onChange={e=>setNewCategoryBanner({...newCategoryBanner, subtitle: e.target.value})} placeholder="e.g. Everyday Essentials" /></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Auto Category Link</label>
                        <select 
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                          onChange={e => {
                            if (e.target.value) {
                              setNewCategoryBanner({...newCategoryBanner, link: `/shop?category=${encodeURIComponent(e.target.value)}`});
                            }
                          }}
                        >
                          <option key="banner-cat" value="">-- Choose Category --</option>
                          {adminCategories.filter(c => c !== 'all').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Destination URL Link</label>
                        <input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newCategoryBanner.link} onChange={e=>setNewCategoryBanner({...newCategoryBanner, link: e.target.value})} placeholder="e.g. /shop?category=Winter" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Banner Image</label>
                      <div className="flex gap-2">
                        <input required className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newCategoryBanner.image} onChange={e=>setNewCategoryBanner({...newCategoryBanner, image: e.target.value})} placeholder="URL or Base64" />
                        <label className="cursor-pointer bg-black text-white px-4 rounded-xl flex items-center hover:bg-gray-800 transition-colors">
                          <Camera className="h-4 w-4" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e.target.files?.[0] || null, (url) => setNewCategoryBanner({...newCategoryBanner, image: url}))} />
                        </label>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 flex gap-3 justify-end pt-2 mt-auto">
                       <button type="button" onClick={() => setIsAddingCategoryBanner(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                       <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">Save Category</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {editingCategoryBanner && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
                  <div className="w-full md:w-2/5 flex flex-col gap-4">
                    <div className="aspect-[4/5] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                      {editingCategoryBanner.image ? (
                        <img src={editingCategoryBanner.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Image className="h-12 w-12 opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Image Preview</span>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateCategoryBanner} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                    <div className="md:col-span-2 flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="font-black uppercase text-xl text-gray-900">Edit Category Banner</h3>
                      </div>
                      <button type="button" onClick={() => setEditingCategoryBanner(null)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors self-start -mt-2 -mr-2">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Title (Use \n for break)</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingCategoryBanner.title} onChange={e=>setEditingCategoryBanner({...editingCategoryBanner, title: e.target.value})} placeholder="e.g. Basic\nTees" /></div>
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Subtitle</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingCategoryBanner.subtitle} onChange={e=>setEditingCategoryBanner({...editingCategoryBanner, subtitle: e.target.value})} placeholder="e.g. Everyday Essentials" /></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Auto Category Link</label>
                        <select 
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                          onChange={e => {
                            if (e.target.value) {
                              setEditingCategoryBanner({...editingCategoryBanner, link: `/shop?category=${encodeURIComponent(e.target.value)}`});
                            }
                          }}
                        >
                          <option key="edit-banner-cat" value="">-- Choose Category --</option>
                          {adminCategories.filter(c => c !== 'all').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Destination URL Link</label>
                        <input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingCategoryBanner.link} onChange={e=>setEditingCategoryBanner({...editingCategoryBanner, link: e.target.value})} placeholder="e.g. /shop?category=Winter" />
                      </div>
                    </div>

                    <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Image URL</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={editingCategoryBanner.image} onChange={e=>setEditingCategoryBanner({...editingCategoryBanner, image: e.target.value})} placeholder="https://..." /></div>
                    
                    <div className="md:col-span-2 flex gap-3 justify-end pt-2 mt-auto">
                       <button type="button" onClick={() => setEditingCategoryBanner(null)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                       <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">Save Changes</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Image & Title</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Subtitle</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Link</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categoryBanners.map(c => (
                    <tr key={c.id}>
                      <td className="p-4 flex items-center gap-3">
                        <img src={c.image} className="w-12 h-12 rounded object-cover" alt="" />
                        <span className="font-medium whitespace-pre-line">{c.title}</span>
                      </td>
                      <td className="p-4">{c.subtitle}</td>
                      <td className="p-4">{c.link}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingCategoryBanner(c)} className="text-black hover:bg-gray-50 p-2 rounded-lg" title="Edit Category"><Edit className="h-5 w-5"/></button>
                          <button onClick={async () => {
                            const result = await Swal.fire({
                              title: 'Are you sure?',
                              text: "Delete this category banner?",
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#000',
                              cancelButtonColor: '#d33',
                              confirmButtonText: 'Yes, delete it!'
                            });
                            if (result.isConfirmed) {
                              deleteCategoryBanner(c.id);
                              Swal.fire('Deleted!', 'Category banner has been deleted.', 'success');
                            }
                          }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Delete Category"><Trash2 className="h-5 w-5"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categoryBanners.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No categories found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lookbook Tab */}
        {activeTab === 'lookbook' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-black uppercase">Lookbook Images</h1>
              <button 
                onClick={() => {
                  setEditingLookbook(null);
                  setNewLookbook({ image: '', link: '', className: '', serial: lookbook.length + 1, title: '' });
                  setIsAddingLookbook(!isAddingLookbook);
                }}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 tracking-widest text-[10px] font-bold uppercase transition-colors"
               >
                {isAddingLookbook ? 'Cancel' : <><Plus className="h-4 w-4"/> Add Lookbook Item</>}
              </button>
            </div>

            {isAddingLookbook && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
                  <div className="w-full md:w-2/5 flex flex-col gap-4">
                    <div className="aspect-[4/5] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 shadow-inner">
                      {newLookbook.image ? (
                        <img src={newLookbook.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Image className="h-12 w-12 opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Lookbook Preview</span>
                    </div>
                  </div>

                  <form onSubmit={handleAddLookbook} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                    <div className="md:col-span-2 flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="font-black uppercase text-xl text-gray-900">{editingLookbook ? 'Edit Lookbook Item (লুকবুকসম্পাদনা)' : 'Add Lookbook Item (লুকবুক ছবি যোগ)'}</h3>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsAddingLookbook(false);
                          setEditingLookbook(null);
                        }} 
                        className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors self-start -mt-2 -mr-2"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Image URL</label>
                      <input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newLookbook.image} onChange={e=>setNewLookbook({...newLookbook, image: e.target.value})} placeholder="https://unsplash.com/etc..." />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Serial / Position</label>
                      <input type="number" required min="1" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newLookbook.serial} onChange={e=>setNewLookbook({...newLookbook, serial: Number(e.target.value) || 1})} placeholder="যেমন - ১, ২, ৩" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Title / শিরোনাম (ঐচ্ছিক)</label>
                      <input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newLookbook.title} onChange={e=>setNewLookbook({...newLookbook, title: e.target.value})} placeholder="যেমন - Summer Minimalist Series" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Grid Style Class</label>
                      <input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newLookbook.className} onChange={e=>setNewLookbook({...newLookbook, className: e.target.value})} placeholder="যেমন - md:col-span-2 md:row-span-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Auto Category Link (ক্যাটাগরি রাউটার)</label>
                        <select 
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                          onChange={e => {
                            if (e.target.value) {
                              setNewLookbook({...newLookbook, link: `/shop?category=${encodeURIComponent(e.target.value)}`});
                            }
                          }}
                        >
                          <option key="lookbook-cat" value="">-- Choose Category --</option>
                          {adminCategories.filter(c => c !== 'all').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Destination Link (Optional)</label>
                        <input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newLookbook.link} onChange={e=>setNewLookbook({...newLookbook, link: e.target.value})} placeholder="যেমন- /shop?category=Basic" />
                      </div>
                    </div>

                    <div className="md:col-span-2 flex gap-3 justify-end pt-2 mt-auto">
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsAddingLookbook(false);
                          setEditingLookbook(null);
                        }} 
                        className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">
                        {editingLookbook ? 'Update Lookbook Image' : 'Save Lookbook Image'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 animate-fade-in">
                  <tr>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Serial</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Title</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Image</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Link Destination</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Grid Style Class</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...lookbook]
                    .sort((a, b) => (a.serial || 0) - (b.serial || 0))
                    .map(l => (
                      <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-black text-gray-900 text-sm">#{l.serial || 0}</td>
                        <td className="p-4 font-bold text-gray-800">{l.title || <span className="text-gray-300 font-normal">None</span>}</td>
                        <td className="p-4">
                          <img src={l.image} className="w-16 h-16 rounded object-cover shadow-sm border border-gray-200" alt="" />
                        </td>
                        <td className="p-4 font-mono text-xs text-gray-600">{l.link || '/shop'}</td>
                        <td className="p-4 text-xs font-mono text-gray-400">{l.className || <span className="italic text-gray-300">Default (1x1)</span>}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => {
                              setEditingLookbook(l);
                              setNewLookbook({
                                image: l.image,
                                link: l.link,
                                className: l.className || '',
                                widthPercent: l.widthPercent || '100%',
                                serial: l.serial || 1,
                                title: l.title || ''
                              });
                              setIsAddingLookbook(true);
                            }} 
                            className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg inline-block mr-2"
                            title="Edit Item"
                          >
                            <Edit className="h-5 w-5"/>
                          </button>
                          <button onClick={async () => {
                            const result = await Swal.fire({
                              title: 'Are you sure?',
                              text: "Delete this lookbook image?",
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#000',
                              cancelButtonColor: '#d33',
                              confirmButtonText: 'Yes, delete it!'
                            });
                            if (result.isConfirmed) {
                              deleteLookbookImage(l.id);
                              Swal.fire('Deleted!', 'Lookbook image has been deleted.', 'success');
                            }
                          }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Delete Item"><Trash2 className="h-5 w-5"/></button>
                        </td>
                      </tr>
                    ))}
                  {lookbook.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No lookbook images found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-black uppercase">Subscribers</h1>
              <button 
                onClick={() => { setEmailTarget('all'); setEmailModalType('newsletter'); setIsSendingEmail(true); }}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 tracking-widest text-[10px] font-bold uppercase transition-colors"
               >
                <Mail className="h-4 w-4"/> Send to All
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Email</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Date</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscribers.map(sub => (
                    <tr key={sub.id}>
                      <td className="p-4 font-medium">{sub.email}</td>
                      <td className="p-4 text-gray-500">{new Date(sub.date).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => { setEmailTarget(sub.email); setEmailModalType('newsletter'); setIsSendingEmail(true); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg inline-block mr-2" title="Send Email">
                          <Mail className="h-5 w-5"/>
                        </button>
                        <button onClick={async () => {
                          const result = await Swal.fire({
                            title: 'Are you sure?',
                            text: "Delete this subscriber?",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#000',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Yes, delete it!'
                          });
                          if (result.isConfirmed) {
                            deleteSubscriber(sub.id);
                            Swal.fire('Deleted!', 'Subscriber has been removed.', 'success');
                          }
                        }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Delete Subscriber"><Trash2 className="h-5 w-5"/></button>
                      </td>
                    </tr>
                  ))}
                  {subscribers.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-500">No subscribers found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-black uppercase">Contact Messages</h1>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Name & Email</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest max-w-xs">Message</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Date</th>
                     <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contactMessages.map(msg => (
                    <tr key={msg.id}>
                      <td className="p-4">
                        <div className="font-bold">{msg.name}</div>
                        <div className="text-xs text-gray-500">{msg.email}</div>
                      </td>
                      <td className="p-4 max-w-xs whitespace-pre-wrap">{msg.message}</td>
                      <td className="p-4 text-gray-500 text-xs">{formatDate(msg.date)} {formatTime(msg.date)}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => { setEmailTarget(msg.email); setEmailModalType('contact'); setIsSendingEmail(true); setEmailSubject(`Reply to your message: ${msg.name}`); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg inline-block mr-2" title="Reply via Email">
                          <Mail className="h-5 w-5"/>
                        </button>
                        <button onClick={async () => {
                          const result = await Swal.fire({
                            title: 'Are you sure?',
                            text: "Delete this message?",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#000',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Yes, delete it!'
                          });
                          if (result.isConfirmed) {
                            deleteContactMessage(msg.id);
                            Swal.fire('Deleted!', 'Message has been deleted.', 'success');
                          }
                        }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Delete Message"><Trash2 className="h-5 w-5"/></button>
                      </td>
                    </tr>
                  ))}
                  {contactMessages.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No messages found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === 'ads' && (
          <div>
            <div className="flex border-b border-gray-100 mb-6 gap-6">
              <button
                onClick={() => {
                  setAdsSubTab('home');
                  setIsAddingPopupAd(false);
                  setEditingPopupAd(null);
                }}
                className={`pb-3.5 font-black uppercase tracking-wider text-[11px] transition-all border-b-2 -mb-[2px] ${adsSubTab === 'home' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-900'}`}
              >
                Home Banner Ads
              </button>
              <button
                onClick={() => {
                  setAdsSubTab('popup');
                  setIsAddingHomeAd(false);
                  setEditingHomeAd(null);
                }}
                className={`pb-3.5 font-black uppercase tracking-wider text-[11px] transition-all border-b-2 -mb-[2px] ${adsSubTab === 'popup' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-900'}`}
              >
                Website Popup Ads
              </button>
            </div>

            {adsSubTab === 'home' ? (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h1 className="text-2xl font-black uppercase">Home Section Ads</h1>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setIsAddingHomeAd(!isAddingHomeAd);
                        if (isAddingHomeAd) {
                          setEditingHomeAd(null);
                          setNewHomeAd({ title: '', subtitle: '', imageUrl: '', linkUrl: '', isActive: true });
                        }
                      }}
                      className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 tracking-widest text-[10px] font-bold uppercase transition-colors"
                    >
                      {isAddingHomeAd ? 'Cancel' : <><Plus className="h-4 w-4"/> Add Home Ad</>}
                    </button>
                  </div>
                </div>

                {isAddingHomeAd && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
                      <div className="w-full md:w-2/5 flex flex-col gap-4">
                        <div className="aspect-[16/9] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                          {newHomeAd.imageUrl ? (
                            <img src={newHomeAd.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Image className="h-12 w-12 opacity-50" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ad Image Preview</span>
                        </div>
                      </div>

                      <form onSubmit={handleAddHomeAd} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                        <div className="md:col-span-2 flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                          <div>
                            <h3 className="font-black uppercase text-xl text-gray-900">{editingHomeAd ? 'Edit' : 'Add'} Home Section Ad</h3>
                          </div>
                          <button type="button" onClick={() => setIsAddingHomeAd(false)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors self-start -mt-2 -mr-2">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Ad Image</label>
                          <div className="flex gap-2">
                            <input required className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newHomeAd.imageUrl} onChange={e=>setNewHomeAd({...newHomeAd, imageUrl: e.target.value})} placeholder="URL or Base64" />
                            <label className="cursor-pointer bg-black text-white px-4 rounded-xl flex items-center hover:bg-gray-800 transition-colors">
                              <Camera className="h-4 w-4" />
                              <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e.target.files?.[0] || null, (url) => setNewHomeAd({...newHomeAd, imageUrl: url}))} />
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Title (Optional)</label>
                          <input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newHomeAd.title} onChange={e=>setNewHomeAd({...newHomeAd, title: e.target.value})} placeholder="যেমন- Flat 15% Discount on basic tees" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Sub-Title (Optional)</label>
                          <input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newHomeAd.subtitle} onChange={e=>setNewHomeAd({...newHomeAd, subtitle: e.target.value})} placeholder="যেমন- Use coupon SUM15 at checkout" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Auto Category Link</label>
                            <select 
                              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                              onChange={e => {
                                if (e.target.value) {
                                  setNewHomeAd({...newHomeAd, linkUrl: `/shop?category=${encodeURIComponent(e.target.value)}`});
                                }
                              }}
                            >
                              <option key="homead-cat" value="">-- Choose Category --</option>
                              {adminCategories.filter(c => c !== 'all').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Destination URL / Link (Optional)</label>
                            <input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newHomeAd.linkUrl} onChange={e=>setNewHomeAd({...newHomeAd, linkUrl: e.target.value})} placeholder="যেমন- /shop বা /shop?category=tees" />
                          </div>
                        </div>
                        <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
                          <input type="checkbox" id="home-ad-active" checked={newHomeAd.isActive} onChange={e=>setNewHomeAd({...newHomeAd, isActive: e.target.checked})} className="w-4 h-4 text-black focus:ring-black" />
                          <label htmlFor="ad-active" className="text-xs font-bold uppercase tracking-widest text-gray-900 cursor-pointer select-none">Active</label>
                        </div>
                        <div className="md:col-span-2 flex gap-3 justify-end pt-2 mt-auto">
                          <button type="button" onClick={() => setIsAddingHomeAd(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                          <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">Save Home Ad</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                         <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Ad Image</th>
                         <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Title & Description</th>
                         <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Link</th>
                         <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Status</th>
                         <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {homeAds.map(ad => (
                        <tr key={ad.id}>
                          <td className="p-4">
                            <img src={ad.imageUrl} className="w-24 h-14 rounded object-cover border border-gray-200" alt="" />
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{ad.title || <span className="text-gray-400 font-normal italic">No Title</span>}</div>
                            <div className="text-xs text-gray-500 font-medium">{ad.subtitle}</div>
                          </td>
                          <td className="p-4 font-mono text-xs">{ad.linkUrl}</td>
                          <td className="p-4">{ad.isActive ? <span className="text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-full text-xs">Active</span> : <span className="text-gray-400 font-bold bg-gray-50 px-2.5 py-1 rounded-full text-xs">Inactive</span>}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => {
                                setEditingHomeAd(ad);
                                setNewHomeAd({
                                  title: ad.title || '',
                                  subtitle: ad.subtitle || '',
                                  imageUrl: ad.imageUrl,
                                  linkUrl: ad.linkUrl,
                                  isActive: ad.isActive
                                });
                                setIsAddingHomeAd(true);
                              }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"><Edit className="h-5 w-5"/></button>
                              <button onClick={async () => {
                                const result = await Swal.fire({
                                  title: 'Are you sure?',
                                  text: "Delete this ad?",
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#000',
                                  cancelButtonColor: '#d33',
                                  confirmButtonText: 'Yes, delete it!'
                                });
                                if (result.isConfirmed) {
                                  deleteHomeAd(ad.id);
                                  Swal.fire('Deleted!', 'Ad has been deleted.', 'success');
                                }
                              }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="h-5 w-5"/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {homeAds.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No home ads found. Add some to display on home page section!</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h1 className="text-2xl font-black uppercase">Popup Ads</h1>
                  <button 
                    onClick={() => {
                      setIsAddingPopupAd(!isAddingPopupAd);
                      if (isAddingPopupAd) {
                        setEditingPopupAd(null);
                        setNewPopupAd({ imageUrl: '', linkUrl: '', isActive: true, pagesString: 'all' });
                      }
                    }}
                    className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 tracking-widest text-[10px] font-bold uppercase transition-colors"
                   >
                    {isAddingPopupAd ? 'Cancel' : <><Plus className="h-4 w-4"/> Add Popup Ad</>}
                  </button>
                </div>

                {isAddingPopupAd && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
                      <div className="w-full md:w-2/5 flex flex-col gap-4">
                        <div className="aspect-[4/5] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                          {newPopupAd.imageUrl ? (
                            <img src={newPopupAd.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Image className="h-12 w-12 opacity-50" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Image Preview</span>
                        </div>
                      </div>

                      <form onSubmit={handleAddPopupAd} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                         <div className="md:col-span-2 flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                          <div>
                            <h3 className="font-black uppercase text-xl text-gray-900">{editingPopupAd ? 'Edit' : 'Add'} Popup Ad</h3>
                          </div>
                          <button type="button" onClick={() => setIsAddingPopupAd(false)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors self-start -mt-2 -mr-2">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Popup Ad Image</label>
                      <div className="flex gap-2">
                        <input required className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newPopupAd.imageUrl} onChange={e=>setNewPopupAd({...newPopupAd, imageUrl: e.target.value})} placeholder="URL or Base64" />
                        <label className="cursor-pointer bg-black text-white px-4 rounded-xl flex items-center hover:bg-gray-800 transition-colors">
                          <Camera className="h-4 w-4" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e.target.files?.[0] || null, (url) => setNewPopupAd({...newPopupAd, imageUrl: url}))} />
                        </label>
                      </div>
                    </div>
                        <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Link URL (Optional)</label><input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newPopupAd.linkUrl} onChange={e=>setNewPopupAd({...newPopupAd, linkUrl: e.target.value})} placeholder="e.g. /shop" /></div>
                        <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Target Pages (Comma separated, or 'all')</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newPopupAd.pagesString} onChange={e=>setNewPopupAd({...newPopupAd, pagesString: e.target.value})} placeholder="e.g. /, /shop, /contact" /></div>
                        <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
                          <input type="checkbox" id="ad-active" checked={newPopupAd.isActive} onChange={e=>setNewPopupAd({...newPopupAd, isActive: e.target.checked})} className="w-4 h-4 text-black focus:ring-black" />
                          <label htmlFor="ad-active" className="text-xs font-bold uppercase tracking-widest text-gray-900 cursor-pointer select-none">Active</label>
                        </div>
                        <div className="md:col-span-2 flex gap-3 justify-end pt-2 mt-auto">
                          <button type="button" onClick={() => setIsAddingPopupAd(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                          <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">Save Popup Ad</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                         <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Image</th>
                         <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Pages</th>
                         <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Status</th>
                         <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {popupAds.map(ad => (
                        <tr key={ad.id}>
                          <td className="p-4">
                            <img src={ad.imageUrl} className="w-16 h-16 rounded object-cover border border-gray-200" alt="" />
                          </td>
                          <td className="p-4 font-mono text-xs">{ad.pages.join(', ')}</td>
                          <td className="p-4">{ad.isActive ? <span className="text-green-600 font-bold">Active</span> : <span className="text-red-500 font-bold">Inactive</span>}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => {
                              setEditingPopupAd(ad);
                              setNewPopupAd({
                                imageUrl: ad.imageUrl,
                                linkUrl: ad.linkUrl || '',
                                isActive: ad.isActive,
                                pagesString: ad.pages.join(', ')
                              });
                              setIsAddingPopupAd(true);
                            }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg mr-2"><Edit className="h-5 w-5"/></button>
                            <button onClick={async () => {
                              const result = await Swal.fire({
                                title: 'Are you sure?',
                                text: "Delete this ad?",
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#000',
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Yes, delete it!'
                              });
                              if (result.isConfirmed) {
                                deletePopupAd(ad.id);
                                Swal.fire('Deleted!', 'Ad has been deleted.', 'success');
                              }
                            }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="h-5 w-5"/></button>
                          </td>
                        </tr>
                      ))}
                      {popupAds.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No popup ads found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'faqs' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-black uppercase">Manage FAQs</h1>
              <button 
                onClick={() => { setIsAddingFAQ(!isAddingFAQ); setEditingFAQ(null); setNewFAQ({ question: '', answer: '' }); }}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 tracking-widest text-[10px] font-bold uppercase transition-colors"
              >
                {isAddingFAQ ? 'Cancel' : <><Plus className="h-4 w-4"/> Add FAQ</>}
              </button>
            </div>

            {isAddingFAQ && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="font-black uppercase text-xl text-gray-900">{editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Provide the QA details below</p>
                    </div>
                    <button type="button" onClick={() => setIsAddingFAQ(false)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleAddFAQ} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Question</label>
                      <input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newFAQ.question} onChange={e=>setNewFAQ({...newFAQ, question: e.target.value})} placeholder="e.g., How long is delivery?" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Answer</label>
                      <textarea required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors h-32 resize-none" value={newFAQ.answer} onChange={e=>setNewFAQ({...newFAQ, answer: e.target.value})} placeholder="e.g., Delivery inside Dhaka takes 2-3 days..." />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <button type="button" onClick={() => setIsAddingFAQ(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                      <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">Save FAQ</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Question</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest">Answer</th>
                    <th className="p-4 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {faqs?.map(faq => (
                    <tr key={faq.id}>
                      <td className="p-4 font-bold text-gray-900 max-w-xs">{faq.question}</td>
                      <td className="p-4 text-gray-500 max-w-sm">{faq.answer}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => {
                          setEditingFAQ(faq);
                          setNewFAQ({ question: faq.question, answer: faq.answer });
                          setIsAddingFAQ(true);
                        }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg mr-2"><Edit className="h-5 w-5"/></button>
                        <button onClick={() => {
                          Swal.fire({
                            title: 'Are you sure?',
                            text: 'This will delete this FAQ questions item permanently!',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#3085d6',
                            confirmButtonText: 'Yes, delete it!'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              deleteFAQ(faq.id);
                              Swal.fire('Deleted!', 'FAQ item has been deleted.', 'success');
                            }
                          });
                        }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="h-5 w-5"/></button>
                      </td>
                    </tr>
                  ))}
                  {(!faqs || faqs.length === 0) && <tr><td colSpan={3} className="p-6 text-center text-gray-500">No FAQ entries found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-black uppercase">Policies</h1>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Update Support Content & Legal Disclosures</span>
            </div>

            {isAddingPolicy && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="font-black uppercase text-xl text-gray-900">{editingPolicy ? 'Edit Policy' : 'Create New Policy'}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Configure parameters below</p>
                    </div>
                    <button type="button" onClick={() => setIsAddingPolicy(false)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleAddPolicy} className="space-y-4">
                    {!editingPolicy && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Policy ID Key</label>
                        <select required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newPolicy.key} onChange={e=>setNewPolicy({...newPolicy, key: e.target.value})}>
                          <option key="shipping_returns" value="shipping_returns">Shipping & Returns</option>
                          <option key="privacy_policy" value="privacy_policy">Privacy Policy</option>
                          <option key="custom" value="custom">Other Custom Policy</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Policy Title</label>
                      <input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newPolicy.title} onChange={e=>setNewPolicy({...newPolicy, title: e.target.value})} placeholder="e.g., Shipping Charges and Rules" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Content (Support Markdown)</label>
                      <textarea required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors h-64 resize-none font-mono text-xs" value={newPolicy.content} onChange={e=>setNewPolicy({...newPolicy, content: e.target.value})} placeholder="Write detailed instructions..." />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <button type="button" onClick={() => setIsAddingPolicy(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                      <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform">Save Policy</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policies?.map(policy => (
                <div key={policy.key} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="p-1 px-2 text-[8px] font-bold uppercase tracking-widest bg-black text-white rounded">{policy.key}</span>
                    </div>
                    <h3 className="font-extrabold uppercase text-lg text-gray-900 mb-4">{policy.title}</h3>
                    <p className="text-xs text-gray-500 whitespace-pre-line line-clamp-6 mb-4">{policy.content}</p>
                  </div>
                  <div className="flex justify-end gap-2 border-t pt-4 border-gray-100 mt-2">
                    <button 
                      onClick={() => {
                        setEditingPolicy(policy);
                        setNewPolicy({ key: policy.key, title: policy.title, content: policy.content });
                        setIsAddingPolicy(true);
                      }}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-gray-50 hover:bg-gray-100 border text-gray-700 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4"/> Edit Content
                    </button>
                    {policy.key !== 'shipping_returns' && policy.key !== 'privacy_policy' && (
                      <button 
                        onClick={() => {
                          Swal.fire({
                            title: 'Are you sure?',
                            text: 'This will delete this policy content permanently!',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#3085d6',
                            confirmButtonText: 'Yes, delete it!'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              deletePolicy(policy.key);
                              Swal.fire('Deleted!', 'Policy has been deleted.', 'success');
                            }
                          });
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admins Tab (SUPER ADMIN ONLY) */}
        {activeTab === 'admins' && currentAdmin?.role === 'super' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h1 className="text-2xl font-black uppercase text-gray-900">Manage Staff Admins</h1>
                <p className="text-xs text-amber-600 font-extrabold uppercase tracking-wide mt-1">👑 Super Admin Control Panel</p>
              </div>
              <button
                onClick={() => {
                  setEditingAdmin(null);
                  setNewAdminEmail('');
                  setNewAdminPassword('');
                  setNewAdminPermissions({
                    dashboard: true,
                    products: true,
                    orders: true,
                    coupons: true,
                    slides: true,
                    categories: true,
                    lookbook: true,
                    subscribers: true,
                    messages: true,
                    ads: true,
                    faqs: true,
                    policies: true
                  });
                  setIsAddingAdmin(true);
                }}
                className="bg-black hover:bg-black/90 text-white flex items-center gap-2 px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform"
              >
                <Plus className="h-4 w-4" /> Add New Admin (নতুন এডমিন যুক্ত করুন)
              </button>
            </div>

            {/* Admin Add / Edit Modal Overlay */}
            {isAddingAdmin && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-black uppercase text-xl text-gray-900">
                    {editingAdmin ? 'Edit Admin & Permissions' : 'Create New Office Admin'}
                  </h3>
                </div>
                    <button type="button" onClick={() => setIsAddingAdmin(false)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      
                      // validate email
                      if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
                        Swal.fire('Error', 'অনুগ্রহ করে সঠিক মেইল এড্রেস দিন', 'error');
                        return;
                      }
                      
                      if (!newAdminPassword) {
                        Swal.fire('Error', 'অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন', 'error');
                        return;
                      }

                      if (editingAdmin) {
                        // edit
                        updateAdmin({
                          ...editingAdmin,
                          email: newAdminEmail.trim().toLowerCase(),
                          password: newAdminPassword,
                          permissions: newAdminPermissions
                        });
                        Swal.fire('সফল হয়েছে!', 'এডমিন একাউন্ট আপডেট করা হয়েছে', 'success');
                      } else {
                        // duplicate check
                        const duplicate = admins.find(a => a.email.toLowerCase() === newAdminEmail.trim().toLowerCase());
                        if (duplicate) {
                          Swal.fire('ভুল হয়েছে', 'এই ইমেইল দিয়ে অলরেডি আর একটি এডমিন একাউন্ট আছে', 'error');
                          return;
                        }
                        // create
                        addAdmin({
                          id: 'admin_' + Date.now(),
                          email: newAdminEmail.trim().toLowerCase(),
                          password: newAdminPassword,
                          role: 'admin',
                          permissions: newAdminPermissions
                        });
                        Swal.fire('যুক্ত হয়েছে!', 'নতুন এডমিন একাউন্ট সফলভাবে তৈরি হয়েছে', 'success');
                      }
                      setIsAddingAdmin(false);
                    }} 
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                        <input 
                          type="email"
                          required 
                          placeholder="manager@tbari.com"
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" 
                          value={newAdminEmail} 
                          onChange={e=>setNewAdminEmail(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Password</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Min 6 characters"
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors font-mono" 
                          value={newAdminPassword} 
                          onChange={e=>setNewAdminPassword(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div>
                      <div className="border-t border-gray-100 pt-4 mb-3">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-800 mb-1">
                          Role Permissions (সেকশন ভিত্তিক এক্সেসসমূহ)
                        </label>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          অনুমতি দেওয়া ট্যাবগুলোই শুধুমাত্র এই এডমিন তার একাউন্টে দেখতে পারবে
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        {/* dashboard permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.dashboard} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, dashboard: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Dashboard</span>
                          </div>
                        </label>

                        {/* products permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.products} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, products: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Products</span>
                          </div>
                        </label>

                        {/* slides permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.slides} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, slides: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Slides</span>
                          </div>
                        </label>

                        {/* categories permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.categories} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, categories: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Categories</span>
                          </div>
                        </label>

                        {/* lookbook permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.lookbook} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, lookbook: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Lookbook</span>
                          </div>
                        </label>

                        {/* orders permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.orders} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, orders: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Orders</span>
                          </div>
                        </label>

                        {/* coupons permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.coupons} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, coupons: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Coupons</span>
                          </div>
                        </label>

                        {/* subscribers permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.subscribers} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, subscribers: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Subscribers</span>
                          </div>
                        </label>

                        {/* messages permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.messages} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, messages: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Messages</span>
                          </div>
                        </label>

                        {/* ads permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.ads} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, ads: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Ads Highlights</span>
                          </div>
                        </label>

                        {/* faqs permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.faqs} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, faqs: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">FAQs</span>
                          </div>
                        </label>

                        {/* policies permissions */}
                        <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={newAdminPermissions.policies} 
                            onChange={e => setNewAdminPermissions({...newAdminPermissions, policies: e.target.checked})}
                            className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black uppercase text-gray-800 block">Policies</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-3 border-t">
                      <button type="button" onClick={() => setIsAddingAdmin(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                      <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform">
                        {editingAdmin ? 'Update Credentials' : 'Create Admin Account'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Admin list table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Email</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Password</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Role Rank</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Active Permissions</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {admins?.map(admin => {
                      const enabledCount = Object.values(admin.permissions || {}).filter(Boolean).length;
                      
                      return (
                        <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-sm text-gray-900 block">{admin.email}</span>
                            {admin.id === currentAdmin?.id && (
                              <span className="text-[10px] text-amber-600 font-bold block">(You are logged in as this user)</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-mono text-xs text-gray-600 select-all bg-gray-100 px-2 py-1 rounded">
                              {admin.password || '••••••••'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {admin.role === 'super' ? (
                              <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-amber-200">
                                👑 Super Master Admin
                              </span>
                            ) : (
                              <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-blue-200">
                                💼 Standard Office Admin
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 max-w-xs">
                            {admin.role === 'super' ? (
                              <span className="text-xs text-amber-600 font-extrabold flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Full System Control
                              </span>
                            ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {Object.keys(admin.permissions || {}).map(key => {
                                  const isActive = admin.permissions[key as keyof typeof admin.permissions];
                                  if (!isActive) return null;
                                  
                                  const labelMap: Record<string, string> = {
                                    dashboard: 'Dashboard',
                                    products: 'Products',
                                    orders: 'Orders',
                                    coupons: 'Coupons',
                                    slides: 'Slides',
                                    categories: 'Categories',
                                    lookbook: 'Lookbook',
                                    subscribers: 'Subscribers',
                                    messages: 'Messages',
                                    ads: 'Ads',
                                    faqs: 'FAQs',
                                    policies: 'Policies'
                                  };
                                  
                                  return (
                                    <span key={key} className="text-[7.5px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
                                      {labelMap[key] || key}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {admin.role === 'super' ? (
                              <span className="text-gray-400 text-xs italic">Super Admin</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingAdmin(admin);
                                    setNewAdminEmail(admin.email);
                                    setNewAdminPassword(admin.password || '');
                                    setNewAdminPermissions({ dashboard: false, ...admin.permissions });
                                    setIsAddingAdmin(true);
                                  }}
                                  className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-black bg-gray-50 border text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <Edit className="h-3.5 w-3.5" /> Modify Account
                                </button>
                                <button
                                  onClick={() => {
                                    Swal.fire({
                                      title: 'Are you sure?',
                                      text: `ইমেইলটি ডিলিট করতে চান? ${admin.email}. This will revoke all their access instantly!`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#d33',
                                      cancelButtonColor: '#3085d6',
                                      confirmButtonText: 'Yes, delete staff admin account!'
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        deleteAdmin(admin.id);
                                        Swal.fire('ডিলিট হয়েছে!', 'এডমিন একাউন্ট ডিলিট করা হয়েছে।', 'success');
                                      }
                                    });
                                  }}
                                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                  title="Delete Admin Profile"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>

        {isSendingEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
              
              <div className="w-full md:w-2/5 flex flex-col gap-4">
                <div className="aspect-[4/5] rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden flex flex-col p-4">
                  {emailModalType === 'newsletter' && (
                    newsletterImage ? (
                      <div className="w-full h-40 rounded-xl overflow-hidden mb-4 shrink-0">
                         <img src={newsletterImage} alt="Newsletter Banner" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-40 rounded-xl bg-gray-100 flex flex-col items-center justify-center text-gray-400 mb-4 shrink-0">
                        <Image className="h-8 w-8 opacity-50 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Banner</span>
                      </div>
                    )
                  )}
                  
                  <div className="flex-1 overflow-hidden pointer-events-none mt-2">
                     <h4 className="font-bold text-lg mb-2 line-clamp-2 text-black leading-tight">{emailSubject || 'Your Subject'}</h4>
                     <p className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-6">{emailBody || 'Your email content will appear here...'}</p>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{emailModalType === 'newsletter' ? 'Newsletter Preview' : 'Email Preview'}</span>
                </div>
              </div>

              <form onSubmit={handleSendEmail} className="flex-1 grid grid-cols-1 gap-4 content-start">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-black uppercase text-xl text-gray-900">{emailModalType === 'newsletter' ? 'Send Newsletter' : 'Reply to Message'}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">To: {emailTarget === 'all' ? 'All Subscribers' : emailTarget}</p>
                  </div>
                  <button type="button" onClick={() => setIsSendingEmail(false)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors self-start -mt-2 -mr-2">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Subject Title</label><input required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={emailSubject} onChange={e=>setEmailSubject(e.target.value)} placeholder="Subject..." /></div>
                {emailModalType === 'newsletter' && (
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Banner Image URL (Optional)</label><input className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors" value={newsletterImage} onChange={e=>setNewsletterImage(e.target.value)} placeholder="https://..." /></div>
                )}
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Message Body</label><textarea required className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 focus:bg-white transition-colors h-48 resize-none" value={emailBody} onChange={e=>setEmailBody(e.target.value)} placeholder="Write your message here..." /></div>
                <div className="flex gap-3 justify-end pt-2 mt-auto">
                  <button type="button" onClick={() => setIsSendingEmail(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors text-gray-600">Cancel</button>
                  <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-transform flex items-center gap-2"><Mail className="h-4 w-4"/> Dispatch</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
