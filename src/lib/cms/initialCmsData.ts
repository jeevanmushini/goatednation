import {
  CmsHeroSlide,
  CmsCategory,
  CmsBanner,
  CmsBrandStory,
  CmsNewsletter,
  CmsSection,
  CmsSiteSettings,
  CmsNavigationItem,
  CmsMediaItem,
  CmsHeroBottomItem,
  CmsStackCardItem,
  CmsEditorialBanner,
  CmsAnnouncement,
} from '../../types/cms';
import { CATEGORIES } from '../../data/products';

export const INITIAL_HERO_SLIDES: CmsHeroSlide[] = [
  {
    id: 'hero-1',
    badge: 'WINTER 2026 DROP // SHIBUYA & BERSERK CAPSULE',
    title: 'WEAR THE',
    titleAccent: 'CULTURE',
    subtitle:
      'High-voltage anime streetwear engineered for the unapologetic. Custom-milled 280–420 GSM French Terry, 3D puff prints, and signature Tokyo drop-shoulder silhouettes.',
    ctaText: 'EXPLORE ALL DROPS',
    ctaLink: '/collections',
    secondaryCtaText: 'HEAVY HOODIES (420 GSM)',
    secondaryCtaLink: '/collections/hoodies',
    desktopImage:
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=2000&q=85',
    mobileImage:
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
    enabled: true,
    order: 1,
  },
  {
    id: 'hero-2',
    badge: 'DARK FANTASY CAPSULE // LIMITED TO 150 PCS',
    title: 'BRAND OF',
    titleAccent: 'SACRIFICE',
    subtitle:
      'Mineral acid-wash treated tees and heavy zip hoodies with distressed crackle typography. Pre-shrunk for an authentic vintage band aesthetic.',
    ctaText: 'SHOP ACID WASH',
    ctaLink: '/collections/acid-wash',
    secondaryCtaText: 'VIEW LOOKBOOK',
    secondaryCtaLink: '/about',
    desktopImage:
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=2000&q=85',
    enabled: true,
    order: 2,
  },
];

export const INITIAL_CATEGORIES: CmsCategory[] = CATEGORIES.map((c, i) => ({
  ...c,
  enabled: true,
  order: i + 1,
}));

export const INITIAL_BANNERS: CmsBanner[] = [
  {
    id: 'banner-1',
    badge: 'COLLECTORS EDITION',
    title: 'VALHALLA 90S BOMBER JACKET',
    subtitle: 'Waterproof matte shell with 120,000 stitch count back embroidery. Quilted satin interior.',
    ctaText: 'SHOP BOMBER JACKET',
    ctaLink: '/products/valhalla-bomber-jacket',
    desktopImage:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1600&q=80',
    enabled: true,
    order: 1,
  },
];

export const INITIAL_BRAND_STORY: CmsBrandStory = {
  title: 'NOT JUST MERCH.',
  titleAccent: 'THIS IS AUTHENTIC FASHION.',
  tagline: 'ENGINEERING & ETHOS',
  description:
    'Most anime clothing in India is printed on flimsy 180 GSM blanks with peeling prints. Goated Nation was born to destroy that standard. We engineer genuine heavy-duty streetwear inspired by Japanese avant-garde labels.',
  stat1Value: '280-420',
  stat1Label: 'GSM French Terry Cotton',
  stat2Value: '50K+',
  stat2Label: 'Cult Community Across India',
  stat3Value: '100%',
  stat3Label: 'Pre-Shrunk Bio-Washed',
  image: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1200&q=80',
  ctaText: 'READ THE FULL MANIFESTO',
  ctaLink: '/about',
};

export const INITIAL_NEWSLETTER: CmsNewsletter = {
  badge: 'THE INNER SYNDICATE',
  title: 'NEVER MISS A LIMITED DROP',
  subtitle:
    'Sign up for drop alerts, secret password-protected restocks, and receive 10% off your first checkout.',
  couponCode: 'WELCOME10',
  discountValue: '10% OFF',
};

