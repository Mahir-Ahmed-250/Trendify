export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  tagText?: string;
  link?: string;
  deleted?: boolean;
}

export interface CategoryBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  deleted?: boolean;
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
  deleted?: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  date: string;
  deleted?: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  deleted?: boolean;
}

export interface PopupAd {
  id: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  pages: string[]; 
  deleted?: boolean;
}

export interface HomeAd {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl: string;
  isActive: boolean;
  deleted?: boolean;
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
  deleted?: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  deleted?: boolean;
}

export interface PolicyItem {
  id: string;
  key: 'shipping_returns' | 'privacy_policy' | string;
  title: string;
  content: string;
  deleted?: boolean;
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
  deleted?: boolean;
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
  deleted?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  orderId: string;
  userName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'hidden';
  date: string;
  deleted?: boolean;
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
  otps?: boolean;
  otpsDelete?: boolean;
  activityLogs?: boolean;
  reviews?: boolean;
  notifications?: boolean;
}

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  actionType: 'create' | 'update' | 'delete' | 'auth' | 'other';
  targetModule: string;
  details: string;
  timestamp: string;
}

export interface OTPRecord {
  id: string;
  phone?: string;
  email?: string;
  otp: string;
  createdAt: string;
  verified: boolean;
  deleted?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  password?: string;
  name?: string;
  image?: string;
  role: 'super' | 'admin';
  permissions: AdminPermissions;
  isActive?: boolean;
}
