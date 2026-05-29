export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  tagText?: string;
  link?: string;
}

export interface CategoryBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

export interface LookbookImage {
  id: string;
  image: string;
  link: string;
  className?: string; // used for grid layout
  widthPercent?: string; // e.g. '25%', '50%', '100%'
  heightPercent?: string; // e.g. '25%', '50%', '100%'
  serial: number;
  title?: string;
}

export interface Subscriber {
  id: string;
  email: string;
  date: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}

export interface PopupAd {
  id: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  pages: string[]; 
}

export interface HomeAd {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  isHotSale: boolean;
  isCollection?: boolean;
  description: string;
  category: string;
  code?: string;
  sizeChartImage?: string;
  images?: string[]; 
  serial?: number;
  stock: number;
  oldPrice?: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface PolicyItem {
  id: string;
  key: 'shipping_returns' | 'privacy_policy' | string;
  title: string;
  content: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  district?: string;
  area?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountValue: number;
  discountType: 'percentage' | 'amount';
  isActive: boolean;
  startDate?: string;
  expiryDate?: string;
}

export interface Order {
  id: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
}

export interface AdminPermissions {
  dashboard: boolean;
  products: boolean;
  orders: boolean;
  coupons: boolean;
  slides: boolean;
  categories: boolean;
  lookbook: boolean;
  subscribers: boolean;
  messages: boolean;
  ads: boolean;
  faqs: boolean;
  policies: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  password?: string;
  name?: string;
  image?: string;
  role: 'super' | 'admin';
  permissions: AdminPermissions;
}
