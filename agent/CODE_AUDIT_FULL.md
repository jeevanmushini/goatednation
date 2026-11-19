# Full Codebase Audit: Bugs, Issues, Redundant & Dead Code

> **Project:** GoatedNation E-Commerce (Next.js 16.4.3, React 19, Neon Postgres)
> **Audit Date:** 2026-11-19
> **Auditor:** Antigravity Deep Code Analysis
> **Files Analyzed:** 54 source files across lib, api, stores, components, pages, and types

---

## TABLE OF CONTENTS
1. [Critical Bugs](#section-1-critical-bugs)
2. [Security Vulnerabilities](#section-2-security-vulnerabilities)
3. [Redundant & Dead Code](#section-3-redundant--dead-code)
4. [Architectural Issues](#section-4-architectural-issues--code-smells)
5. [Neon Postgres Integration Issues](#section-5-neon-postgres-integration-issues)
6. [TypeScript & Type Safety Issues](#section-6-typescript--type-safety-issues)
7. [Production Readiness Gaps](#section-7-production-readiness-gaps)

---

## SECTION 1: CRITICAL BUGS

### BUG-01: Synchronous Spin-Wait Loop Blocks the Event Loop

- **File:** `src/lib/cms/serverCms.ts` (Lines 219–220)
- **Issue:** A busy-wait `while (Date.now() - start < 35) {}` loop is used to delay file retry writes. This is a synchronous CPU spin that **freezes the entire Node.js event loop** for 35ms per retry attempt — up to 105ms total. All other requests are blocked during this time.
- **Impact:** Causes cascading request timeouts in production. Completely unnecessary since the function is already `async`.
- **Fix Step-by-Step:**
  1. Replace the spin-wait with a proper async delay:
  ```ts
  // Before (WRONG):
  const start = Date.now();
  while (Date.now() - start < 35) {}

  // After (CORRECT):
  await new Promise<void>((resolve) => setTimeout(resolve, 35));
  ```
  2. No other changes needed — `savePublishedCmsData` is already `async`.

---

### BUG-02: Race Condition — `saveUsers` Writes ALL Users to Neon on Every Save

- **File:** `src/lib/auth/userDb.ts` (Lines 107–112)
- **Issue:** `saveUsers(users)` is called with the **full array** of all users. The Neon upsert loop then fires one database call **per user, every single time any user is saved**. If there are 100 users and one logs in, 100 Neon upserts are fired simultaneously.
- **Impact:** Unnecessary Neon connection pool exhaustion, latency spikes on every login/register.
- **Fix Step-by-Step:**
  1. Remove the `for` loop from `saveUsers`.
  2. Add a `saveSingleUserToNeon(user: UserRecord)` helper called only where a new/updated user is created:
  ```ts
  // In createUser(), after users.push(newUser); saveUsers(users):
  upsertUserInNeon(newUser).catch((err) =>
    console.warn(`[UserDb] Failed to sync new user to Neon:`, err)
  );

  // In findOrCreateOAuthUser(), after users.push(newUser); saveUsers(users):
  upsertUserInNeon(newUser).catch((err) =>
    console.warn(`[UserDb] Failed to sync OAuth user to Neon:`, err)
  );
  ```

---

### BUG-03: `findUserByEmail` Only Checks File/Memory Cache — Misses Neon Users After Deploy

- **File:** `src/lib/auth/userDb.ts` (Lines 73–97)
- **Issue:** `loadUsers()` is synchronous and **only reads from the local JSON file**. The `syncWithNeon()` is fire-and-forget, so the cache isn't populated from Neon before the first login attempt. A user registered from a different server instance will get "Invalid email or password" even though their account exists in Neon.
- **Impact:** Login failures after every new deployment on serverless hosting (Vercel). Critical data loss perception.
- **Fix Step-by-Step:**
  1. Make `findUserByEmail` async and query Neon directly on cache miss:
  ```ts
  export async function findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.toLowerCase().trim();
    // 1. Fast path: in-memory cache
    if (cachedUsers) {
      const found = cachedUsers.find((u) => u.email.toLowerCase() === normalized);
      if (found) return found;
    }
    // 2. Authoritative source: Neon Postgres
    try {
      const neonUsers = await getUsersFromNeon<UserRecord>();
      if (neonUsers.length > 0) cachedUsers = neonUsers;
      return neonUsers.find((u) => u.email.toLowerCase() === normalized) || null;
    } catch {
      return null;
    }
  }
  ```
  2. Update all API route callers to `await findUserByEmail(email)`.

---

### BUG-04: Payment Webhook Handler Does Nothing on `payment.captured`

- **File:** `src/app/api/payment/webhook/route.ts` (Lines 29–32)
- **Issue:** The `payment.captured` / `order.paid` block is completely empty — only a comment.
- **Impact:** Successful payments are never recorded. Orders are never fulfilled. No customer notification. In production, money is taken but nothing happens.
- **Fix Step-by-Step:**
  1. Implement order recording inside the event handler:
  ```ts
  if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
    const paymentEntity = payload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;
    // 1. Save to Neon app_orders table
    // 2. Trigger Shiprocket order creation
    // 3. Send confirmation email
    console.log(`[Webhook] Payment captured: orderId=${orderId}, paymentId=${paymentId}`);
  }
  ```
  2. At minimum, add logging so captured payments are visible in server logs.

---

### BUG-05: Hardcoded Demo Credentials Pre-fill Checkout Form

- **File:** `src/components/layout/CheckoutModal.tsx` (Lines 46–54)
- **Issue:** The checkout form is pre-filled with fake demo data: `'Arjun Verma'`, `'arjun.streetwear@example.com'`, `'9876543210'`, `'arjun@okhdfcbank'`, etc. — hardcoded as default `useState` values.
- **Impact:** Real customers checking out will see demo data pre-filled and may accidentally submit orders with wrong details.
- **Fix Step-by-Step:**
  1. Change all initial `useState` values to empty strings:
  ```ts
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [upiId, setUpiId] = useState('');
  ```
  2. Auto-fill from logged-in user optionally:
  ```ts
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  ```

---

### BUG-06: Admin Quick Login Leaks Password in Client Bundle

- **File:** `src/app/admin/layout.tsx` (Lines 80–87, 145–158)
- **Issue:** `handleQuickAdminLogin` calls `login('admin@goatednation.com', 'Admin@123')` directly in a `'use client'` component. The admin password is bundled into the JavaScript served to every browser.
- **Impact:** Anyone who opens DevTools can extract admin credentials from the JS bundle.
- **Fix Step-by-Step:**
  1. Delete the entire `handleQuickAdminLogin` function (lines 80–87).
  2. Delete the entire quick-login button block (lines 145–158) in the JSX.
  3. Remove `quickLoginLoading` state (line 43).

---

### BUG-07: `api/admin/oauth-config` Writes to `.env.local` at Runtime

- **File:** `src/app/api/admin/oauth-config/route.ts` (Lines 41–58)
- **Issue:** The POST handler reads and writes `.env.local` via `fs.writeFileSync`. This fails silently on Vercel (read-only filesystem) and doesn't propagate across serverless instances.
- **Impact:** Admin thinks credentials are saved; they aren't. Changes lost on every redeploy.
- **Fix Step-by-Step:**
  1. Remove all `fs` import and file-write logic from the route.
  2. Create an `app_settings` table in Neon:
  ```sql
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
  ```
  3. Store/retrieve `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from `app_settings` via Neon.

---

### BUG-08: `ShippingLedger` Duplicates Records Under Multiple Keys

- **File:** `src/lib/shippingLedger.ts` (Lines 72–74)
- **Issue:** The same `ShipmentRecord` is stored under THREE keys simultaneously (`orderId`, `awbCode`, `shipmentId`), creating 3x data redundancy and potential inconsistency.
- **Impact:** Data corruption when records diverge across different keys.
- **Fix:** Store under a single canonical key (`orderId`) and add lightweight index maps for `awbCode` → `orderId` lookup. Better: migrate to Neon `app_shipping_orders` table.

---

## SECTION 2: SECURITY VULNERABILITIES

### SEC-01: CMS POST Endpoint Has Auth Bypass in Dev/LAN Mode

- **File:** `src/app/api/cms/route.ts` (Lines 29–46)
- **Issue:** Unauthenticated writes are allowed when `NODE_ENV !== 'production'` OR when host contains `localhost/192.168./10./172.`. Anyone on the same Wi-Fi can overwrite the entire storefront without credentials.
- **Impact:** Complete CMS content takeover by any LAN device.
- **Fix:**
  ```ts
  // Remove the isDev / isLocalNetwork bypass entirely.
  // Always enforce JWT:
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Administrator clearance required.' },
      { status: 401 }
    );
  }
  ```

---

### SEC-02: Identical Auth Bypass in Media Upload Route

- **File:** `src/app/api/media/upload/route.ts` (Lines 30–46)
- **Issue:** Same `isDev || isLocalNetwork` bypass as SEC-01. Any LAN device can upload arbitrary files to your Cloudinary without authentication.
- **Impact:** Unauthorized file uploads, storage quota abuse, potential malicious file injection.
- **Fix:** Same as SEC-01 — always require a valid ADMIN JWT, remove the bypass.

---

### SEC-03: JWT Stored in `localStorage` — XSS Vulnerability

- **File:** `src/stores/authStore.ts` (Lines 50–51)
- **Issue:** The JWT token is stored in `localStorage` (`gn_auth_token`). `localStorage` is fully accessible to any JavaScript on the page. One XSS vulnerability anywhere on the site enables complete account takeover.
- **Impact:** Complete account takeover for all users.
- **Fix Step-by-Step:**
  1. Remove `localStorage.setItem('gn_auth_token', token)` from `setUser`.
  2. Remove all `localStorage.getItem('gn_auth_token')` reads in `checkAuth`.
  3. Rely exclusively on the HTTP-only cookie set by the login/register endpoints.
  4. Keep `localStorage.getItem('gn_auth_user')` for optimistic user profile display only.

---

### SEC-04: Admin Password Hardcoded in Client-Side React Component

- **File:** `src/app/admin/layout.tsx` (Line 83)
- **Issue:** `'Admin@123'` appears in a `'use client'` component and is compiled into the browser-accessible JS bundle.
- **Impact:** Admin credential exposure to anyone who inspects the page source or JS bundle.
- **Fix:** See BUG-06 — delete the quick-login button and function entirely.

---

### SEC-05: `GOOGLE_CLIENT_ID` Value Exposed in Admin API Response

- **File:** `src/app/api/admin/oauth-config/route.ts` (Lines 15–22)
- **Issue:** The GET response includes `clientId: process.env.GOOGLE_CLIENT_ID`. Knowing the exact OAuth client ID enables targeted phishing attacks.
- **Fix:** Only return the boolean:
  ```ts
  google: {
    configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    // Remove: clientId: process.env.GOOGLE_CLIENT_ID
  }
  ```

---

### SEC-06: Webhook Signature Verification Is Optional — Forgeable Events

- **File:** `src/app/api/payment/webhook/route.ts` (Lines 10–24)
- **Issue:** `if (webhookSecret && signature)` — if either is missing, the webhook processes unauthenticated requests. Anyone can POST a fake `payment.captured` event.
- **Impact:** Free order fulfillment by any attacker who knows the endpoint URL.
- **Fix:** Make verification **mandatory**:
  ```ts
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }
  // Always verify, never skip.
  ```

---

### SEC-07: Open Redirect Risk in OAuth State Parameter

- **File:** `src/app/api/auth/oauth/[provider]/route.ts` (Lines 33–41)
- **Issue:** `stateObj` includes `redirectUri` from the client. If read back in the callback without strict validation, enables open redirect attacks.
- **Impact:** Post-login redirect to attacker-controlled URLs — phishing.
- **Fix:**
  1. Remove `redirectUri` from the state object.
  2. Always reconstruct `redirectUri` server-side from `process.env.SITE_URL`.
  3. Only allow redirect paths in a whitelist (`['/admin', '/', '/account']`).

---

## SECTION 3: REDUNDANT & DEAD CODE

### RED-01: Duplicate Route Re-export File

- **File:** `src/app/api/auth/callback/google/route.ts`
- **Issue:** Contains only `export { GET } from '../../oauth/callback/route';` — a pure re-export that creates a duplicate route for no reason.
- **Action:** Delete this file. Update any `GOOGLE_REDIRECT_URI` env vars using the old path to point to `/api/auth/oauth/callback`.

---

### RED-02: Dead Vercel KV Code Path

- **File:** `src/lib/cms/serverCms.ts` (Lines 63–103)
- **Issue:** `getFromKvStore()` and `saveToKvStore()` implement full Upstash/Vercel KV support, but `KV_REST_API_URL` is not set anywhere. These functions always return `null`/`false` and add ~40 lines of dead code.
- **Action:** Remove `getFromKvStore()`, `saveToKvStore()`, and their call sites from `getPublishedCmsData` and `savePublishedCmsData` if Vercel KV is not planned. Add a comment `// FUTURE: Vercel KV` if you want to keep it as reference.

---

### RED-03: Useless `neonSyncAttempted` Global Flag

- **File:** `src/lib/auth/userDb.ts` (Lines 43–71)
- **Issue:** This module-level boolean resets on every serverless cold start, making it effectively a noop. It prevents re-sync if the first attempt silently fails.
- **Action:** Remove the flag and the `syncWithNeon()` function entirely. Replace with direct async Neon reads in `findUserByEmail` (see BUG-03).

---

### RED-04: `export const dynamic = 'force-dynamic'` on a `'use client'` Page

- **File:** `src/app/admin/products/page.tsx` (Line 3)
- **Issue:** Route segment config has **no effect** on `'use client'` components — client components are always rendered on the client. This line does nothing.
- **Action:** Delete line 3.

---

### RED-05: Unused `StateStorage` Import

- **File:** `src/lib/cms/cmsStore.ts` (Line 2)
- **Issue:** `StateStorage` is imported from `zustand/middleware` but never referenced in the file.
- **Action:** Remove `StateStorage` from the import statement.

---

### RED-06: Local JSON File Fallbacks Are Dead Code on Serverless

- **Files:** `src/lib/auth/userDb.ts`, `src/lib/cms/serverCms.ts`
- **Issue:** All `fs.readFileSync`/`fs.writeFileSync` calls are dead in production serverless environments (Vercel has a read-only filesystem).
- **Action:** Add guards and comments:
  ```ts
  if (process.env.NODE_ENV === 'production') {
    console.warn('[UserDb] Skipping file write — serverless production environment uses Neon.');
    return;
  }
  ```

---

## SECTION 4: ARCHITECTURAL ISSUES & CODE SMELLS

### ARCH-01: In-Memory Rate Limiter Resets on Every Serverless Cold Start

- **File:** `src/app/api/auth/me/route.ts` (Lines 5–17)
- **Issue:** `const rateLimitMap = new Map<...>()` is module-level. In serverless, every new Lambda instance starts with an empty Map. The rate limiter provides **zero protection** in production.
- **Impact:** Unlimited brute-force against `/api/auth/me` in production.
- **Fix Step-by-Step:**
  1. Replace with Neon-based rate limiting or Upstash Redis:
  ```ts
  // Option A: Upstash Redis (1 env var)
  import { Ratelimit } from "@upstash/ratelimit";
  import { Redis } from "@upstash/redis";
  ```
  2. Or move rate limiting to `src/middleware.ts` at the edge.
  3. At minimum, clean up stale Map entries to prevent memory leak:
  ```ts
  if (now > entry.reset) rateLimitMap.delete(ip);
  ```

---

### ARCH-02: `fs.readFileSync` in `loadUsers()` Blocks the Event Loop

- **File:** `src/lib/auth/userDb.ts` (Lines 79–86)
- **Issue:** `fs.existsSync` and `fs.readFileSync` are synchronous blocking calls. During disk I/O (even if fast), ALL other concurrent requests are blocked.
- **Fix:** Convert `loadUsers()` to async using `fs.promises.readFile`. Make all callers async accordingly.

---

### ARCH-03: `globalThis.__SERVER_PUBLISHED_CMS__` Unreliable in Serverless

- **File:** `src/lib/cms/serverCms.ts` (Lines 59–61)
- **Issue:** Storing CMS state in `globalThis` is unreliable in serverless — different invocations may get different instances.
- **Fix:** Rely on Neon reads directly (they're fast via HTTP). Use Next.js route caching (`cache: 'force-cache'` or ISR `revalidate`) instead of `globalThis` for performance.

---

### ARCH-04: Silent Swallowing of Neon Async Errors

- **File:** `src/lib/cms/serverCms.ts` (Lines 135, 147)
- **Issue:** `saveCmsDataToNeon(sanitized).catch(() => {})` silently ignores errors. Admins have no visibility into failed cloud saves.
- **Fix:**
  ```ts
  saveCmsDataToNeon(sanitized).catch((err) => {
    console.error('[CMS] Background Neon sync failed:', err);
    // In production: report to Sentry or monitoring
  });
  ```

---

### ARCH-05: `CheckoutModal.tsx` Is 629 Lines (God Component)

- **File:** `src/components/layout/CheckoutModal.tsx`
- **Issue:** One component handles: form state, Razorpay SDK, pincode serviceability, shipping creation, payment flow, and success state. Unmaintainable and untestable.
- **Fix:** Split into:
  - `hooks/useCheckoutForm.ts` — form state management
  - `hooks/useRazorpay.ts` — SDK loading and payment
  - `CheckoutAddressStep.tsx`, `CheckoutPaymentStep.tsx`, `CheckoutSuccessStep.tsx`

---

### ARCH-06: No Error Boundaries — Full Page Crashes on Any Component Error

- **File:** `src/app/layout.tsx`
- **Issue:** No React Error Boundaries exist. A runtime error anywhere crashes the entire page to a white screen.
- **Fix Step-by-Step:**
  1. Create `src/components/ErrorBoundary.tsx`:
  ```tsx
  'use client';
  import React from 'react';
  export class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean }
  > {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
      if (this.state.hasError)
        return this.props.fallback || <div>Something went wrong. <a href="/">Go home</a></div>;
      return this.props.children;
    }
  }
  ```
  2. Wrap key sections in `page.tsx` and `layout.tsx`.

---

## SECTION 5: NEON POSTGRES INTEGRATION ISSUES

### NEO-01: `initDatabaseSchema()` Called on Every Query

- **File:** `src/lib/db/neon.ts` (Lines 26–72)
- **Issue:** Schema initialization runs on every cold start (3 extra `CREATE TABLE IF NOT EXISTS` queries per request). The `schemaInitialized` flag resets in serverless.
- **Fix:** Run schema migration **once** as a `postdeploy` script:
  ```bash
  # package.json scripts
  "postdeploy": "node scripts/migrate.mjs"
  ```
  Remove `await initDatabaseSchema()` from every query function.

---

### NEO-02: Users Not Available from Neon at First Request After Deploy

- **File:** `src/lib/auth/userDb.ts`
- **Issue:** The fire-and-forget `syncWithNeon()` means the user cache is empty when the first login arrives after a cold start.
- **Fix:** See BUG-03 — make `findUserByEmail` directly async-query Neon as the authoritative source.

---

### NEO-03: All 107 Products Stored as a Single Monolithic JSONB Blob

- **File:** `src/lib/db/neon.ts`, `src/lib/cms/serverCms.ts`
- **Issue:** Every product update rewrites the entire 107-product JSONB blob. Products can't be queried, filtered, or searched via SQL.
- **Fix:** Create a dedicated `app_products` table:
  ```sql
  CREATE TABLE IF NOT EXISTS app_products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    price INTEGER,
    data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
  ```
  Then migrate product CRUD to individual Neon upserts.

---

### NEO-04: No Connection Caching Configuration

- **File:** `src/lib/db/neon.ts` (Line 1)
- **Issue:** `neon(dbUrl)` is called without enabling connection caching for long-running environments.
- **Fix:**
  ```ts
  import { neon, neonConfig } from '@neondatabase/serverless';
  neonConfig.fetchConnectionCache = true;
  ```

---

## SECTION 6: TYPESCRIPT & TYPE SAFETY ISSUES

### TYPE-01: `products: typeof PRODUCTS` — Ties Type to Runtime Data

- **File:** `src/lib/cms/serverCms.ts` (Line 24)
- **Issue:** `typeof PRODUCTS` creates a type tied to the specific runtime array, not a reusable type. Changes to `PRODUCTS` silently change the interface.
- **Fix:**
  ```ts
  import { Product } from '../../types/product';
  // Replace: products: typeof PRODUCTS;
  // With:    products: Product[];
  ```

---

### TYPE-02: `getCmsDataFromNeon` Has Loose Generic Default

- **File:** `src/lib/db/neon.ts` (Line 77)
- **Issue:** Default generic `T = Record<string, unknown>` provides no type safety for unspecified callers.
- **Fix:** Change default to `PublishedCmsData`.

---

### TYPE-03: `upsertUserInNeon` Accepts `role: string` Instead of `UserRole`

- **File:** `src/lib/db/neon.ts` (Line 146)
- **Issue:** Allows invalid role values to be stored in the database.
- **Fix:**
  ```ts
  import { UserRole } from '../../types/auth';
  role: UserRole; // not: role: string
  ```

---

### TYPE-04: `rateLimitMap` Grows Without Bound — Memory Leak

- **File:** `src/app/api/auth/me/route.ts` (Line 6)
- **Issue:** Expired entries are never removed from the Map. Grows indefinitely with unique IPs.
- **Fix:**
  ```ts
  if (now > entry.reset) {
    rateLimitMap.delete(ip); // Prune expired entries
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  ```

---

### TYPE-05: Optional `payload.avatar` Used as Required `string`

- **File:** `src/app/api/auth/me/route.ts` (Line 79)
- **Issue:** `avatar: payload.avatar` — `JwtPayload.avatar` is `avatar?: string` but returned as a required field.
- **Fix:** `avatar: payload.avatar ?? ''`

---

## SECTION 7: PRODUCTION READINESS GAPS

### PROD-01: No Content Security Policy (CSP) Headers

- **Issue:** No `Content-Security-Policy` header is set. The site is fully open to XSS attacks via script injection.
- **Fix:** Add to `middleware.ts`:
  ```ts
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; img-src 'self' data: https://res.cloudinary.com; connect-src 'self' https://api.razorpay.com;"
  );
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  ```

---

### PROD-02: No Input Sanitization (Stored XSS Risk)

- **Issue:** User-supplied strings (name, address, etc.) are stored in Neon without sanitization. While Neon tagged templates prevent SQL injection, stored XSS is possible.
- **Fix:**
  ```bash
  npm install sanitize-html
  ```
  ```ts
  import sanitizeHtml from 'sanitize-html';
  const safeName = sanitizeHtml(params.name, { allowedTags: [] });
  ```

---

### PROD-03: No `next.config.ts` Image Domain Allowlist

- **Issue:** No `next.config.ts` was found with `images.remotePatterns`. Cloudinary and Google avatar images will fail in production builds.
- **Fix:** Create `animestreet/next.config.ts`:
  ```ts
  const nextConfig = {
    images: {
      remotePatterns: [
        { protocol: 'https', hostname: 'res.cloudinary.com' },
        { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
        { protocol: 'https', hostname: 'cdn.shopify.com' },
      ],
    },
  };
  export default nextConfig;
  ```

---

### PROD-04: No Order Persistence in Database

- **Issue:** After a successful Razorpay payment, **no order record is created anywhere**. No order history, no admin orders panel, no fulfillment trail.
- **Fix:** Create `app_orders` table in Neon and write to it after payment capture:
  ```sql
  CREATE TABLE IF NOT EXISTS app_orders (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    shiprocket_order_id TEXT,
    awb_code TEXT,
    status TEXT DEFAULT 'PENDING',
    items JSONB NOT NULL,
    shipping_address JSONB,
    total_amount INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
  ```

---

### PROD-05: Next.js Version Has Known Security Vulnerability

- **Issue:** Next.js `16.4.3` has a flagged security advisory shown during every `npm run build`.
- **Fix:**
  ```bash
  cd animestreet
  next upgrade --agent=security
  # OR:
  npm install next@latest
  ```

---

### PROD-06: No CSRF Protection on Mutation Routes

- **Issue:** POST routes for `/api/auth/login`, `/api/auth/register`, and `/api/cms` have no CSRF token verification. `sameSite: 'lax'` is not sufficient for all CSRF vectors.
- **Fix:** Change cookie `sameSite` from `'lax'` to `'strict'` on all auth cookies, or implement CSRF token header requirement.

---

### PROD-07: `console.log`/`console.warn` Throughout Server-Side Production Code

- **Files:** `src/lib/db/neon.ts`, `src/lib/auth/userDb.ts`, `src/lib/cms/serverCms.ts`, `src/lib/shiprocket.ts`
- **Issue:** Dozens of unstructured `console.*` calls expose internal system information in production logs.
- **Fix:**
  1. Create `src/lib/logger.ts`:
  ```ts
  const isDev = process.env.NODE_ENV !== 'production';
  export const logger = {
    info: (...args: unknown[]) => isDev && console.log('[INFO]', ...args),
    warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
    error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  };
  ```
  2. Replace all `console.*` in `src/lib/` with `logger.*`.

---

## SUMMARY TABLE

| ID | Category | Severity | File | Action |
|---|---|---|---|---|
| BUG-01 | Spin-Wait Loop | 🔴 Critical | `serverCms.ts:219` | Fix immediately |
| BUG-02 | N+1 Neon Writes on Save | 🔴 Critical | `userDb.ts:108` | Fix immediately |
| BUG-03 | Stale User Cache Misses Neon | 🔴 Critical | `userDb.ts:73` | Fix immediately |
| BUG-04 | Webhook Does Nothing | 🟠 High | `payment/webhook/route.ts:30` | Fix this week |
| BUG-05 | Hardcoded Demo Checkout Data | 🟠 High | `CheckoutModal.tsx:46` | Fix immediately |
| BUG-06 | Admin Password in JS Bundle | 🔴 Critical | `admin/layout.tsx:83` | Fix immediately |
| BUG-07 | Runtime `.env.local` Writes | 🟠 High | `oauth-config/route.ts:41` | Fix this week |
| BUG-08 | Duplicate Ledger Keys | 🟡 Medium | `shippingLedger.ts:72` | Fix this month |
| SEC-01 | CMS Auth Bypass on LAN | 🔴 Critical | `api/cms/route.ts:38` | Fix immediately |
| SEC-02 | Media Upload Auth Bypass | 🔴 Critical | `media/upload/route.ts:39` | Fix immediately |
| SEC-03 | JWT in localStorage | 🔴 Critical | `authStore.ts:50` | Fix immediately |
| SEC-04 | Admin Password in Bundle | 🔴 Critical | `admin/layout.tsx:83` | Fix immediately |
| SEC-05 | OAuth ClientId Leaked | 🟡 Medium | `oauth-config/route.ts:19` | Fix this week |
| SEC-06 | Webhook Sig Verification Optional | 🔴 Critical | `payment/webhook/route.ts:10` | Fix immediately |
| SEC-07 | Open Redirect in OAuth State | 🟠 High | `oauth/[provider]/route.ts:34` | Fix this week |
| RED-01 | Dead Route Re-export File | 🟢 Low | `callback/google/route.ts` | Delete file |
| RED-02 | Dead KV Code Path | 🟢 Low | `serverCms.ts:63` | Remove |
| RED-03 | Useless `neonSyncAttempted` | 🟡 Medium | `userDb.ts:43` | Remove |
| RED-04 | `dynamic` on Client Page | 🟢 Low | `admin/products/page.tsx:3` | Remove line |
| RED-05 | Unused `StateStorage` Import | 🟢 Low | `cmsStore.ts:2` | Remove import |
| ARCH-01 | In-Memory Rate Limiter | 🔴 Critical | `api/auth/me/route.ts:5` | Replace with Neon/Redis |
| ARCH-02 | Sync File Read Blocks Loop | 🟠 High | `userDb.ts:79` | Make async |
| ARCH-05 | 629-line God Component | 🟡 Medium | `CheckoutModal.tsx` | Refactor |
| ARCH-06 | No Error Boundaries | 🟠 High | `layout.tsx` | Add ErrorBoundary |
| NEO-01 | Schema Init on Every Query | 🟡 Medium | `db/neon.ts:26` | Migrate to postdeploy |
| NEO-03 | Products as JSONB Blob | 🟠 High | `db/neon.ts` | Add `app_products` table |
| TYPE-01 | `typeof PRODUCTS` Wrong Type | 🟡 Medium | `serverCms.ts:24` | Use `Product[]` |
| TYPE-04 | Rate Limit Map Memory Leak | 🟠 High | `api/auth/me/route.ts:6` | Add cleanup |
| PROD-01 | No CSP Headers | 🔴 Critical | `middleware.ts` | Add headers |
| PROD-04 | No Order Persistence | 🔴 Critical | `CheckoutModal.tsx` | Add `app_orders` table |
| PROD-05 | Next.js Security Advisory | 🔴 Critical | `package.json` | Upgrade Next.js |

---

## RECOMMENDED FIX ORDER (Priority Queue)

### Immediate (Fix Today)
1. **PROD-05** — `cd animestreet && next upgrade --agent=security`
2. **SEC-01 + SEC-02** — Remove auth bypass from CMS and upload routes
3. **BUG-05 + BUG-06 / SEC-04** — Remove hardcoded demo checkout data and admin password
4. **SEC-06** — Make Razorpay webhook signature verification mandatory
5. **SEC-03** — Remove JWT from `localStorage`, rely only on HTTP-only cookie
6. **BUG-01** — Replace spin-wait with `await new Promise(r => setTimeout(r, 35))`

### This Week
7. **PROD-01** — Add CSP + security headers in `middleware.ts`
8. **BUG-03 + NEO-02** — Make `findUserByEmail` async and Neon-first
9. **BUG-02** — Fix N+1 Neon upserts in `saveUsers`
10. **BUG-04** — Implement webhook order recording logic
11. **SEC-07** — Remove `redirectUri` from OAuth state, reconstruct server-side
12. **ARCH-01** — Replace in-memory rate limiter
13. **BUG-07** — Replace `.env.local` file writes with Neon `app_settings` table

### This Month
14. **PROD-04** — Create `app_orders` table and persist orders
15. **NEO-03** — Migrate products to dedicated `app_products` table
16. **PROD-03** — Create `next.config.ts` with image domain allowlist
17. **ARCH-06** — Add `ErrorBoundary` components
18. **ARCH-02** — Make `loadUsers()` async
19. **ARCH-05** — Refactor `CheckoutModal.tsx` into smaller components
20. **RED-01..06** — Clean up dead code, unused imports, and redundant patterns
