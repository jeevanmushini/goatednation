import { create } from 'zustand';
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
  deletedProductIds: string[];
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
  publishChanges: () => Promise<{ success: boolean; error?: string }>;
  resetToDefaults: () => Promise<{ success: boolean; error?: string }>;
  syncFromServer: (force?: boolean) => Promise<void>;
}

let serverSyncTimer: ReturnType<typeof setTimeout> | null = null;

function triggerServerSync(state: Partial<CmsState>, immediate = false): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return Promise.resolve({ success: false, error: 'SSR environment' });
  }

  if (serverSyncTimer) {
    clearTimeout(serverSyncTimer);
    serverSyncTimer = null;
  }

  const sendPayload = async (): Promise<{ success: boolean; error?: string }> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const match = document.cookie.match(/(?:^|;\s*)(?:auth_token|gn_auth_token)=([^;]+)/);
      const cookieToken = match ? decodeURIComponent(match[1]) : null;
      const inMemoryToken = (globalThis as unknown as { __AUTH_TOKEN__?: string }).__AUTH_TOKEN__;
      const token = inMemoryToken || cookieToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers,
        credentials: 'include',
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
          deletedProductIds: state.deletedProductIds || [],
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        console.warn('[CMS Sync] Server response error:', res.status, json?.error);
        return { success: false, error: json?.error || `HTTP ${res.status}` };
      }

      console.info('[CMS Sync] Successfully persisted CMS state to server:', json.storageTarget);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network sync failed';
      console.warn('[CMS Sync] Network error during server push:', msg);
      return { success: false, error: msg };
    }
  };

  if (immediate) {
    return sendPayload();
  } else {
    return new Promise((resolve) => {
      serverSyncTimer = setTimeout(async () => {
        const result = await sendPayload();
        resolve(result);
      }, 250);
    });
  }
}

let hasClientSyncedFromServer = false;

