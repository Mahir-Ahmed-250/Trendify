import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Order, Coupon, CartItem, CustomerInfo, Slide, CategoryBanner, LookbookImage, Subscriber, ContactMessage, PopupAd, FAQItem, PolicyItem, HomeAd, AdminUser } from './types';
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
  addToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  removeFromCart: (productId: string, selectedSize?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
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
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
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
      policies: true
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
            admins
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

  const loginAdmin = (email: string, pass: string) => {
    const found = admins.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === pass);
    if (found) {
      setCurrentAdmin(found);
      setIsAdminAuth(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setCurrentAdmin(null);
    setIsAdminAuth(false);
  };

  const addAdmin = (admin: AdminUser) => {
    setAdmins(prev => [...prev, admin]);
  };

  const updateAdmin = (admin: AdminUser) => {
    setAdmins(prev => prev.map(a => a.id === admin.id ? admin : a));
    if (currentAdmin && currentAdmin.id === admin.id) {
      setCurrentAdmin(admin);
    }
  };

  const deleteAdmin = (id: string) => {
    setAdmins(prev => prev.filter(a => a.id !== id));
    if (currentAdmin && currentAdmin.id === id) {
      setCurrentAdmin(null);
      setIsAdminAuth(false);
    }
  };

  const addToCart = (product: Product, quantity = 1, selectedSize?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === selectedSize);
      const currentQty = existing ? existing.quantity : 0;
      const totalRequested = currentQty + quantity;
      
      // Stock check
      const stock = product.stock || 0;
      if (totalRequested > stock) {
        // If we can't fulfill the full request, just add up to stock
        const allowedAdd = Math.max(0, stock - currentQty);
        if (allowedAdd <= 0) return prev;
        
        if (existing) {
          return prev.map(item => (item.id === product.id && item.selectedSize === selectedSize) ? { ...item, quantity: stock } : item);
        }
        return [...prev, { ...product, quantity: stock, selectedSize }];
      }

      if (existing) {
        return prev.map(item => (item.id === product.id && item.selectedSize === selectedSize) ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity, selectedSize }];
    });
  };

  const removeFromCart = (productId: string, selectedSize?: string) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.selectedSize === selectedSize)));
  };

  const updateCartQuantity = (productId: string, quantity: number, selectedSize?: string) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => {
      if (item.id === productId && item.selectedSize === selectedSize) {
        const stock = item.stock || 0;
        return { ...item, quantity: Math.min(quantity, stock) };
      }
      return item;
    }));
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

    const newOrder: Order = {
      id: generateId(),
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
          updated[productIndex] = {
            ...updated[productIndex],
            stock: Math.max(0, (updated[productIndex].stock || 0) - item.quantity)
          };
        }
      });
      return updated;
    });

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return { success: true, orderId: newOrder.id };
  };

  // Admin
  const addProduct = (product: Omit<Product, 'id'>) => {
    const code = product.code && product.code.trim() 
      ? product.code.trim().toUpperCase() 
      : 'TS-' + Math.floor(1000 + Math.random() * 9000);
    setProducts(prev => [{ ...product, code, id: generateId() }, ...prev]);
  };

  const updateProduct = (product: Product) => {
    const code = product.code && product.code.trim()
      ? product.code.trim().toUpperCase()
      : 'TS-' + Math.floor(1000 + Math.random() * 9000);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...product, code } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addCoupon = (coupon: Omit<Coupon, 'id'>) => {
    setCoupons(prev => [{ ...coupon, id: generateId() }, ...prev]);
  };

  const updateCoupon = (coupon: Coupon) => {
    setCoupons(prev => prev.map(c => c.id === coupon.id ? coupon : c));
  };

  const deleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
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
              updated[productIndex] = {
                ...updated[productIndex],
                stock: (updated[productIndex].stock || 0) + item.quantity
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
              updated[productIndex] = {
                ...updated[productIndex],
                stock: Math.max(0, (updated[productIndex].stock || 0) - item.quantity)
              };
            }
          });
          return updated;
        });
      }
      return prev.map(o => o.id === orderId ? { ...o, status } : o);
    });
  };

  const updateOrderNotes = (orderId: string, notes: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notes } : o));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const addSlide = (slide: Omit<Slide, 'id'>) => setSlides(prev => [{...slide, id: generateId()}, ...prev]);
  const updateSlide = (slide: Slide) => setSlides(prev => prev.map(s => s.id === slide.id ? slide : s));
  const deleteSlide = (id: string) => setSlides(prev => prev.filter(s => s.id !== id));
  
  const addCategoryBanner = (banner: Omit<CategoryBanner, 'id'>) => setCategoryBanners(prev => [{...banner, id: generateId()}, ...prev]);
  const updateCategoryBanner = (banner: CategoryBanner) => setCategoryBanners(prev => prev.map(b => b.id === banner.id ? banner : b));
  const deleteCategoryBanner = (id: string) => setCategoryBanners(prev => prev.filter(b => b.id !== id));

  const addLookbookImage = (img: Omit<LookbookImage, 'id'>) => setLookbook(prev => [{...img, id: generateId()}, ...prev]);
  const updateLookbookImage = (img: LookbookImage) => setLookbook(prev => prev.map(l => l.id === img.id ? img : l));
  const deleteLookbookImage = (id: string) => setLookbook(prev => prev.filter(l => l.id !== id));

  const addSubscriber = (email: string) => {
    if (!subscribers.find(s => s.email === email)) {
      setSubscribers(prev => [{ id: generateId(), email, date: new Date().toISOString() }, ...prev]);
    }
  };
  const deleteSubscriber = (id: string) => setSubscribers(prev => prev.filter(s => s.id !== id));

  const addContactMessage = (msg: Omit<ContactMessage, 'id' | 'date'>) => {
    setContactMessages(prev => [{ ...msg, id: generateId(), date: new Date().toISOString() }, ...prev]);
  };
  const deleteContactMessage = (id: string) => setContactMessages(prev => prev.filter(m => m.id !== id));

  const addPopupAd = (ad: Omit<PopupAd, 'id'>) => setPopupAds(prev => [{...ad, id: generateId()}, ...prev]);
  const deletePopupAd = (id: string) => setPopupAds(prev => prev.filter(a => a.id !== id));
  const updatePopupAd = (id: string, updatedAd: Partial<PopupAd>) => {
    setPopupAds(prev => prev.map(ad => ad.id === id ? { ...ad, ...updatedAd } : ad));
  };

  const addHomeAd = (ad: Omit<HomeAd, 'id'>) => setHomeAds(prev => [{...ad, id: generateId()}, ...prev]);
  const deleteHomeAd = (id: string) => setHomeAds(prev => prev.filter(a => a.id !== id));
  const updateHomeAd = (ad: HomeAd) => setHomeAds(prev => prev.map(a => a.id === ad.id ? ad : a));

  const addFAQ = (faq: Omit<FAQItem, 'id'>) => setFaqs(prev => [{ ...faq, id: generateId() }, ...prev]);
  const updateFAQ = (faq: FAQItem) => setFaqs(prev => prev.map(f => f.id === faq.id ? faq : f));
  const deleteFAQ = (id: string) => setFaqs(prev => prev.filter(f => f.id !== id));

  const addPolicy = (policy: Omit<PolicyItem, 'id'>) => setPolicies(prev => [{ ...policy, id: generateId() }, ...prev]);
  const updatePolicy = (policy: PolicyItem) => setPolicies(prev => prev.map(p => p.id === policy.id ? policy : p));
  const deletePolicy = (id: string) => setPolicies(prev => prev.filter(p => p.id !== id));

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
      products, orders, coupons, cart, slides, categoryBanners, lookbook, subscribers, contactMessages, popupAds, homeAds, faqs, policies, isAdminAuth,
      currentAdmin, admins,
      addToCart, removeFromCart, updateCartQuantity, clearCart, placeOrder,
      loginAdmin, logoutAdmin, addAdmin, updateAdmin, deleteAdmin, addProduct, updateProduct, deleteProduct,
      addSlide, updateSlide, deleteSlide, addCategoryBanner, updateCategoryBanner, deleteCategoryBanner, addLookbookImage, updateLookbookImage, deleteLookbookImage,
      addCoupon, updateCoupon, deleteCoupon,
      updateOrderStatus, updateOrderNotes, deleteOrder,
      addSubscriber, deleteSubscriber, addContactMessage, deleteContactMessage, addPopupAd, deletePopupAd, updatePopupAd,
      addHomeAd, deleteHomeAd, updateHomeAd,
      addFAQ, updateFAQ, deleteFAQ, addPolicy, updatePolicy, deletePolicy,
      isDarkMode, toggleDarkMode, isCartOpen, setIsCartOpen
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
