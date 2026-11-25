import postgres from 'postgres';
import crypto from 'crypto';
import { UserRole } from '../../types/auth';
import { Product } from '../../types/product';
import { Ticket, TicketMessage, TicketMetrics } from '../../types/ticket';

// Authoritative Aiven Managed PostgreSQL SQL Client
let cachedSql: any = null;
let schemaInitialized = true;

/**
 * Returns a configured SQL client for Aiven Managed PostgreSQL.
 * Returns null if database URL is not set.
 */
export function getDb(): any {
  let dbUrl =
    process.env.AIVEN_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!dbUrl) {
    return null;
  }

  // Strip wrapping quotes if string was copied with quotes into Vercel dashboard
  dbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');

  if (!cachedSql) {
    cachedSql = postgres(dbUrl, {
      ssl: 'require',
      max: 3,
      idle_timeout: 10,
      connect_timeout: 5,
      prepare: false,
    });
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

    // 7. Dedicated Products Table
    await sql`
      CREATE TABLE IF NOT EXISTS app_products (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        anime TEXT NOT NULL,
        category TEXT NOT NULL,
        price NUMERIC NOT NULL,
        original_price NUMERIC NOT NULL,
        discount_percent INTEGER DEFAULT 0,
        rating NUMERIC DEFAULT 4.9,
        review_count INTEGER DEFAULT 0,
        badge TEXT,
        is_new_drop BOOLEAN DEFAULT FALSE,
        images JSONB NOT NULL DEFAULT '[]'::jsonb,
        description TEXT,
        details JSONB NOT NULL DEFAULT '{}'::jsonb,
        sizes JSONB NOT NULL DEFAULT '["S","M","L","XL","XXL"]'::jsonb,
        colors JSONB NOT NULL DEFAULT '[]'::jsonb,
        in_stock BOOLEAN DEFAULT TRUE,
        stock_count INTEGER DEFAULT 10,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON app_products(category);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_slug ON app_products(slug);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_is_new_drop ON app_products(is_new_drop);`;

    // 8. Password Reset OTP Table
    await sql`
      CREATE TABLE IF NOT EXISTS app_password_resets (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_pwd_resets_email ON app_password_resets(email);`;

    // 9. Customer Support Tickets Table
    await sql`
      CREATE TABLE IF NOT EXISTS app_tickets (
        id TEXT PRIMARY KEY,
        ticket_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        order_id TEXT,
        category TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'MEDIUM',
        status TEXT NOT NULL DEFAULT 'OPEN',
        subject TEXT NOT NULL,
        initial_message TEXT NOT NULL,
        attachments JSONB DEFAULT '[]'::jsonb,
        telemetry JSONB DEFAULT '{}'::jsonb,
        exchange_details JSONB DEFAULT '{}'::jsonb,
        payment_details JSONB DEFAULT '{}'::jsonb,
        shiprocket_awb TEXT,
        resolution_notes TEXT,
        customer_rating INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITH TIME ZONE
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_email ON app_tickets(customer_email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_status ON app_tickets(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_priority ON app_tickets(priority);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON app_tickets(order_id);`;

    // 10. Threaded Ticket Messages Table
    await sql`
      CREATE TABLE IF NOT EXISTS app_ticket_messages (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL REFERENCES app_tickets(id) ON DELETE CASCADE,
        sender_type TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_email TEXT,
        message TEXT NOT NULL,
        attachments JSONB DEFAULT '[]'::jsonb,
        is_internal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON app_ticket_messages(ticket_id);`;

    // 11. Delivery & Review Tracking Columns on Orders
    await sql`
      ALTER TABLE app_orders 
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS review_email_sent BOOLEAN DEFAULT FALSE;
    `;

    // 12. Abandoned Checkouts Table
    await sql`
      CREATE TABLE IF NOT EXISTS app_abandoned_checkouts (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        customer_name TEXT,
        phone TEXT,
        items JSONB NOT NULL,
        total_amount NUMERIC NOT NULL,
        recovery_email_sent BOOLEAN DEFAULT FALSE,
        recovered BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_abandoned_email ON app_abandoned_checkouts(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_abandoned_sent ON app_abandoned_checkouts(recovery_email_sent);`;

    schemaInitialized = true;
    return true;
  } catch (error) {
    console.error('[Neon Postgres] Schema initialization error:', error);
    return false;
  }
}

