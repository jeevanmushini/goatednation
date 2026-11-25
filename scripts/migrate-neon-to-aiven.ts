import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Load .env.local manually if not populated
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

const sourceUrl = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '');
const targetUrl = (process.env.AIVEN_DATABASE_URL || '').trim().replace(/^["']|["']$/g, '');

if (!sourceUrl) {
  console.error('❌ Error: DATABASE_URL (Neon source) is missing in .env.local');
  process.exit(1);
}

if (!targetUrl) {
  console.error('❌ Error: AIVEN_DATABASE_URL (Aiven target) is missing in .env.local');
  console.error('Please paste your Aiven Service URI into .env.local:');
  console.error('AIVEN_DATABASE_URL="postgres://avnadmin:...@your-service.aivencloud.com:12345/defaultdb?sslmode=require"');
  process.exit(1);
}

const neonSql = neon(sourceUrl);
const aivenSql = postgres(targetUrl, {
  ssl: 'require',
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function migrate() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('  GOATED NATION: Neon -> Aiven DB Migration Engine  ');
  console.log('====================================================\n');

  try {
    // 1. Connection check
    console.log('[1/4] Connecting to Neon Source Database...');
    const testNeon = await neonSql`SELECT 1 as connected`;
    if (!testNeon || testNeon.length === 0) throw new Error('Could not connect to Neon');
    console.log('  ✔ Connected to Neon.\n');

    console.log('[2/4] Connecting to Aiven Target Database...');
    const testAiven = await aivenSql`SELECT 1 as connected`;
    if (!testAiven || testAiven.length === 0) throw new Error('Could not connect to Aiven');
    console.log('  ✔ Connected to Aiven.\n');

    // 2. Schema Creation
    console.log('[3/4] Creating all tables & indexes in Aiven...');

    await aivenSql`
      CREATE TABLE IF NOT EXISTS app_cms_state (
        key TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('  ✔ app_cms_state table ready');

    await aivenSql`
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
    console.log('  ✔ app_users table ready');

    await aivenSql`
      CREATE TABLE IF NOT EXISTS app_shipping_orders (
        order_id TEXT PRIMARY KEY,
        tracking_data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('  ✔ app_shipping_orders table ready');

    await aivenSql`
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
        delivered_at TIMESTAMP WITH TIME ZONE,
        review_email_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('  ✔ app_orders table ready');

    await aivenSql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('  ✔ app_settings table ready');

    await aivenSql`
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
    console.log('  ✔ app_reviews table ready');

    await aivenSql`
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
    await aivenSql`CREATE INDEX IF NOT EXISTS idx_products_category ON app_products(category);`;
    await aivenSql`CREATE INDEX IF NOT EXISTS idx_products_slug ON app_products(slug);`;
    await aivenSql`CREATE INDEX IF NOT EXISTS idx_products_is_new_drop ON app_products(is_new_drop);`;
    console.log('  ✔ app_products table & indexes ready');

    await aivenSql`
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
    await aivenSql`CREATE INDEX IF NOT EXISTS idx_pwd_resets_email ON app_password_resets(email);`;
    console.log('  ✔ app_password_resets table ready');

    await aivenSql`
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
    await aivenSql`CREATE INDEX IF NOT EXISTS idx_tickets_email ON app_tickets(customer_email);`;
    await aivenSql`CREATE INDEX IF NOT EXISTS idx_tickets_status ON app_tickets(status);`;
    console.log('  ✔ app_tickets table ready');

    await aivenSql`
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
    await aivenSql`CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON app_ticket_messages(ticket_id);`;
    console.log('  ✔ app_ticket_messages table ready');

    await aivenSql`
      CREATE TABLE IF NOT EXISTS app_abandoned_checkouts (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        phone TEXT,
        customer_name TEXT,
        items JSONB NOT NULL,
        total_amount INTEGER NOT NULL,
        recovery_token TEXT UNIQUE NOT NULL,
        email_sent BOOLEAN DEFAULT FALSE,
        recovered BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('  ✔ app_abandoned_checkouts table ready\n');

    // 3. Data Migration
    console.log('[4/4] Extracting & batch-inserting data from Neon into Aiven...');

    // A. app_cms_state
    const cmsRows = await neonSql`SELECT key, data, updated_at FROM app_cms_state`;
    for (const r of cmsRows) {
      await aivenSql`
        INSERT INTO app_cms_state (key, data, updated_at)
        VALUES (${r.key}, ${JSON.stringify(r.data)}::jsonb, ${r.updated_at || new Date()})
        ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
      `;
    }
    console.log(`  ✔ app_cms_state: ${cmsRows.length} rows migrated.`);

    // B. app_users
    const userRows = await neonSql`SELECT id, name, email, role, avatar, provider, salt, password_hash, created_at FROM app_users`;
    for (const u of userRows) {
      await aivenSql`
        INSERT INTO app_users (id, name, email, role, avatar, provider, salt, password_hash, created_at)
        VALUES (${u.id}, ${u.name}, ${u.email}, ${u.role}, ${u.avatar || null}, ${u.provider}, ${u.salt || null}, ${u.password_hash || null}, ${u.created_at || new Date()})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          avatar = EXCLUDED.avatar,
          provider = EXCLUDED.provider,
          salt = EXCLUDED.salt,
          password_hash = EXCLUDED.password_hash
      `;
    }
    console.log(`  ✔ app_users: ${userRows.length} rows migrated.`);

    // C. app_products
    const prodRows = await neonSql`
      SELECT id, slug, title, anime, category, price, original_price, discount_percent, rating, review_count, badge, is_new_drop, images, description, details, sizes, colors, in_stock, stock_count, is_active, created_at, updated_at 
      FROM app_products
    `;
    for (const p of prodRows) {
      await aivenSql`
        INSERT INTO app_products (
          id, slug, title, anime, category, price, original_price, discount_percent, rating, review_count, badge, is_new_drop, images, description, details, sizes, colors, in_stock, stock_count, is_active, created_at, updated_at
        ) VALUES (
          ${p.id}, ${p.slug}, ${p.title}, ${p.anime}, ${p.category}, ${p.price}, ${p.original_price}, ${p.discount_percent || 0}, ${p.rating || 4.9}, ${p.review_count || 0}, ${p.badge || null}, ${p.is_new_drop || false}, ${JSON.stringify(p.images || [])}::jsonb, ${p.description || ''}, ${JSON.stringify(p.details || {})}::jsonb, ${JSON.stringify(p.sizes || [])}::jsonb, ${JSON.stringify(p.colors || [])}::jsonb, ${p.in_stock ?? true}, ${p.stock_count || 10}, ${p.is_active ?? true}, ${p.created_at || new Date()}, ${p.updated_at || new Date()}
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
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at
      `;
    }
    console.log(`  ✔ app_products: ${prodRows.length} rows migrated.`);

    // D. app_reviews
    const reviewRows = await neonSql`SELECT id, product_id, author_name, author_email, rating, title, comment, fit_feedback, verified_purchase, created_at FROM app_reviews`;
    for (const r of reviewRows) {
      await aivenSql`
        INSERT INTO app_reviews (id, product_id, author_name, author_email, rating, title, comment, fit_feedback, verified_purchase, created_at)
        VALUES (${r.id}, ${r.product_id}, ${r.author_name}, ${r.author_email || null}, ${r.rating}, ${r.title}, ${r.comment}, ${r.fit_feedback || 'TRUE_TO_SIZE'}, ${r.verified_purchase ?? true}, ${r.created_at || new Date()})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`  ✔ app_reviews: ${reviewRows.length} rows migrated.`);

    // E. app_settings
    const settingsRows = await neonSql`SELECT key, value, updated_at FROM app_settings`;
    for (const s of settingsRows) {
      await aivenSql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (${s.key}, ${s.value}, ${s.updated_at || new Date()})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
      `;
    }
    console.log(`  ✔ app_settings: ${settingsRows.length} rows migrated.\n`);

    // 4. Audit Verification
    console.log('====================================================');
    console.log('           AUDIT & VERIFICATION REPORT              ');
    console.log('====================================================');
    
    const [aivenProdCount] = await aivenSql`SELECT count(*) as count FROM app_products`;
    const [aivenUserCount] = await aivenSql`SELECT count(*) as count FROM app_users`;
    const [aivenReviewCount] = await aivenSql`SELECT count(*) as count FROM app_reviews`;
    const [aivenCmsCount] = await aivenSql`SELECT count(*) as count FROM app_cms_state`;

    console.log(`Table: app_products  | Neon: ${prodRows.length.toString().padEnd(4)} | Aiven: ${String(aivenProdCount.count).padEnd(4)} | Status: ${prodRows.length === Number(aivenProdCount.count) ? 'MATCH ✔' : 'MISMATCH ❌'}`);
    console.log(`Table: app_users     | Neon: ${userRows.length.toString().padEnd(4)} | Aiven: ${String(aivenUserCount.count).padEnd(4)} | Status: ${userRows.length === Number(aivenUserCount.count) ? 'MATCH ✔' : 'MISMATCH ❌'}`);
    console.log(`Table: app_reviews   | Neon: ${reviewRows.length.toString().padEnd(4)} | Aiven: ${String(aivenReviewCount.count).padEnd(4)} | Status: ${reviewRows.length === Number(aivenReviewCount.count) ? 'MATCH ✔' : 'MISMATCH ❌'}`);
    console.log(`Table: app_cms_state | Neon: ${cmsRows.length.toString().padEnd(4)} | Aiven: ${String(aivenCmsCount.count).padEnd(4)} | Status: ${cmsRows.length === Number(aivenCmsCount.count) ? 'MATCH ✔' : 'MISMATCH ❌'}`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 MIGRATION FINISHED SUCCESSFULLY! (Duration: ${duration}s)`);
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Migration failed with error:', err);
    process.exit(1);
  } finally {
    await aivenSql.end();
  }
}

migrate();
