import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const jiti = require('jiti')(__filename);
const { PRODUCTS } = jiti('../src/data/products.ts');
const { uploadRemoteUrlToCloudinary } = jiti('../src/lib/cloudinary.ts');
const { upsertProductInNeon, initDatabaseSchema } = jiti('../src/lib/db/neon.ts');

const MAPPING_FILE = path.join(__dirname, 'cloudinary_mapping.json');

let mapping = {};
if (fs.existsSync(MAPPING_FILE)) {
  try {
    mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
    console.log(`Loaded ${Object.keys(mapping).length} existing mapped images from cache.`);
  } catch (err) {
    mapping = {};
  }
}

function saveMapping() {
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), 'utf-8');
}

async function runMigration() {
  console.log('=== STARTING CLOUDINARY & NEON POSTGRES CATALOG MIGRATION ===\n');

  // Collect all unique Shopify URLs
  const allUrls = [];
  PRODUCTS.forEach((p) => {
    p.images.forEach((img) => {
      if (img && img.startsWith('https://cdn.shopify.com') && !mapping[img]) {
        if (!allUrls.includes(img)) {
          allUrls.push(img);
        }
      }
    });
  });

  console.log(`Found ${allUrls.length} images to upload to Cloudinary...`);

  const CONCURRENCY = 8;
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < allUrls.length; i += CONCURRENCY) {
    const chunk = allUrls.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (url, idx) => {
        const publicId = `prod-migrated-${i + idx + 1}-${Date.now() % 100000}`;
        try {
          const res = await uploadRemoteUrlToCloudinary(url, 'products', publicId);
          mapping[url] = res.url;
          completed++;
        } catch (err) {
          console.warn(`[WARN] Failed to upload ${url}:`, err.message);
          failed++;
        }
      })
    );
    saveMapping();
    process.stdout.write(`Progress: ${completed + Object.keys(mapping).length - allUrls.length}/${allUrls.length + Object.keys(mapping).length - allUrls.length} uploaded (failed: ${failed})\r`);
  }

  console.log(`\n\nUpload phase finished: ${Object.keys(mapping).length} total Cloudinary URLs mapped.`);

  // Now transform products to use Cloudinary URLs
  console.log('\n--- Transforming Catalog & Seeding Neon Postgres app_products ---');
  await initDatabaseSchema();

  const transformedProducts = PRODUCTS.map((p) => {
    const updatedImages = p.images.map((img) => mapping[img] || img);
    return {
      ...p,
      images: updatedImages,
    };
  });

  let seededCount = 0;
  for (const product of transformedProducts) {
    try {
      await upsertProductInNeon(product);
      seededCount++;
    } catch (err) {
      console.warn(`Failed to seed product ${product.id} into Neon:`, err.message);
    }
  }

  console.log(`Successfully seeded ${seededCount}/${transformedProducts.length} products into Neon Postgres app_products table!`);

  // Write transformed products back to src/data/products.ts
  const productsFilePath = path.join(__dirname, '../src/data/products.ts');
  let productsContent = fs.readFileSync(productsFilePath, 'utf-8');

  // Replace each mapped Shopify URL in src/data/products.ts
  let replaceCount = 0;
  for (const [shopifyUrl, cldUrl] of Object.entries(mapping)) {
    if (productsContent.includes(shopifyUrl)) {
      productsContent = productsContent.split(shopifyUrl).join(cldUrl);
      replaceCount++;
    }
  }

  fs.writeFileSync(productsFilePath, productsContent, 'utf-8');
  console.log(`Updated ${replaceCount} image URLs in src/data/products.ts with secure Cloudinary CDN URLs!`);

  console.log('\n=== MIGRATION TO CLOUDINARY AND NEON POSTGRES COMPLETED SUCCESSFULLY! ===');
}

runMigration().catch(console.error);