const createCmsStore = () =>
  create<CmsState>()((set, get) => ({
      heroSlides: INITIAL_HERO_SLIDES,
      categories: INITIAL_CATEGORIES,
      products: [],
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
      deletedProductIds: [],
      lastPublishedAt: '2026-11-06T12:00:00Z',
      isDraft: false,

      // Zenin Hero Bottoms Implementations
      updateHeroBottom: (id, item) => {
        const updated = get().heroBottoms.map((b) => (b.id === id ? { ...b, ...item } : b));
        set({
          heroBottoms: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), heroBottoms: updated }, true);
      },

      addHeroBottom: (item) => {
        const newItem: CmsHeroBottomItem = {
          ...item,
          id: `b-${Date.now()}`,
        };
        const updated = [...get().heroBottoms, newItem];
        set({ heroBottoms: updated, isDraft: true });
        triggerServerSync({ ...get(), heroBottoms: updated }, true);
      },

      deleteHeroBottom: (id) => {
        const updated = get().heroBottoms.filter((b) => b.id !== id);
        set({
          heroBottoms: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), heroBottoms: updated }, true);
      },

      // Zenin 3D Stack Cards Implementations
      updateStackCard: (id, card) => {
        const updated = get().stackCards.map((c) => (c.id === id ? { ...c, ...card } : c));
        set({
          stackCards: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), stackCards: updated }, true);
      },

      addStackCard: (card) => {
        const newCard: CmsStackCardItem = {
          ...card,
          id: `s-${Date.now()}`,
        };
        const updated = [...get().stackCards, newCard];
        set({ stackCards: updated, isDraft: true });
        triggerServerSync({ ...get(), stackCards: updated }, true);
      },

      deleteStackCard: (id) => {
        const updated = get().stackCards.filter((c) => c.id !== id);
        set({
          stackCards: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), stackCards: updated }, true);
      },

      // Editorial Banner & Announcement Implementations
      updateEditorialBanner: (banner) => {
        const updated = { ...get().editorialBanner, ...banner };
        set({
          editorialBanner: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), editorialBanner: updated }, true);
      },

      updateAnnouncement: (announcement) => {
        const updated = { ...get().announcement, ...announcement };
        set({
          announcement: updated,
          isDraft: true,
        });
        triggerServerSync({ ...get(), announcement: updated }, true);
      },

      updateHeroSlide: (id, slide) => {
        const updated = get().heroSlides.map((s) => (s.id === id ? { ...s, ...slide } : s));
        set({ heroSlides: updated, isDraft: true });
        triggerServerSync({ ...get(), heroSlides: updated }, true);
      },

      addHeroSlide: (slide) => {
        const newSlide: CmsHeroSlide = {
          ...slide,
          id: `hero-${Date.now()}`,
          order: get().heroSlides.length + 1,
        };
        const updated = [...get().heroSlides, newSlide];
        set({ heroSlides: updated, isDraft: true });
        triggerServerSync({ ...get(), heroSlides: updated }, true);
      },

      deleteHeroSlide: (id) => {
        const updated = get().heroSlides.filter((s) => s.id !== id);
        set({ heroSlides: updated, isDraft: true });
        triggerServerSync({ ...get(), heroSlides: updated }, true);
      },

      updateCategory: (id, cat) => {
        const updated = get().categories.map((c) => (c.id === id ? { ...c, ...cat } : c));
        set({ categories: updated, isDraft: true });
        triggerServerSync({ ...get(), categories: updated }, true);
      },

      addCategory: (cat) => {
        const newCat: CmsCategory = {
          ...cat,
          id: `cat-${Date.now()}`,
          order: get().categories.length + 1,
        };
        const updated = [...get().categories, newCat];
        set({ categories: updated, isDraft: true });
        triggerServerSync({ ...get(), categories: updated }, true);
      },

      deleteCategory: (id) => {
        const updated = get().categories.filter((c) => c.id !== id);
        set({ categories: updated, isDraft: true });
        triggerServerSync({ ...get(), categories: updated }, true);
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
        triggerServerSync({ ...get(), categories: reordered }, true);
      },

      addProduct: (product) => {
        const updated = [product, ...get().products];
        set({ products: updated, isDraft: true });
        triggerServerSync({ ...get(), products: updated }, true);
      },

      updateProduct: (id, product) => {
        const updated = get().products.map((p) => (p.id === id ? { ...p, ...product } : p));
        set({ products: updated, isDraft: true });
        triggerServerSync({ ...get(), products: updated }, true);
      },

      deleteProduct: (id) => {
        const updated = get().products.filter((p) => p.id !== id);
        const updatedDeleted = Array.from(new Set([...(get().deletedProductIds || []), id]));
        set({ products: updated, deletedProductIds: updatedDeleted, isDraft: true });
        triggerServerSync({ ...get(), products: updated, deletedProductIds: updatedDeleted }, true);
      },

      updateBanner: (id, banner) => {
        const updated = get().banners.map((b) => (b.id === id ? { ...b, ...banner } : b));
        set({ banners: updated, isDraft: true });
        triggerServerSync({ ...get(), banners: updated }, true);
      },

      addBanner: (banner) => {
        const newBanner: CmsBanner = {
          ...banner,
          id: `banner-${Date.now()}`,
          order: get().banners.length + 1,
        };
        const updated = [...get().banners, newBanner];
        set({ banners: updated, isDraft: true });
        triggerServerSync({ ...get(), banners: updated }, true);
      },

      deleteBanner: (id) => {
        const updated = get().banners.filter((b) => b.id !== id);
        set({ banners: updated, isDraft: true });
        triggerServerSync({ ...get(), banners: updated }, true);
      },

      updateBrandStory: (story) => {
        const updated = { ...get().brandStory, ...story };
        set({ brandStory: updated, isDraft: true });
        triggerServerSync({ ...get(), brandStory: updated }, true);
      },

      updateNewsletter: (newsletter) => {
        const updated = { ...get().newsletter, ...newsletter };
        set({ newsletter: updated, isDraft: true });
        triggerServerSync({ ...get(), newsletter: updated }, true);
      },

      updateSection: (id, sec) => {
        const updated = get().sections.map((s) => (s.id === id ? { ...s, ...sec } : s));
        set({ sections: updated, isDraft: true });
        triggerServerSync({ ...get(), sections: updated }, true);
      },

      toggleSection: (id) => {
        const updated = get().sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
        set({ sections: updated, isDraft: true });
        triggerServerSync({ ...get(), sections: updated }, true);
      },

      reorderSections: (newSections) => {
        set({ sections: newSections, isDraft: true });
        triggerServerSync({ ...get(), sections: newSections }, true);
      },

      updateSettings: (settings) => {
        const updated = { ...get().settings, ...settings };
        set({ settings: updated, isDraft: true });
        triggerServerSync({ ...get(), settings: updated }, true);
      },

      updateNavigation: (nav) => {
        set({ navigation: nav, isDraft: true });
        triggerServerSync({ ...get(), navigation: nav }, true);
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
        triggerServerSync({ ...get(), media: updatedMedia }, true);
      },

      deleteMedia: (id) => {
        const updatedMedia = get().media.filter((m) => m.id !== id);
        set({ media: updatedMedia, isDraft: true });
        triggerServerSync({ ...get(), media: updatedMedia }, true);
      },

      publishChanges: async () => {
        const publishedAt = new Date().toISOString();
        set({
          isDraft: false,
          lastPublishedAt: publishedAt,
        });
        return await triggerServerSync(
          {
            ...get(),
            isDraft: false,
            lastPublishedAt: publishedAt,
            deletedProductIds: get().deletedProductIds || [],
          },
          true
        );
      },

      resetToDefaults: async () => {
        const defaultState = {
          heroSlides: INITIAL_HERO_SLIDES,
          categories: INITIAL_CATEGORIES,
          products: get().products,
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
        return await triggerServerSync(defaultState, true);
      },

      syncFromServer: async (force = false) => {
        if (typeof window === 'undefined' || !window.location?.origin) return;
        if (!force && hasClientSyncedFromServer) return;

        try {
          const res = await fetch('/api/cms?t=' + Date.now(), { credentials: 'include', cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              hasClientSyncedFromServer = true;
              const serverData = json.data;
              const current = get();

              const deletedSet = new Set([
                ...(serverData.deletedProductIds || []),
                ...(current.deletedProductIds || []),
              ]);

              // Defensive product merge: ALWAYS preserve custom drops, but strictly EXCLUDE any deleted products
              const productMap = new Map<string, Product>();
              if (Array.isArray(serverData.products)) {
                for (const p of serverData.products) {
                  if (p?.id && !deletedSet.has(p.id)) {
                    productMap.set(p.id, p);
                  }
                }
              }
              // Also ensure any non-deleted custom drops in client memory are preserved
              if (Array.isArray(current.products)) {
                for (const p of current.products) {
                  if (p?.id && !deletedSet.has(p.id) && (!p.id.startsWith('zn-') || p.id.startsWith('as-'))) {
                    if (!productMap.has(p.id)) {
                      productMap.set(p.id, p);
                    }
                  }
                }
              }
              const customDrops: Product[] = [];
              const baseDrops: Product[] = [];
              for (const p of productMap.values()) {
                if (!deletedSet.has(p.id)) {
                  if (!p.id.startsWith('zn-') || p.id.startsWith('as-')) {
                    customDrops.push(p);
                  } else {
                    baseDrops.push(p);
                  }
                }
              }
              const serverProducts = productMap.size > 0 ? [...customDrops, ...baseDrops] : current.products.filter(p => !deletedSet.has(p.id));

              const serverHeroBottoms =
                Array.isArray(serverData.heroBottoms) && serverData.heroBottoms.length > 0
                  ? serverData.heroBottoms
                  : current.heroBottoms;

              // Check if server data actually differs from current state.
              // If identical, do NOT call set() to prevent spurious re-renders of the storefront.
              const isIdentical =
                JSON.stringify(current.products) === JSON.stringify(serverProducts) &&
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
                products: serverProducts,
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
                deletedProductIds: Array.from(deletedSet),
                lastPublishedAt: serverData.lastPublishedAt || prev.lastPublishedAt,
                isDraft: false,
              }));
            }
          }
        } catch (err) {
          console.warn('[CMS Store] Background sync with server skipped:', err);
        }
      },
    }));