export function parseJsonField<T>(field: unknown, defaultValue: T): T {
  if (field === null || field === undefined) return defaultValue;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return (typeof parsed === 'string' ? JSON.parse(parsed) : parsed) as T;
    } catch {
      return defaultValue;
    }
  }
  return field as T;
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
      return parseJsonField<T>(rows[0].data, {} as T);
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
    const payloadObject = typeof data === 'string' ? JSON.parse(data) : data;
    await sql`
      INSERT INTO app_cms_state (key, data, updated_at)
      VALUES ('published_cms', ${sql.json(payloadObject as object)}, CURRENT_TIMESTAMP)
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

const localOrders = new Map<string, any>();

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
  localOrders.set(order.id, {
    id: order.id,
    userEmail: order.userEmail,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    shiprocketOrderId: order.shiprocketOrderId,
    awbCode: order.awbCode,
    status: order.status || 'PENDING',
    items: order.items || [],
    shippingAddress: order.shippingAddress || {},
    totalAmount: order.totalAmount || 0,
    createdAt: new Date().toISOString(),
  });

  const sql = getDb();
  if (!sql) return true;

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

/**
 * Fetches all active products directly from Neon Postgres.
 */
export async function getProductsFromNeon(): Promise<Product[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT 
        id, 
        slug, 
        title, 
        anime, 
        category, 
        price, 
        original_price as "originalPrice", 
        discount_percent as "discountPercent", 
        rating, 
        review_count as "reviewCount", 
        badge, 
        is_new_drop as "isNewDrop", 
        images, 
        description, 
        details, 
        sizes, 
        colors, 
        in_stock as "inStock", 
        stock_count as "stockCount"
      FROM app_products
      WHERE is_active = TRUE
      ORDER BY is_new_drop DESC, created_at DESC;
    `;
    return rows.map((r: any) => ({
      ...r,
      images: parseJsonField<string[]>(r.images, []),
      details: parseJsonField<any>(r.details, {}),
      sizes: parseJsonField<any[]>(r.sizes, []),
      colors: parseJsonField<any[]>(r.colors, []),
      price: Number(r.price),
      originalPrice: Number(r.originalPrice),
      rating: Number(r.rating),
      reviews: [],
    })) as unknown as Product[];
  } catch (error) {
    console.error('[Neon Postgres] Error reading products:', error);
    return [];
  }
}

/**
 * Retrieves a single product by slug or id from Neon Postgres.
 */
export async function getProductBySlugFromNeon(slugOrId: string): Promise<Product | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT 
        id, 
        slug, 
        title, 
        anime, 
        category, 
        price, 
        original_price as "originalPrice", 
        discount_percent as "discountPercent", 
        rating, 
        review_count as "reviewCount", 
        badge, 
        is_new_drop as "isNewDrop", 
        images, 
        description, 
        details, 
        sizes, 
        colors, 
        in_stock as "inStock", 
        stock_count as "stockCount"
      FROM app_products
      WHERE (slug = ${slugOrId} OR id = ${slugOrId}) AND is_active = TRUE
      LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        ...r,
        images: parseJsonField<string[]>(r.images, []),
        details: parseJsonField<any>(r.details, {}),
        sizes: parseJsonField<any[]>(r.sizes, []),
        colors: parseJsonField<any[]>(r.colors, []),
        price: Number(r.price),
        originalPrice: Number(r.originalPrice),
        rating: Number(r.rating),
        reviews: [],
      } as unknown as Product;
    }
    return null;
  } catch (error) {
    console.error(`[Neon Postgres] Error reading product ${slugOrId}:`, error);
    return null;
  }
}

/**
 * Inserts or updates an individual product in Neon Postgres.
 */
export async function upsertProductInNeon(product: Product): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    await sql`
      INSERT INTO app_products (
        id, slug, title, anime, category, price, original_price, discount_percent, rating, review_count,
        badge, is_new_drop, images, description, details, sizes, colors, in_stock, stock_count, is_active, updated_at
      )
      VALUES (
        ${product.id},
        ${product.slug},
        ${product.title},
        ${product.anime},
        ${product.category},
        ${product.price},
        ${product.originalPrice || product.price},
        ${product.discountPercent || 0},
        ${product.rating || 4.9},
        ${product.reviewCount || 0},
        ${product.badge || null},
        ${product.isNewDrop ?? false},
        ${JSON.stringify(product.images || [])}::jsonb,
        ${product.description || ''},
        ${JSON.stringify(product.details || {})}::jsonb,
        ${JSON.stringify(product.sizes || ['S', 'M', 'L', 'XL'])}::jsonb,
        ${JSON.stringify(product.colors || [])}::jsonb,
        ${product.inStock ?? true},
        ${product.stockCount || 10},
        TRUE,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        title = EXCLUDED.title,
        anime = EXCLUDED.anime,
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        original_price = EXCLUDED.original_price,
        discount_percent = EXCLUDED.discount_percent,
        rating = EXCLUDED.rating,
        review_count = EXCLUDED.review_count,
        badge = EXCLUDED.badge,
        is_new_drop = EXCLUDED.is_new_drop,
        images = EXCLUDED.images,
        description = EXCLUDED.description,
        details = EXCLUDED.details,
        sizes = EXCLUDED.sizes,
        colors = EXCLUDED.colors,
        in_stock = EXCLUDED.in_stock,
        stock_count = EXCLUDED.stock_count,
        is_active = TRUE,
        updated_at = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error upserting product ${product.id}:`, error);
    return false;
  }
}

/**
 * Permanently deletes or marks inactive a product in Neon Postgres.
 */
