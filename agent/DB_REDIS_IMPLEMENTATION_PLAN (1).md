# GOATED NATION — Pure Database + Redis Cache-Aside Implementation Plan
## Complete Eradication of Hardcoded Data & Transition to Live Neon DB + Upstash Redis

> **Primary Objective:** Completely eradicate **every hardcoded static product, category, and catalog fallback** from the runtime storefront. Every single product, category, and CMS piece of data must originate from **Neon PostgreSQL (`app_products`, `app_cms_state`)**, be cached in **Upstash Redis / Vercel KV** for sub-3ms reads, and be automatically invalidated on Admin edits.

---

## 1. Full Audit of Current Hardcoded Touchpoints

A repository-wide AST audit found **9 files** that actively import and fall back to hardcoded data from `src/data/products.ts`:

| # | File Path | Current Hardcoded Dependency | Target Fix |
|---|---|---|---|
| 1 | `src/lib/cms/serverCms.ts` | Imports `PRODUCTS`, loops through it in `sanitizePublishedCmsData()`, uses it in `DEFAULT_STATE` | Remove import, make Neon DB + Redis the single source of truth |
| 2 | `src/lib/cms/cmsStore.ts` | Imports `PRODUCTS`, preserves static products in `syncFromServer()` and `resetToDefaults()` | Remove import, sync strictly with live server/DB state |
| 3 | `src/lib/cms/initialCmsData.ts` | Imports `CATEGORIES` from `products.ts` | Decouple from static products file; store categories in Neon DB |
| 4 | `src/app/collections/[slug]/page.tsx` | Imports `PRODUCTS, CATEGORIES`, falls back to `PRODUCTS.filter()` at line 103 | Remove static fallback; render loading skeletons until DB data loads |
| 5 | `src/components/collections/CollectionsClientView.tsx` | Imports `ZENIN_ALL_PRODUCTS`, falls back at line 103 | Remove static fallback; render loading skeletons until DB data loads |
| 6 | `src/app/products/[slug]/page.tsx` | Imports `PRODUCTS`, falls back to `PRODUCTS.find()` and `activeProduct = product || PRODUCTS[0]` | Remove static fallback; trigger 404 `notFound()` if product not in DB |
| 7 | `src/components/zenin/ZeninNewArrivals.tsx` | Imports `PRODUCTS`, falls back at line 68 if DB array empty | Remove static fallback; display live DB arrivals with loading state |
| 8 | `src/components/layout/SearchModal.tsx` | Imports `PRODUCTS`, uses `cmsProducts.length > 0 ? cmsProducts : PRODUCTS` at line 21 | Search strictly against live DB/CMS products |
| 9 | `src/stores/cartStore.ts` | Imports `COUPONS` from `products.ts` | Move coupon rules to dedicated `types/cart.ts` or database config |

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL EDGE / CLOUD                            │
│                                                                             │
│  Visitor Request (/collections, /products/[slug], homepage)                 │
│        │                                                                    │
│        ▼                                                                    │
│  productCache.ts (Unified Cache Layer)                                      │
│    ├── 1. Check Upstash Redis via HTTPS REST API                            │
│    │       ├── Cache HIT  ──► Return products immediately (< 3ms) ✅        │
│    │       └── Cache MISS ──► Query Neon PostgreSQL                         │
│    │                              │                                         │
│    │                              ▼                                         │
│    │                         `app_products` (110+ rows)                     │
│    │                         `app_cms_state` (JSONB)                        │
│    │                              │                                         │
│    │                              ▼                                         │
│    │                         Save into Redis (TTL 3600s)                    │
│    │                         Return live DB data to page                    │
│    │                                                                        │
│    └── 2. Admin Mutation (Add / Edit / Delete in /admin/products)           │
│            ├── Writes change directly to Neon DB                            │
│            └── Instantly purges Redis keys:                                 │
│                  • DEL `gn:products:all`                                    │
│                  • DEL `gn:product:{slug}`                                  │
│                  • DEL `gn:cms:published`                                   │
│            └── Next request fetches fresh DB state instantly ✅             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Implementation Blueprint

### Phase 1: Create Central Product & CMS Cache Service
**File:** `src/lib/cache/productCache.ts` (NEW FILE)

This file manages all Upstash Redis operations and connects directly to Neon DB.

```ts
/**
 * Responsibilities:
 * - getCachedProducts(): Reads "gn:products:all" from Redis. On miss, queries getProductsFromNeon(), caches it for 1 hour, and returns it.
 * - getCachedProductBySlug(slug): Reads "gn:product:{slug}" from Redis. On miss, queries getProductBySlugFromNeon(slug), caches for 24 hours, and returns it.
 * - getCachedCmsData(): Reads "gn:cms:published" from Redis. On miss, queries getCmsDataFromNeon(), caches it, and returns it.
 * - invalidateProductCache(slug?): Purges "gn:products:all", "gn:cms:published", and optionally "gn:product:{slug}".
 * - Graceful fallback: If KV_REST_API_URL is missing or fails, it queries Neon DB directly (zero downtime).
 */
```

