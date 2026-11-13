import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
import { Product } from '../../types/product';
import { PRODUCTS } from '../../data/products';
import {
  INITIAL_HERO_SLIDES,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
  INITIAL_BRAND_STORY,
  INITIAL_NEWSLETTER,
  INITIAL_SECTIONS,
  INITIAL_SETTINGS,
  INITIAL_NAVIGATION,
  INITIAL_MEDIA,
  INITIAL_HERO_BOTTOMS,
  INITIAL_STACK_ITEMS,
  INITIAL_EDITORIAL_BANNER,
  INITIAL_ANNOUNCEMENT,
} from './initialCmsData';

interface CmsState {
  heroSlides: CmsHeroSlide[];
  categories: CmsCategory[];
  products: Product[];
  banners: CmsBanner[];
  brandStory: CmsBrandStory;
  newsletter: CmsNewsletter;
  sections: CmsSection[];
  settings: CmsSiteSettings;
  navigation: CmsNavigationItem[];
  media: CmsMediaItem[];
  heroBottoms: CmsHeroBottomItem[];
  stackCards: CmsStackCardItem[];
  editorialBanner: CmsEditorialBanner;
  announcement: CmsAnnouncement;
  lastPublishedAt: string;
  isDraft: boolean;

  // Zenin Hero Bottoms Actions
  updateHeroBottom: (id: string, item: Partial<CmsHeroBottomItem>) => void;
  addHeroBottom: (item: Omit<CmsHeroBottomItem, 'id'>) => void;
  deleteHeroBottom: (id: string) => void;

  // Zenin 3D Stack Cards Actions
  updateStackCard: (id: string, card: Partial<CmsStackCardItem>) => void;
  addStackCard: (card: Omit<CmsStackCardItem, 'id'>) => void;
  deleteStackCard: (id: string) => void;

  // Editorial Banner & Announcement Actions
  updateEditorialBanner: (banner: Partial<CmsEditorialBanner>) => void;
  updateAnnouncement: (announcement: Partial<CmsAnnouncement>) => void;

  // Hero Actions
  updateHeroSlide: (id: string, slide: Partial<CmsHeroSlide>) => void;
  addHeroSlide: (slide: Omit<CmsHeroSlide, 'id'>) => void;
  deleteHeroSlide: (id: string) => void;