export async function deleteProductInNeon(productId: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    await sql`
      DELETE FROM app_products
      WHERE id = ${productId};
    `;
    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error deleting product ${productId}:`, error);
    return false;
  }
}

/**
 * Hashes a 6-digit OTP using SHA-256 and records it in app_password_resets table.
 * Invalidates any previous unconsumed OTPs for this email.
 */
export async function createPasswordResetOtp(
  email: string,
  otp: string,
  ttlMinutes = 10
): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const normalizedEmail = email.toLowerCase().trim();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const id = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

    // Invalidate existing unused tokens for this email
    await sql`
      UPDATE app_password_resets
      SET used = TRUE
      WHERE LOWER(email) = ${normalizedEmail} AND used = FALSE;
    `;

    // Insert new OTP record
    await sql`
      INSERT INTO app_password_resets (id, email, otp_hash, attempts, expires_at, used, created_at)
      VALUES (${id}, ${normalizedEmail}, ${otpHash}, 0, ${expiresAt}, FALSE, CURRENT_TIMESTAMP);
    `;

    return true;
  } catch (error) {
    console.error('[Neon Postgres] Error creating password reset OTP:', error);
    return false;
  }
}

/**
 * Verifies and consumes a password reset OTP.
 * Enforces expiration, attempt thresholds (max 5), and matching SHA-256 hash.
 */
export async function verifyAndConsumeOtp(
  email: string,
  rawOtp: string
): Promise<{ success: boolean; error?: string }> {
  const sql = getDb();
  if (!sql) {
    return { success: false, error: 'Database service is temporarily unavailable.' };
  }

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = rawOtp.trim();

    // Fetch the latest active OTP record for this email
    const rows = await sql`
      SELECT id, otp_hash as "otpHash", attempts, expires_at as "expiresAt", used
      FROM app_password_resets
      WHERE LOWER(email) = ${normalizedEmail} AND used = FALSE
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return { success: false, error: 'No active verification code found. Please request a new code.' };
    }

    const record = rows[0] as { id: string; otpHash: string; attempts: number; expiresAt: string; used: boolean };

    // Check expiration
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      await sql`UPDATE app_password_resets SET used = TRUE WHERE id = ${record.id};`;
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // Check rate limit threshold (max 5 attempts)
    if (record.attempts >= 5) {
      await sql`UPDATE app_password_resets SET used = TRUE WHERE id = ${record.id};`;
      return { success: false, error: 'Too many failed attempts. Code has been invalidated. Please request a new code.' };
    }

    // Compute incoming OTP hash
    const inputHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');

    if (inputHash !== record.otpHash) {
      const updatedAttempts = record.attempts + 1;
      await sql`
        UPDATE app_password_resets
        SET attempts = ${updatedAttempts}
        WHERE id = ${record.id};
      `;

      const remaining = 5 - updatedAttempts;
      return {
        success: false,
        error: remaining > 0
          ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many failed attempts. Please request a new code.',
      };
    }

    // Mark code as used
    await sql`
      UPDATE app_password_resets
      SET used = TRUE
      WHERE id = ${record.id};
    `;

    return { success: true };
  } catch (error) {
    console.error('[Neon Postgres] Error verifying OTP:', error);
    return { success: false, error: 'An error occurred while verifying the code.' };
  }
}

/**
 * Updates a user's password hash and salt in app_users table.
 */
export async function updateUserPassword(
  email: string,
  newPasswordHash: string,
  newSalt: string
): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const normalizedEmail = email.toLowerCase().trim();
    await sql`
      UPDATE app_users
      SET password_hash = ${newPasswordHash}, salt = ${newSalt}
      WHERE LOWER(email) = ${normalizedEmail};
    `;
    return true;
  } catch (error) {
    console.error('[Neon Postgres] Error updating user password:', error);
    return false;
  }
}

/**
 * Retrieves an order by ID or Razorpay Order ID or AWB from Neon Postgres.
 */
export async function getOrderByIdFromNeon(
  orderIdOrAwb: string
): Promise<{
  id: string;
  userEmail?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shiprocketOrderId?: string;
  awbCode?: string;
  status?: string;
  items?: unknown[];
  shippingAddress?: Record<string, unknown>;
  totalAmount?: number;
  createdAt?: string;
} | null> {
  const local =
    localOrders.get(orderIdOrAwb) ||
    Array.from(localOrders.values()).find(
      (o) => o.razorpayOrderId === orderIdOrAwb || o.awbCode === orderIdOrAwb
    );

  const sql = getDb();
  if (!sql) return local || null;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT 
        id, 
        user_email as "userEmail", 
        razorpay_order_id as "razorpayOrderId", 
        razorpay_payment_id as "razorpayPaymentId", 
        shiprocket_order_id as "shiprocketOrderId", 
        awb_code as "awbCode", 
        status, 
        items, 
        shipping_address as "shippingAddress", 
        total_amount as "totalAmount", 
        created_at as "createdAt"
      FROM app_orders
      WHERE id = ${orderIdOrAwb} 
         OR razorpay_order_id = ${orderIdOrAwb} 
         OR awb_code = ${orderIdOrAwb}
      LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      return rows[0] as unknown as {
        id: string;
        userEmail?: string;
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
        shiprocketOrderId?: string;
        awbCode?: string;
        status?: string;
        items?: unknown[];
        shippingAddress?: Record<string, unknown>;
        totalAmount?: number;
        createdAt?: string;
      };
    }
    const local =
      localOrders.get(orderIdOrAwb) ||
      Array.from(localOrders.values()).find(
        (o) => o.razorpayOrderId === orderIdOrAwb || o.awbCode === orderIdOrAwb
      );
    return local || null;
  } catch (error) {
    console.error(`[Neon Postgres] Error reading order ${orderIdOrAwb}:`, error);
    const local =
      localOrders.get(orderIdOrAwb) ||
      Array.from(localOrders.values()).find(
        (o) => o.razorpayOrderId === orderIdOrAwb || o.awbCode === orderIdOrAwb
      );
    return local || null;
  }
}

