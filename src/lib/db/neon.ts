import { neon, neonConfig, NeonQueryFunction } from '@neondatabase/serverless';
import { UserRole } from '../../types/auth';

// Enable connection caching for optimal latency and reuse across serverless requests (NEO-04)
neonConfig.fetchConnectionCache = true;

let cachedSql: NeonQueryFunction<false, false> | null = null;
let schemaInitialized = false;

/**
 * Returns a configured Neon SQL client if DATABASE_URL is available.
 * Returns null if DATABASE_URL is not set.
 */
export function getDb(): NeonQueryFunction<false, false> | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return null;
  }

  if (!cachedSql) {
    cachedSql = neon(dbUrl);
  }
  return cachedSql;
}

/**
 * Ensures required database tables exist in Neon Postgres.
 * Creates app_cms_state, app_users, app_shipping_orders, app_orders, and app_settings if they do not exist.
 */
export async function initDatabaseSchema(): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  if (schemaInitialized) return true;

  try {
    // 1. CMS State Table
    await sql`
      CREATE TABLE IF NOT EXISTS app_cms_state (
        key TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'CUSTOMER',
        avatar TEXT,
        provider TEXT NOT NULL DEFAULT 'credentials',
        salt TEXT,
        password_hash TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Shipping Orders Table
    await sql`
      CREATE TABLE IF NOT EXISTS app_shipping_orders (
        order_id TEXT PRIMARY KEY,
        tracking_data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Production Orders Table (PROD-04)
    await sql`
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 5. System & Integration Settings Table (BUG-07)
    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 6. Product Reviews Table
    await sql`
      CREATE TABLE IF NOT EXISTS app_reviews (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT,
        rating INTEGER NOT NULL,
        title TEXT NOT NULL,
        comment TEXT NOT NULL,
        fit_feedback TEXT DEFAULT 'TRUE_TO_SIZE',
        verified_purchase BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    schemaInitialized = true;
    return true;
  } catch (error) {
    console.error('[Neon Postgres] Schema initialization error:', error);
    return false;
  }
}

/**
 * Fetches published CMS state directly from Neon Postgres.
 */
export async function getCmsDataFromNeon<T = Record<string, unknown>>(): Promise<T | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT data FROM app_cms_state WHERE key = 'published_cms' LIMIT 1;
    `;
    if (rows && rows.length > 0 && rows[0].data) {
      return rows[0].data as T;
    }
    return null;
  } catch (error) {
    console.error('[Neon Postgres] Error reading CMS state:', error);
    return null;
  }
}

/**
 * Persists published CMS state directly into Neon Postgres.
 */
export async function saveCmsDataToNeon(data: unknown): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const jsonString = JSON.stringify(data);
    await sql`
      INSERT INTO app_cms_state (key, data, updated_at)
      VALUES ('published_cms', ${jsonString}::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (error) {
    console.error('[Neon Postgres] Error saving CMS state:', error);
    return false;
  }
}

/**
 * Fetches all user records from Neon Postgres.
 */
export async function getUsersFromNeon<T = unknown>(): Promise<T[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT id, name, email, role, avatar, provider, salt, password_hash as "passwordHash", created_at as "createdAt"
      FROM app_users
      ORDER BY created_at ASC;
    `;
    return rows as unknown as T[];
  } catch (error) {
    console.error('[Neon Postgres] Error reading users:', error);
    return [];
  }
}

/**
 * Fetches a single user by email from Neon Postgres.
 */
export async function getSingleUserByEmailFromNeon<T = unknown>(email: string): Promise<T | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT id, name, email, role, avatar, provider, salt, password_hash as "passwordHash", created_at as "createdAt"
      FROM app_users
      WHERE LOWER(email) = ${email.toLowerCase().trim()}
      LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      return rows[0] as unknown as T;
    }
    return null;
  } catch (error) {
    console.error('[Neon Postgres] Error reading user by email:', error);
    return null;
  }
}

/**
 * Inserts or updates a user in Neon Postgres.
 */
export async function upsertUserInNeon(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  provider?: string;
  salt?: string;
  passwordHash?: string;
  createdAt?: string;
}): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    await sql`
      INSERT INTO app_users (id, name, email, role, avatar, provider, salt, password_hash, created_at)
      VALUES (
        ${user.id},
        ${user.name},
        ${user.email.toLowerCase().trim()},
        ${user.role || 'CUSTOMER'},
        ${user.avatar || ''},
        ${user.provider || 'credentials'},
        ${user.salt || null},
        ${user.passwordHash || null},
        ${user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()}
      )
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        avatar = EXCLUDED.avatar,
        provider = EXCLUDED.provider,
        salt = COALESCE(EXCLUDED.salt, app_users.salt),
        password_hash = COALESCE(EXCLUDED.password_hash, app_users.password_hash);
    `;
    return true;
  } catch (error) {
    console.error('[Neon Postgres] Error upserting user:', error);
    return false;
  }
}

/**
 * Saves or updates an order in Neon Postgres (PROD-04).
 */
export async function saveOrderToNeon(order: {
  id: string;
  userEmail?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shiprocketOrderId?: string;
  awbCode?: string;
  status?: string;
  items: unknown;
  shippingAddress?: unknown;
  totalAmount?: number;
}): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const itemsJson = JSON.stringify(order.items || []);
    const addressJson = JSON.stringify(order.shippingAddress || {});
    await sql`
      INSERT INTO app_orders (
        id, user_email, razorpay_order_id, razorpay_payment_id,
        shiprocket_order_id, awb_code, status, items, shipping_address, total_amount, created_at
      )
      VALUES (
        ${order.id},
        ${order.userEmail || null},
        ${order.razorpayOrderId || null},
        ${order.razorpayPaymentId || null},
        ${order.shiprocketOrderId || null},
        ${order.awbCode || null},
        ${order.status || 'PENDING'},
        ${itemsJson}::jsonb,
        ${addressJson}::jsonb,
        ${order.totalAmount || 0},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id)
      DO UPDATE SET
        razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, app_orders.razorpay_payment_id),
        shiprocket_order_id = COALESCE(EXCLUDED.shiprocket_order_id, app_orders.shiprocket_order_id),
        awb_code = COALESCE(EXCLUDED.awb_code, app_orders.awb_code),
        status = EXCLUDED.status;
    `;
    return true;
  } catch (error) {
    console.error('[Neon Postgres] Error saving order:', error);
    return false;
  }
}

/**
 * Retrieves a setting value from Neon Postgres app_settings (BUG-07).
 */
export async function getSettingFromNeon(key: string): Promise<string | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT value FROM app_settings WHERE key = ${key} LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      return rows[0].value as string;
    }
    return null;
  } catch (error) {
    console.error(`[Neon Postgres] Error reading setting ${key}:`, error);
    return null;
  }
}

/**
 * Persists a setting value to Neon Postgres app_settings (BUG-07).
 */
export async function saveSettingToNeon(key: string, value: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    await sql`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error saving setting ${key}:`, error);
    return false;
  }
}

/**
 * Persists shipping order and tracking state to Neon Postgres (BUG-08).
 */
export async function saveShippingOrderToNeon(orderId: string, trackingData: unknown): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const dataJson = JSON.stringify(trackingData || {});
    await sql`
      INSERT INTO app_shipping_orders (order_id, tracking_data, updated_at)
      VALUES (${orderId}, ${dataJson}::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (order_id)
      DO UPDATE SET tracking_data = EXCLUDED.tracking_data, updated_at = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error saving shipping order ${orderId}:`, error);
    return false;
  }
}

/**
 * Retrieves shipping tracking record by orderId from Neon Postgres (BUG-08).
 */
export async function getShippingOrderFromNeon<T = unknown>(orderId: string): Promise<T | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT tracking_data as "trackingData" FROM app_shipping_orders WHERE order_id = ${orderId} LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      return rows[0].trackingData as T;
    }
    return null;
  } catch (error) {
    console.error(`[Neon Postgres] Error reading shipping order ${orderId}:`, error);
    return null;
  }
}

export interface ReviewRecord {
  id: string;
  productId: string;
  authorName: string;
  authorEmail?: string;
  rating: number;
  title: string;
  comment: string;
  fitFeedback?: string;
  verifiedPurchase?: boolean;
  createdAt?: string;
}

/**
 * Fetches all reviews for a product from Neon Postgres.
 */
export async function getReviewsFromNeon(productId: string): Promise<ReviewRecord[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT 
        id, 
        product_id as "productId", 
        author_name as "authorName", 
        author_email as "authorEmail", 
        rating, 
        title, 
        comment, 
        fit_feedback as "fitFeedback", 
        verified_purchase as "verifiedPurchase", 
        created_at as "createdAt"
      FROM app_reviews
      WHERE product_id = ${productId}
      ORDER BY created_at DESC;
    `;
    return rows as unknown as ReviewRecord[];
  } catch (error) {
    console.error(`[Neon Postgres] Error reading reviews for ${productId}:`, error);
    return [];
  }
}

/**
 * Inserts a new review into Neon Postgres.
 */
export async function addReviewToNeon(review: ReviewRecord): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    await sql`
      INSERT INTO app_reviews (
        id, product_id, author_name, author_email, rating, title, comment, fit_feedback, verified_purchase, created_at
      )
      VALUES (
        ${review.id},
        ${review.productId},
        ${review.authorName},
        ${review.authorEmail || null},
        ${review.rating},
        ${review.title},
        ${review.comment},
        ${review.fitFeedback || 'TRUE_TO_SIZE'},
        ${review.verifiedPurchase ?? true},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO NOTHING;
    `;
    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error adding review for ${review.productId}:`, error);
    return false;
  }
}
