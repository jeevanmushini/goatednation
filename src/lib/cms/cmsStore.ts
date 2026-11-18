import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
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
  syncFromServer: () => Promise<void>;
}

const memoryFallbackMap = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(name) ?? memoryFallbackMap.get(name) ?? null;
    } catch {
      return memoryFallbackMap.get(name) ?? null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
      memoryFallbackMap.delete(name);
    } catch (err) {
      console.warn('[CMS Storage] LocalStorage quota exceeded. Engaging auto-recovery...', err);

      // Attempt 1: Clear non-essential auxiliary keys from localStorage
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < (localStorage.length || 0); i++) {
          const k = localStorage.key(i);
          if (
            k &&
            k !== name &&
            !k.toLowerCase().includes('token') &&
            !k.toLowerCase().includes('auth') &&
            !k.toLowerCase().includes('session')
          ) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(name, value);
        console.info('[CMS Storage] Successfully saved after clearing auxiliary browser cache.');
        return;
      } catch {
        // Still exceeding quota
      }

      // Attempt 2: Prune heavy base64 data URLs from media list
      try {
        const parsed = JSON.parse(value);
        if (parsed?.state) {
          if (Array.isArray(parsed.state.media)) {
            parsed.state.media = parsed.state.media
              .filter(
                (m: Partial<CmsMediaItem>) =>
                  !m?.url?.startsWith('data:') || (m.url?.length ?? 0) < 40000
              )
              .slice(0, 15);
          }
          const prunedValue = JSON.stringify(parsed);
          localStorage.setItem(name, prunedValue);
          console.info('[CMS Storage] Successfully saved after pruning legacy media data URLs.');
          return;
        }
      } catch {
        // Still exceeding quota
      }

      // Attempt 3: In-memory fallback to guarantee the UI never crashes
      memoryFallbackMap.set(name, value);
      console.warn(
        '[CMS Storage] Browser storage quota (5MB) reached. Changes held safely in session memory.'
      );
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
    memoryFallbackMap.delete(name);
  },
};

let serverSyncTimer: ReturnType<typeof setTimeout> | null = null;