  // Category Actions
  updateCategory: (id: string, cat: Partial<CmsCategory>) => void;
  addCategory: (cat: Omit<CmsCategory, 'id'>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;

  // Product Actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Banner Actions
  updateBanner: (id: string, banner: Partial<CmsBanner>) => void;
  addBanner: (banner: Omit<CmsBanner, 'id'>) => void;
  deleteBanner: (id: string) => void;

  // Brand Story & Newsletter Actions
  updateBrandStory: (story: Partial<CmsBrandStory>) => void;
  updateNewsletter: (newsletter: Partial<CmsNewsletter>) => void;

  // Section Ordering & Visibility Actions
  updateSection: (id: string, sec: Partial<CmsSection>) => void;
  toggleSection: (id: string) => void;
  reorderSections: (newSections: CmsSection[]) => void;

  // Navigation & Settings Actions
  updateSettings: (settings: Partial<CmsSiteSettings>) => void;
  updateNavigation: (nav: CmsNavigationItem[]) => void;

  // Media Library Actions
  addMedia: (media: Omit<CmsMediaItem, 'id' | 'uploadedAt'>) => void;
  deleteMedia: (id: string) => void;

  // Publishing & Reset
  publishChanges: () => void;
  resetToDefaults: () => void;
}

const createCmsStore = () =>
  create<CmsState>()(
    persist(
      (set, get) => ({
      heroSlides: INITIAL_HERO_SLIDES,
      categories: INITIAL_CATEGORIES,
      products: PRODUCTS,
      banners: INITIAL_BANNERS,
      brandStory: INITIAL_BRAND_STORY,
      newsletter: INITIAL_NEWSLETTER,
      sections: INITIAL_SECTIONS,
      settings: INITIAL_SETTINGS,
      navigation: INITIAL_NAVIGATION,
      media: INITIAL_MEDIA,
      heroBottoms: INITIAL_HERO_BOTTOMS,
      stackCards: INITIAL_STACK_ITEMS,
      editorialBanner: INITIAL_EDITORIAL_BANNER,
      announcement: INITIAL_ANNOUNCEMENT,
      lastPublishedAt: '2026-11-06T12:00:00Z',
      isDraft: false,

      // Zenin Hero Bottoms Implementations
      updateHeroBottom: (id, item) => {
        set({
          heroBottoms: get().heroBottoms.map((b) => (b.id === id ? { ...b, ...item } : b)),
          isDraft: true,
        });
      },

      addHeroBottom: (item) => {
        const newItem: CmsHeroBottomItem = {
          ...item,
          id: `b-${Date.now()}`,
        };
        set({ heroBottoms: [...get().heroBottoms, newItem], isDraft: true });
      },

      deleteHeroBottom: (id) => {
        set({
          heroBottoms: get().heroBottoms.filter((b) => b.id !== id),
          isDraft: true,
        });
      },

      // Zenin 3D Stack Cards Implementations
      updateStackCard: (id, card) => {
        set({
          stackCards: get().stackCards.map((c) => (c.id === id ? { ...c, ...card } : c)),
          isDraft: true,
        });
      },

      addStackCard: (card) => {
        const newCard: CmsStackCardItem = {
          ...card,
          id: `s-${Date.now()}`,
        };
        set({ stackCards: [...get().stackCards, newCard], isDraft: true });
      },

      deleteStackCard: (id) => {
        set({
          stackCards: get().stackCards.filter((c) => c.id !== id),
          isDraft: true,
        });
      },

      // Editorial Banner & Announcement Implementations
      updateEditorialBanner: (banner) => {
        set({
          editorialBanner: { ...get().editorialBanner, ...banner },
          isDraft: true,
        });
      },

      updateAnnouncement: (announcement) => {
        set({
          announcement: { ...get().announcement, ...announcement },
          isDraft: true,
        });
      },

      updateHeroSlide: (id, slide) => {
        set({
          heroSlides: get().heroSlides.map((s) => (s.id === id ? { ...s, ...slide } : s)),
          isDraft: true,
        });
      },

      addHeroSlide: (slide) => {
        const newSlide: CmsHeroSlide = {
          ...slide,
          id: `hero-${Date.now()}`,
          order: get().heroSlides.length + 1,
        };
        set({ heroSlides: [...get().heroSlides, newSlide], isDraft: true });
      },

      deleteHeroSlide: (id) => {
        set({
          heroSlides: get().heroSlides.filter((s) => s.id !== id),
          isDraft: true,
        });
      },

      updateCategory: (id, cat) => {
        set({
          categories: get().categories.map((c) => (c.id === id ? { ...c, ...cat } : c)),
          isDraft: true,
        });
      },

      addCategory: (cat) => {
        const newCat: CmsCategory = {
          ...cat,
          id: `cat-${Date.now()}`,
          order: get().categories.length + 1,
        };
        set({ categories: [...get().categories, newCat], isDraft: true });
      },

      deleteCategory: (id) => {
        set({
          categories: get().categories.filter((c) => c.id !== id),
          isDraft: true,
        });
      },

      reorderCategories: (orderedIds) => {
        const map = new Map(get().categories.map((c) => [c.id, c]));
        const reordered = orderedIds
          .map((id, index) => {
            const item = map.get(id);
            return item ? { ...item, order: index + 1 } : null;
          })
          .filter(Boolean) as CmsCategory[];
        set({ categories: reordered, isDraft: true });
      },

      addProduct: (product) => {
        set({ products: [product, ...get().products], isDraft: true });
      },

      updateProduct: (id, product) => {
        set({
          products: get().products.map((p) => (p.id === id ? { ...p, ...product } : p)),
          isDraft: true,
        });
      },

      deleteProduct: (id) => {
        set({
          products: get().products.filter((p) => p.id !== id),
          isDraft: true,
        });
      },

      updateBanner: (id, banner) => {
        set({
          banners: get().banners.map((b) => (b.id === id ? { ...b, ...banner } : b)),
          isDraft: true,
        });
      },

      addBanner: (banner) => {
        const newBanner: CmsBanner = {
          ...banner,
          id: `banner-${Date.now()}`,
          order: get().banners.length + 1,
        };
        set({ banners: [...get().banners, newBanner], isDraft: true });
      },

      deleteBanner: (id) => {
        set({
          banners: get().banners.filter((b) => b.id !== id),
          isDraft: true,
        });
      },

      updateBrandStory: (story) => {
        set({
          brandStory: { ...get().brandStory, ...story },
          isDraft: true,
        });
      },

      updateNewsletter: (newsletter) => {
        set({
          newsletter: { ...get().newsletter, ...newsletter },
          isDraft: true,
        });
      },

      updateSection: (id, sec) => {
        set({
          sections: get().sections.map((s) => (s.id === id ? { ...s, ...sec } : s)),
          isDraft: true,
        });
      },

      toggleSection: (id) => {
        set({
          sections: get().sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
          isDraft: true,
        });
      },

      reorderSections: (newSections) => {
        set({ sections: newSections, isDraft: true });
      },

      updateSettings: (settings) => {
        set({
          settings: { ...get().settings, ...settings },
          isDraft: true,
        });
      },

      updateNavigation: (nav) => {
        set({ navigation: nav, isDraft: true });
      },

      addMedia: (media) => {
        const newMedia: CmsMediaItem = {
          ...media,
          id: `med-${Date.now()}`,
          uploadedAt: new Date().toISOString().split('T')[0],
        };
        set({ media: [newMedia, ...get().media], isDraft: true });
      },

      deleteMedia: (id) => {
        set({ media: get().media.filter((m) => m.id !== id), isDraft: true });
      },

      publishChanges: () => {
        set({
          isDraft: false,
          lastPublishedAt: new Date().toISOString(),
        });
      },

      resetToDefaults: () => {
        set({
          heroSlides: INITIAL_HERO_SLIDES,
          categories: INITIAL_CATEGORIES,
          products: PRODUCTS,
          banners: INITIAL_BANNERS,
          brandStory: INITIAL_BRAND_STORY,
          newsletter: INITIAL_NEWSLETTER,
          sections: INITIAL_SECTIONS,
          settings: INITIAL_SETTINGS,
          navigation: INITIAL_NAVIGATION,
          media: INITIAL_MEDIA,
          heroBottoms: INITIAL_HERO_BOTTOMS,
          stackCards: INITIAL_STACK_ITEMS,
          editorialBanner: INITIAL_EDITORIAL_BANNER,
          announcement: INITIAL_ANNOUNCEMENT,
          isDraft: false,
          lastPublishedAt: new Date().toISOString(),
        });
      },
    }),
    {
      name: 'animestreet-cms-data',
      version: 3,
      migrate: (persistedState: unknown) => {
        const state = persistedState as CmsState;
        if (state?.settings) {
          if (!state.settings.brandName || state.settings.brandName === 'ANIMESTREET') {
            state.settings.brandName = 'GOATED NATION';
            state.settings.logoSubtext = 'GOATED NATION // TOKYO • MUMBAI';
            state.settings.supportEmail = 'support@goatednation.in';
            state.settings.address = 'GOATED NATION Hub, Harajuku Road, Mumbai, Maharashtra 400050';
          }
        }
        if (!state?.heroBottoms || state.heroBottoms.length === 0) {
          state.heroBottoms = INITIAL_HERO_BOTTOMS;
        }
        if (!state?.stackCards || state.stackCards.length === 0) {
          state.stackCards = INITIAL_STACK_ITEMS;
        }
        if (!state?.editorialBanner) {
          state.editorialBanner = INITIAL_EDITORIAL_BANNER;
        }
        if (!state?.announcement) {
          state.announcement = INITIAL_ANNOUNCEMENT;
        }
        return state;
      },
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);

type CmsStoreType = ReturnType<typeof createCmsStore>;

const globalForCms = globalThis as unknown as {
  __ANIMESTREET_CMS_STORE__?: CmsStoreType;
};

export const useCmsStore: CmsStoreType =
  globalForCms.__ANIMESTREET_CMS_STORE__ ?? createCmsStore();

globalForCms.__ANIMESTREET_CMS_STORE__ = useCmsStore;

if (typeof window !== 'undefined') {
  (window as unknown as { __CMS_STORE__: CmsStoreType }).__CMS_STORE__ = useCmsStore;
}


