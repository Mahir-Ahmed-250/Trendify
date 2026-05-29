import { Product, Coupon, Slide, CategoryBanner, LookbookImage } from './types';

export const initialSlides: Slide[] = [
  {
    id: 's1',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    title: 'Summer Collection 2026',
    subtitle: 'Stay cool with our premium cotton t-shirts',
    tagText: 'Summer 2026 Collection',
    link: '/shop'
  },
  {
    id: 's2',
    image: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    title: 'Minimalist Essentials',
    subtitle: 'Elevate your everyday wardrobe',
    tagText: 'New Arrivals',
    link: '/shop'
  }
];

export const initialCategoryBanners: CategoryBanner[] = [
  {
    id: 'cb1',
    title: 'Basic\nTees',
    subtitle: 'Everyday Essentials',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    link: '/shop?q=basic'
  },
  {
    id: 'cb2',
    title: 'Graphic\nPrints',
    subtitle: 'Streetwear Collection',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    link: '/shop?q=graphic'
  }
];

export const initialLookbook: LookbookImage[] = [
  {
    id: 'lb1',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    link: '/shop?category=Graphic',
    className: 'col-span-2 row-span-2',
    serial: 1,
    title: 'Summer Casual Series'
  },
  {
    id: 'lb2',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    link: '/shop?category=Basic',
    serial: 2,
    title: 'Minimalist Essentials'
  },
  {
    id: 'lb3',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    link: '/shop?category=Oversized',
    className: 'col-span-1 row-span-2',
    serial: 3,
    title: 'Urban Streetwear Look'
  },
  {
    id: 'lb4',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    link: '/shop?category=Basic',
    serial: 4,
    title: 'Premium Classic Fits'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'p1',
    name: 'Classic White T-Shirt',
    price: 450,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isHotSale: true,
    description: 'Perfect classic white t-shirt for everyday wear, made with 100% cotton.',
    category: 'Basic',
    code: 'TS-1001',
    stock: 50
  },
  {
    id: 'p2',
    name: 'Black Minimalist Tee',
    price: 500,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isHotSale: true,
    description: 'Sleek dark design, breathable fabric.',
    category: 'Basic',
    code: 'TS-1002',
    stock: 50
  },
  {
    id: 'p3',
    name: 'Vintage Bengal Print',
    price: 650,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isHotSale: false,
    description: 'Stylish vintage printed t-shirt.',
    category: 'Graphic',
    code: 'TS-1003',
    stock: 50
  },
  {
    id: 'p4',
    name: 'Oversized Streetwear Tee',
    price: 750,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isHotSale: true,
    description: 'Trendy oversized fit, very comfortable.',
    category: 'Oversized',
    code: 'TS-1004',
    stock: 50
  },
  {
    id: 'p5',
    name: 'Retro Striped T-Shirt',
    price: 550,
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isHotSale: false,
    description: 'Striped retro pattern.',
    category: 'Basic',
    code: 'TS-1005',
    stock: 50
  },
  {
    id: 'p6',
    name: 'Graphic Art Tee',
    price: 600,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isHotSale: false,
    description: 'Modern art graphic printed.',
    category: 'Graphic',
    code: 'TS-1006',
    stock: 50
  }
];

export const initialCoupons: Coupon[] = [
  {
    id: 'c1',
    code: 'WELCOME10',
    discountValue: 10,
    discountType: 'percentage',
    isActive: true,
  },
  {
    id: 'c2',
    code: 'FESTIVAL20',
    discountValue: 20,
    discountType: 'percentage',
    isActive: true,
  }
];