export const INITIAL_SECTIONS: CmsSection[] = [
  { id: 'sec-hero', type: 'hero', title: 'Main Hero Showcase', enabled: true, order: 1 },
  { id: 'sec-categories', type: 'categories', title: 'Curated Silhouettes', enabled: true, order: 2 },
  { id: 'sec-drops', type: 'product-grid', title: 'Trending Streetwear Drops', enabled: true, order: 3 },
  { id: 'sec-banner', type: 'banner', title: 'Promotional Feature Banner', enabled: true, order: 4 },
  { id: 'sec-story', type: 'brand-story', title: 'Craftsmanship & Engineering Manifesto', enabled: true, order: 5 },
  { id: 'sec-testimonials', type: 'testimonials', title: 'Streetwear Community Reviews', enabled: true, order: 6 },
  { id: 'sec-newsletter', type: 'newsletter', title: 'Syndicate Newsletter Subscription', enabled: true, order: 7 },
];

export const INITIAL_SETTINGS: CmsSiteSettings = {
  brandName: 'GOATED NATION',
  brandTagline: 'Where Anime Culture Meets Street Style',
  logoSubtext: 'GOATED NATION // TOKYO • MUMBAI',
  announcementText:
    '⚡ NEW DROP: SHIBUYA PROTOCOL OVERSIZED TEE LIVE • FREE EXPRESS SHIPPING OVER ₹999 • USE CODE "WELCOME10" FOR 10% OFF',
  announcementEnabled: true,
  freeShippingThreshold: 999,
  supportEmail: 'support@goatednation.in',
  supportPhone: '+91 98765 43210',
  address: 'GOATED NATION Hub, Harajuku Road, Mumbai, Maharashtra 400050',
  instagramUrl: 'https://instagram.com/goatednation',
  twitterUrl: 'https://twitter.com/goatednation',
  youtubeUrl: 'https://youtube.com/@goatednation',
};

export const INITIAL_NAVIGATION: CmsNavigationItem[] = [
  { id: 'nav-1', label: 'ALL DROPS', href: '/collections', enabled: true, order: 1 },
  { id: 'nav-2', label: 'OVERSIZED TEES', href: '/collections/tees', enabled: true, order: 2 },
  { id: 'nav-3', label: 'HOODIES', href: '/collections/hoodies', enabled: true, order: 3 },
  { id: 'nav-4', label: 'ACID WASH', href: '/collections/acid-wash', enabled: true, order: 4 },
  { id: 'nav-5', label: 'OUTERWEAR', href: '/collections/jackets', enabled: true, order: 5 },
  { id: 'nav-6', label: 'MANIFESTO', href: '/about', enabled: true, order: 6 },
];

export const INITIAL_MEDIA: CmsMediaItem[] = [
  {
    id: 'med-1',
    name: 'Shibuya Hero Dark Background',
    url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=2000&q=85',
    category: 'banners',
    uploadedAt: '2026-11-01',
    size: '1.2 MB',
  },
  {
    id: 'med-2',
    name: 'Shibuya Incident Tee Front',
    url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
    category: 'products',
    uploadedAt: '2026-11-01',
    size: '850 KB',
  },
  {
    id: 'med-3',
    name: 'Infinite Void 420 GSM Hoodie',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
    category: 'products',
    uploadedAt: '2026-11-01',
    size: '920 KB',
  },
  {
    id: 'med-4',
    name: 'Valhalla Bomber Jacket',
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
    category: 'products',
    uploadedAt: '2026-11-01',
    size: '1.1 MB',
  },
];

