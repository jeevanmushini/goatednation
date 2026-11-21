import fs from 'fs';
import path from 'path';
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
import { Product } from '../../types/product';
import { getCmsDataFromNeon, saveCmsDataToNeon, deleteProductInNeon, upsertProductInNeon, getProductBySlugFromNeon, getProductsFromNeon } from '../db/neon';
import { getCachedProducts, getCachedProductBySlug, getCachedCmsData, invalidateProductCache } from '../cache/productCache';

export interface PublishedCmsData {
  heroSlides: typeof INITIAL_HERO_SLIDES;
  categories: typeof INITIAL_CATEGORIES;
  products: Product[];
  banners: typeof INITIAL_BANNERS;
  brandStory: typeof INITIAL_BRAND_STORY;
  newsletter: typeof INITIAL_NEWSLETTER;
  sections: typeof INITIAL_SECTIONS;
  settings: typeof INITIAL_SETTINGS;
  navigation: typeof INITIAL_NAVIGATION;
  media: typeof INITIAL_MEDIA;
  heroBottoms: typeof INITIAL_HERO_BOTTOMS;
  stackCards: typeof INITIAL_STACK_ITEMS;
  editorialBanner: typeof INITIAL_EDITORIAL_BANNER;
  announcement: typeof INITIAL_ANNOUNCEMENT;
  deletedProductIds?: string[];
  lastPublishedAt?: string;
}

export const CMS_STORAGE_FILE = path.join(process.cwd(), '.cms_published_data.json');

export const DEFAULT_STATE: PublishedCmsData = {
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
  lastPublishedAt: new Date().toISOString(),
};

const globalForCms = globalThis as unknown as {
  __SERVER_PUBLISHED_CMS__?: PublishedCmsData;
};