### Phase 2: Decouple Server CMS (`src/lib/cms/serverCms.ts`)
1. **Remove static import:** Delete `import { PRODUCTS } from '../../data/products';`.
2. **Remove static seeding loop:** In `sanitizePublishedCmsData()`, delete the loop that populates `catalogMap` from `PRODUCTS`. `catalogMap` must ONLY be populated from live database records.
3. **Connect to Redis Cache:**
   - Update `getPublishedCmsData()` to call `productCache.getCachedProducts()` and `productCache.getCachedCmsData()`.
   - Update `getPublishedProductBySlug(slug)` to call `productCache.getCachedProductBySlug(slug)`.
4. **Purge Cache on Publish:** In `savePublishedCmsData()`, after database save succeeds, call `invalidateProductCache()`.

### Phase 3: Decouple Client Store (`src/lib/cms/cmsStore.ts`)
1. **Remove static import:** Delete `import { PRODUCTS } from '../../data/products';`.
2. **Initial State:** Set `products: []` initially, allowing the hydration from `syncFromServer()` to populate the store with live DB data.
3. **Clean `syncFromServer()`:** Remove any code that merges or preserves static items. The server response is 100% authoritative.
4. **Clean `resetToDefaults()`:** Make it reset against live database seed rather than hardcoded client array.

### Phase 4: Decouple Storefront Pages & Components

#### 4.1 Category & Collection Pages
* **`src/app/collections/[slug]/page.tsx`:**
  - Remove `import { PRODUCTS, CATEGORIES } from '../../../data/products';`.
  - Replace line 103 `return PRODUCTS.filter(...)` fallback with an empty check.
  - If `allProducts.length === 0`, render a minimalist Zenin skeleton grid rather than showing static fake items.
* **`src/components/collections/CollectionsClientView.tsx`:**
  - Remove `import { ZENIN_ALL_PRODUCTS } from '../../data/products';`.
  - Replace line 103 `return ZENIN_ALL_PRODUCTS.filter(...)` fallback with live state only.
  - Add skeleton placeholders when products are being fetched.

#### 4.2 Product Detail Page
* **`src/app/products/[slug]/page.tsx`:**
  - Remove `import { PRODUCTS } from '../../../data/products';`.
  - Remove line 51 fallback: `PRODUCTS.find(...)`.
  - Remove line 94 bug: `const activeProduct = product || PRODUCTS[0];`.
  - If the product is not in the database and resolving finishes, call `notFound()` to show a proper 404 page.

#### 4.3 New Arrivals & Search
* **`src/components/zenin/ZeninNewArrivals.tsx`:**
  - Remove `import { PRODUCTS } from '../../data/products';`.
  - Remove lines 67–69 fallback `PRODUCTS.forEach(processItem);`.
  - Display only active products from the server/DB.
* **`src/components/layout/SearchModal.tsx`:**
  - Remove `import { PRODUCTS } from '../../data/products';`.
  - Search strictly against `cmsProducts` (which holds the active live database catalog).

#### 4.4 Decouple Coupons
* **`src/stores/cartStore.ts`:**
  - Move coupon codes (e.g., `WELCOME10`) into `src/types/cart.ts` or database settings table so `cartStore` does not import `src/data/products.ts`.

---

## 4. Admin Live Cache Invalidation Protocol

When an admin performs any CRUD action in `/admin/products`:

1. **Create Product:**
   - Admin submits form $\rightarrow$ API saves to Neon PostgreSQL (`app_products` table and `app_cms_state`).
   - API calls `invalidateProductCache()`.
   - Redis key `gn:products:all` is deleted.
   - Next storefront visitor triggers a cache miss $\rightarrow$ loads new product from Neon $\rightarrow$ caches it in Redis.
2. **Edit Product:**
   - Admin updates title, price, or stock $\rightarrow$ API updates Neon DB.
   - API calls `invalidateProductCache(slug)`.
   - Redis keys `gn:products:all` and `gn:product:{slug}` are deleted.
   - Storefront and product page immediately reflect the new price.
3. **Delete Product:**
   - Admin clicks Delete $\rightarrow$ API sets `is_active = FALSE` in `app_products` and adds ID to `deletedProductIds` in `app_cms_state`.
   - API calls `invalidateProductCache(slug)`.
   - Product is immediately removed from the catalog across all edge nodes.

---

## 5. Verification & Acceptance Criteria

1. **Zero Runtime Imports:** Run `grep -rn "data/products" src/` and verify that **zero storefront components or pages** import from `src/data/products.ts`.
2. **Database Authority:** Edit a product title in Neon DB $\rightarrow$ refresh the site $\rightarrow$ verify the updated title appears on the storefront.
3. **Redis Performance:** Verify cache latency is $< 5\text{ms}$ on subsequent visits.
4. **404 Integrity:** Navigate to `/products/non-existent-item` $\rightarrow$ verify the site renders a clean 404 page instead of falling back to `PRODUCTS[0]`.
5. **Admin Flow:** Create a test product in `/admin/products` $\rightarrow$ verify it immediately appears on `/collections` without redeploying.
6. **Lint & Build:** `npm run lint` and `npm run build` pass with 0 errors and 0 warnings.