// ─── TICKETING & SUPPORT DATA HELPERS ─────────────────────────────────────────

function mapTicketRow(r: Record<string, unknown>): Ticket {
  return {
    id: String(r.id),
    ticketNumber: String(r.ticket_number),
    customerName: String(r.customer_name),
    customerEmail: String(r.customer_email),
    customerPhone: r.customer_phone ? String(r.customer_phone) : undefined,
    orderId: r.order_id ? String(r.order_id) : undefined,
    category: r.category as Ticket['category'],
    priority: r.priority as Ticket['priority'],
    status: r.status as Ticket['status'],
    subject: String(r.subject),
    initialMessage: String(r.initial_message),
    attachments: parseJsonField<string[]>(r.attachments, []),
    telemetry: parseJsonField<Ticket['telemetry']>(r.telemetry, {}),
    exchangeDetails: parseJsonField<Ticket['exchangeDetails']>(r.exchange_details, {}),
    paymentDetails: parseJsonField<Ticket['paymentDetails']>(r.payment_details, {}),
    shiprocketAwb: r.shiprocket_awb ? String(r.shiprocket_awb) : undefined,
    resolutionNotes: r.resolution_notes ? String(r.resolution_notes) : undefined,
    customerRating: r.customer_rating != null ? Number(r.customer_rating) : undefined,
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : new Date().toISOString(),
    resolvedAt: r.resolved_at ? new Date(r.resolved_at as string).toISOString() : undefined,
  };
}

function mapMessageRow(r: Record<string, unknown>): TicketMessage {
  return {
    id: String(r.id),
    ticketId: String(r.ticket_id),
    senderType: r.sender_type as TicketMessage['senderType'],
    senderName: String(r.sender_name),
    senderEmail: r.sender_email ? String(r.sender_email) : undefined,
    message: String(r.message),
    attachments: parseJsonField<string[]>(r.attachments, []),
    isInternal: Boolean(r.is_internal),
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : new Date().toISOString(),
  };
}

/**
 * Creates a new support ticket and its initial customer message.
 */
export async function createTicketInNeon(ticket: Ticket): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();

    await sql`
      INSERT INTO app_tickets (
        id, ticket_number, customer_name, customer_email, customer_phone,
        order_id, category, priority, status, subject, initial_message,
        attachments, telemetry, exchange_details, payment_details,
        shiprocket_awb, resolution_notes, created_at, updated_at
      ) VALUES (
        ${ticket.id},
        ${ticket.ticketNumber},
        ${ticket.customerName},
        ${ticket.customerEmail.toLowerCase().trim()},
        ${ticket.customerPhone || null},
        ${ticket.orderId || null},
        ${ticket.category},
        ${ticket.priority || 'MEDIUM'},
        ${ticket.status || 'OPEN'},
        ${ticket.subject},
        ${ticket.initialMessage},
        ${JSON.stringify(ticket.attachments || [])}::jsonb,
        ${JSON.stringify(ticket.telemetry || {})}::jsonb,
        ${JSON.stringify(ticket.exchangeDetails || {})}::jsonb,
        ${JSON.stringify(ticket.paymentDetails || {})}::jsonb,
        ${ticket.shiprocketAwb || null},
        ${ticket.resolutionNotes || null},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
    `;

    // Also persist initial customer message in thread
    const msgId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    await sql`
      INSERT INTO app_ticket_messages (
        id, ticket_id, sender_type, sender_name, sender_email,
        message, attachments, is_internal, created_at
      ) VALUES (
        ${msgId},
        ${ticket.id},
        'CUSTOMER',
        ${ticket.customerName},
        ${ticket.customerEmail.toLowerCase().trim()},
        ${ticket.initialMessage},
        ${JSON.stringify(ticket.attachments || [])}::jsonb,
        FALSE,
        CURRENT_TIMESTAMP
      );
    `;

    return true;
  } catch (error) {
    console.error('[Neon Postgres] Error creating ticket:', error);
    return false;
  }
}

/**
 * Fetches a single ticket by its internal ID or public ticket number.
 */
