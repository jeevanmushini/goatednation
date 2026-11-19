# CDN & External Images Audit

**Project:** AnimeStreet / GoatedNation E-commerce  
**Audit Date:** 2026-11-19  
**Purpose:** Catalogue every hardcoded external/CDN image URL in the codebase, explain the impact, and provide step-by-step fix instructions using the existing admin upload system (Cloudinary via `/admin/media`).

---

## Summary Table

| # | File | Lines | Source | Count | Priority |
|---|------|-------|--------|-------|----------|
| 1 | `src/data/products.ts` | 17–5300 | `cdn.shopify.com` | **492 URLs** | 🔴 CRITICAL |
| 2 | `src/components/zenin/ZeninNewArrivals.tsx` | 34–100 | `cdn.shopify.com` | 12 URLs | 🔴 HIGH |
| 3 | `src/lib/auth/userDb.ts` | 22, 33 | `zenin.co.in`, Unsplash | 2 URLs | 🔴 HIGH |
| 4 | `src/lib/cms/initialCmsData.ts` | 31,33,49,70,88,141,149,157,165 | Unsplash | 9 URLs | 🟠 MEDIUM |
| 5 | `src/app/admin/categories/page.tsx` | 20, 30 | Unsplash | 2 URLs | 🟡 LOW |
| 6 | `src/app/admin/products/page.tsx` | 34, 37, 64, 67 | Unsplash | 4 URLs | 🟡 LOW |
| 7 | `.cms_published_data.json` | (entire file) | Shopify CDN + Unsplash | many | 🟠 MEDIUM |
| 8 | `public/images/hero/` & `public/images/editorial/` | — | Local files ✅ | 8 files | ✅ OK |

---

## Category 1 — `src/data/products.ts` ⚠️ CRITICAL

**File:** `src/data/products.ts`  
**Lines:** 17–5365 (entire file — 5,365 lines, 185 KB)  
**CDN source:** `https://cdn.shopify.com/s/files/1/0651/5215/5705/files/`  
**URL count:** **492 occurrences**

### What it is
This is the static product database for the entire store. Every product object has an `images: string[]` array where each entry is a Shopify CDN URL. Example:

```ts
// src/data/products.ts, Line 15-20
{
  id: 'web-crossbody-bag',
  images: [
    "https://cdn.shopify.com/s/files/1/0651/5215/5705/files/web1s.jpg?v=1793190214",
    "https://cdn.shopify.com/s/files/1/0651/5215/5705/files/web3-6_...jpg",
    "https://cdn.shopify.com/s/files/1/0651/5215/5705/files/web2-6_...jpg",
  ],
  ...
}
```

### Impact
- All product cards on `/shop`, `/collections`, and product detail pages (`/products/[slug]`) display these Shopify images
- If Shopify CDN goes down or the files are deleted, all product images break
- These images cannot be managed from the admin panel

### Fix Steps

**Step 1 — Go to Admin Products page**
Navigate to `http://localhost:3000/admin/products` (or your deployed URL `/admin/products`).

**Step 2 — For each product, upload replacement images**
- Click on a product to edit it
- In the **Images** field, click `Upload from Computer`
- Select the product image files from your local computer
- Each image uploads to Cloudinary and returns a URL like `https://res.cloudinary.com/your-cloud/...`
- Save the product

**Step 3 — Publish from admin**
After uploading all product images, click **Publish** in the admin CMS panel. The published data is written to `.cms_published_data.json` and served to the storefront.

**Step 4 — Eventually deprecate `products.ts`**
Once all products are managed via CMS, the static `products.ts` file can be replaced with a simple redirect to the CMS store:
```ts
// Replace the entire products.ts export with:
import { useCmsStore } from '@/lib/cms/cmsStore';
export const products = useCmsStore.getState().products;
```

> [!IMPORTANT]
> This is the highest priority fix. With 492 Shopify CDN URLs, the entire product catalog is dependent on a third-party CDN that is not under your control.

---

## Category 2 — `src/components/zenin/ZeninNewArrivals.tsx` ⚠️ HIGH

**File:** `src/components/zenin/ZeninNewArrivals.tsx`  
**Lines:** 34–100  
**CDN source:** `https://cdn.shopify.com/s/files/1/0651/5215/5705/files/`  
**URL count:** 12

