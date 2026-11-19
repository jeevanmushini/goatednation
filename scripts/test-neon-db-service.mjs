import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envFile = path.join(process.cwd(), '.env.local');
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl && fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8');
  const match = content.match(/DATABASE_URL="?([^"\r\n]+)"?/);
  if (match) dbUrl = match[1];
}

console.log('Connecting to Neon with:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : 'NONE');
const sql = neon(dbUrl);

async function runTest() {
  console.log('\n--- 1. Testing Schema Creation ---');
  await sql`
    CREATE TABLE IF NOT EXISTS app_cms_state (
      key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
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
  await sql`
    CREATE TABLE IF NOT EXISTS app_shipping_orders (
      order_id TEXT PRIMARY KEY,
      tracking_data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('Tables created or verified in Neon Postgres.');

  console.log('\n--- 2. Testing CMS Data Persistence ---');
  const testCmsData = {
    test: true,
    platform: 'GoatedNation E-Commerce',
    neonPostgresConnected: true,
    timestamp: new Date().toISOString()
  };
  await sql`
    INSERT INTO app_cms_state (key, data, updated_at)
    VALUES ('test_cms_key', ${JSON.stringify(testCmsData)}::jsonb, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;
  `;
  const cmsResult = await sql`SELECT key, data FROM app_cms_state WHERE key = 'test_cms_key';`;
  console.log('Read back from app_cms_state:', cmsResult[0]);

  console.log('\n--- 3. Testing Users Persistence ---');
  const testUser = {
    id: 'usr_test_neon_001',
    name: 'Neon Postgres Test User',
    email: 'neon_tester@goatednation.com',
    role: 'ADMIN',
    avatar: '',
    provider: 'credentials',
    salt: 'test_salt_123',
    password_hash: 'test_hash_456'
  };
  await sql`
    INSERT INTO app_users (id, name, email, role, avatar, provider, salt, password_hash)
    VALUES (
      ${testUser.id},
      ${testUser.name},
      ${testUser.email},
      ${testUser.role},
      ${testUser.avatar},
      ${testUser.provider},
      ${testUser.salt},
      ${testUser.password_hash}
    )
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
  `;
  const usersResult = await sql`SELECT id, name, email, role FROM app_users WHERE email = ${testUser.email};`;
  console.log('Read back from app_users:', usersResult[0]);

  // Clean up test records
  await sql`DELETE FROM app_cms_state WHERE key = 'test_cms_key';`;
  await sql`DELETE FROM app_users WHERE email = 'neon_tester@goatednation.com';`;
  console.log('Cleanup of test records complete.');

  console.log('\nALL NEON POSTGRES DATABASE OPERATIONS TESTED SUCCESSFULLY!');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