export async function getTicketByIdFromNeon(ticketIdOrNumber: string): Promise<Ticket | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT *
      FROM app_tickets
      WHERE id = ${ticketIdOrNumber} OR ticket_number = ${ticketIdOrNumber}
      LIMIT 1;
    `;

    if (rows && rows.length > 0) {
      return mapTicketRow(rows[0] as Record<string, unknown>);
    }
    return null;
  } catch (error) {
    console.error(`[Neon Postgres] Error reading ticket ${ticketIdOrNumber}:`, error);
    return null;
  }
}

/**
 * Fetches all tickets belonging to a specific customer email.
 */
export async function getTicketsForUserFromNeon(email: string): Promise<Ticket[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT *
      FROM app_tickets
      WHERE LOWER(customer_email) = ${email.toLowerCase().trim()}
      ORDER BY created_at DESC;
    `;

    return (rows || []).map((r: any) => mapTicketRow(r as Record<string, unknown>));
  } catch (error) {
    console.error(`[Neon Postgres] Error reading tickets for ${email}:`, error);
    return [];
  }
}

/**
 * Fetches filtered tickets for the admin support queue.
 */
export async function getAdminTicketsFromNeon(options?: {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ tickets: Ticket[]; total: number }> {
  const sql = getDb();
  if (!sql) return { tickets: [], total: 0 };

  try {
    if (!schemaInitialized) await initDatabaseSchema();

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const search = options?.search ? `%${options.search.toLowerCase().trim()}%` : null;

    let rows: Record<string, unknown>[];

    if (search) {
      rows = (await sql`
        SELECT *
        FROM app_tickets
        WHERE (
          LOWER(ticket_number) LIKE ${search} OR
          LOWER(customer_name) LIKE ${search} OR
          LOWER(customer_email) LIKE ${search} OR
          LOWER(COALESCE(order_id, '')) LIKE ${search} OR
          LOWER(COALESCE(shiprocket_awb, '')) LIKE ${search}
        )
        ${options?.status && options.status !== 'ALL' ? sql`AND status = ${options.status}` : sql``}
        ${options?.category && options.category !== 'ALL' ? sql`AND category = ${options.category}` : sql``}
        ${options?.priority && options.priority !== 'ALL' ? sql`AND priority = ${options.priority}` : sql``}
        ORDER BY
          CASE WHEN priority = 'URGENT' THEN 1 WHEN priority = 'HIGH' THEN 2 WHEN priority = 'MEDIUM' THEN 3 ELSE 4 END,
          created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `) as Record<string, unknown>[];
    } else {
      rows = (await sql`
        SELECT *
        FROM app_tickets
        WHERE TRUE
        ${options?.status && options.status !== 'ALL' ? sql`AND status = ${options.status}` : sql``}
        ${options?.category && options.category !== 'ALL' ? sql`AND category = ${options.category}` : sql``}
        ${options?.priority && options.priority !== 'ALL' ? sql`AND priority = ${options.priority}` : sql``}
        ORDER BY
          CASE WHEN priority = 'URGENT' THEN 1 WHEN priority = 'HIGH' THEN 2 WHEN priority = 'MEDIUM' THEN 3 ELSE 4 END,
          created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `) as Record<string, unknown>[];
    }

    const countRows = await sql`SELECT COUNT(*)::int as count FROM app_tickets;`;
    const total = countRows && countRows.length > 0 ? Number(countRows[0].count) : rows.length;

    return {
      tickets: rows.map((r) => mapTicketRow(r)),
      total,
    };
  } catch (error) {
    console.error('[Neon Postgres] Error querying admin tickets:', error);
    return { tickets: [], total: 0 };
  }
}

/**
 * Updates a ticket's status, priority, resolution notes, rating, etc.
 */
export async function updateTicketInNeon(
  id: string,
  updates: Partial<Ticket>
): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();

    const current = await getTicketByIdFromNeon(id);
    if (!current) return false;

    const newStatus = updates.status || current.status;
    const newPriority = updates.priority || current.priority;
    const newAwb = updates.shiprocketAwb !== undefined ? updates.shiprocketAwb : current.shiprocketAwb;
    const newNotes = updates.resolutionNotes !== undefined ? updates.resolutionNotes : current.resolutionNotes;
    const newRating = updates.customerRating !== undefined ? updates.customerRating : current.customerRating;
    const resolvedAt = newStatus === 'RESOLVED' ? (current.resolvedAt || new Date().toISOString()) : (newStatus === 'OPEN' ? null : current.resolvedAt);

    await sql`
      UPDATE app_tickets
      SET
        status = ${newStatus},
        priority = ${newPriority},
        shiprocket_awb = ${newAwb || null},
        resolution_notes = ${newNotes || null},
        customer_rating = ${newRating != null ? newRating : null},
        resolved_at = ${resolvedAt ? new Date(resolvedAt).toISOString() : null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} OR ticket_number = ${id};
    `;

    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error updating ticket ${id}:`, error);
    return false;
  }
}

/**
 * Adds a new message to a ticket thread.
 */
export async function addTicketMessageInNeon(msg: TicketMessage): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();

    await sql`
      INSERT INTO app_ticket_messages (
        id, ticket_id, sender_type, sender_name, sender_email,
        message, attachments, is_internal, created_at
      ) VALUES (
        ${msg.id},
        ${msg.ticketId},
        ${msg.senderType},
        ${msg.senderName},
        ${msg.senderEmail || null},
        ${msg.message},
        ${JSON.stringify(msg.attachments || [])}::jsonb,
        ${Boolean(msg.isInternal)},
        CURRENT_TIMESTAMP
      );
    `;

    // Also update ticket updated_at
    await sql`
      UPDATE app_tickets
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${msg.ticketId};
    `;

    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error adding message to ticket ${msg.ticketId}:`, error);
    return false;
  }
}

