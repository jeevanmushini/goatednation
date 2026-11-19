import { neon, NeonQueryFunction } from '@neondatabase/serverless';

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
 * Creates app_cms_state, app_users, and app_shipping_orders if they do not exist.
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

    schemaInitialized = true;
    console.log('[Neon Postgres] Schema successfully verified and initialized.');
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
    await initDatabaseSchema();
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
    await initDatabaseSchema();
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
    await initDatabaseSchema();
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
 * Inserts or updates a user in Neon Postgres.
 */
export async function upsertUserInNeon(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  provider?: string;
  salt?: string;
  passwordHash?: string;
  createdAt?: string;
}): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    await initDatabaseSchema();
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