### What it is
This component has its own **hardcoded product array** (completely separate from `products.ts`) used for the "New Arrivals" section on the homepage. It contains 6 products, each with 2 Shopify CDN image URLs:

```ts
// Lines 30-105 (abbreviated)
const products = [
  {
    id: 'web-crossbody-bag',
    images: [
      'https://cdn.shopify.com/s/files/1/0651/5215/5705/files/web1s.jpg?v=1793190214',   // Line 34
      'https://cdn.shopify.com/s/files/1/0651/5215/5705/files/web3-6_...jpg',             // Line 35
    ],
  },
  {
    id: 'berserk-monogram-hoodie',
    images: [
      'https://cdn.shopify.com/s/files/1/0651/5215/5705/files/W1-23.jpg?v=1791715144',    // Line 47
      'https://cdn.shopify.com/s/files/1/0651/5215/5705/files/w2-25.jpg?v=1791715143',    // Line 48
    ],
  },
  // ... 4 more products at lines 60-61, 73-74, 86-87, 99-100
];
```

### Impact
- Homepage "New Arrivals" section shows broken images if Shopify CDN is unavailable
- Admin cannot control which products appear or what images are shown without editing code

### Fix Steps

**Step 1 — Upload images for these 6 products via admin**
Go to `/admin/products` and upload computer images for:
- Web Crossbody Bag
- Berserk Monogram Hoodie
- Aizen Oversized T-shirt
- Berserk Bag
- Oversized hoodie (w2s product)
- Aizen product

**Step 2 — Replace the hardcoded array with CMS data**
Edit `ZeninNewArrivals.tsx` to remove the hardcoded `products` array and read from the CMS store instead:

```tsx
// REMOVE lines 30–105 (the hardcoded products array)
// REPLACE with:
import { useCmsStore } from '@/lib/cms/cmsStore';

// Inside the component:
const cmsProducts = useCmsStore(state => state.products);
const newArrivals = cmsProducts
  .filter(p => p.tags?.includes('new-arrival'))
  .slice(0, 6);
```

**Step 3 — Tag products as "new-arrival" in admin**
In `/admin/products`, add the tag `new-arrival` to the 6 products you want shown in this section.

---

## Category 3 — `src/lib/auth/userDb.ts` ⚠️ HIGH

**File:** `src/lib/auth/userDb.ts`  
**Lines:** 22, 33, 123, 189  
**CDN sources:** `zenin.co.in`, Unsplash, DiceBear API

### What it is

```ts
// Line 22 — Default ADMIN user avatar (THIS CAUSED THE RUNTIME ERROR)
avatar: 'https://zenin.co.in/cdn/shop/files/web1s.jpg',

// Line 33 — Default CUSTOMER user avatar
avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',

// Lines 123, 189 — Auto-generated avatar for new registrations
`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`
```

### Impact
- **Line 22** directly caused a runtime crash: `Invalid src prop on next/image — hostname "zenin.co.in" not configured`
- If `zenin.co.in` goes offline, the admin sidebar shows a broken avatar and may crash
- DiceBear API (lines 123, 189) is an external service — works fine as auto-generated avatars but introduces external dependency for every new user

### Fix Steps

**For Line 22 (Admin avatar — HIGHEST RISK):**
```ts
// CHANGE:
avatar: 'https://zenin.co.in/cdn/shop/files/web1s.jpg',

// TO (remove avatar entirely and rely on initials fallback):
// avatar: '',   // Remove this field OR set to empty string
```
The admin layout already has an initials fallback (`user.name.charAt(0)`) — no avatar is needed.

**For Line 33 (Customer seed avatar):**
```ts
// CHANGE:
avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?...',

// TO:
avatar: '',  // Use initials fallback
```

**For Lines 123 & 189 (DiceBear auto-generated):**
These are acceptable for auto-generated user avatars (not product/content images). You can keep DiceBear OR replace with initials-only:
```ts
// Option A: Keep DiceBear (acceptable)
// Option B: Remove and rely on initials
avatar: '',
```

---

## Category 4 — `src/lib/cms/initialCmsData.ts` 🟠 MEDIUM

**File:** `src/lib/cms/initialCmsData.ts`  
**Lines:** 31, 33, 49, 70, 88, 141, 149, 157, 165  
**CDN source:** `https://images.unsplash.com/`  
**URL count:** 9