/**
 * Retrieves all messages for a ticket thread.
 * When includeInternal is false, hides yellow staff-only notes.
 */
export async function getTicketMessagesFromNeon(
  ticketId: string,
  includeInternal = false
): Promise<TicketMessage[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    if (!schemaInitialized) await initDatabaseSchema();

    let rows: Record<string, unknown>[];
    if (includeInternal) {
      rows = (await sql`
        SELECT *
        FROM app_ticket_messages
        WHERE ticket_id = ${ticketId}
        ORDER BY created_at ASC;
      `) as Record<string, unknown>[];
    } else {
      rows = (await sql`
        SELECT *
        FROM app_ticket_messages
        WHERE ticket_id = ${ticketId} AND is_internal = FALSE
        ORDER BY created_at ASC;
      `) as Record<string, unknown>[];
    }

    return (rows || []).map((r) => mapMessageRow(r));
  } catch (error) {
    console.error(`[Neon Postgres] Error reading messages for ticket ${ticketId}:`, error);
    return [];
  }
}

/**
 * Computes live KPI metrics for admin tickets dashboard.
 */
export async function getAdminTicketMetricsFromNeon(): Promise<TicketMetrics> {
  const sql = getDb();
  if (!sql) {
    return {
      totalOpen: 0,
      urgentSla: 0,
      inProgress: 0,
      resolvedToday: 0,
      averageCsat: 5.0,
    };
  }

  try {
    if (!schemaInitialized) await initDatabaseSchema();

    const metricsRow = await sql`
      SELECT
        COUNT(CASE WHEN status IN ('OPEN', 'WAITING_CUSTOMER') THEN 1 END)::int as "totalOpen",
        COUNT(CASE WHEN status IN ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER') AND priority = 'URGENT' THEN 1 END)::int as "urgentSla",
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END)::int as "inProgress",
        COUNT(CASE WHEN status = 'RESOLVED' AND resolved_at >= CURRENT_DATE THEN 1 END)::int as "resolvedToday",
        ROUND(AVG(customer_rating), 1)::float as "averageCsat"
      FROM app_tickets;
    `;

    if (metricsRow && metricsRow.length > 0) {
      const row = metricsRow[0];
      return {
        totalOpen: Number(row.totalOpen || 0),
        urgentSla: Number(row.urgentSla || 0),
        inProgress: Number(row.inProgress || 0),
        resolvedToday: Number(row.resolvedToday || 0),
        averageCsat: Number(row.averageCsat || 4.9),
      };
    }

    return { totalOpen: 0, urgentSla: 0, inProgress: 0, resolvedToday: 0, averageCsat: 5.0 };
  } catch (error) {
    console.error('[Neon Postgres] Error computing ticket metrics:', error);
    return { totalOpen: 0, urgentSla: 0, inProgress: 0, resolvedToday: 0, averageCsat: 5.0 };
  }
}

/**
 * Retrieves all previous orders for a customer by their email address.
 */
export async function getUserOrdersFromNeon(email: string): Promise<Array<{
  id: string;
  userEmail: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shiprocketOrderId?: string;
  awbCode?: string;
  status: string;
  items: unknown[];
  shippingAddress: Record<string, unknown>;
  totalAmount: number;
  createdAt: string;
}>> {
  const sql = getDb();
  if (!sql) return [];

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const normalized = email.toLowerCase().trim();

    const rows = await sql`
      SELECT
        id,
        user_email as "userEmail",
        razorpay_order_id as "razorpayOrderId",
        razorpay_payment_id as "razorpayPaymentId",
        shiprocket_order_id as "shiprocketOrderId",
        awb_code as "awbCode",
        status,
        items,
        shipping_address as "shippingAddress",
        total_amount as "totalAmount",
        created_at as "createdAt"
      FROM app_orders
      WHERE LOWER(user_email) = ${normalized}
      ORDER BY created_at DESC;
    `;

    return (rows || []).map((r: any) => ({
      id: String(r.id),
      userEmail: String(r.userEmail || ''),
      razorpayOrderId: r.razorpayOrderId ? String(r.razorpayOrderId) : undefined,
      razorpayPaymentId: r.razorpayPaymentId ? String(r.razorpayPaymentId) : undefined,
      shiprocketOrderId: r.shiprocketOrderId ? String(r.shiprocketOrderId) : undefined,
      awbCode: r.awbCode ? String(r.awbCode) : undefined,
      status: String(r.status || 'CONFIRMED'),
      items: parseJsonField<unknown[]>(r.items, []),
      shippingAddress: parseJsonField<Record<string, unknown>>(r.shippingAddress, {}),
      totalAmount: Number(r.totalAmount || 0),
      createdAt: r.createdAt ? new Date(r.createdAt as string).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error(`[Neon Postgres] Error reading user orders for ${email}:`, error);
    return [];
  }
}

/**
 * Updates a user's role in Neon Postgres.
 */
export async function updateUserRoleInNeon(
  email: string,
  targetRole: UserRole
): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const normalizedEmail = email.toLowerCase().trim();
    await sql`
      UPDATE app_users
      SET role = ${targetRole}
      WHERE LOWER(email) = ${normalizedEmail};
    `;
    return true;
  } catch (error) {
    console.error('[Neon Postgres] Error updating user role:', error);
    return false;
  }
}

