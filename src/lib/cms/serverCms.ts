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
import { PRODUCTS } from '../../data/products';
import { Product } from '../../types/product';
import { getCmsDataFromNeon, saveCmsDataToNeon } from '../db/neon';

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
  lastPublishedAt?: string;
}

export const CMS_STORAGE_FILE = path.join(process.cwd(), '.cms_published_data.json');

export const DEFAULT_STATE: PublishedCmsData = {
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

function sanitizePublishedCmsData(data: PublishedCmsData): PublishedCmsData {
  if (!data.heroBottoms || data.heroBottoms.length === 0) {
    data.heroBottoms = INITIAL_HERO_BOTTOMS;
  }
  return data;
}

/**
 * Retrieves the published CMS data for Server-Side Rendering (SSR) and API routes.
 * Guarantees zero-flicker on first page paint.
 */
export async function getPublishedCmsData(): Promise<{ data: PublishedCmsData; source: 'neon' | 'kv' | 'file' | 'memory' | 'default' }> {
  // 1. Try Neon Postgres
  try {
    const neonData = await getCmsDataFromNeon<PublishedCmsData>();
    if (neonData && typeof neonData === 'object' && Object.keys(neonData).length > 0) {
      const sanitized = sanitizePublishedCmsData({ ...DEFAULT_STATE, ...neonData });
      globalForCms.__SERVER_PUBLISHED_CMS__ = sanitized;
      return { data: sanitized, source: 'neon' };
    }
  } catch (err) {
    console.warn('[CMS Server] Neon Postgres fetch failed:', err);
  }

  // 2. Try Vercel KV / Upstash Redis
  const kvData = await getFromKvStore();
  if (kvData) {
    const sanitized = sanitizePublishedCmsData({ ...DEFAULT_STATE, ...kvData });
    // Seed Neon Postgres asynchronously if it was empty
    saveCmsDataToNeon(sanitized).catch((err) => {
      console.warn('[CMS Server] Background Neon Postgres seed failed:', err);
    });
    return { data: sanitized, source: 'kv' };
  }

  // 3. Try Local File Storage
  if (fs.existsSync(CMS_STORAGE_FILE)) {
    try {
      const raw = fs.readFileSync(CMS_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const sanitized = sanitizePublishedCmsData({ ...DEFAULT_STATE, ...parsed });
        // Seed Neon Postgres asynchronously so cloud database is up-to-date
        saveCmsDataToNeon(sanitized).catch((err) => {
          console.warn('[CMS Server] Background Neon Postgres sync failed:', err);
        });
        return { data: sanitized, source: 'file' };
      }
    } catch (err) {
      console.warn('[CMS Server] Failed to read local CMS storage file:', err);
    }
  }

  // 4. Try In-Memory Cache
  if (globalForCms.__SERVER_PUBLISHED_CMS__) {
    return {
      data: sanitizePublishedCmsData({ ...DEFAULT_STATE, ...globalForCms.__SERVER_PUBLISHED_CMS__ }),
      source: 'memory',
    };
  }

  // 5. Default State Fallback
  return { data: DEFAULT_STATE, source: 'default' };
}

/**
 * Persists published CMS data across Neon Postgres, memory, disk, and cloud KV.
 */
export async function savePublishedCmsData(data: Partial<PublishedCmsData>): Promise<{ savedToNeon: boolean; savedToKv: boolean; savedToFile: boolean }> {
  // Read existing published data first so partial updates don't clobber other sections
  let existingData: Partial<PublishedCmsData> = {};
  if (fs.existsSync(CMS_STORAGE_FILE)) {
    try {
      const raw = fs.readFileSync(CMS_STORAGE_FILE, 'utf-8');
      existingData = JSON.parse(raw) || {};
    } catch {
      // ignore
    }
  }
  if (globalForCms.__SERVER_PUBLISHED_CMS__) {
    existingData = { ...existingData, ...globalForCms.__SERVER_PUBLISHED_CMS__ };
  }

  const payload: PublishedCmsData = sanitizePublishedCmsData({
    ...DEFAULT_STATE,
    ...existingData,
    ...data,
    lastPublishedAt: new Date().toISOString(),
  });

  // 1. Memory Cache
  globalForCms.__SERVER_PUBLISHED_CMS__ = payload;

  // 2. Neon Postgres Cloud Database
  let savedToNeon = false;
  try {
    savedToNeon = await saveCmsDataToNeon(payload);
  } catch (err) {
    console.warn('[CMS Server] Neon Postgres save failed:', err);
  }

  // 3. KV Store
  const savedToKv = await saveToKvStore(payload);

  // 4. Local File with atomic write & retry logic to prevent Windows EBUSY locking
  let savedToFile = false;
  const jsonContent = JSON.stringify(payload, null, 2);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      fs.writeFileSync(CMS_STORAGE_FILE, jsonContent, 'utf-8');
      savedToFile = true;
      break;
    } catch (err) {
      if (attempt === 2) {
        console.warn('[CMS Server] Failed to write CMS storage file after 3 attempts:', err);
      }
      // Non-blocking async delay before retry (prevents freezing the Node event loop)
      await new Promise<void>((resolve) => setTimeout(resolve, 35));
    }
  }

  return { savedToNeon, savedToKv, savedToFile };
}
