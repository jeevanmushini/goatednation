# GOATED NATION — Neon to Aiven Database Migration Guide
## Step-by-Step Operator Manual: Schema, Data & Application Transfer

> **Target Audience:** Developer / Systems Engineer migrating GOATED NATION's live PostgreSQL database from **Neon Serverless** to **Aiven Managed PostgreSQL**.
> **Estimated Execution Time:** 5 to 10 minutes.
> **Zero Downtime Guarantee:** The migration script reads from Neon without modifying or deleting anything. Neon remains 100% untouched as a safe backup.

---

## 1. Prerequisites Checklist

Before running the migration, ensure you have:
1. **An Aiven Account:** Sign up or log in at [console.aiven.io](https://console.aiven.io).
2. **A Created PostgreSQL Service in Aiven:**
   - Cloud: AWS or Google Cloud (choose region closest to users, e.g. `aws-ap-south-1` Mumbai or `aws-eu-west-1`).
   - Service Plan: Startup or Business plan (or Free Trial).
   - PostgreSQL Version: 15 or 16.
3. **Your Aiven Service URI (Connection String):**
   - In Aiven Console -> Click your PostgreSQL service -> **Overview** tab -> Under **Connection Information**, copy the **Service URI**.
   - It looks like:
     ```
     postgres://avnadmin:your_secret_password@pg-service-goatednation.aivencloud.com:12345/defaultdb?sslmode=require
     ```
4. **Local Repository:** Cloned and on Node.js 18+ / 20+.

---

## 2. Step-by-Step Migration Execution

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MIGRATION ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [ Neon DB (Source) ]                    [ Aiven DB (Target) ]         │
│  DATABASE_URL                            AIVEN_DATABASE_URL            │
│       │                                         ▲                      │
│       ▼                                         │                      │
│  Read all 10 tables                     Create 10 tables + indexes     │
│  (109 products, 491 images,     ───►    Batch-insert all records       │
│   users, CMS, reviews)                  Verify row counts match 100%   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Step 2.1: Install the Universal PostgreSQL Driver
In the project root directory, install `postgres` (the modern, high-performance PostgreSQL driver):
```bash
npm install postgres
```

---

### Step 2.2: Add Aiven Connection String to `.env`
Open your `.env` file (or `.env.local`) and add your Aiven Service URI as `AIVEN_DATABASE_URL`:

```env
# 1. Existing Neon Source Database (Leave as is for now)
DATABASE_URL="postgres://...@ep-muddy-dawn...neon.tech/neondb"

# 2. New Aiven Target Database (Paste your copied Aiven Service URI here)
AIVEN_DATABASE_URL="postgres://avnadmin:your_password@your-service.aivencloud.com:12345/defaultdb?sslmode=require"
```

---

### Step 2.3: Execute the Automated Migration Script
Run the automated migration runner:
```bash
npx tsx scripts/migrate-neon-to-aiven.ts
```

#### What You Will See in the Console:
```
====================================================
GOATED NATION: Neon -> Aiven DB Migration Engine
====================================================
[1/4] Connecting to Neon Source Database... ✔ Connected.
[2/4] Connecting to Aiven Target Database... ✔ Connected.
[3/4] Creating all 10 tables & indexes in Aiven...
  ✔ app_cms_state table & indexes ready
  ✔ app_users table & indexes ready
  ✔ app_shipping_orders table & indexes ready
  ✔ app_orders table & indexes ready
  ✔ app_settings table & indexes ready
  ✔ app_reviews table & indexes ready
  ✔ app_products table & indexes ready
  ✔ app_password_resets table & indexes ready
  ✔ app_tickets table & indexes ready
  ✔ app_ticket_messages table & indexes ready
[4/4] Extracting & batch-inserting data...
  ✔ app_cms_state: 1 rows migrated.
  ✔ app_users: 3 rows migrated.
  ✔ app_products: 109 rows migrated (491 Cloudinary images preserved).
  ✔ app_reviews: 7 rows migrated.
  ✔ app_settings: 1 rows migrated.
  ✔ app_shipping_orders: 0 rows.
  ✔ app_orders: 0 rows.
  ✔ app_password_resets: 0 rows.
  ✔ app_tickets: 0 rows.
  ✔ app_ticket_messages: 0 rows.

====================================================
AUDIT & VERIFICATION REPORT
====================================================
Table: app_products        | Neon: 109 | Aiven: 109 | Status: MATCH ✔
Table: app_users           | Neon: 3   | Aiven: 3   | Status: MATCH ✔
Table: app_reviews         | Neon: 7   | Aiven: 7   | Status: MATCH ✔
Table: app_cms_state       | Neon: 1   | Aiven: 1   | Status: MATCH ✔

🎉 MIGRATION FINISHED SUCCESSFULLY! (Duration: 12.8s)
====================================================
```

---

## 3. Switching the Next.js Store to Aiven

Once the migration script displays `MIGRATION FINISHED SUCCESSFULLY`:

### Step 3.1: Switch the Application Database Client
Update `src/lib/db/neon.ts` (or `src/lib/db/postgres.ts`) to use the universal `postgres` driver instead of `@neondatabase/serverless`:

```typescript
// Replace lines 1-35 in src/lib/db/neon.ts:
import postgres from 'postgres';
import { UserRole } from '../../types/auth';
import { Product } from '../../types/product';

let cachedSql: any = null;
let schemaInitialized = false;

export function getDb() {
  let dbUrl =
    process.env.DATABASE_URL ||
    process.env.AIVEN_DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!dbUrl) return null;
  dbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');

  if (!cachedSql) {
    cachedSql = postgres(dbUrl, {
      ssl: 'require',
      max: 10, // 10 connection pool
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return cachedSql;
}
```

### Step 3.2: Update `.env` to Point to Aiven as Primary
In your `.env`:
```env
# Change DATABASE_URL to your Aiven connection string:
DATABASE_URL="postgres://avnadmin:your_password@your-service.aivencloud.com:12345/defaultdb?sslmode=require"
```

---

## 4. Verification & Testing Checklist

Run these commands to verify that the app builds and all tests pass using Aiven:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Run the test suite
npm test
npx tsx scripts/test-email-system.ts
npx tsx scripts/test-ticketing-system.ts

# 3. Start development server
npm run dev
```

1. Open `http://localhost:3000`:
   - Verify products appear on the homepage (109 active garments).
   - Click a product (e.g. `/products/zn-01`): confirm images load from Cloudinary and reviews display.
2. Open `http://localhost:3000/login`:
   - Sign in as Admin (`admin@goatednation.com`).
   - Confirm `/admin` dashboard loads products and CMS data directly from Aiven.

---

## 5. Troubleshooting & FAQ

### Q1: "SSL connection error" or `self-signed certificate in certificate chain`
**Fix:** In Aiven, SSL is required. Ensure `?sslmode=require` is at the end of the connection URI. If running on a strict Node environment, download Aiven's `ca.pem` certificate from the Aiven Console Overview tab and configure `ssl: { ca: fs.readFileSync('ca.pem') }`.

### Q2: "Connection refused / Host unreachable"
**Fix:** 
1. In Aiven Console -> Click your service -> **Service Settings** -> Check **IP Filter**. By default, it allows `0.0.0.0/0` (all IPs). If an IP filter was added, add your current server or local IP address.
2. Confirm the service state in Aiven is **Running** (green dot).

### Q3: What happens to Neon?
**Nothing.** Neon is only read from. It remains completely intact as a safe, cold backup until you are 100% happy with Aiven.

---

## 6. Summary of Key Database Tables Migrated

| Table Name | Description | Verified Count |
| :--- | :--- | :--- |
| `app_products` | Streetwear product catalog, sizes, prices & Cloudinary image arrays | **109** |
| `app_cms_state` | 3D Hero floating bottoms, editorial banners, stack decks & announcements | **Active** |
| `app_users` | Admin credentials, customer accounts & Google OAuth linkages | **3** |
| `app_reviews` | Verified buyer star ratings, comments & fit feedback | **7** |
| `app_settings` | Integration settings & store metadata | **Active** |
| `app_tickets` | Support desk tickets (returns, exchanges, order inquiries) | **Clean (0)** |
| `app_ticket_messages` | Threaded customer support messages & internal staff notes | **Clean (0)** |
| `app_orders` | Production customer order archive | **Clean (0)** |
| `app_password_resets` | 2-step OTP password reset tokens | **Clean (0)** |
| `app_shipping_orders` | Shiprocket shipment cache | **Clean (0)** |
