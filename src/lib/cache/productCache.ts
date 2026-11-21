/**
 * Centralized Redis (Upstash / Vercel KV) + In-Memory Product & CMS Cache Layer
 *
 * Implements Cache-Aside Pattern:
 * 1. Sub-1ms in-memory cache for process lifetime / SSR
 * 2. Sub-5ms Upstash Redis REST query across edge lambdas
 * 3. Graceful fallback directly to Neon Postgres on cache miss or unconfigured Redis
 * 4. Automatic invalidation on Admin mutations
 */

import { Product } from '../../types/product';
import { getProductsFromNeon, getProductBySlugFromNeon, getCmsDataFromNeon } from '../db/neon';

interface MemoryCacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry<unknown>>();

function getMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setMemoryCache<T>(key: string, data: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function delMemoryCache(keyPrefixOrExact: string): void {
  for (const k of memoryCache.keys()) {
    if (k === keyPrefixOrExact || k.startsWith(keyPrefixOrExact)) {
      memoryCache.delete(k);
    }
  }
}

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function redisGet<T>(key: string): Promise<T | null> {
  const config = getRedisConfig();
  if (!config) return null;

  try {
    const res = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${config.token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.result !== null && json.result !== undefined) {
        return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
      }
    }
  } catch (err) {
    console.warn(`[Redis Cache] GET ${key} failed:`, err);
  }
  return null;
}

async function redisSet<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  const config = getRedisConfig();
  if (!config) return false;

  try {
    const serialized = JSON.stringify(value);
    const res = await fetch(`${config.url}/set/${encodeURIComponent(key)}?ex=${ttlSeconds}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serialized),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[Redis Cache] SET ${key} failed:`, err);
    return false;
  }
}

async function redisDel(keys: string[]): Promise<boolean> {
  const config = getRedisConfig();
  if (!config || keys.length === 0) return false;

  try {
    await Promise.all(
      keys.map((k) =>
        fetch(`${config.url}/del/${encodeURIComponent(k)}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${config.token}` },
        }).catch(() => null)
      )
    );
    return true;
  } catch (err) {
    console.warn(`[Redis Cache] DEL failed:`, err);
    return false;
  }
}

/**
 * Reads all active products with Cache-Aside strategy:
 * Memory -> Redis (TTL: 1 hour) -> Neon Postgres.
 */
export async function getCachedProducts(): Promise<Product[]> {
  const cacheKey = 'gn:products:all';

  // 1. In-memory hot cache
  const mem = getMemoryCache<Product[]>(cacheKey);
  if (mem && mem.length > 0) return mem;

  // 2. Upstash Redis / Vercel KV
  const redisData = await redisGet<Product[]>(cacheKey);
  if (redisData && redisData.length > 0) {
    setMemoryCache(cacheKey, redisData, 3600);
    return redisData;
  }

  // 3. Fallback to live Neon Postgres DB
  const neonProducts = await getProductsFromNeon();
  if (neonProducts && neonProducts.length > 0) {
    setMemoryCache(cacheKey, neonProducts, 3600);
    redisSet(cacheKey, neonProducts, 3600).catch(() => null);
    return neonProducts;
  }

  return [];
}

/**
 * Reads individual product by slug with Cache-Aside strategy:
 * Memory -> Redis (TTL: 24 hours) -> Neon Postgres.
 */
export async function getCachedProductBySlug(slug: string): Promise<Product | null> {
  const cacheKey = `gn:product:${slug}`;

  // 1. In-memory hot cache
  const mem = getMemoryCache<Product>(cacheKey);
  if (mem) return mem;

  // 2. Upstash Redis / Vercel KV
  const redisProduct = await redisGet<Product>(cacheKey);
  if (redisProduct) {
    setMemoryCache(cacheKey, redisProduct, 86400);
    return redisProduct;
  }

  // 3. Fallback to live Neon Postgres DB
  const neonProduct = await getProductBySlugFromNeon(slug);
  if (neonProduct) {
    setMemoryCache(cacheKey, neonProduct, 86400);
    redisSet(cacheKey, neonProduct, 86400).catch(() => null);
    return neonProduct;
  }

  return null;
}

/**
 * Reads published CMS state with Cache-Aside strategy:
 * Memory -> Redis (TTL: 1 hour) -> Neon Postgres.
 */
export async function getCachedCmsData<T = unknown>(): Promise<T | null> {
  const cacheKey = 'gn:cms:published';

  // 1. In-memory hot cache
  const mem = getMemoryCache<T>(cacheKey);
  if (mem) return mem;

  // 2. Upstash Redis / Vercel KV
  const redisCms = await redisGet<T>(cacheKey);
  if (redisCms) {
    setMemoryCache(cacheKey, redisCms, 3600);
    return redisCms;
  }

  // 3. Fallback to live Neon Postgres DB
  const neonCms = await getCmsDataFromNeon<T>();
  if (neonCms) {
    setMemoryCache(cacheKey, neonCms, 3600);
    redisSet(cacheKey, neonCms, 3600).catch(() => null);
    return neonCms;
  }

  return null;
}

/**
 * Purges products & CMS cache across in-memory and Upstash Redis.
 * Called immediately upon Admin Create / Edit / Delete.
 */
export async function invalidateProductCache(slug?: string): Promise<void> {
  const keysToPurge = ['gn:products:all', 'gn:cms:published'];
  if (slug) {
    keysToPurge.push(`gn:product:${slug}`);
  }

  // 1. Purge memory cache
  for (const k of keysToPurge) {
    delMemoryCache(k);
  }

  // 2. Purge Upstash Redis
  await redisDel(keysToPurge);
}