// ─── COMMERCE AUTOMATIONS: REVIEW NUDGES & ABANDONED CARTS ───────────────────

interface LocalAbandonedCartRecord {
  id: string;
  email: string;
  customerName?: string;
  phone?: string;
  items: unknown[];
  totalAmount: number;
  recoveryEmailSent: boolean;
  recovered: boolean;
  createdAt: string;
}

const localAbandonedCarts = new Map<string, LocalAbandonedCartRecord>();

/**
 * Marks an order as delivered with a delivered_at timestamp.
 */
export async function markOrderDelivered(orderIdOrAwb: string): Promise<boolean> {
  const local =
    localOrders.get(orderIdOrAwb) ||
    Array.from(localOrders.values()).find(
      (o) => o.razorpayOrderId === orderIdOrAwb || o.awbCode === orderIdOrAwb
    );
  if (local) {
    local.status = 'DELIVERED';
    local.deliveredAt = new Date().toISOString();
  }

  const sql = getDb();
  if (!sql) return true;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    await sql`
      UPDATE app_orders
      SET 
        status = 'DELIVERED',
        delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP)
      WHERE id = ${orderIdOrAwb} 
         OR awb_code = ${orderIdOrAwb} 
         OR razorpay_order_id = ${orderIdOrAwb};
    `;
    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error marking order delivered ${orderIdOrAwb}:`, error);
    return false;
  }
}

/**
 * Retrieves orders delivered between 3 and 7 days ago that have not received a review nudge email.
 */
export async function getOrdersPendingReviewNudge(): Promise<
  Array<{
    id: string;
    userEmail: string;
    customerName?: string;
    items: Array<{ id?: string; title?: string; name?: string; image?: string; slug?: string }>;
    deliveredAt: string;
  }>
> {
  const sql = getDb();
  if (!sql) return [];

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = (await sql`
      SELECT 
        id, 
        user_email as "userEmail", 
        shipping_address as "shippingAddress", 
        items, 
        delivered_at as "deliveredAt"
      FROM app_orders
      WHERE status = 'DELIVERED'
        AND delivered_at <= NOW() - INTERVAL '3 days'
        AND delivered_at >= NOW() - INTERVAL '14 days'
        AND (review_email_sent IS FALSE OR review_email_sent IS NULL)
        AND user_email IS NOT NULL
      LIMIT 50;
    `) as Record<string, unknown>[];

    return (rows || []).map((r) => {
      const addr = (r.shippingAddress && typeof r.shippingAddress === 'object') ? (r.shippingAddress as Record<string, string>) : {};
      return {
        id: String(r.id),
        userEmail: String(r.userEmail),
        customerName: addr.customerName || addr.name || undefined,
        items: Array.isArray(r.items) ? (r.items as Array<{ id?: string; title?: string; name?: string; image?: string; slug?: string }>) : [],
        deliveredAt: r.deliveredAt ? new Date(r.deliveredAt as string).toISOString() : new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('[Neon Postgres] Error fetching orders pending review nudge:', error);
    return [];
  }
}

/**
 * Marks review_email_sent = TRUE on an order.
 */
export async function markReviewEmailSent(orderId: string): Promise<boolean> {
  const local = localOrders.get(orderId);
  if (local) {
    local.reviewEmailSent = true;
  }

  const sql = getDb();
  if (!sql) return true;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    await sql`
      UPDATE app_orders
      SET review_email_sent = TRUE
      WHERE id = ${orderId};
    `;
    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error marking review email sent for order ${orderId}:`, error);
    return false;
  }
}

/**
 * Captures or updates a shopper's checkout intent for abandoned cart recovery.
 */