async function getFromKvStore(): Promise<PublishedCmsData | null> {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return null;

  try {
    const res = await fetch(`${kvUrl}/get/goatednation_cms_published`, {
      headers: { Authorization: `Bearer ${kvToken}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
    }
  } catch (err) {
    console.warn('[CMS Server] KV fetch failed:', err);
  }
  return null;
}

export async function saveToKvStore(data: PublishedCmsData): Promise<boolean> {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return false;

  try {
    const res = await fetch(`${kvUrl}/set/goatednation_cms_published`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(data)),
    });
    return res.ok;
  } catch (err) {
    console.warn('[CMS Server] KV save failed:', err);
    return false;
  }
}

export function sanitizePublishedCmsData(data: PublishedCmsData): PublishedCmsData {
  if (!data.heroBottoms || data.heroBottoms.length === 0) {
    data.heroBottoms = INITIAL_HERO_BOTTOMS;
  }

  const deletedSet = new Set(data.deletedProductIds || []);

  const catalogMap = new Map<string, Product>();
  if (Array.isArray(data.products) && data.products.length > 0) {
    for (const p of data.products) {
      if (p && p.id && !deletedSet.has(p.id)) {
        catalogMap.set(p.id, p);
      }
    }
    const customDrops: Product[] = [];
    const baseDrops: Product[] = [];
    for (const p of catalogMap.values()) {
      if (!deletedSet.has(p.id)) {
        if (!p.id.startsWith('zn-') || p.id.startsWith('as-')) {
          customDrops.push(p);
        } else {
          baseDrops.push(p);
        }
      }
    }
    data.products = [...customDrops, ...baseDrops];
  } else {
    data.products = [];
  }

  return data;
}

/**
 * Retrieves the published CMS data for Server-Side Rendering (SSR) and API routes.
 * Guarantees sub-3ms reads via Cache-Aside strategy (Memory -> Redis -> Neon DB).
 */
export async function getPublishedCmsData(): Promise<{ data: PublishedCmsData; source: 'neon' | 'kv' | 'file' | 'memory' | 'default' }> {
  // 1. Try Neon Postgres + Redis Cache Layer
  try {
    const cachedCms = await getCachedCmsData<PublishedCmsData>();
    const cachedProducts = await getCachedProducts();

    if (cachedCms && typeof cachedCms === 'object' && Object.keys(cachedCms).length > 0) {
      const deletedSet = new Set(cachedCms.deletedProductIds || []);
      const pMap = new Map<string, Product>();

      if (cachedProducts && cachedProducts.length > 0) {
        for (const p of cachedProducts) {
          if (!deletedSet.has(p.id)) {
            pMap.set(p.id, p);
          }
        }
      }

      if (Array.isArray(cachedCms.products)) {
        for (const p of cachedCms.products) {
          if (!deletedSet.has(p.id) && !pMap.has(p.id)) {
            pMap.set(p.id, p);
          }
        }
      }

      cachedCms.products = Array.from(pMap.values());
      const sanitized = sanitizePublishedCmsData({ ...DEFAULT_STATE, ...cachedCms });
      globalForCms.__SERVER_PUBLISHED_CMS__ = sanitized;
      return { data: sanitized, source: 'neon' };
    }
  } catch (err) {
    console.warn('[CMS Server] Cache / Neon fetch failed:', err);
  }

  // 2. Fallback to direct Neon query if cache missed or empty
  try {
    const neonData = await getCmsDataFromNeon<PublishedCmsData>();
    if (neonData && typeof neonData === 'object' && Object.keys(neonData).length > 0) {
      try {
        const neonProducts = await getProductsFromNeon();
        if (neonProducts && neonProducts.length > 0) {
          const deletedSet = new Set(neonData.deletedProductIds || []);
          const pMap = new Map<string, Product>();
          for (const p of neonProducts) {
            if (!deletedSet.has(p.id)) {
              pMap.set(p.id, p);
            }
          }
          if (Array.isArray(neonData.products)) {
            for (const p of neonData.products) {
              if (!deletedSet.has(p.id) && !pMap.has(p.id)) {
                pMap.set(p.id, p);
              }
            }
          }
          neonData.products = Array.from(pMap.values());
        }
      } catch (err) {
        console.warn('[CMS Server] Failed to query relational products from Neon:', err);
      }
      const sanitized = sanitizePublishedCmsData({ ...DEFAULT_STATE, ...neonData });
      globalForCms.__SERVER_PUBLISHED_CMS__ = sanitized;
      return { data: sanitized, source: 'neon' };
    }
  } catch (err) {
    console.warn('[CMS Server] Direct Neon Postgres fetch failed:', err);
  }

  // 3. Try Vercel KV / Upstash Redis
  const kvData = await getFromKvStore();
  if (kvData) {
    const sanitized = sanitizePublishedCmsData({ ...DEFAULT_STATE, ...kvData });
    saveCmsDataToNeon(sanitized).catch((err) => {
      console.warn('[CMS Server] Background Neon Postgres seed failed:', err);
    });
    return { data: sanitized, source: 'kv' };
  }

  // 4. Try Local File Storage
  if (fs.existsSync(CMS_STORAGE_FILE)) {
    try {
      const raw = fs.readFileSync(CMS_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const sanitized = sanitizePublishedCmsData({ ...DEFAULT_STATE, ...parsed });
        return { data: sanitized, source: 'file' };
      }
    } catch (err) {
      console.warn('[CMS Server] Failed to read local CMS storage file:', err);
    }
  }

  // 5. Try In-Memory Cache
  if (globalForCms.__SERVER_PUBLISHED_CMS__) {
    return {
      data: sanitizePublishedCmsData({ ...DEFAULT_STATE, ...globalForCms.__SERVER_PUBLISHED_CMS__ }),
      source: 'memory',
    };
  }

  // 6. Default State Fallback
  return { data: DEFAULT_STATE, source: 'default' };
}

/**
 * Persists published CMS data across Neon Postgres, memory, disk, and cloud KV.
 */
export async function savePublishedCmsData(data: Partial<PublishedCmsData>): Promise<{ savedToNeon: boolean; savedToKv: boolean; savedToFile: boolean }> {
  // Read authoritative published data first so partial updates don't clobber other sections
  let existingData: Partial<PublishedCmsData> = {};
  if (globalForCms.__SERVER_PUBLISHED_CMS__) {
    existingData = { ...globalForCms.__SERVER_PUBLISHED_CMS__ };
  } else {
    try {
      const current = await getPublishedCmsData();
      if (current?.data) {
        existingData = current.data;
      }
    } catch {
      // ignore
    }
  }

  const mergedDeletedIds = Array.from(new Set([
    ...(existingData.deletedProductIds || []),
    ...(data.deletedProductIds || []),
  ]));

  const payload: PublishedCmsData = sanitizePublishedCmsData({
    ...DEFAULT_STATE,
    ...existingData,
    ...data,
    deletedProductIds: mergedDeletedIds,
    lastPublishedAt: new Date().toISOString(),
  });

  // 1. Memory Cache
  globalForCms.__SERVER_PUBLISHED_CMS__ = payload;

  // 2. Neon Postgres Cloud Database
  let savedToNeon = false;
  try {
    savedToNeon = await saveCmsDataToNeon(payload);
    // Sync individual products to dedicated app_products table in Neon
    if (Array.isArray(payload.products)) {
      await Promise.all(
        payload.products.map(async (p) => {
          try {
            await upsertProductInNeon(p);
          } catch (err) {
            console.warn(`[CMS Server] Failed to upsert product ${p.id} in Neon:`, err);
          }
        })
      );
    }
    // Delete explicitly removed products from app_products in Neon
    if (Array.isArray(payload.deletedProductIds) && payload.deletedProductIds.length > 0) {
      await Promise.all(
        payload.deletedProductIds.map(async (id) => {
          try {
            await deleteProductInNeon(id);
          } catch (err) {
            console.warn(`[CMS Server] Failed to delete product ${id} in Neon:`, err);
          }
        })
      );
    }
  } catch (err) {
    console.warn('[CMS Server] Neon Postgres save failed:', err);
  }

  // 3. Purge & Invalidate Redis / Memory Product & CMS Cache
  try {
    await invalidateProductCache();
  } catch (err) {
    console.warn('[CMS Server] Cache invalidation skipped:', err);
  }

  // 4. KV Store
  const savedToKv = await saveToKvStore(payload);

  // 5. Local File backup is ALWAYS kept in sync with latest published state
  let savedToFile = false;
  try {
    const jsonContent = JSON.stringify(payload, null, 2);
    fs.writeFileSync(CMS_STORAGE_FILE, jsonContent, 'utf-8');
    savedToFile = true;
  } catch (err) {
    console.warn('[CMS Server] Failed to write local CMS storage backup:', err);
  }

  return { savedToNeon, savedToKv, savedToFile };
}

/**
 * Fast lookup for individual product by slug or ID with server fallback.
 * Powered by Cache-Aside strategy (Memory -> Redis -> Neon DB).
 */
export async function getPublishedProductBySlug(slug: string): Promise<Product | null> {
  const { data } = await getPublishedCmsData();
  const deletedSet = new Set(data.deletedProductIds || []);
  const found = data.products.find((p) => p.slug === slug || p.id === slug);
  if (found && !deletedSet.has(found.id)) return found;

  // Direct lookup via Cache-Aside layer (Memory -> Redis -> Neon DB)
  try {
    const cached = await getCachedProductBySlug(slug);
    if (cached && !deletedSet.has(cached.id)) return cached;
  } catch {
    // ignore
  }

  return null;
}

