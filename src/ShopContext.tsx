import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Order, Coupon, CartItem, CustomerInfo, Slide, CategoryBanner, LookbookImage, Subscriber, ContactMessage, PopupAd, FAQItem, PolicyItem, HomeAd, AdminUser, OTPRecord, ActivityLog, Review } from './types';
import { initialProducts, initialCoupons, initialSlides, initialCategoryBanners, initialLookbook } from './mockData';
import { generateId } from './lib/utils';

interface ShopContextType {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  cart: CartItem[];
  slides: Slide[];
  categoryBanners: CategoryBanner[];
  lookbook: LookbookImage[];
  subscribers: Subscriber[];
  contactMessages: ContactMessage[];
  popupAds: PopupAd[];
  homeAds: HomeAd[];
  faqs: FAQItem[];
  policies: PolicyItem[];
  isAdminAuth: boolean;
  currentAdmin: AdminUser | null;
  admins: AdminUser[];
  activityLogs: ActivityLog[];
  logActivity: (actionType: ActivityLog['actionType'], targetModule: string, details: string, adminOverride?: AdminUser) => void;
  getProductPriceForSize: (product: Product, size: string) => number;
  getProductStockForSize: (product: Product, size: string) => number;
  addToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  removeFromCart: (productId: string, selectedSize?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  updateCartItemSize: (productId: string, oldSize: string, newSize: string) => void;
  clearCart: () => void;
  placeOrder: (customer: CustomerInfo, couponCode?: string) => { success: boolean; orderId?: string; error?: string };
  // Admin actions
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;
  addAdmin: (admin: AdminUser) => void;
  updateAdmin: (admin: AdminUser) => void;
  deleteAdmin: (id: string) => void;
  addSlide: (slide: Omit<Slide, 'id'>) => void;
  deleteSlide: (id: string) => void;
  updateSlide: (slide: Slide) => void;
  addCategoryBanner: (banner: Omit<CategoryBanner, 'id'>) => void;
  updateCategoryBanner: (banner: CategoryBanner) => void;
  deleteCategoryBanner: (id: string) => void;
  addLookbookImage: (img: Omit<LookbookImage, 'id'>) => void;
  updateLookbookImage: (img: LookbookImage) => void;
  deleteLookbookImage: (id: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  updateCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrderNotes: (orderId: string, notes: string) => void;
  updateOrder: (order: Order) => void;
  deleteOrder: (id: string) => void;
  addSubscriber: (email: string) => void;
  deleteSubscriber: (id: string) => void;
  addContactMessage: (msg: Omit<ContactMessage, 'id' | 'date'>) => void;
  deleteContactMessage: (id: string) => void;
  addPopupAd: (ad: Omit<PopupAd, 'id'>) => void;
  deletePopupAd: (id: string) => void;
  updatePopupAd: (id: string, ad: Partial<PopupAd>) => void;
  addHomeAd: (ad: Omit<HomeAd, 'id'>) => void;
  deleteHomeAd: (id: string) => void;
  updateHomeAd: (ad: HomeAd) => void;
  // Page CRUDs
  addFAQ: (faq: Omit<FAQItem, 'id'>) => void;
  updateFAQ: (faq: FAQItem) => void;
  deleteFAQ: (id: string) => void;
  addPolicy: (policy: Omit<PolicyItem, 'id'>) => void;
  updatePolicy: (policy: PolicyItem) => void;
  deletePolicy: (id: string) => void;
  otps: OTPRecord[];
  addOTP: (phone: string, otp: string, email?: string) => void;
  deleteOTP: (id: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  wishlist: string[]; // Store product IDs
  toggleWishlist: (productId: string) => void;
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'status' | 'date'>) => { success: boolean; message: string };
  updateReviewStatus: (reviewId: string, status: Review['status']) => void;
  deleteReview: (reviewId: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const defaultFAQs: FAQItem[] = [
  {
    id: 'faq_1',
    question: 'How do I track my order? (আমি কিভাবে আমার অর্ডার ট্র্যাক করব?)',
    answer: 'You can easily track your order using the Tracker page. Just input your Order ID to see real-time updates.'
  },
  {
    id: 'faq_2',
    question: 'What are the delivery charges? (ডেলিভারি চার্জ কত?)',
    answer: 'Delivery inside Dhaka is ৳70. Delivery outside Dhaka (any district in Bangladesh) is ৳120.'
  },
  {
    id: 'faq_3',
    question: 'How long does delivery take? (ডেলিভারি পেতে কতদিন সময় লাগবে?)',
    answer: 'Inside Dhaka, it takes 24 to 48 hours. Outside Dhaka, it takes around 3 to 5 business days.'
  }
];

const defaultPolicies: PolicyItem[] = [
  {
    id: 'policy_shipping_returns',
    key: 'shipping_returns',
    title: 'Shipping & Returns Policy (শিপিং ও রিটার্ন পলিসি)',
    content: `আমরা সারা বাংলাদেশে দ্রুত ও নিরাপদ ক্যাশ-অন-ডেলিভারি প্রদান করি।

১. ডেলিভারি চার্জ: ঢাকা সিটির ভিতরে ৭০ টাকা, ঢাকা সিটির বাইরে ১২০ টাকা।
২. রিটার্ন পলিসি: আমাদের কোনো পোশাকে সমস্যা থাকলে ডেলিভারি ম্যানের সামনে চেক করে সাথে সাথেই রিটার্ন বা পরিবর্তন করতে পারবেন। ডেলিভারি ম্যান চলে যাওয়ার পর ২৪ ঘণ্টার মধ্যে যেকোনো সমস্যার কথা আমাদের কন্ট্যাক্ট পেজের মাধ্যমে জানাতে হবে।
৩. পরিবর্তন করার ক্ষেত্রে প্রোডাক্টের ট্যাগ ও পলিব্যাগ অক্ষত অবস্থায় ফেরত দিতে হবে।`
  },
  {
    id: 'policy_privacy',
    key: 'privacy_policy',
    title: 'Privacy Policy (প্রাইভেসি পলিসি)',
    content: `ট্রেন্ডিফাই (TRENDIFY) অ্যাপলেট ব্যবহারে আপনার সকল তথ্যের গোপনীয়তা রক্ষা করতে আমরা প্রতিশ্রুতিবদ্ধ।

১. গ্রাহকের নাম, ফোন নম্বর, ইমেইল ও জেলা ভিত্তিক ঠিকানা কেবলমাত্র অর্ডার পৌঁছে দেওয়ার উদ্দেশ্যে সংগ্রহ ও সংরক্ষণ করা হয়।
২. আপনার পেমেন্ট বা ব্যক্তিগত তথ্য সম্পূর্ণ সুরক্ষিত থাকে এবং কোনো তৃতীয় পক্ষের কাছে এটি হস্তান্তর বা বিক্রি করা হয় না।
৩. যেকোনো সময় আপনার ডাটা ডিলিট বা পরিবর্তনের জন্য আমাদের কন্ট্যাক্ট ফর্মের সাহায্যে অনুরোধ জানাতে পারেন।`
  }
];

const defaultHomeAds: HomeAd[] = [
  {
    id: 'ha_1',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1500',
    title: 'Trendy Bengal Design Exclusives',
    subtitle: 'Get up to 30% discount on classic t-shirts with premium printing.',
    linkUrl: '/shop',
    isActive: true
  },
  {
    id: 'ha_2',
    imageUrl: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=1500',
    title: 'Casual Summer Premium Collection',
    subtitle: 'Buy any 3 products and grab FREE delivery across all of Bangladesh.',
    linkUrl: '/shop',
    isActive: true
  }
];

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ts_products');
    const data = saved ? JSON.parse(saved) : initialProducts;
    return data.map((p: Product) => ({
      ...p,
      stock: p.stock !== undefined ? p.stock : 50
    }));
  });

  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    const saved = localStorage.getItem('ts_faqs');
    return saved ? JSON.parse(saved) : defaultFAQs;
  });

  const [policies, setPolicies] = useState<PolicyItem[]>(() => {
    const saved = localStorage.getItem('ts_policies');
    return saved ? JSON.parse(saved) : defaultPolicies;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('ts_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('ts_coupons');
    return saved ? JSON.parse(saved) : initialCoupons;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ts_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [slides, setSlides] = useState<Slide[]>(() => {
    const saved = localStorage.getItem('ts_slides');
    return saved ? JSON.parse(saved) : initialSlides;
  });

  const [categoryBanners, setCategoryBanners] = useState<CategoryBanner[]>(() => {
    const saved = localStorage.getItem('ts_category_banners');
    return saved ? JSON.parse(saved) : initialCategoryBanners;
  });

  const [lookbook, setLookbook] = useState<LookbookImage[]>(() => {
    const saved = localStorage.getItem('ts_lookbook');
    return saved ? JSON.parse(saved) : initialLookbook;
  });

  const [subscribers, setSubscribers] = useState<Subscriber[]>(() => {
    const saved = localStorage.getItem('ts_subscribers');
    return saved ? JSON.parse(saved) : [];
  });

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    const saved = localStorage.getItem('ts_contact_msgs');
    return saved ? JSON.parse(saved) : [];
  });

  const [popupAds, setPopupAds] = useState<PopupAd[]>(() => {
    const saved = localStorage.getItem('ts_popup_ads');
    return saved ? JSON.parse(saved) : [];
  });

  const [homeAds, setHomeAds] = useState<HomeAd[]>(() => {
    const saved = localStorage.getItem('ts_home_ads');
    return saved ? JSON.parse(saved) : defaultHomeAds;
  });

  const [otps, setOtps] = useState<OTPRecord[]>(() => {
    const saved = localStorage.getItem('ts_otps');
    return saved ? JSON.parse(saved) : [];
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('ts_activity_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('ts_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('ts_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const defaultSuperAdmin: AdminUser = {
    id: 'super_admin_id',
    email: 'xahin.mahir@gmail.com',
    password: '123456',
    role: 'super',
    permissions: {
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
      policies: true,
      otps: true,
      otpsDelete: true,
      activityLogs: true,
      reviews: true
    }
  };

  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('ts_admins');
    return saved ? JSON.parse(saved) : [defaultSuperAdmin];
  });

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('ts_current_admin');
    return saved && saved !== '' && saved !== 'undefined' ? JSON.parse(saved) : null;
  });

  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(() => {
    const savedAdmin = localStorage.getItem('ts_current_admin');
    return !!savedAdmin && savedAdmin !== '' && savedAdmin !== 'undefined';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ts_dark_mode') === 'true';
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  const serverSave = async (key: string, data: any) => {
    try {
      await fetch('/api/db/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
      });
    } catch (err) {
      console.error(`Failed to save ${key} to server database:`, err);
    }
  };

  useEffect(() => {
    const fetchDb = async () => {
      try {
        const res = await fetch('/api/db');
        const dbData = await res.json();
        
        if (dbData && Object.keys(dbData).length > 0) {
          if (dbData.products) {
            setProducts(dbData.products.map((p: any) => ({
              ...p,
              stock: p.stock !== undefined ? p.stock : 50
            })));
          }
          if (dbData.faqs) setFaqs(dbData.faqs);
          if (dbData.policies) setPolicies(dbData.policies);
          if (dbData.orders) setOrders(dbData.orders);
          if (dbData.coupons) setCoupons(dbData.coupons);
          if (dbData.slides) setSlides(dbData.slides);
          if (dbData.categoryBanners) setCategoryBanners(dbData.categoryBanners);
          if (dbData.lookbook) setLookbook(dbData.lookbook);
          if (dbData.subscribers) setSubscribers(dbData.subscribers);
          if (dbData.contactMessages) setContactMessages(dbData.contactMessages);
          if (dbData.popupAds) setPopupAds(dbData.popupAds);
          if (dbData.homeAds) setHomeAds(dbData.homeAds);
          if (dbData.admins) setAdmins(dbData.admins);
          if (dbData.otps) setOtps(dbData.otps);
          if (dbData.activityLogs) setActivityLogs(dbData.activityLogs);
        } else {
          // Initialize server with local storage values or default mocks
          const initialDb = {
            products,
            faqs,
            policies,
            orders,
            coupons,
            slides,
            categoryBanners,
            lookbook,
            subscribers,
            contactMessages,
            popupAds,
            homeAds,
            admins,
            otps,
            activityLogs
          };
          await fetch('/api/db/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialDb)
          });
        }
      } catch (err) {
        console.error("Failed to load DB from server:", err);
      } finally {
        setIsDbLoaded(true);
      }
    };
    fetchDb();
  }, []);

  // Custom hook to prevent syncing on the first load of isDbLoaded
  function useServerSync(key: string, data: any, storageKey: string) {
    const isFirstMount = React.useRef(true);
    useEffect(() => {
      localStorage.setItem(storageKey, JSON.stringify(data));
      if (isDbLoaded) {
        if (isFirstMount.current) {
          isFirstMount.current = false;
        } else {
          serverSave(key, data);
        }
      }
    }, [data, isDbLoaded, key, storageKey]);
  }

  useServerSync('products', products, 'ts_products');
  useServerSync('orders', orders, 'ts_orders');
  useServerSync('coupons', coupons, 'ts_coupons');
  useServerSync('slides', slides, 'ts_slides');
  useServerSync('categoryBanners', categoryBanners, 'ts_category_banners');
  useServerSync('lookbook', lookbook, 'ts_lookbook');
  useServerSync('subscribers', subscribers, 'ts_subscribers');
  useServerSync('contactMessages', contactMessages, 'ts_contact_msgs');
  useServerSync('popupAds', popupAds, 'ts_popup_ads');
  useServerSync('homeAds', homeAds, 'ts_home_ads');
  useServerSync('faqs', faqs, 'ts_faqs');
  useServerSync('policies', policies, 'ts_policies');
  useServerSync('admins', admins, 'ts_admins');
  useServerSync('otps', otps, 'ts_otps');
  useServerSync('activityLogs', activityLogs, 'ts_activity_logs');
  useServerSync('wishlist', wishlist, 'ts_wishlist');
  useServerSync('reviews', reviews, 'ts_reviews');

  useEffect(() => { 
    localStorage.setItem('ts_cart', JSON.stringify(cart)); 
  }, [cart]);

  useEffect(() => {
    if (currentAdmin) {
      localStorage.setItem('ts_current_admin', JSON.stringify(currentAdmin));
      localStorage.setItem('ts_admin_auth', 'true');
      setIsAdminAuth(true);
    } else {
      localStorage.removeItem('ts_current_admin');
      localStorage.setItem('ts_admin_auth', 'false');
      setIsAdminAuth(false);
    }
  }, [currentAdmin]);
  
  useEffect(() => { 
    localStorage.setItem('ts_dark_mode', isDarkMode.toString()); 
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const addReview = (reviewData: Omit<Review, 'id' | 'status' | 'date'>) => {
    // Validate orderId (case-insensitive and trimmed)
    const submittedId = reviewData.orderId.trim().toUpperCase();
    const order = orders.find(o => o.id.trim().toUpperCase() === submittedId);
    if (!order) {
      return { success: false, message: `Invalid Order ID (${submittedId}). অনুগ্রহ করে সঠিক অর্ডার আইডি দিন।` };
    }

    // Validate if product is in that order
    const hasProduct = order.items.some(item => item.id === reviewData.productId);
    if (!hasProduct) {
      return { success: false, message: 'This product was not part of this order (এই প্রোডাক্টটি এই অর্ডারের অন্তর্ভুক্ত নয়)' };
    }

    // Check if user already reviewed this product with this order
    const alreadyReviewed = reviews.some(r => r.orderId === reviewData.orderId && r.productId === reviewData.productId && !r.deleted);
    if (alreadyReviewed) {
      return { success: false, message: 'You have already submitted a review for this product using this Order ID (আপনি ইতিমধ্যে এই অর্ডার আইডির জন্য একটি রিভিউ দিয়েছেন)' };
    }

    const newReview: Review = {
      ...reviewData,
      id: generateId(),
      status: 'pending',
      date: new Date().toISOString(),
    };

    setReviews(prev => [newReview, ...prev]);
    return { success: true, message: 'Review submitted for moderation! (রিভিউটি অনুমোদনের জন্য পাঠানো হয়েছে!)' };
  };

  const updateReviewStatus = (reviewId: string, status: Review['status']) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status } : r));
    logActivity('update', 'reviews', `Changed review #${reviewId} status to ${status}`);
  };

  const deleteReview = (reviewId: string) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, deleted: true } : r));
    logActivity('delete', 'reviews', `Deleted review #${reviewId}`);
  };

  const logActivity = (actionType: ActivityLog['actionType'], targetModule: string, details: string, adminOverride?: AdminUser) => {
    let admin = adminOverride || currentAdmin;
    if (!admin) {
      const saved = localStorage.getItem('ts_current_admin');
      if (saved && saved !== 'undefined') {
        try {
          admin = JSON.parse(saved);
        } catch (e) {}
      }
    }

    const newLog: ActivityLog = {
      id: generateId(),
      adminId: admin?.id || 'system',
      adminName: admin?.name || admin?.email?.split('@')[0] || 'System/Customer',
      adminEmail: admin?.email || 'system@trendify.com',
      actionType,
      targetModule,
      details,
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const loginAdmin = (email: string, pass: string) => {
    const found = admins.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === pass);
    if (found) {
      setCurrentAdmin(found);
      setIsAdminAuth(true);
      logActivity('auth', 'admins', `Admin logged in successfully: ${found.email} (${found.role})`, found);
      return true;
    }
    logActivity('auth', 'admins', `Failed login attempt for email: ${email}`);
    return false;
  };

  const logoutAdmin = () => {
    if (currentAdmin) {
      logActivity('auth', 'admins', `Admin logged out: ${currentAdmin.email}`);
    }
    setCurrentAdmin(null);
    setIsAdminAuth(false);
  };

  const addAdmin = (admin: AdminUser) => {
    const updatedAdmins = [...admins, admin];
    setAdmins(updatedAdmins);
    serverSave('admins', updatedAdmins);
    logActivity('create', 'admins', `Created admin account: "${admin.email}" (Name: ${admin.name}, Role: ${admin.role})`);
  };

  const updateAdmin = (admin: AdminUser) => {
    const updatedAdmins = admins.map(a => a.id === admin.id ? admin : a);
    setAdmins(updatedAdmins);
    serverSave('admins', updatedAdmins);
    logActivity('update', 'admins', `Updated admin account/permissions: "${admin.email}" (Role: ${admin.role})`);
    if (currentAdmin && currentAdmin.id === admin.id) {
      setCurrentAdmin(admin);
    }
  };

  const deleteAdmin = (id: string) => {
    const adminToDelete = admins.find(a => a.id === id);
    const emailStr = adminToDelete ? adminToDelete.email : `ID - ${id}`;
    // Hard delete from state so it propagates to server sync and gets removed from MongoDB
    const updatedAdmins = admins.filter(a => a.id !== id);
    setAdmins(updatedAdmins);
    logActivity('delete', 'admins', `Deleted admin account: "${emailStr}"`);
    if (currentAdmin && currentAdmin.id === id) {
      setCurrentAdmin(null);
      setIsAdminAuth(false);
    }
  };

  const getProductPriceForSize = (product: Product, size: string): number => {
    if (product?.sizePrices && product.sizePrices[size] !== undefined && product.sizePrices[size] > 0) {
      return product.sizePrices[size];
    }
    return product.price;
  };

  const getProductStockForSize = (product: Product, size: string): number => {
    if (product?.sizeStocks && product.sizeStocks[size] !== undefined) {
      return product.sizeStocks[size];
    }
    return product ? (product.stock !== undefined ? product.stock : 0) : 0;
  };

  const addToCart = (product: Product, quantity = 1, selectedSize?: string) => {
    const size = selectedSize || 'M';
    const priceForSize = getProductPriceForSize(product, size);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && (item.selectedSize || 'M') === size);
      const currentQty = existing ? existing.quantity : 0;
      const totalRequested = currentQty + quantity;
      
      // Size-Specific Stock check
      const stock = getProductStockForSize(product, size);
      if (totalRequested > stock) {
        // If we can't fulfill the full request, just add up to stock
        const allowedAdd = Math.max(0, stock - currentQty);
        if (allowedAdd <= 0) return prev;
        
        if (existing) {
          return prev.map(item => (item.id === product.id && (item.selectedSize || 'M') === size) ? { ...item, quantity: stock, price: priceForSize } : item);
        }
        return [...prev, { ...product, price: priceForSize, quantity: stock, selectedSize: size }];
      }

      if (existing) {
        return prev.map(item => (item.id === product.id && (item.selectedSize || 'M') === size) ? { ...item, quantity: item.quantity + quantity, price: priceForSize } : item);
      }
      return [...prev, { ...product, price: priceForSize, quantity, selectedSize: size }];
    });
  };

  const removeFromCart = (productId: string, selectedSize?: string) => {
    const size = selectedSize || 'M';
    setCart(prev => prev.filter(item => !(item.id === productId && (item.selectedSize || 'M') === size)));
  };

  const updateCartQuantity = (productId: string, quantity: number, selectedSize?: string) => {
    if (quantity < 1) return;
    const size = selectedSize || 'M';
    setCart(prev => prev.map(item => {
      if (item.id === productId && (item.selectedSize || 'M') === size) {
        const stock = getProductStockForSize(item, size);
        const priceForSize = getProductPriceForSize(item, size);
        return { ...item, quantity: Math.min(quantity, stock), price: priceForSize };
      }
      return item;
    }));
  };

  const updateCartItemSize = (productId: string, oldSize: string, newSize: string) => {
    const sizeOld = oldSize || 'M';
    const sizeNew = newSize || 'M';
    if (sizeOld === sizeNew) return;

    setCart(prev => {
      const itemIndex = prev.findIndex(item => item.id === productId && (item.selectedSize || 'M') === sizeOld);
      if (itemIndex === -1) return prev;

      const updatedItem = prev[itemIndex];
      const priceNew = getProductPriceForSize(updatedItem, sizeNew);
      const existingIndex = prev.findIndex((item, idx) => idx !== itemIndex && item.id === productId && (item.selectedSize || 'M') === sizeNew);

      if (existingIndex !== -1) {
        // Merge the quantities of both items up to stock limit
        const existingItem = prev[existingIndex];
        const stock = getProductStockForSize(updatedItem, sizeNew);
        const mergedQty = Math.min(updatedItem.quantity + existingItem.quantity, stock);

        // Update the existing item and remove the old item
        return prev.map((item, idx) => {
          if (idx === existingIndex) {
            return { ...item, quantity: mergedQty, price: priceNew };
          }
          return item;
        }).filter((_, idx) => idx !== itemIndex);
      } else {
        // Just change the size
        return prev.map((item, idx) => {
          if (idx === itemIndex) {
            return { ...item, selectedSize: sizeNew, price: priceNew };
          }
          return item;
        });
      }
    });
  };

  const clearCart = () => setCart([]);

  const placeOrder = (customer: CustomerInfo, couponCode?: string) => {
    if (cart.length === 0) return { success: false, error: 'Cart is empty' };

    let discount = 0;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (couponCode) {
      const coupon = coupons.find(c => {
        const isActive = c.isActive;
        const now = new Date();
        const isNotExpired = !c.expiryDate || new Date(c.expiryDate) >= now;
        const isStarted = !c.startDate || new Date(c.startDate) <= now;
        return c.code === couponCode && isActive && isNotExpired && isStarted;
      });
      if (!coupon) {
        return { success: false, error: 'Invalid, inactive, not yet started, or expired coupon' };
      }
      
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
       } else {
        discount = coupon.discountValue;
      }
    }

    const total = subtotal - discount;

    const newOrderId = `TND-${Date.now()}${(Math.random() * 1000).toFixed(0)}`;

    const newOrder: Order = {
      id: newOrderId,
      customer,
      items: [...cart],
      subtotal,
      discount,
      total,
      couponCode,
      date: new Date().toISOString(),
      status: 'pending'
    };

    // Decrease stock
    setProducts(prev => {
      const updated = [...prev];
      cart.forEach(item => {
        const productIndex = updated.findIndex(p => p.id === item.id);
        if (productIndex !== -1) {
          const prod = updated[productIndex];
          const sz = item.selectedSize || 'M';
          const newSizeStocks = { ...(prod.sizeStocks || {}) };
          if (newSizeStocks[sz] !== undefined) {
            newSizeStocks[sz] = Math.max(0, (newSizeStocks[sz] || 0) - item.quantity);
          }
          updated[productIndex] = {
            ...prod,
            stock: Math.max(0, (prod.stock || 0) - item.quantity),
            sizeStocks: newSizeStocks
          };
        }
      });
      return updated;
    });

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    logActivity('create', 'orders', `New order placed: ${newOrder.id} (Total: ৳${total}) by ${customer.name}`);
    return { success: true, orderId: newOrder.id };
  };

  // Admin
  const addProduct = (product: Omit<Product, 'id'>) => {
    // Generate sequential code if none provided
    let code = product.code && product.code.trim() 
      ? product.code.trim().toUpperCase() 
      : '';
    
    if (!code) {
      const tyCodes = products
        .map(p => p.code || '')
        .filter(c => c.startsWith('TY-'))
        .map(c => parseInt(c.split('-')[1]))
        .filter(n => !isNaN(n));
      const maxNum = tyCodes.length > 0 ? Math.max(...tyCodes) : 1000;
      code = `TY-${maxNum + 1}`;
    }
    
    setProducts(prev => [{ ...product, code, id: generateId() }, ...prev]);
    logActivity('create', 'products', `Added product: "${product.name}" (Code: ${code}, Price: ৳${product.price})`);
  };

  const updateProduct = (product: Product) => {
    let code = product.code && product.code.trim()
      ? product.code.trim().toUpperCase()
      : '';
    
    if (!code) {
      const tyCodes = products
        .filter(p => p.id !== product.id)
        .map(p => p.code || '')
        .filter(c => c.startsWith('TY-'))
        .map(c => parseInt(c.split('-')[1]))
        .filter(n => !isNaN(n));
      const maxNum = tyCodes.length > 0 ? Math.max(...tyCodes) : 1000;
      code = `TY-${maxNum + 1}`;
    }
    
    setProducts(prev => prev.map(p => p.id === product.id ? { ...product, code } : p));
    logActivity('update', 'products', `Updated product: "${product.name}" (Code: ${code}, Price: ৳${product.price})`);
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    const prodName = prod ? `"${prod.name}"` : `ID - ${id}`;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, deleted: true } : p));
    logActivity('delete', 'products', `Deleted product: ${prodName}`);
  };

  const addCoupon = (coupon: Omit<Coupon, 'id'>) => {
    setCoupons(prev => [{ ...coupon, id: generateId() }, ...prev]);
    logActivity('create', 'coupons', `Added coupon: "${coupon.code}" (${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : ' ৳'} discount)`);
  };

  const updateCoupon = (coupon: Coupon) => {
    setCoupons(prev => prev.map(c => c.id === coupon.id ? coupon : c));
    logActivity('update', 'coupons', `Updated coupon: "${coupon.code}" (${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : ' ৳'} discount)`);
  };

  const deleteCoupon = (id: string) => {
    const coup = coupons.find(c => c.id === id);
    const coupCode = coup ? `"${coup.code}"` : `ID - ${id}`;
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, deleted: true } : c));
    logActivity('delete', 'coupons', `Deleted coupon: ${coupCode}`);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => {
      const order = prev.find(o => o.id === orderId);
      if (order && status === 'cancelled' && order.status !== 'cancelled') {
        // Restore stock
        setProducts(pPrev => {
          const updated = [...pPrev];
          order.items.forEach(item => {
            const productIndex = updated.findIndex(p => p.id === item.id);
            if (productIndex !== -1) {
              const prod = updated[productIndex];
              const sz = item.selectedSize || 'M';
              const newSizeStocks = { ...(prod.sizeStocks || {}) };
              if (newSizeStocks[sz] !== undefined) {
                newSizeStocks[sz] = (newSizeStocks[sz] || 0) + item.quantity;
              }
              updated[productIndex] = {
                ...prod,
                stock: (prod.stock || 0) + item.quantity,
                sizeStocks: newSizeStocks
              };
            }
          });
          return updated;
        });
      } else if (order && order.status === 'cancelled' && status !== 'cancelled') {
        // Re-decrease stock if accidentally restored from cancelled
        setProducts(pPrev => {
          const updated = [...pPrev];
          order.items.forEach(item => {
            const productIndex = updated.findIndex(p => p.id === item.id);
            if (productIndex !== -1) {
              const prod = updated[productIndex];
              const sz = item.selectedSize || 'M';
              const newSizeStocks = { ...(prod.sizeStocks || {}) };
              if (newSizeStocks[sz] !== undefined) {
                newSizeStocks[sz] = Math.max(0, (newSizeStocks[sz] || 0) - item.quantity);
              }
              updated[productIndex] = {
                ...prod,
                stock: Math.max(0, (prod.stock || 0) - item.quantity),
                sizeStocks: newSizeStocks
              };
            }
          });
          return updated;
        });
      }
      return prev.map(o => o.id === orderId ? { ...o, status } : o);
    });
    logActivity('update', 'orders', `Updated status of order "${orderId}" to "${status}"`);
  };

  const updateOrderNotes = (orderId: string, notes: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notes } : o));
    logActivity('update', 'orders', `Updated notes/history for order "${orderId}"`);
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, deleted: true } : o));
    logActivity('delete', 'orders', `Deleted order: "${id}"`);
  };

  const updateOrder = (order: Order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    logActivity('update', 'orders', `Customized details and items of order "${order.id}"`);
  };

  const addSlide = (slide: Omit<Slide, 'id'>) => {
    setSlides(prev => [{...slide, id: generateId()}, ...prev]);
    logActivity('create', 'slides', `Added slider banner: "${slide.title || 'Untitled'}"`);
  };
  const updateSlide = (slide: Slide) => {
    setSlides(prev => prev.map(s => s.id === slide.id ? slide : s));
    logActivity('update', 'slides', `Updated slider banner: "${slide.title || 'Untitled'}"`);
  };
  const deleteSlide = (id: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, deleted: true } : s));
    logActivity('delete', 'slides', `Deleted slider banner with ID: ${id}`);
  };
  
  const addCategoryBanner = (banner: Omit<CategoryBanner, 'id'>) => {
    setCategoryBanners(prev => [{...banner, id: generateId()}, ...prev]);
    logActivity('create', 'categories', `Added category banner: "${banner.title || 'Untitled'}"`);
  };
  const updateCategoryBanner = (banner: CategoryBanner) => {
    setCategoryBanners(prev => prev.map(b => b.id === banner.id ? banner : b));
    logActivity('update', 'categories', `Updated category banner: "${banner.title || 'Untitled'}"`);
  };
  const deleteCategoryBanner = (id: string) => {
    setCategoryBanners(prev => prev.map(b => b.id === id ? { ...b, deleted: true } : b));
    logActivity('delete', 'categories', `Deleted category banner with ID: ${id}`);
  };

  const addLookbookImage = (img: Omit<LookbookImage, 'id'>) => {
    setLookbook(prev => [{...img, id: generateId()}, ...prev]);
    logActivity('create', 'lookbook', `Added lookbook item: "${img.title || 'Untitled'}"`);
  };
  const updateLookbookImage = (img: LookbookImage) => {
    setLookbook(prev => prev.map(l => l.id === img.id ? img : l));
    logActivity('update', 'lookbook', `Updated lookbook item: "${img.title || 'Untitled'}"`);
  };
  const deleteLookbookImage = (id: string) => {
    setLookbook(prev => prev.map(l => l.id === id ? { ...l, deleted: true } : l));
    logActivity('delete', 'lookbook', `Deleted lookbook item with ID: ${id}`);
  };

  const addSubscriber = (email: string) => {
    if (!subscribers.find(s => s.email === email)) {
      setSubscribers(prev => [{ id: generateId(), email, date: new Date().toISOString() }, ...prev]);
      logActivity('create', 'subscribers', `New user subscribed to newsletter: ${email}`);
    }
  };
  const deleteSubscriber = (id: string) => {
    const sub = subscribers.find(s => s.id === id);
    const subEmail = sub ? sub.email : `ID - ${id}`;
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, deleted: true } : s));
    logActivity('delete', 'subscribers', `Deleted subscriber: ${subEmail}`);
  };

  const addContactMessage = (msg: Omit<ContactMessage, 'id' | 'date'>) => {
    setContactMessages(prev => [{ ...msg, id: generateId(), date: new Date().toISOString() }, ...prev]);
    logActivity('create', 'messages', `New contact message from: ${msg.name} (${msg.email})`);
  };
  const deleteContactMessage = (id: string) => {
    const msg = contactMessages.find(m => m.id === id);
    const msgSender = msg ? `${msg.name} (${msg.email})` : `ID - ${id}`;
    setContactMessages(prev => prev.map(m => m.id === id ? { ...m, deleted: true } : m));
    logActivity('delete', 'messages', `Deleted contact message from: ${msgSender}`);
  };

  const addPopupAd = (ad: Omit<PopupAd, 'id'>) => {
    setPopupAds(prev => [{...ad, id: generateId()}, ...prev]);
    logActivity('create', 'ads', `Created popup ad with image: "${ad.imageUrl}"`);
  };
  const deletePopupAd = (id: string) => {
    setPopupAds(prev => prev.map(a => a.id === id ? { ...a, deleted: true } : a));
    logActivity('delete', 'ads', `Deleted popup ad with ID: ${id}`);
  };
  const updatePopupAd = (id: string, updatedAd: Partial<PopupAd>) => {
    setPopupAds(prev => prev.map(ad => ad.id === id ? { ...ad, ...updatedAd } : ad));
    logActivity('update', 'ads', `Updated popup ad details for ID: ${id}`);
  };

  const addHomeAd = (ad: Omit<HomeAd, 'id'>) => {
    setHomeAds(prev => [{...ad, id: generateId()}, ...prev]);
    logActivity('create', 'ads', `Created banner/home ad campaign: "${ad.title || 'Untitled'}"`);
  };
  const deleteHomeAd = (id: string) => {
    setHomeAds(prev => prev.map(a => a.id === id ? { ...a, deleted: true } : a));
    logActivity('delete', 'ads', `Deleted banner/home ad campaign with ID: ${id}`);
  };
  const updateHomeAd = (ad: HomeAd) => {
    setHomeAds(prev => prev.map(a => a.id === ad.id ? ad : a));
    logActivity('update', 'ads', `Updated banner/home ad campaign: "${ad.title || 'Untitled'}"`);
  };

  const addFAQ = (faq: Omit<FAQItem, 'id'>) => {
    setFaqs(prev => [{ ...faq, id: generateId() }, ...prev]);
    logActivity('create', 'faqs', `Added FAQ item: "${faq.question}"`);
  };
  const updateFAQ = (faq: FAQItem) => {
    setFaqs(prev => prev.map(f => f.id === faq.id ? faq : f));
    logActivity('update', 'faqs', `Updated FAQ item: "${faq.question}"`);
  };
  const deleteFAQ = (id: string) => {
    const item = faqs.find(f => f.id === id);
    const itemQuestion = item ? `"${item.question}"` : `ID - ${id}`;
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, deleted: true } : f));
    logActivity('delete', 'faqs', `Deleted FAQ: ${itemQuestion}`);
  };

  const addPolicy = (policy: Omit<PolicyItem, 'id'>) => {
    setPolicies(prev => [{ ...policy, id: generateId() }, ...prev]);
    logActivity('create', 'policies', `Created policy page item: "${policy.title}"`);
  };
  const updatePolicy = (policy: PolicyItem) => {
    setPolicies(prev => prev.map(p => p.id === policy.id ? policy : p));
    logActivity('update', 'policies', `Updated policy page item: "${policy.title}"`);
  };
  const deletePolicy = (id: string) => {
    const pol = policies.find(p => p.id === id);
    const polTitle = pol ? `"${pol.title}"` : `ID - ${id}`;
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, deleted: true } : p));
    logActivity('delete', 'policies', `Deleted policy item: ${polTitle}`);
  };

  const addOTP = (phone: string, otp: string, email?: string) => {
    setOtps(prev => [
      {
         id: generateId(),
         phone,
         email,
         otp,
         createdAt: new Date().toISOString(),
         verified: false
      },
      ...prev
    ]);
    logActivity('create', 'otps', `OTP Code [${otp}] created & sent for phone tracker: ${phone} (Email: ${email || 'N/A'})`);
  };

  const deleteOTP = (id: string) => {
    const otpRec = otps.find(o => o.id === id);
    const details = otpRec ? `Deleted OTP code: [${otpRec.otp}] for phone: ${otpRec.phone || 'N/A'}` : `Deleted OTP ID: ${id}`;
    setOtps(prev => prev.map(o => o.id === id ? { ...o, deleted: true } : o));
    logActivity('delete', 'otps', details);
  };

  if (!isDbLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 animate-pulse">অনলাইন ডাটাবেজ লোড করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <ShopContext.Provider value={{
      products: products.filter(p => !p.deleted), 
      orders: orders.filter(o => !o.deleted), 
      coupons: coupons.filter(c => !c.deleted), 
      cart, 
      slides: slides.filter(s => !s.deleted), 
      categoryBanners: categoryBanners.filter(b => !b.deleted), 
      lookbook: lookbook.filter(l => !l.deleted), 
      subscribers: subscribers.filter(s => !s.deleted), 
      contactMessages: contactMessages.filter(m => !m.deleted), 
      popupAds: popupAds.filter(a => !a.deleted), 
      homeAds: homeAds.filter(a => !a.deleted), 
      faqs: faqs.filter(f => !f.deleted), 
      policies: policies.filter(p => !p.deleted), 
      isAdminAuth,
      currentAdmin, 
      admins: admins.filter(a => a.isActive !== false), 
      otps: otps.filter(o => !o.deleted), 
      activityLogs, 
      logActivity,
      getProductPriceForSize,
      getProductStockForSize,
      addToCart, removeFromCart, updateCartQuantity, updateCartItemSize, clearCart, placeOrder,
      loginAdmin, logoutAdmin, addAdmin, updateAdmin, deleteAdmin, addProduct, updateProduct, deleteProduct,
      addSlide, updateSlide, deleteSlide, addCategoryBanner, updateCategoryBanner, deleteCategoryBanner, addLookbookImage, updateLookbookImage, deleteLookbookImage,
      addCoupon, updateCoupon, deleteCoupon,
      updateOrderStatus, updateOrderNotes, updateOrder, deleteOrder,
      addSubscriber, deleteSubscriber, addContactMessage, deleteContactMessage, addPopupAd, deletePopupAd, updatePopupAd,
      addHomeAd, deleteHomeAd, updateHomeAd,
      addFAQ, updateFAQ, deleteFAQ, addPolicy, updatePolicy, deletePolicy,
      addOTP, deleteOTP,
      isDarkMode, toggleDarkMode, isCartOpen, setIsCartOpen,
      wishlist, toggleWishlist,
      reviews: reviews.filter(r => !r.deleted), addReview, updateReviewStatus, deleteReview
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