### What it is
This file defines the **default CMS data** shown when the admin has never published anything. It contains Unsplash images for:

| Line | Purpose | URL |
|------|---------|-----|
| 31 | Hero slide 1 — desktop image | `photo-1509967419530...` (anime streetwear) |
| 33 | Hero slide 1 — mobile image | Same photo, smaller crop |
| 49 | Hero slide 2 — desktop image | `photo-1503342217505...` (clothing rack) |
| 70 | Hero slide 3 — desktop image | `photo-1551028719...` (anime scene) |
| 88 | Editorial banner image | `photo-1529374255404...` |
| 141 | Media library default item 1 | `photo-1509967419530...` |
| 149 | Media library default item 2 | `photo-1503342217505...` |
| 157 | Media library default item 3 | `photo-1556905055...` |
| 165 | Media library default item 4 | `photo-1551028719...` |

### Impact
- On a fresh install with no published CMS data, the homepage shows Unsplash images (requires external network)
- Unsplash `auto=format&fit=crop` URLs depend on Unsplash's CDN being available
- These are "first-launch" defaults — once admin publishes from `/admin/homepage`, these are overridden

### Fix Steps

**Option A — Replace with local placeholder (Recommended)**
```ts
// CHANGE all Unsplash URLs to local placeholder:
// Lines 31, 33, 49, 70, 88, 141, 149, 157, 165:
url: '/images/placeholder-product.svg',
// or:
image: '/images/placeholder-product.svg',
```

**Option B — Upload hero images via admin and publish**
1. Go to `/admin/homepage`
2. For each hero slide, click **Upload from Computer** and choose your hero image
3. Click **Publish** — this replaces the defaults in `.cms_published_data.json`
4. The storefront now uses your Cloudinary-uploaded images instead of Unsplash

> [!NOTE]
> Option B is preferred for production. The Unsplash defaults only matter on first launch before the admin has set up content.

---

## Category 5 — `src/app/admin/categories/page.tsx` 🟡 LOW

**File:** `src/app/admin/categories/page.tsx`  
**Lines:** 20, 30  
**CDN source:** Unsplash  
**URL count:** 2

### What it is
Fallback image URLs used when a category has no image set:

```ts
// Line 20 — Default category image (used in preview)
'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'

// Line 30 — Same URL used as "placeholder" for empty category
'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'
```

### Impact
- Admin category management page shows Unsplash images for categories without uploaded images
- Minor — only affects the admin panel preview, not the storefront

### Fix Steps
```ts
// CHANGE both occurrences (lines 20 and 30) to:
'/images/placeholder-product.svg'
```

---

## Category 6 — `src/app/admin/products/page.tsx` 🟡 LOW

**File:** `src/app/admin/products/page.tsx`  
**Lines:** 34, 37, 64, 67  
**CDN source:** Unsplash  
**URL count:** 4

### What it is
Placeholder images for the admin product list in empty/default states:

```ts
// Line 34 — Sample product 1 image
'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80'

// Line 37 — Sample product 2 image
'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80'

// Lines 64, 67 — Same two URLs repeated for second set of placeholders
```

### Impact
- Admin product management shows Unsplash placeholder images in empty product card previews
- Only visible in admin, not on the storefront

### Fix Steps
```ts
// CHANGE all 4 occurrences to:
'/images/placeholder-product.svg'
```

---

## Category 7 — `.cms_published_data.json` 🟠 MEDIUM

**File:** `.cms_published_data.json` (project root)  
**CDN sources:** `cdn.shopify.com`, Unsplash  
**Note:** This file is **auto-generated** — it's written by the admin CMS when you click "Publish"

### What it is
This is the live published CMS state served to the storefront. It currently contains:
- Product image arrays with `cdn.shopify.com` URLs (copied from initial data)
- Hero slide images with Unsplash URLs (from `initialCmsData.ts` defaults)

### Impact
- The storefront reads this file for all CMS-driven content
- If it contains Shopify CDN URLs, those are served to users even after fixing `products.ts`

### Fix Steps
> [!IMPORTANT]
> **Do NOT edit this file manually.** It is overwritten every time the admin publishes.

