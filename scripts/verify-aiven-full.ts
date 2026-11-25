import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const dbUrl = (process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '');

if (!dbUrl) {
  console.error('❌ DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(dbUrl, {
  ssl: 'require',
  max: 5,
  idle_timeout: 10,
  connect_timeout: 10,
});

async function runAudit() {
  console.log('====================================================');
  console.log('      AIVEN DATABASE DEEP AUDIT & VERIFICATION      ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, msg: string, detail?: string) {
    if (cond) {
      console.log(`  ✔ [PASS] ${msg}`);
      if (detail) console.log(`      ↳ ${detail}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      if (detail) console.error(`      ↳ ${detail}`);
      failed++;
    }
  }

  try {
    // 1. Connection & Server Info
    const [versionRow] = await sql`SELECT version()`;
    assert(!!versionRow?.version, 'PostgreSQL Connection Established', versionRow.version.slice(0, 60));

    // 2. Table Existence
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tableNames = tables.map((t: any) => t.table_name);
    console.log('\n--- 1. Database Tables Check ---');
    const requiredTables = [
      'app_cms_state',
      'app_users',
      'app_shipping_orders',
      'app_orders',
      'app_settings',
      'app_reviews',
      'app_products',
      'app_password_resets',
      'app_tickets',
      'app_ticket_messages',
      'app_abandoned_checkouts',
    ];

    for (const req of requiredTables) {
      assert(tableNames.includes(req), `Table: ${req} exists`);
    }

    // 3. Products Audit
    console.log('\n--- 2. Product Catalog Deep Audit ---');
    const [prodCount] = await sql`SELECT count(*) as count FROM app_products WHERE is_active = TRUE`;
    assert(Number(prodCount.count) === 109, 'Active product catalog count', `Total active products: ${prodCount.count}`);

    const customDrops = await sql`SELECT id, title, is_new_drop FROM app_products WHERE id LIKE 'as-%'`;
    assert(customDrops.length >= 2, 'Admin custom streetwear drops present', `Custom drops found: ${customDrops.map((d: any) => d.title).join(', ')}`);

    const [cloudinaryImages] = await sql`
      SELECT count(*) as count 
      FROM app_products 
      WHERE images::text LIKE '%res.cloudinary.com%'
    `;
    assert(Number(cloudinaryImages.count) >= 100, 'Cloudinary CDN product image URLs preserved', `Products with Cloudinary images: ${cloudinaryImages.count}`);

    // 4. CMS State Audit
    console.log('\n--- 3. CMS State Audit ---');
    const [cmsRow] = await sql`SELECT key, data, updated_at FROM app_cms_state WHERE key = 'published_cms'`;
    assert(!!cmsRow, 'CMS state record exists (key: published_cms)');
    if (cmsRow) {
      const data = typeof cmsRow.data === 'string' ? JSON.parse(cmsRow.data) : cmsRow.data;
      assert(Array.isArray(data?.heroBottoms) && data.heroBottoms.length > 0, 'Hero 3D Floating Bottoms array valid', `${data?.heroBottoms?.length || 0} bottoms`);
      assert(Array.isArray(data?.stackCards) && data.stackCards.length > 0, '3D Category Stack Cards valid', `${data?.stackCards?.length || 0} cards`);
      assert(!!data?.editorialBanner?.image, 'Editorial Banner image valid', data?.editorialBanner?.image?.slice(0, 65) || 'none');
      assert(!!data?.announcement?.highlightText, 'Announcement Bar texts valid', data?.announcement?.highlightText || 'none');
    }

    // 5. Users & RBAC Audit
    console.log('\n--- 4. Users & Authentication Audit ---');
    const users = await sql`SELECT id, name, email, role, provider, password_hash, salt FROM app_users`;
    assert(users.length >= 1, 'User records present', `${users.length} users registered`);
    const adminUser = users.find((u: any) => u.role === 'ADMIN');
    assert(!!adminUser, 'Admin clearance account exists', `Admin email: ${adminUser?.email}`);

    // 6. Reviews Audit
    console.log('\n--- 5. Customer Reviews Audit ---');
    const reviews = await sql`SELECT id, rating, author_name, title FROM app_reviews`;
    assert(reviews.length === 7, 'Customer verified reviews preserved', `Found ${reviews.length} reviews`);

    // 7. Support & Tickets Audit
    console.log('\n--- 6. Customer Support Infrastructure Audit ---');
    const [ticketCount] = await sql`SELECT count(*) as count FROM app_tickets`;
    assert(ticketCount !== undefined, 'Support tickets table ready for incoming queries', `Current tickets: ${ticketCount.count}`);

    console.log('\n====================================================');
    console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    if (failed === 0) {
      console.log('🎉 ALL SYSTEM & DATABASE AUDIT CHECKS PASSED 100%!');
    } else {
      console.log('⚠️ SOME CHECKS FAILED - REVIEW LOGS ABOVE');
    }
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal audit error:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runAudit();
