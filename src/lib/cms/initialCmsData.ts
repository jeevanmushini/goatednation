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
    desktopImage: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179472/berserk-hoodie/oycsjwff2wkzukvqhjom.jpg',
    mobileImage: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179472/berserk-hoodie/oycsjwff2wkzukvqhjom.jpg',
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
    desktopImage: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179478/valhalla-bomber/u6cun32wgk3hbfiqv3ww.jpg',
    enabled: true,
    order: 2,
  },
];

export const INITIAL_CATEGORIES: CmsCategory[] = [
  {
    id: 'tees',
    title: 'Oversized Tees',
    subtitle: '280+ GSM Combed Heavy Cotton',
    count: '16+ Styles',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179474/cherry-blossom-waffle/z7imwkvphxo70j57gi7y.jpg',
    slug: 'tees',
    enabled: true,
    order: 1,
  },
  {
    id: 'hoodies',
    title: 'Heavyweight Hoodies',
    subtitle: '400+ GSM French Terry Fleece',
    count: '24+ Drops',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179472/berserk-hoodie/oycsjwff2wkzukvqhjom.jpg',
    slug: 'hoodies',
    enabled: true,
    order: 2,
  },
  {
    id: 'acid-wash',
    title: 'Acid Wash Heavy Tees',
    subtitle: 'Mineral Wash Vintage Feel',
    count: '12+ Styles',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179478/valhalla-bomber/u6cun32wgk3hbfiqv3ww.jpg',
    slug: 'acid-wash',
    enabled: true,
    order: 3,
  },
  {
    id: 'jackets',
    title: 'Bombers & Jacquards',
    subtitle: '120K+ Stitch Embroidery',
    count: '8+ Jackets',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179476/ryujin-jacket/sjuq3kyz9ofyhu6g0k9r.jpg',
    slug: 'jackets',
    enabled: true,
    order: 4,
  },
  {
    id: 'cargo',
    title: 'Utility Bottoms',
    subtitle: 'Heavy Cord & Barrel Fit',
    count: '10+ Pants',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179477/sukuna-jacket/yjwhc1wk3tqlce77975i.jpg',
    slug: 'cargo',
    enabled: true,
    order: 5,
  },
  {
    id: 'accessories',
    title: 'Street Accessories',
    subtitle: 'Crossbody Slings & Pendants',
    count: '20+ Styles',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179479/zoro-crossbody/ikbras4fhohlznvmbsnk.jpg',
    slug: 'accessories',
    enabled: true,
    order: 6,
  },
];

export const INITIAL_BANNERS: CmsBanner[] = [
  {
    id: 'banner-1',
    badge: 'COLLECTORS EDITION',
    title: 'VALHALLA 90S BOMBER JACKET',
    subtitle: 'Waterproof matte shell with 120,000 stitch count back embroidery. Quilted satin interior.',
    ctaText: 'SHOP BOMBER JACKET',
    ctaLink: '/products/valhalla-bomber-jacket',
    desktopImage: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179478/valhalla-bomber/u6cun32wgk3hbfiqv3ww.jpg',
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
  image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179471/editorial-banner/nbyoy0iyj1u9waae5egl.jpg',
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
    name: 'Berserk Eclipse Hoodie',
    url: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179472/berserk-hoodie/oycsjwff2wkzukvqhjom.jpg',
    category: 'banners',
    uploadedAt: '2026-11-01',
    size: '1.2 MB',
  },
  {
    id: 'med-2',
    name: 'Cherry Blossom Waffle',
    url: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179474/cherry-blossom-waffle/z7imwkvphxo70j57gi7y.jpg',
    category: 'products',
    uploadedAt: '2026-11-01',
    size: '850 KB',
  },
  {
    id: 'med-3',
    name: 'Sukuna Domain Jacket',
    url: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179477/sukuna-jacket/yjwhc1wk3tqlce77975i.jpg',
    category: 'products',
    uploadedAt: '2026-11-01',
    size: '920 KB',
  },
  {
    id: 'med-4',
    name: 'Valhalla Bomber Jacket',
    url: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179478/valhalla-bomber/u6cun32wgk3hbfiqv3ww.jpg',
    category: 'products',
    uploadedAt: '2026-11-01',
    size: '1.1 MB',
  },
];

