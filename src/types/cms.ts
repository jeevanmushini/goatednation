export interface CmsHeroSlide {
  id: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  desktopImage: string;
  mobileImage?: string;
  enabled: boolean;
  order: number;
}

export interface CmsCategory {
  id: string;
  title: string;
  subtitle: string;
  count: string;
  image: string;
  slug: string;
  enabled: boolean;
  order: number;
}

export interface CmsBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  desktopImage: string;
  mobileImage?: string;
  enabled: boolean;
  order: number;
}

export interface CmsBrandStory {
  title: string;
  titleAccent: string;
  tagline: string;
  description: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export interface CmsNewsletter {
  badge: string;
  title: string;
  subtitle: string;
  couponCode: string;
  discountValue: string;
}

export type CmsSectionType =
  | 'hero'
  | 'categories'
  | 'product-grid'
  | 'banner'
  | 'brand-story'
  | 'testimonials'
  | 'newsletter';

export interface CmsSection {
  id: string;
  type: CmsSectionType;
  title: string;
  enabled: boolean;
  order: number;
}

export interface CmsSiteSettings {
  brandName: string;
  brandTagline: string;
  logoSubtext: string;
  announcementText: string;
  announcementEnabled: boolean;
  freeShippingThreshold: number;
  supportEmail: string;
  supportPhone: string;
  address: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
}

export interface CmsNavigationItem {
  id: string;
  label: string;
  href: string;
  badge?: string;
  enabled: boolean;
  order: number;
}

export interface CmsMediaItem {
  id: string;
  name: string;
  url: string;
  category: 'banners' | 'products' | 'categories' | 'editorial';
  uploadedAt: string;
  size: string;
}

export interface CmsHeroBottomItem {
  id: string;
  name: string;
  kanji: string;
  price: string;
  image: string;
  color: string;
  badge: string;
}

export interface CmsStackCardItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

export interface CmsEditorialBanner {
  title: string;
  followersText: string;
  image: string;
  instagramUrl: string;
  ctaText: string;
}

export interface CmsAnnouncement {
  text: string;
  highlightText: string;
  ctaText: string;
  ctaLink: string;
  countdownDays: number;
}