function triggerServerSync(state: Partial<CmsState>, immediate = false) {
  if (typeof window === 'undefined' || !window.location?.origin) return;

  if (serverSyncTimer) {
    clearTimeout(serverSyncTimer);
    serverSyncTimer = null;
  }

  const sendPayload = () => {
    fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heroSlides: state.heroSlides,
        categories: state.categories,
        products: state.products,
        banners: state.banners,
        brandStory: state.brandStory,
        newsletter: state.newsletter,
        sections: state.sections,
        settings: state.settings,
        navigation: state.navigation,
        media: state.media,
        heroBottoms: state.heroBottoms,
        stackCards: state.stackCards,
        editorialBanner: state.editorialBanner,
        announcement: state.announcement,
      }),
    }).catch(() => {});
  };

  if (immediate) {
    sendPayload();
  } else {
    serverSyncTimer = setTimeout(sendPayload, 250);
  }
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
        const updated = get().heroBottoms.map((b) => (b.id === id ? { ...b, ...item } : b));
        set({
          heroBottoms: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), heroBottoms: updated });
      },

      addHeroBottom: (item) => {
        const newItem: CmsHeroBottomItem = {
          ...item,
          id: `b-${Date.now()}`,
        };
        const updated = [...get().heroBottoms, newItem];
        set({ heroBottoms: updated, isDraft: true });
        triggerServerSync({ ...get(), heroBottoms: updated });
      },

      deleteHeroBottom: (id) => {
        const updated = get().heroBottoms.filter((b) => b.id !== id);
        set({
          heroBottoms: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), heroBottoms: updated });
      },

      // Zenin 3D Stack Cards Implementations
      updateStackCard: (id, card) => {
        const updated = get().stackCards.map((c) => (c.id === id ? { ...c, ...card } : c));
        set({
          stackCards: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), stackCards: updated });
      },

      addStackCard: (card) => {
        const newCard: CmsStackCardItem = {
          ...card,
          id: `s-${Date.now()}`,
        };
        const updated = [...get().stackCards, newCard];
        set({ stackCards: updated, isDraft: true });
        triggerServerSync({ ...get(), stackCards: updated });
      },

      deleteStackCard: (id) => {
        const updated = get().stackCards.filter((c) => c.id !== id);
        set({
          stackCards: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), stackCards: updated });
      },

      // Editorial Banner & Announcement Implementations
      updateEditorialBanner: (banner) => {
        const updated = { ...get().editorialBanner, ...banner };
        set({
          editorialBanner: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), editorialBanner: updated });
      },

      updateAnnouncement: (announcement) => {
        const updated = { ...get().announcement, ...announcement };
        set({
          announcement: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), announcement: updated });
      },

      updateHeroSlide: (id, slide) => {
        const updated = get().heroSlides.map((s) => (s.id === id ? { ...s, ...slide } : s));
        set({ heroSlides: updated, isDraft: true });
        triggerServerSync({ ...get(), heroSlides: updated });
      },

      addHeroSlide: (slide) => {
        const newSlide: CmsHeroSlide = {
          ...slide,
          id: `hero-${Date.now()}`,
          order: get().heroSlides.length + 1,
        };
        const updated = [...get().heroSlides, newSlide];
        set({ heroSlides: updated, isDraft: true });
        triggerServerSync({ ...get(), heroSlides: updated });
      },

      deleteHeroSlide: (id) => {
        const updated = get().heroSlides.filter((s) => s.id !== id);
        set({ heroSlides: updated, isDraft: true });
        triggerServerSync({ ...get(), heroSlides: updated });
      },

      updateCategory: (id, cat) => {
        const updated = get().categories.map((c) => (c.id === id ? { ...c, ...cat } : c));
        set({ categories: updated, isDraft: true });
        triggerServerSync({ ...get(), categories: updated });
      },

      addCategory: (cat) => {
        const newCat: CmsCategory = {
          ...cat,
          id: `cat-${Date.now()}`,
          order: get().categories.length + 1,
        };
        const updated = [...get().categories, newCat];
        set({ categories: updated, isDraft: true });
        triggerServerSync({ ...get(), categories: updated });
      },

      deleteCategory: (id) => {
        const updated = get().categories.filter((c) => c.id !== id);
        set({ categories: updated, isDraft: true });
        triggerServerSync({ ...get(), categories: updated });
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
        triggerServerSync({ ...get(), categories: reordered });
      },

      addProduct: (product) => {
        const updated = [product, ...get().products];
        set({ products: updated, isDraft: true });
        triggerServerSync({ ...get(), products: updated });
      },

      updateProduct: (id, product) => {
        const updated = get().products.map((p) => (p.id === id ? { ...p, ...product } : p));
        set({ products: updated, isDraft: true });
        triggerServerSync({ ...get(), products: updated });
      },

      deleteProduct: (id) => {
        const updated = get().products.filter((p) => p.id !== id);
        set({ products: updated, isDraft: true });
        triggerServerSync({ ...get(), products: updated });
      },

      updateBanner: (id, banner) => {
        const updated = get().banners.map((b) => (b.id === id ? { ...b, ...banner } : b));
        set({ banners: updated, isDraft: true });
        triggerServerSync({ ...get(), banners: updated });
      },

      addBanner: (banner) => {
        const newBanner: CmsBanner = {
          ...banner,
          id: `banner-${Date.now()}`,
          order: get().banners.length + 1,
        };
        const updated = [...get().banners, newBanner];
        set({ banners: updated, isDraft: true });
        triggerServerSync({ ...get(), banners: updated });
      },

      deleteBanner: (id) => {
        const updated = get().banners.filter((b) => b.id !== id);
        set({ banners: updated, isDraft: true });
        triggerServerSync({ ...get(), banners: updated });
      },

      updateBrandStory: (story) => {
        const updated = { ...get().brandStory, ...story };
        set({ brandStory: updated, isDraft: true });
        triggerServerSync({ ...get(), brandStory: updated });
      },

      updateNewsletter: (newsletter) => {
        const updated = { ...get().newsletter, ...newsletter };
        set({ newsletter: updated, isDraft: true });
        triggerServerSync({ ...get(), newsletter: updated });
      },

      updateSection: (id, sec) => {
        const updated = get().sections.map((s) => (s.id === id ? { ...s, ...sec } : s));
        set({ sections: updated, isDraft: true });
        triggerServerSync({ ...get(), sections: updated });
      },

      toggleSection: (id) => {
        const updated = get().sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
        set({ sections: updated, isDraft: true });
        triggerServerSync({ ...get(), sections: updated });
      },

      reorderSections: (newSections) => {
        set({ sections: newSections, isDraft: true });
        triggerServerSync({ ...get(), sections: newSections });
      },

      updateSettings: (settings) => {
        const updated = { ...get().settings, ...settings };
        set({ settings: updated, isDraft: true });
        triggerServerSync({ ...get(), settings: updated });
      },

      updateNavigation: (nav) => {
        set({ navigation: nav, isDraft: true });
        triggerServerSync({ ...get(), navigation: nav });
      },

      addMedia: (media) => {
        // Prevent duplicate media URLs
        const existing = get().media.find((m) => m.url === media.url);
        if (existing) return;

        const newMedia: CmsMediaItem = {
          ...media,
          id: `med-${Date.now()}`,
          uploadedAt: new Date().toISOString().split('T')[0],
        };
        // Keep media gallery bounded to 30 items so it doesn't exhaust localStorage quota
        const updatedMedia = [newMedia, ...get().media].slice(0, 30);
        set({ media: updatedMedia, isDraft: true });
      },

      deleteMedia: (id) => {
        set({ media: get().media.filter((m) => m.id !== id), isDraft: true });
      },

      publishChanges: () => {
        const publishedAt = new Date().toISOString();
        set({
          isDraft: false,
          lastPublishedAt: publishedAt,
        });
        triggerServerSync({ ...get(), isDraft: false, lastPublishedAt: publishedAt }, true);
      },

      resetToDefaults: () => {
        const defaultState = {
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
        };
        set(defaultState);
        triggerServerSync(defaultState, true);
      },

      syncFromServer: async () => {
        if (typeof window === 'undefined' || !window.location?.origin) return;
        try {
          const res = await fetch('/api/cms', { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              const serverData = json.data;

              const serverHeroBottoms =
                Array.isArray(serverData.heroBottoms) && serverData.heroBottoms.length > 0
                  ? serverData.heroBottoms
                  : get().heroBottoms;

              // Check if server data actually differs from current state.
              // If identical, do NOT call set() to prevent spurious re-renders of the storefront.
              const current = get();
              const isIdentical =
                JSON.stringify(current.heroBottoms) === JSON.stringify(serverHeroBottoms) &&
                JSON.stringify(current.stackCards) === JSON.stringify(serverData.stackCards || current.stackCards) &&
                JSON.stringify(current.editorialBanner) === JSON.stringify(serverData.editorialBanner || current.editorialBanner) &&
                JSON.stringify(current.announcement) === JSON.stringify(serverData.announcement || current.announcement) &&
                JSON.stringify(current.settings) === JSON.stringify(serverData.settings || current.settings);

              if (isIdentical) return;

              set((prev) => ({
                ...prev,
                heroSlides: serverData.heroSlides || prev.heroSlides,
                categories: serverData.categories || prev.categories,
                products: serverData.products || prev.products,
                banners: serverData.banners || prev.banners,
                brandStory: serverData.brandStory || prev.brandStory,
                newsletter: serverData.newsletter || prev.newsletter,
                sections: serverData.sections || prev.sections,
                settings: serverData.settings || prev.settings,
                navigation: serverData.navigation || prev.navigation,
                media: serverData.media || prev.media,
                heroBottoms: serverHeroBottoms,
                stackCards: serverData.stackCards || prev.stackCards,
                editorialBanner: serverData.editorialBanner || prev.editorialBanner,
                announcement: serverData.announcement || prev.announcement,
                lastPublishedAt: serverData.lastPublishedAt || prev.lastPublishedAt,
                isDraft: false,
              }));
            }
          }
        } catch (err) {
          console.warn('[CMS Store] Background sync with server skipped:', err);
        }
      },
    }),
    {
      name: 'animestreet-cms-data',
      version: 6,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as CmsState;
        if (!state) return state;

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

        // Version 6 Migration: Purge any legacy track pants, dead links, or test data
        if (version < 6) {
          state.heroBottoms = INITIAL_HERO_BOTTOMS;
          state.stackCards = INITIAL_STACK_ITEMS;
          state.editorialBanner = INITIAL_EDITORIAL_BANNER;
          state.announcement = INITIAL_ANNOUNCEMENT;
        }

        return state;
      },
      storage: createJSONStorage(() => safeStorage),
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
  // Automatically sync with published server CMS state on device load
  if (window.location?.origin) {
    setTimeout(() => {
      try {
        useCmsStore.getState().syncFromServer?.();
      } catch {
        // ignore
      }
    }, 50);
  }
}