export const INITIAL_HERO_BOTTOMS: CmsHeroBottomItem[] = [
  {
    id: 'b-1',
    name: 'CHERRY BLOSSOM / BARREL SWEATPANTS',
    kanji: '桜 // 420 GSM ROPE CORD',
    price: 'Rs. 1,949',
    image: 'https://zenin.co.in/cdn/shop/files/pant1s.png',
    color: 'Onyx Black',
    badge: 'BESTSELLER',
  },
  {
    id: 'b-2',
    name: 'HEAVYWEIGHT HEATHER GREY / BARREL',
    kanji: '灰 // TOKYO FIT',
    price: 'Rs. 1,899',
    image: 'https://zenin.co.in/cdn/shop/files/pant2.png',
    color: 'Heather Grey',
    badge: 'LIMITED',
  },
  {
    id: 'b-3',
    name: 'KANJI LOVE / CREAM SWEATPANTS',
    kanji: '愛 // EMBROIDERED',
    price: 'Rs. 1,949',
    image: 'https://zenin.co.in/cdn/shop/files/pant3ss.png',
    color: 'Sand Cream',
    badge: 'RESTOCKED',
  },
  {
    id: 'b-4',
    name: 'CYBERPUNK PURPLE / TECH SWEAT',
    kanji: '紫 // UV REACTIVE',
    price: 'Rs. 1,999',
    image: 'https://zenin.co.in/cdn/shop/files/pant5.png',
    color: 'Deep Violet',
    badge: 'NEW',
  },
  {
    id: 'b-5',
    name: 'MECHA MONOCHROME / CONTRAST CARGO',
    kanji: '機 // MODULAR',
    price: 'Rs. 2,299',
    image: 'https://zenin.co.in/cdn/shop/files/pant6.png',
    color: 'Mono Contrast',
    badge: 'TACTICAL',
  },
  {
    id: 'b-6',
    name: 'AKIRA REDLINE / PIPED SWEATPANTS',
    kanji: '赤 // RACER LINE',
    price: 'Rs. 1,849',
    image: 'https://zenin.co.in/cdn/shop/files/pant_8.png',
    color: 'Crimson Trace',
    badge: 'DROP 03',
  },
  {
    id: 'b-7',
    name: 'STEALTH SHADOW / COMBAT PANTS',
    kanji: '影 // 360 CORD',
    price: 'Rs. 2,199',
    image: 'https://zenin.co.in/cdn/shop/files/pant_7.png',
    color: 'Pitch Black',
    badge: 'HEAVY TERRY',
  },
];

export const INITIAL_STACK_ITEMS: CmsStackCardItem[] = [
  {
    id: 's-1',
    category: 'BACKPACK',
    title: 'ZORO TACTICAL // CROSSBODY',
    subtitle: 'MODULAR MOLLE SYSTEM • 1000D CORDURA',
    image: 'https://zenin.co.in/cdn/shop/files/backpackcollection.jpg',
    link: '/collections/backpack',
  },
  {
    id: 's-2',
    category: 'JACKETS',
    title: 'SUKUNA DOMAIN // JACQUARD JACKET',
    subtitle: 'METALLIC THREAD EMBROIDERY • BOX FIT',
    image: 'https://zenin.co.in/cdn/shop/files/W2_6048f97c-7344-4633-be03-4078572c4ab3.jpg',
    link: '/collections/jacket',
  },
  {
    id: 's-3',
    category: 'HOODIES',
    title: 'BERSERK ECLIPSE // 420 GSM HOODIE',
    subtitle: 'DOUBLE-LAYER HOOD • PUFF SCREEN PRINT',
    image: 'https://zenin.co.in/cdn/shop/files/W2_c73c0e9a-68a9-4ab7-ad83-2780a0d86305.jpg',
    link: '/collections/hoodie',
  },
  {
    id: 's-4',
    category: 'VEST',
    title: 'TACTICAL UTILITY // COMBAT VEST',
    subtitle: 'MULTI-POCKET HARNESS • REFLECTIVE WEBBING',
    image: 'https://zenin.co.in/cdn/shop/files/w2-16.jpg',
    link: '/collections/vest',
  },
];

export const INITIAL_EDITORIAL_BANNER: CmsEditorialBanner = {
  title: 'GOATED NATION STREET ARCHIVE',
  followersText: '176K FOLLOWERS',
  image: 'https://zenin.co.in/cdn/shop/files/ZENIN17.jpg',
  instagramUrl: 'https://instagram.com/goatednation',
  ctaText: 'INSTAGRAM',
};

export const INITIAL_ANNOUNCEMENT: CmsAnnouncement = {
  text: 'APPLIED AT CHECKOUT',
  highlightText: 'EXTRA 15% OFF ON PREPAID ORDERS',
  ctaText: 'SHOP NOW',
  ctaLink: '/collections',
  countdownDays: 2,
};
