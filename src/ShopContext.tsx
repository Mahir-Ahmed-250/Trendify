import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Product, Order, Category, Coupon, CartItem, CustomerInfo, Slide, CategoryBanner, LookbookImage, Subscriber, ContactMessage, PopupAd, HomeAd, AdminUser, OTPRecord, Review, ContactInfo, Announcement, FAQItem, PolicyItem, SocialLink } from './types';
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
  categories: Category[];
  contactInfo: ContactInfo;
  isAdminAuth: boolean;
  authToken: string | null;
  currentAdmin: AdminUser | null;
  admins: AdminUser[];
  getProductPriceForSize: (product: Product, size: string) => number;
  getProductStockForSize: (product: Product, size: string) => number;
  addToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  removeFromCart: (productId: string, selectedSize?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  updateCartItemSize: (productId: string, oldSize: string, newSize: string) => void;
  clearCart: () => void;
  placeOrder: (customer: CustomerInfo, couponCode?: string) => { success: boolean; orderId?: string; error?: string };
  // Admin actions
  loginAdmin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;
  updateProfile: (updates: Partial<AdminUser>) => Promise<{ success: boolean; error?: string }>;
  addAdmin: (admin: AdminUser) => void;
  updateAdmin: (admin: AdminUser) => void;
  deleteAdmin: (id: string) => void;
  updateContactInfo: (info: ContactInfo) => void;
  isMaintenanceMode: boolean;
  setMaintenanceMode: (status: boolean) => void;
  addSlide: (slide: Omit<Slide, 'id'>) => void;
  deleteSlide: (id: string) => void;
  updateSlide: (slide: Slide) => void;
  addCategoryBanner: (banner: Omit<CategoryBanner, 'id'>) => void;
  updateCategoryBanner: (banner: CategoryBanner) => void;
  deleteCategoryBanner: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
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
  comparisonItems: string[];
  toggleComparison: (productId: string) => void;
  clearComparison: () => void;
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'status' | 'date'>) => { success: boolean; message: string };
  updateReviewStatus: (reviewId: string, status: Review['status']) => void;
  deleteReview: (reviewId: string) => void;
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  updateAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
  socialLinks: SocialLink[];
  updateSocialLinks: (links: SocialLink[]) => void;
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
    content: `নিওনথ্রেড (NEONTHREAD) অ্যাপলেট ব্যবহারে আপনার সকল তথ্যের গোপনীয়তা রক্ষা করতে আমরা প্রতিশ্রুতিবদ্ধ।

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

const DatabaseLoader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(p);

      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">{progress}% </p>
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
            className="h-full bg-black dark:bg-white"
          />
        </div>
      </div>
    </div>
  );
};

const safeParse = (saved: string | null, fallback: any) => {
  if (!saved || saved === 'undefined' || saved === 'null') return fallback;
  try {
    const parsed = JSON.parse(saved);
    if (parsed === null) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch (e) {
    console.error('Failed to parse from local storage:', e);
    return fallback;
  }
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ts_products');
    const data = safeParse(saved, initialProducts);
    return data.map((p: Product) => ({
      ...p,
      stock: p.stock !== undefined ? p.stock : 0
    }));
  });

  const [categories, setCategories] = useState<Category[]>(() => safeParse(localStorage.getItem('ts_categories'), []));

  const [contactInfo, setContactInfo] = useState<ContactInfo>(() => safeParse(localStorage.getItem('ts_contact_info'), {
    storeAddress: "Our Store(Dhaka)",
    storeAddressSubtitle: "Dhaka Uddan\nDhaka, Bangladesh",
    phone: "+8801515668345",
    phoneSubtitle: "Saturday-Sunday, 9am - 8pm",
    email: "neonthread@gmail.com",
    emailSubtitle: "We typically reply within 24 hours"
  }));

  const [faqs, setFaqs] = useState<FAQItem[]>(() => safeParse(localStorage.getItem('ts_faqs'), defaultFAQs));

  const [policies, setPolicies] = useState<PolicyItem[]>(() => safeParse(localStorage.getItem('ts_policies'), defaultPolicies));

  const [orders, setOrders] = useState<Order[]>(() => safeParse(localStorage.getItem('ts_orders'), []));

  const [coupons, setCoupons] = useState<Coupon[]>(() => safeParse(localStorage.getItem('ts_coupons'), initialCoupons));

  const [cart, setCart] = useState<CartItem[]>(() => safeParse(localStorage.getItem('ts_cart'), []));

  const [slides, setSlides] = useState<Slide[]>(() => safeParse(localStorage.getItem('ts_slides'), initialSlides));

  const [categoryBanners, setCategoryBanners] = useState<CategoryBanner[]>(() => safeParse(localStorage.getItem('ts_category_banners'), initialCategoryBanners));

  const [lookbook, setLookbook] = useState<LookbookImage[]>(() => safeParse(localStorage.getItem('ts_lookbook'), initialLookbook));

  const [subscribers, setSubscribers] = useState<Subscriber[]>(() => safeParse(localStorage.getItem('ts_subscribers'), []));

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => safeParse(localStorage.getItem('ts_contact_msgs'), []));

  const [popupAds, setPopupAds] = useState<PopupAd[]>(() => safeParse(localStorage.getItem('ts_popup_ads'), []));

  const [homeAds, setHomeAds] = useState<HomeAd[]>(() => safeParse(localStorage.getItem('ts_home_ads'), defaultHomeAds));

  const [otps, setOtps] = useState<OTPRecord[]>(() => safeParse(localStorage.getItem('ts_otps'), []));

  const [wishlist, setWishlist] = useState<string[]>(() => safeParse(localStorage.getItem('ts_wishlist'), []));
  
  const [comparisonItems, setComparisonItems] = useState<string[]>(() => safeParse(localStorage.getItem('ts_comparison'), []));

  const [reviews, setReviews] = useState<Review[]>(() => safeParse(localStorage.getItem('ts_reviews'), []));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => safeParse(localStorage.getItem('ts_announcements'), [
    {
      id: 'ann_1',
      text: 'Special Offer: Free delivery on orders over ৳1500! (৳১৫০০ এর বেশি অর্ডার করলে ফ্রি ডেলিভারি!)',
      isActive: true,
      isMarquee: false,
      backgroundColor: '#000000',
      textColor: '#ffffff'
    }
  ]));

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => safeParse(localStorage.getItem('ts_social_links'), [
    { id: 'sl_fb', platform: 'facebook', url: '', isActive: false },
    { id: 'sl_ig', platform: 'instagram', url: '', isActive: false },
    { id: 'sl_wa', platform: 'whatsapp', url: '', isActive: false },
    { id: 'sl_tk', platform: 'tiktok', url: '', isActive: false },
    { id: 'sl_yt', platform: 'youtube', url: '', isActive: false },
    { id: 'sl_x', platform: 'x', url: '', isActive: false }
  ]));

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() => safeParse(localStorage.getItem('ts_maintenance_mode'), false));

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
      categoryBanners: true,
      lookbook: true,
      subscribers: true,
      messages: true,
      ads: true,
      faqs: true,
      policies: true,
      otps: true,
      otpsDelete: true,
      reviews: true
    }
  };

  const [admins, setAdmins] = useState<AdminUser[]>(() => safeParse(localStorage.getItem('ts_admins'), [defaultSuperAdmin]));

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => safeParse(localStorage.getItem('ts_current_admin'), null));

  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(() => {
    return !!localStorage.getItem('ts_admin_token');
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('ts_admin_token');
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ts_dark_mode') === 'true';
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  const serverSave = async (key: string, data: any) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/db/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data, token: authToken })
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          // Clear invalid/expired admin token and log out
          setCurrentAdmin(null);
          setAuthToken(null);
          setIsAdminAuth(false);
        }
        let errorMsg = `Server error (${res.status})`;
        try {
          const errorData = await res.json();
          errorMsg += `: ${errorData.error || res.statusText}`;
        } catch (e) {
          errorMsg += `: ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }
      
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('network')) {
        // Quietly fail on network errors as the server might be restarting or slow
        console.warn(`Server sync skipped for ${key} (network issue).`);
      } else {
        console.error(`Failed to save ${key} to server database:`, err);
      }
    }
  };

  const publicAdd = async (key: string, item: any) => {
    try {
      await fetch('/api/db/public-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data: item })
      });
    } catch (err) {
      console.error(`Failed to publicly add ${key}:`, err);
    }
  };

  useEffect(() => {
    const fetchDb = async () => {
      try {
        const endpoint = authToken ? '/api/admin/db' : '/api/db';
        const options: RequestInit = authToken ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: authToken })
        } : {
          method: 'GET'
        };

        const res = await fetch(endpoint, options);
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }
        const dbData = await res.json();
        
        if (dbData && Object.keys(dbData).length > 0) {
          if (dbData.products) {
            setProducts(dbData.products.map((p: any) => ({
              ...p,
              stock: p.stock !== undefined ? p.stock : 0
            })));
          }
          if (dbData.faqs) setFaqs(dbData.faqs);
          if (dbData.policies) setPolicies(dbData.policies);
          if (dbData.categories) setCategories(dbData.categories);
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
          if (dbData.announcements) setAnnouncements(dbData.announcements);
          if (dbData.socialLinks) setSocialLinks(dbData.socialLinks);
          if (dbData.comparison) setComparisonItems(dbData.comparison);
          if (dbData.maintenance_mode !== undefined) setIsMaintenanceMode(dbData.maintenance_mode);
        } else {
          // Initialize server with local storage values or default mocks
          const initialDb = {
            products,
            faqs,
            policies,
            categories,
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
            announcements,
            socialLinks,
            comparison: comparisonItems,
            maintenance_mode: isMaintenanceMode
          };
          await fetch('/api/db/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialDb)
          });
        }
      } catch (err) {
        console.error("Failed to load DB from server, falling back to mock data:", err);
        // Fallback to local mocks if server is unreachable
        setProducts(initialProducts.map((p: any) => ({
          ...p,
          stock: p.stock !== undefined ? p.stock : 0
        })));
        setCoupons(initialCoupons);
        setSlides(initialSlides);
        setCategoryBanners(initialCategoryBanners);
        setLookbook(initialLookbook);
        // Note: other states like faqs, policies will remain empty defaults or as initialized in ShopProvider
      } finally {
        setIsDbLoaded(true);
      }
    };
    fetchDb();
  }, [authToken]);

  // Custom hook to prevent syncing on the first load of isDbLoaded
  function useServerSync(key: string, data: any, storageKey: string) {
    const previousDataRef = React.useRef(data);
    const hasInitializedRef = React.useRef(false);

    useEffect(() => {
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      if (!isDbLoaded) {
        previousDataRef.current = data;
        return;
      }

      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        previousDataRef.current = data;
        return;
      }

      // Only save if the data actually changed from the previous state and user is admin
      if (isAdminAuth && JSON.stringify(previousDataRef.current) !== JSON.stringify(data)) {
        previousDataRef.current = data;
        serverSave(key, data);
      }
    }, [data, isDbLoaded, key, storageKey, isAdminAuth]);
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
  useServerSync('categories', categories, 'ts_categories');
  useServerSync('contactInfo', contactInfo, 'ts_contact_info');
  useServerSync('admins', admins, 'ts_admins');
  useServerSync('otps', otps, 'ts_otps');
  useServerSync('wishlist', wishlist, 'ts_wishlist');
  useServerSync('announcements', announcements, 'ts_announcements');
  useServerSync('comparison', comparisonItems, 'ts_comparison');
  useServerSync('reviews', reviews, 'ts_reviews');
  useServerSync('maintenance_mode', isMaintenanceMode, 'ts_maintenance_mode');

  useEffect(() => { 
    try {
      localStorage.setItem('ts_cart', JSON.stringify(cart)); 
    } catch (e) {
      console.error('Failed to save cart to local storage', e);
    }
  }, [cart]);

  // Keep currentAdmin in sync with the central admins list
  useEffect(() => {
    if (currentAdmin && admins.length > 0) {
      const latest = admins.find(a => a.id === currentAdmin.id);
      if (latest && (
        latest.image !== currentAdmin.image || 
        latest.name !== currentAdmin.name || 
        latest.email !== currentAdmin.email ||
        latest.role !== currentAdmin.role
      )) {
        setCurrentAdmin(latest);
      }
    }
  }, [admins, currentAdmin]);

  useEffect(() => {
    if (authToken) {
      localStorage.setItem('ts_admin_token', authToken);
    } else {
      localStorage.removeItem('ts_admin_token');
    }
  }, [authToken]);

  useEffect(() => {
    if (currentAdmin) {
      localStorage.setItem('ts_current_admin', JSON.stringify(currentAdmin));
      setIsAdminAuth(true);
    } else {
      localStorage.removeItem('ts_current_admin');
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

  const toggleComparison = (productId: string) => {
    setComparisonItems(prev => {
      const isAlreadyIn = prev.includes(productId);
      if (isAlreadyIn) {
        return prev.filter(id => id !== productId);
      }
      if (prev.length >= 4) {
        // Limit to 4 products for comparison
        return prev;
      }
      return [...prev, productId];
    });
  };

  const clearComparison = () => setComparisonItems([]);

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
    publicAdd('reviews', newReview);
    return { success: true, message: 'Review submitted for moderation! (রিভিউটি অনুমোদনের জন্য পাঠানো হয়েছে!)' };
  };

  const updateReviewStatus = (reviewId: string, status: Review['status']) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status } : r));
  };

  const deleteReview = (reviewId: string) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, deleted: true } : r));
  };

  const addAnnouncement = (announcement: Omit<Announcement, 'id'>) => {
    setAnnouncements(prev => [{ ...announcement, id: generateId() }, ...prev]);
  };

  const updateAnnouncement = (announcement: Announcement) => {
    setAnnouncements(prev => prev.map(a => a.id === announcement.id ? announcement : a));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, deleted: true } : a));
  };

  const updateSocialLinks = (links: SocialLink[]) => {
    setSocialLinks(links);
    serverSave('socialLinks', links);
  };

  const loginAdmin = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (data.success) {
        setAuthToken(data.token);
        setCurrentAdmin(data.admin);
        setIsAdminAuth(true);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: "Network error occurred." };
    }
  };

  const logoutAdmin = () => {
    setCurrentAdmin(null);
    setAuthToken(null);
    setIsAdminAuth(false);
  };

  const updateProfile = async (updates: Partial<AdminUser>) => {
    if (!currentAdmin || !authToken) return { success: false, error: "Not authenticated" };
    try {
      const res = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentAdmin.id, updates, token: authToken })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentAdmin(data.admin);
        // Update admin in list too
        setAdmins(prev => prev.map(a => a.id === data.admin.id ? data.admin : a));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: "Failed to update profile" };
    }
  };

  const addAdmin = (admin: AdminUser) => {
    const updatedAdmins = [...admins, admin];
    setAdmins(updatedAdmins);
    serverSave('admins', updatedAdmins);
  };

  const updateAdmin = (admin: AdminUser) => {
    const updatedAdmins = admins.map(a => a.id === admin.id ? admin : a);
    setAdmins(updatedAdmins);
    serverSave('admins', updatedAdmins);
    if (currentAdmin && currentAdmin.id === admin.id) {
      setCurrentAdmin(admin);
    }
  };

  const updateContactInfo = (info: ContactInfo) => {
    setContactInfo(info);
  };

  const deleteAdmin = (id: string) => {
    const adminToDelete = admins.find(a => a.id === id);
    const emailStr = adminToDelete ? adminToDelete.email : `ID - ${id}`;
    // Hard delete from state so it propagates to server sync and gets removed from MongoDB
    const updatedAdmins = admins.filter(a => a.id !== id);
    setAdmins(updatedAdmins);
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
        return c.code.toLowerCase() === couponCode.toLowerCase() && isActive && isNotExpired && isStarted;
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

    const shippingCharge = customer.district === 'Dhaka' ? 70 : 120;
    const total = subtotal - discount + shippingCharge;

    // Check stock availability
    for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
            const stock = getProductStockForSize(product, item.selectedSize || 'M');
            if (item.quantity > stock) {
                return { success: false, error: `Product ${product.name} is out of stock or insufficient quantity for size ${item.selectedSize || 'M'}.` };
            }
        } else {
            return { success: false, error: `Product not found: ${item.name}` };
        }
    }

    const newOrderId = `NTD-${Date.now()}${(Math.random() * 1000).toFixed(0)}`;

    const newOrder: Order = {
      id: newOrderId,
      customer,
      items: [...cart],
      subtotal,
      discount,
      shippingCharge,
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
    publicAdd('orders', newOrder);
    clearCart();
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
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    const prodName = prod ? `"${prod.name}"` : `ID - ${id}`;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, deleted: true } : p));
  };

  const addCoupon = (coupon: Omit<Coupon, 'id'>) => {
    setCoupons(prev => [{ ...coupon, id: generateId() }, ...prev]);
  };

  const updateCoupon = (coupon: Coupon) => {
    setCoupons(prev => prev.map(c => c.id === coupon.id ? coupon : c));
  };

  const deleteCoupon = (id: string) => {
    const coup = coupons.find(c => c.id === id);
    const coupCode = coup ? `"${coup.code}"` : `ID - ${id}`;
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, deleted: true } : c));
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
  };

  const updateOrderNotes = (orderId: string, notes: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notes } : o));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, deleted: true } : o));
  };

  const updateOrder = (order: Order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  };

  const addSlide = (slide: Omit<Slide, 'id'>) => {
    setSlides(prev => [{...slide, id: generateId()}, ...prev]);
  };
  const updateSlide = (slide: Slide) => {
    setSlides(prev => prev.map(s => s.id === slide.id ? slide : s));
  };
  const deleteSlide = (id: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, deleted: true } : s));
  };
  
  const addCategoryBanner = (banner: Omit<CategoryBanner, 'id'>) => {
    setCategoryBanners(prev => [{...banner, id: generateId()}, ...prev]);
  };
  const updateCategoryBanner = (banner: CategoryBanner) => {
    setCategoryBanners(prev => prev.map(b => b.id === banner.id ? banner : b));
  };
  const deleteCategoryBanner = (id: string) => {
    setCategoryBanners(prev => prev.map(b => b.id === id ? { ...b, deleted: true } : b));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    setCategories(prev => [{...category, id: generateId()}, ...prev]);
  };
  const updateCategory = (category: Category) => {
    setCategories(prev => prev.map(c => c.id === category.id ? category : c));
  };
  const deleteCategory = (id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, deleted: true } : c));
  };

  const addLookbookImage = (img: Omit<LookbookImage, 'id'>) => {
    setLookbook(prev => [{...img, id: generateId()}, ...prev]);
  };
  const updateLookbookImage = (img: LookbookImage) => {
    setLookbook(prev => prev.map(l => l.id === img.id ? img : l));
  };
  const deleteLookbookImage = (id: string) => {
    setLookbook(prev => prev.map(l => l.id === id ? { ...l, deleted: true } : l));
  };

  const addSubscriber = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!subscribers.find(s => s.email && s.email.trim().toLowerCase() === normalizedEmail)) {
      const newSub = { id: generateId(), email: normalizedEmail, date: new Date().toISOString() };
      setSubscribers(prev => [newSub, ...prev]);
      publicAdd('subscribers', newSub);
    }
  };
  const deleteSubscriber = (id: string) => {
    const sub = subscribers.find(s => s.id === id);
    const subEmail = sub ? sub.email : `ID - ${id}`;
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, deleted: true } : s));
  };

  const addContactMessage = (msg: Omit<ContactMessage, 'id' | 'date'>) => {
    const newMsg = { ...msg, id: generateId(), date: new Date().toISOString() };
    setContactMessages(prev => [newMsg, ...prev]);
    publicAdd('contactMessages', newMsg);
  };
  const deleteContactMessage = (id: string) => {
    const msg = contactMessages.find(m => m.id === id);
    const msgSender = msg ? `${msg.name} (${msg.email})` : `ID - ${id}`;
    setContactMessages(prev => prev.map(m => m.id === id ? { ...m, deleted: true } : m));
  };

  const addPopupAd = (ad: Omit<PopupAd, 'id'>) => {
    setPopupAds(prev => [{...ad, id: generateId()}, ...prev]);
  };
  const deletePopupAd = (id: string) => {
    setPopupAds(prev => prev.map(a => a.id === id ? { ...a, deleted: true } : a));
  };
  const updatePopupAd = (id: string, updatedAd: Partial<PopupAd>) => {
    setPopupAds(prev => prev.map(ad => ad.id === id ? { ...ad, ...updatedAd } : ad));
  };

  const addHomeAd = (ad: Omit<HomeAd, 'id'>) => {
    setHomeAds(prev => [{...ad, id: generateId()}, ...prev]);
  };
  const deleteHomeAd = (id: string) => {
    setHomeAds(prev => prev.map(a => a.id === id ? { ...a, deleted: true } : a));
  };
  const updateHomeAd = (ad: HomeAd) => {
    setHomeAds(prev => prev.map(a => a.id === ad.id ? ad : a));
  };

  const addFAQ = (faq: Omit<FAQItem, 'id'>) => {
    setFaqs(prev => [{ ...faq, id: generateId() }, ...prev]);
  };
  const updateFAQ = (faq: FAQItem) => {
    setFaqs(prev => prev.map(f => f.id === faq.id ? faq : f));
  };
  const deleteFAQ = (id: string) => {
    const item = faqs.find(f => f.id === id);
    const itemQuestion = item ? `"${item.question}"` : `ID - ${id}`;
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, deleted: true } : f));
  };

  const addPolicy = (policy: Omit<PolicyItem, 'id'>) => {
    setPolicies(prev => [{ ...policy, id: generateId() }, ...prev]);
  };
  const updatePolicy = (policy: PolicyItem) => {
    setPolicies(prev => prev.map(p => p.id === policy.id ? policy : p));
  };
  const deletePolicy = (id: string) => {
    const pol = policies.find(p => p.id === id);
    const polTitle = pol ? `"${pol.title}"` : `ID - ${id}`;
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, deleted: true } : p));
  };

  const addOTP = (phone: string, otp: string, email?: string) => {
    const newOtp = {
      id: generateId(),
      phone,
      email,
      otp,
      createdAt: new Date().toISOString(),
      verified: false
    };
    setOtps(prev => [newOtp, ...prev]);
    publicAdd('otps', newOtp);
  };

  const deleteOTP = (id: string) => {
    const otpRec = otps.find(o => o.id === id);
    const details = otpRec ? `Deleted OTP code: [${otpRec.otp}] for phone: ${otpRec.phone || 'N/A'}` : `Deleted OTP ID: ${id}`;
    setOtps(prev => prev.map(o => o.id === id ? { ...o, deleted: true } : o));
  };

  if (!isDbLoaded) {
    return <DatabaseLoader />;
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
      categories: categories.filter(c => !c.deleted),
      contactInfo,
      isAdminAuth,
      authToken,
      currentAdmin, 
      admins: admins.filter(a => a.isActive !== false), 
      otps: otps.filter(o => !o.deleted), 
      isMaintenanceMode,
      setMaintenanceMode: setIsMaintenanceMode,
      getProductPriceForSize,
      getProductStockForSize,
      addToCart, removeFromCart, updateCartQuantity, updateCartItemSize, clearCart, placeOrder,
      loginAdmin, logoutAdmin, updateProfile, addAdmin, updateAdmin, deleteAdmin, updateContactInfo, addProduct, updateProduct, deleteProduct,
      addSlide, updateSlide, deleteSlide, addCategoryBanner, updateCategoryBanner, deleteCategoryBanner, 
      addCategory, updateCategory, deleteCategory,
      addLookbookImage, updateLookbookImage, deleteLookbookImage,
      addCoupon, updateCoupon, deleteCoupon,
      updateOrderStatus, updateOrderNotes, updateOrder, deleteOrder,
      addSubscriber, deleteSubscriber, addContactMessage, deleteContactMessage, addPopupAd, deletePopupAd, updatePopupAd,
      addHomeAd, deleteHomeAd, updateHomeAd,
      addFAQ, updateFAQ, deleteFAQ, addPolicy, updatePolicy, deletePolicy,
      addOTP, deleteOTP,
      isDarkMode, toggleDarkMode, isCartOpen, setIsCartOpen,
      wishlist, toggleWishlist,
      comparisonItems, toggleComparison, clearComparison,
      reviews: reviews.filter(r => !r.deleted), addReview, updateReviewStatus, deleteReview,
      announcements: announcements.filter(a => !a.deleted), addAnnouncement, updateAnnouncement, deleteAnnouncement,
      socialLinks, updateSocialLinks
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
