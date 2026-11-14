import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);

console.log('=== TESTING CMS STORAGE QUOTA PROTECTION & RESILIENCE ===\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// 1. Setup Mock Storage that simulates QuotaExceededError
let simulateQuota = false;
const storeMock = new Map();

globalThis.window = {
  localStorage: {
    getItem: (key) => storeMock.get(key) || null,
    setItem: (key, val) => {
      if (simulateQuota) {
        const err = new Error("Failed to execute 'setItem' on 'Storage': Setting the value of 'animestreet-cms-data' exceeded the quota.");
        err.name = 'QuotaExceededError';
        err.code = 22;
        throw err;
      }
      storeMock.set(key, String(val));
    },
    removeItem: (key) => storeMock.delete(key),
    clear: () => storeMock.clear(),
    get length() {
      return storeMock.size;
    },
    key: (i) => Array.from(storeMock.keys())[i] || null,
  },
};
globalThis.localStorage = globalThis.window.localStorage;

const jiti = require('jiti')(__filename);
const { useCmsStore } = jiti('../src/lib/cms/cmsStore.ts');
const { compressImage } = jiti('../src/lib/utils/imageCompressor.ts');

async function testQuotaHandling() {
  // Test 1: Normal storage works
  console.log('Test 1: Normal State Persistence');
  useCmsStore.getState().updateHeroBottom('b1', { name: 'Resilient Pant' });
  assert(storeMock.has('animestreet-cms-data'), 'Initial state persisted to localStorage');

  // Test 2: Quota Exceeded Simulation
  console.log('\nTest 2: QuotaExceededError Graceful Interception');
  simulateQuota = true;

  let threwError = false;
  try {
    // Adding media when quota is exceeded should NOT throw an unhandled exception to the UI
    useCmsStore.getState().addMedia({
      name: 'hover_test.jpg',
      url: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vv19f...',
      category: 'products',
      size: '45 KB',
    });
  } catch (err) {
    threwError = true;
    console.error('Unexpected throw during store action:', err);
  }

  assert(!threwError, 'Store action does NOT crash when localStorage quota is exceeded');

  // Test 3: Bounded Media Gallery
  console.log('\nTest 3: Media Gallery Bounded Length');
  simulateQuota = false;
  for (let i = 0; i < 40; i++) {
    useCmsStore.getState().addMedia({
      name: `item_${i}.jpg`,
      url: `https://cdn.example.com/item_${i}.jpg`,
      category: 'products',
      size: '20 KB',
    });
  }
  const mediaCount = useCmsStore.getState().media.length;
  assert(mediaCount <= 30, `Media gallery is strictly bounded to <= 30 items (Actual: ${mediaCount})`);

  // Test 4: Image Compressor Server-Safe Fallback
  console.log('\nTest 4: Image Compressor Node / SSR Compatibility');
  const mockFile = {
    name: 'test-oversized.jpg',
    type: 'image/jpeg',
    size: 2048500,
  };
  const compResult = await compressImage(mockFile);
  assert(Boolean(compResult), 'compressImage completes safely');
  assert(compResult.file.name === 'test-oversized.jpg', 'Image file preserved in non-browser context');

  console.log(`\n=== QUOTA PROTECTION SUMMARY ===`);
  console.log(`Total Passed: ${passed} | Total Failed: ${failed}`);
  if (failed === 0) {
    console.log(`\n>>> QUOTA-SAFE STORAGE ADAPTER VERIFIED 100% OPERATIONAL! <<<`);
  } else {
    process.exit(1);
  }
}

testQuotaHandling().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
