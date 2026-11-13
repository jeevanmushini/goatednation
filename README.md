# GOATED NATION - Premium Anime Streetwear E-Commerce

> **README-FIRST DEVELOPMENT POLICY**
> Every file creation, modification, deletion, or refactor is documented in this README. This is the single source of truth for the entire project.

---

## Table of Contents

1. [Project Vision](#project-vision)
2. [Brand Identity](#brand-identity)
3. [Technology Stack](#technology-stack)
4. [Architecture & Integrations](#architecture--integrations)
   - [Shiprocket Logistics Integration](#shiprocket-logistics-integration)
   - [Razorpay Payment Gateway Integration](#razorpay-payment-gateway-integration)
5. [Design System & Zenin Aesthetics](#design-system--zenin-aesthetics)
6. [CMS & Admin Visual Management](#cms--admin-visual-management)
7. [Environment Configuration](#environment-configuration)
8. [API Documentation](#api-documentation)
9. [Activity Log](#activity-log)

---

## Project Vision

**GOATED NATION** is an ultra-premium, brutalist anime streetwear e-commerce platform inspired directly by Japanese high-fashion streetwear (Zenin aesthetic). Designed specifically for anime culture enthusiasts, offering heavyweight 280-420 GSM oversized tees, barrel sweatpants, jacquard jackets, and tactical cross-body accessories with native Shiprocket logistics and payment integrations.

---

## Brand Identity

- **Brand Name:** GOATED NATION
- **Tagline:** "Wear the Culture • Tokyo Streetwear Syndicate"
- **Primary Aesthetics:**
  - Ultra-clean White Background: `#FFFFFF`
  - Subtle Neutral Borders: `#EAEAEA` / `#E5E5E5`
  - Deep Black Typography & Accents: `#000000` / `#111111`
  - Crimson Red Sale Badges: `#8B1D1D`
  - Brand Orange Accent: `#FF4D00`
  - Monospace Data / Technical Typography

---

## Technology Stack

- **Framework:** Next.js 16 (App Router with Turbopack)
- **Library:** React 19, TypeScript 5
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion (floating physics, arc perspective)
- **State Management:** Zustand 5 (Persistent Storage for Bag, Wishlist & CMS)
- **Logistics:** Live Shiprocket External API v1 Gateway
- **Icons:** Lucide React

---

## Architecture & Integrations

### Shiprocket Logistics Integration
- **Live Authentication:** JWT token retrieval cached with automatic refresh (`/auth/login`).
- **Account Verified:** User `jeevanmushini43@gmail.com` with pickup warehouse pincode `560054`.
- **Dynamic Serviceability:** Live courier check returning Xpressbees, Blue Dart, and Delhivery with real-time delivery estimates and COD availability.
- **Dynamic Rates:** Freight and COD charge calculations.
- **Real-Time Tracking:** Live AWB milestone status tracking.

### CMS & Admin Architecture
- **Local Laptop Image Upload:** Full drag-and-drop file upload support storing assets in `/public/uploads/` via `/api/media/upload`.
- **External Image URLs:** Direct CDN and web link support.
- **Media Library:** Reusable asset selection across the entire admin dashboard.
- **Zenin Design System:** Unified white minimalist aesthetic across all admin routes (`/admin`, `/admin/homepage`, `/admin/products`, `/admin/categories`, `/admin/media`, `/admin/shipping`, `/admin/navigation`, `/admin/settings`).

---

## Activity Log

### 17. Navigation Refinement, Live Shiprocket Verification & Full Admin Zenin Re-theme
- Date: 2026-11-06
- Status: COMPLETED
- Implemented:
  1. **Sub-Navigation Strip Deleted (`ZeninHeader.tsx`):**
     - Completely removed the 12-category sub-navigation strip directly below the main header bar per user request.
     - Kept top announcement bar, main navigation with Categories dropdown, search, account, and shopping bag drawer trigger.
  2. **Shiprocket Live Credentials Connected & Verified (`shiprocket.ts`, `route.ts`):**
     - Connected user's live credentials (`jeevanmushini43@gmail.com`, Pickup Pincode `560054`).
     - Verified JWT login (`/auth/login`), serviceability checker, and rate calculation returning live couriers (Xpressbees Air, Blue Dart Air).
     - Fixed `testShiprocketConnection()` and serviceability route to use configured pickup pincode.
  3. **Admin Dashboard Full Zenin Theme Alignment:**
     - Re-themed all admin pages to the clean, minimalist Zenin design language (`bg-white` / `#FBFBFB`, `#EAEAEA` borders, monospace uppercase tags, high-contrast black action buttons):
       - `ImageInputWithUpload.tsx`: Clean white laptop file upload card with drag & drop, direct URL input, and media library picker.
       - `AdminProductsPage` (`/admin/products`): Clean table with light headers, product image thumbnails, drop badges, and modal dialog with laptop image upload.
       - `AdminCategoriesPage` (`/admin/categories`): Clean white category cards with laptop file upload for cover artwork.
       - `AdminShippingPage` (`/admin/shipping`): Live Shiprocket status card, serviceability testing form, live rate calculator, and webhook guide in clean Zenin styling.
       - `AdminMediaPage` (`/admin/media`): Drag-and-drop file queue from laptop, category filter chips, and image grid.
       - `AdminNavigationPage` (`/admin/navigation`): Clean reorderable menu links and modal.
       - `AdminSettingsPage` (`/admin/settings`): Clean brand, announcement, and logistics settings.
  4. **Build & Quality Verification:**
     - `npm run lint`: **0 errors, 0 warnings**.
     - `npm run build`: Compiled production build successfully in 1128ms. All 20 routes static & dynamic server-rendered on demand.
     - Live probe tests verified HTTP 200 OK on `/`, `/admin`, and `/admin/shipping`.

### 18. Faithful Recreation of All Products Page (Zenin Aesthetic)
- Date: 2026-11-06
- Status: COMPLETED
- Implemented:
  1. **Recreated All Products Catalog Layout ([collections/page.tsx](file:///c:/Users/jeeva/Desktop/cognizanthandson/ecommerce/animestreet/src/app/collections/page.tsx)):**
     - Matches `https://zenin.co.in/collections/all-products` design specifications from the 5 reference screenshots.
     - Minimalist left-aligned page title: `All Products`.
     - Monospace horizontal filter toolbar with popover controls:
       - `Filter:` with `Availability ˅` (In stock / Out of stock checkboxes + count) and `Price ˅` (`From` / `To` range inputs).
       - Right-aligned `Sort by: Featured ˅` dropdown with `16 products` / total item count.
     - 4-column responsive product grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8`) with 3:4 aspect ratio cards.
     - Dual image crossfade on hover with bottom-left crimson discount badge (`SAVE XX%`).
     - Strikethrough original price and current price in monospace font (`Rs. 5,000`).
     - Centered minimalist pagination (`1`, `2`, `3`, `...`, `7`, `>`).
  2. **16 Zenin Products Dataset ([products.ts](file:///c:/Users/jeeva/Desktop/cognizanthandson/ecommerce/animestreet/src/data/products.ts)):**
     - Seeded all 16 items from the 4 rows in screenshots 1-4 with exact titles, dual Zenin images, pricing, and discount percentages.
  3. **Universal Route Support ([collections/[slug]/page.tsx](file:///c:/Users/jeeva/Desktop/cognizanthandson/ecommerce/animestreet/src/app/collections/[slug]/page.tsx)):**
     - Connected `/collections/all-products` and `/collections` to render the same exact layout.
  4. **Build & Quality Verification:**
     - `npm run lint`: **0 errors, 0 warnings**.
     - `npm run build`: Compiled production build cleanly in **1013ms**. Both `/collections` and `/collections/all-products` return HTTP 200 OK.