type CmsStoreType = ReturnType<typeof createCmsStore>;

const globalForCms = globalThis as unknown as {
  __ANIMESTREET_CMS_STORE__?: CmsStoreType;
};

export const useCmsStore: CmsStoreType =
  globalForCms.__ANIMESTREET_CMS_STORE__ ?? createCmsStore();

globalForCms.__ANIMESTREET_CMS_STORE__ = useCmsStore;

if (typeof window !== 'undefined') {
  // Purge legacy CMS data and cached keys from localStorage so client strictly relies on Neon DB and Cloudinary
  try {
    localStorage.removeItem('animestreet-cms-data');
    localStorage.removeItem('goatednation_cms_v1');
    localStorage.removeItem('gn_auth_user');
    localStorage.removeItem('gn_auth_token');
    localStorage.removeItem('goatednation-cart-storage');
    localStorage.removeItem('goatednation-wishlist-storage');
  } catch {
    // ignore
  }

  (window as unknown as { __CMS_STORE__: CmsStoreType }).__CMS_STORE__ = useCmsStore;
  // Automatically sync with published server CMS state on device load
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function' && window.location?.origin) {
    setTimeout(() => {
      try {
        useCmsStore.getState().syncFromServer?.();
      } catch {
        // ignore
      }
    }, 50);

    window.addEventListener('cms-published', () => {
      try {
        useCmsStore.getState().syncFromServer?.(true);
      } catch {
        // ignore
      }
    });
  }
}