export const INITIAL_HERO_BOTTOMS: CmsHeroBottomItem[] = [
  {
    id: 'b-1',
    name: 'BERSERK ECLIPSE // 420 GSM HOODIE',
    kanji: '黒 // 420 GSM TERRY',
    price: 'Rs. 2,499',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179472/berserk-hoodie/oycsjwff2wkzukvqhjom.jpg',
    color: 'Eclipse Black',
    badge: 'BESTSELLER',
    link: '/collections/hoodie',
  },
  {
    id: 'b-2',
    name: 'SUKUNA DOMAIN // JACQUARD JACKET',
    kanji: '宿 // METALLIC STITCH',
    price: 'Rs. 2,999',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179477/sukuna-jacket/yjwhc1wk3tqlce77975i.jpg',
    color: 'Crimson Gold',
    badge: 'LIMITED',
    link: '/collections/jacket',
  },
  {
    id: 'b-3',
    name: 'RYUJIN DRAGON // JACQUARD JACKET',
    kanji: '龍 // TRADITIONAL KNOT',
    price: 'Rs. 2,099',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179476/ryujin-jacket/sjuq3kyz9ofyhu6g0k9r.jpg',
    color: 'Onyx Green',
    badge: 'NEW DROP',
    link: '/collections/jacket',
  },
  {
    id: 'b-4',
    name: 'WAFFLE CHERRY BLOSSOM // FULL SLEEVE',
    kanji: '桜 // 200K STITCHES',
    price: 'Rs. 1,549',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179474/cherry-blossom-waffle/z7imwkvphxo70j57gi7y.jpg',
    color: 'Cherry Floral',
    badge: 'RESTOCKED',
    link: '/collections/tees',
  },
  {
    id: 'b-5',
    name: 'ZORO TACTICAL // CROSSBODY BAG',
    kanji: '刀 // 1000D CORDURA',
    price: 'Rs. 1,299',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179479/zoro-crossbody/ikbras4fhohlznvmbsnk.jpg',
    color: 'Military Olive',
    badge: 'TACTICAL',
    link: '/collections/backpack',
  },
  {
    id: 'b-6',
    name: 'TACTICAL UTILITY // COMBAT VEST',
    kanji: '機 // MULTI POCKET',
    price: 'Rs. 1,899',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179477/tactical-vest/d1qbbxrdj2ckkcxif6il.jpg',
    color: 'Matte Slate',
    badge: 'NEW',
    link: '/collections/vest',
  },
  {
    id: 'b-7',
    name: 'VALHALLA 90S // BOMBER JACKET',
    kanji: '神 // SATIN INTERIOR',
    price: 'Rs. 2,799',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179478/valhalla-bomber/u6cun32wgk3hbfiqv3ww.jpg',
    color: 'Vintage Black',
    badge: 'HEAVY EMBROIDERY',
    link: '/collections/jacket',
  },
];

export const INITIAL_STACK_ITEMS: CmsStackCardItem[] = [
  {
    id: 's-1',
    category: 'BACKPACK',
    title: 'ZORO TACTICAL // CROSSBODY',
    subtitle: 'MODULAR MOLLE SYSTEM • 1000D CORDURA',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179479/zoro-crossbody/ikbras4fhohlznvmbsnk.jpg',
    link: '/collections/backpack',
  },
  {
    id: 's-2',
    category: 'JACKETS',
    title: 'SUKUNA DOMAIN // JACQUARD JACKET',
    subtitle: 'METALLIC THREAD EMBROIDERY • BOX FIT',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179477/sukuna-jacket/yjwhc1wk3tqlce77975i.jpg',
    link: '/collections/jacket',
  },
  {
    id: 's-3',
    category: 'HOODIES',
    title: 'BERSERK ECLIPSE // 420 GSM HOODIE',
    subtitle: 'DOUBLE-LAYER HOOD • PUFF SCREEN PRINT',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179472/berserk-hoodie/oycsjwff2wkzukvqhjom.jpg',
    link: '/collections/hoodie',
  },
  {
    id: 's-4',
    category: 'VEST',
    title: 'TACTICAL UTILITY // COMBAT VEST',
    subtitle: 'MULTI-POCKET HARNESS • REFLECTIVE WEBBING',
    image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179477/tactical-vest/d1qbbxrdj2ckkcxif6il.jpg',
    link: '/collections/vest',
  },
];

export const INITIAL_EDITORIAL_BANNER: CmsEditorialBanner = {
  title: 'GOATED NATION STREET ARCHIVE',
  followersText: '176K FOLLOWERS',
  image: 'https://res.cloudinary.com/bu4oxldy/image/upload/v1795179471/editorial-banner/nbyoy0iyj1u9waae5egl.jpg',
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