1. Fix the source data first (Categories 1–6 above)
2. Go to `/admin/homepage` → update all hero slides with computer-uploaded images → click **Publish**
3. Go to `/admin/products` → update all product images with computer-uploaded images → click **Publish**
4. The `.cms_published_data.json` file will be regenerated with Cloudinary URLs automatically

---

## Category 8 — `public/images/` Local Files ✅ OK (No Action Needed)

**Directory:** `public/images/hero/` and `public/images/editorial/`

### Files present (all LOCAL — no CDN dependency):
| File | Used in |
|------|---------|
| `public/images/hero/berserk-hoodie.jpg` | CMS initial hero slides |
| `public/images/hero/cherry-blossom-waffle.jpg` | CMS initial hero slides |
| `public/images/hero/ryujin-jacket.jpg` | CMS initial hero slides |
| `public/images/hero/sukuna-jacket.jpg` | CMS initial hero slides |
| `public/images/hero/tactical-vest.jpg` | CMS initial hero slides |
| `public/images/hero/valhalla-bomber.jpg` | CMS initial hero slides |
| `public/images/hero/zoro-crossbody.jpg` | CMS initial hero slides |
| `public/images/editorial/editorial-banner.jpg` | CMS editorial section |
| `public/images/placeholder-product.svg` | Fallback for missing images |

### Status
✅ These are **local files** served from your own server — no external CDN dependency. They are appropriate as local fallbacks and default images. **No changes needed.**

The admin can override these at any time via `/admin/homepage` by uploading replacement images from their computer.

---

## Recommended Fix Order

```
1. 🔴 src/lib/auth/userDb.ts (Line 22)        → URGENT — caused production runtime crash
2. 🔴 src/data/products.ts                     → Upload all product images via /admin/products
3. 🔴 src/components/zenin/ZeninNewArrivals.tsx → Upload 6 product images + wire to CMS store
4. 🟠 src/lib/cms/initialCmsData.ts            → Replace Unsplash with /images/placeholder-product.svg
5. 🟠 .cms_published_data.json                 → Auto-fixed after Steps 2+3 admin publish
6. 🟡 src/app/admin/categories/page.tsx        → Replace 2 Unsplash URLs with local SVG
7. 🟡 src/app/admin/products/page.tsx          → Replace 4 Unsplash URLs with local SVG
8. ✅ src/lib/auth/userDb.ts (Lines 123, 189)  → DiceBear is acceptable, keep or remove avatar
```

---

## How the Admin Image Upload System Works

The project already has a complete admin image upload pipeline:

```
Admin clicks "Upload from Computer"
        ↓
<ImageInputWithUpload> component (src/components/admin/ImageInputWithUpload.tsx)
        ↓
POST /api/media/upload  →  Cloudinary (res.cloudinary.com/...)
        ↓
Returns Cloudinary URL → stored in CMS store (useCmsStore)
        ↓
Admin clicks "Publish"
        ↓
CMS state written to .cms_published_data.json
        ↓
Storefront reads CMS data → displays Cloudinary images ✅
```

**Admin pages for image management:**
- `/admin/homepage` — Hero slides, editorial banner, featured categories
- `/admin/products` — Product images (per product)
- `/admin/media` — Media library (bulk image management)
- `/admin/categories` — Category images

---

## Quick Reference: Files to Edit for Code Fixes

| File | Lines to Change | Change |
|------|----------------|--------|
| `src/lib/auth/userDb.ts` | 22 | Remove `avatar` field or set to `''` |
| `src/lib/auth/userDb.ts` | 33 | Remove `avatar` field or set to `''` |
| `src/lib/cms/initialCmsData.ts` | 31, 33, 49, 70, 88, 141, 149, 157, 165 | Replace Unsplash URLs with `/images/placeholder-product.svg` |
| `src/app/admin/categories/page.tsx` | 20, 30 | Replace Unsplash URLs with `/images/placeholder-product.svg` |
| `src/app/admin/products/page.tsx` | 34, 37, 64, 67 | Replace Unsplash URLs with `/images/placeholder-product.svg` |
| `src/components/zenin/ZeninNewArrivals.tsx` | 30–105 | Remove hardcoded array, wire to `useCmsStore` |
| `src/data/products.ts` | Entire file | Migrate all product images to CMS admin uploads |