export async function upsertAbandonedCheckout(checkout: {
  id?: string;
  email: string;
  customerName?: string;
  phone?: string;
  items: unknown[];
  totalAmount: number;
}): Promise<string> {
  const id = checkout.id || `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const normalizedEmail = checkout.email.toLowerCase().trim();

  // In-memory resilient cache
  localAbandonedCarts.set(id, {
    id,
    email: normalizedEmail,
    customerName: checkout.customerName,
    phone: checkout.phone,
    items: checkout.items || [],
    totalAmount: checkout.totalAmount || 0,
    recoveryEmailSent: false,
    recovered: false,
    createdAt: new Date().toISOString(),
  });

  const sql = getDb();
  if (!sql) return id;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    await sql`
      INSERT INTO app_abandoned_checkouts (
        id, email, customer_name, phone, items, total_amount, recovery_email_sent, recovered, created_at, updated_at
      ) VALUES (
        ${id},
        ${normalizedEmail},
        ${checkout.customerName || null},
        ${checkout.phone || null},
        ${JSON.stringify(checkout.items || [])}::jsonb,
        ${checkout.totalAmount || 0},
        FALSE,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        customer_name = COALESCE(EXCLUDED.customer_name, app_abandoned_checkouts.customer_name),
        phone = COALESCE(EXCLUDED.phone, app_abandoned_checkouts.phone),
        items = EXCLUDED.items,
        total_amount = EXCLUDED.total_amount,
        updated_at = CURRENT_TIMESTAMP;
    `;
    return id;
  } catch (error) {
    console.error('[Neon Postgres] Error upserting abandoned checkout:', error);
    return id;
  }
}

/**
 * Marks all abandoned carts for an email as recovered once a payment succeeds.
 */
export async function markCheckoutRecovered(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  // Update in-memory cache
  for (const cart of localAbandonedCarts.values()) {
    if (cart.email.toLowerCase().trim() === normalizedEmail) {
      cart.recovered = true;
    }
  }

  const sql = getDb();
  if (!sql) return true;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    await sql`
      UPDATE app_abandoned_checkouts
      SET recovered = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(email) = ${normalizedEmail};
    `;
    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error marking checkout recovered for ${email}:`, error);
    return false;
  }
}

/**
 * Retrieves abandoned checkouts created between 2 and 24 hours ago that have not been recovered or pinged.
 */
export async function getPendingAbandonedCarts(): Promise<
  Array<{
    id: string;
    email: string;
    customerName?: string;
    phone?: string;
    items: Array<{ id?: string; title: string; price: number; quantity?: number; size?: string; color?: string; image?: string }>;
    totalAmount: number;
    createdAt: string;
  }>
> {
  const sql = getDb();
  if (!sql) return [];

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = (await sql`
      SELECT 
        id, 
        email, 
        customer_name as "customerName", 
        phone, 
        items, 
        total_amount as "totalAmount", 
        created_at as "createdAt"
      FROM app_abandoned_checkouts
      WHERE created_at <= NOW() - INTERVAL '2 hours'
        AND created_at >= NOW() - INTERVAL '48 hours'
        AND recovery_email_sent IS FALSE
        AND recovered IS FALSE
      ORDER BY created_at DESC
      LIMIT 50;
    `) as Record<string, unknown>[];

    return (rows || []).map((r: any) => ({
      id: String(r.id),
      email: String(r.email),
      customerName: r.customerName ? String(r.customerName) : undefined,
      phone: r.phone ? String(r.phone) : undefined,
      items: Array.isArray(r.items) ? (r.items as Array<{ id?: string; title: string; price: number; quantity?: number; size?: string; color?: string; image?: string }>) : [],
      totalAmount: Number(r.totalAmount || 0),
      createdAt: r.createdAt ? new Date(r.createdAt as string).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('[Neon Postgres] Error fetching pending abandoned carts:', error);
    return [];
  }
}

/**
 * Marks an abandoned cart as having received its recovery email.
 */
export async function markAbandonedCartEmailSent(id: string): Promise<boolean> {
  const local = localAbandonedCarts.get(id);
  if (local) {
    local.recoveryEmailSent = true;
  }

  const sql = getDb();
  if (!sql) return true;

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    await sql`
      UPDATE app_abandoned_checkouts
      SET recovery_email_sent = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id};
    `;
    return true;
  } catch (error) {
    console.error(`[Neon Postgres] Error marking recovery email sent for cart ${id}:`, error);
    return false;
  }
}

/**
 * Retrieves an abandoned checkout record by ID to restore cart in storefront.
 */
export async function getAbandonedCartById(id: string): Promise<{
  id: string;
  email: string;
  customerName?: string;
  phone?: string;
  items: unknown[];
  totalAmount: number;
} | null> {
  const local = localAbandonedCarts.get(id);

  const sql = getDb();
  if (!sql) {
    return local
      ? {
          id: local.id,
          email: local.email,
          customerName: local.customerName,
          phone: local.phone,
          items: local.items,
          totalAmount: local.totalAmount,
        }
      : null;
  }

  try {
    if (!schemaInitialized) await initDatabaseSchema();
    const rows = await sql`
      SELECT 
        id, 
        email, 
        customer_name as "customerName", 
        phone, 
        items, 
        total_amount as "totalAmount"
      FROM app_abandoned_checkouts
      WHERE id = ${id}
      LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        id: String(r.id),
        email: String(r.email),
        customerName: r.customerName ? String(r.customerName) : undefined,
        phone: r.phone ? String(r.phone) : undefined,
        items: Array.isArray(r.items) ? r.items : [],
        totalAmount: Number(r.totalAmount || 0),
      };
    }
    return local
      ? {
          id: local.id,
          email: local.email,
          customerName: local.customerName,
          phone: local.phone,
          items: local.items,
          totalAmount: local.totalAmount,
        }
      : null;
  } catch (error) {
    console.error(`[Neon Postgres] Error fetching abandoned cart ${id}:`, error);
    return local
      ? {
          id: local.id,
          email: local.email,
          customerName: local.customerName,
          phone: local.phone,
          items: local.items,
          totalAmount: local.totalAmount,
        }
      : null;
  }
}
