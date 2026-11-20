import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);

// Mock browser environment
const storageMap = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => storageMap.get(key) || null,
    setItem: (key, val) => storageMap.set(key, String(val)),
    removeItem: (key) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  },
  location: { origin: 'http://localhost:3000' },
  addEventListener: () => {},
  dispatchEvent: () => {},
};
globalThis.localStorage = globalThis.window.localStorage;

async function runTests() {
  console.log('=== TESTING PRODUCT DELETION & ZERO RESURRECTION GUARANTEE ===\n');

  const jiti = require('jiti')(__filename);
  const { useCmsStore } = jiti('../src/lib/cms/cmsStore.ts');
  const { sanitizePublishedCmsData, savePublishedCmsData, getPublishedProductBySlug } = jiti('../src/lib/cms/serverCms.ts');

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

  const initialProducts = useCmsStore.getState().products;
  assert(initialProducts.length > 0, `Initial catalog loaded (${initialProducts.length} items)`);

  // 1. Add and delete custom product
  const customId = 'as-test-del-' + Date.now();
  const customProduct = {
    id: customId,
    slug: 'test-del-drop',
    title: 'Test Delete Drop',
    anime: 'Berserk',
    category: 'tees',
    price: 1999,
    originalPrice: 2999,
    discountPercent: 33,
    rating: 5,
    reviewCount: 1,
    badge: 'NEW DROP',
    isNewDrop: true,
    images: ['/images/placeholder-product.svg'],
    description: 'Test',
    details: { gsm: '280 GSM' },
    sizes: ['M', 'L'],
    colors: [],
    inStock: true,
    stockCount: 10,
    reviews: [],
  };

  useCmsStore.getState().addProduct(customProduct);
  assert(useCmsStore.getState().products.some((p) => p.id === customId), 'Custom product added');

  useCmsStore.getState().deleteProduct(customId);
  assert(!useCmsStore.getState().products.some((p) => p.id === customId), 'Custom product removed from store');
  assert(useCmsStore.getState().deletedProductIds.includes(customId), 'Custom product ID tracked in deletedProductIds');

  // 2. Delete baseline catalog product (zn-01)
  const defaultId = 'zn-01';
  useCmsStore.getState().deleteProduct(defaultId);
  assert(!useCmsStore.getState().products.some((p) => p.id === defaultId), 'Baseline product removed from store');
  assert(useCmsStore.getState().deletedProductIds.includes(defaultId), 'Baseline product ID tracked in deletedProductIds');

  // 3. Server sanitization check
  const sanitized = sanitizePublishedCmsData({
    products: useCmsStore.getState().products,
    deletedProductIds: useCmsStore.getState().deletedProductIds,
  });
  assert(!sanitized.products.some((p) => p.id === customId), 'Sanitized server products exclude custom deleted product');
  assert(!sanitized.products.some((p) => p.id === defaultId), 'Sanitized server products exclude baseline deleted product');

  // 4. Server slug lookup check
  await savePublishedCmsData({
    products: sanitized.products,
    deletedProductIds: useCmsStore.getState().deletedProductIds,
  });
  const lookedUp = await getPublishedProductBySlug('ryujin-dragon-jacquard-jacket');
  assert(lookedUp === null, 'getPublishedProductBySlug strictly returns null for deleted products');

  // 5. Client syncFromServer defense check
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        products: [customProduct, ...initialProducts],
        deletedProductIds: [customId, defaultId],
      },
    }),
  });

  await useCmsStore.getState().syncFromServer(true);
  const syncedProducts = useCmsStore.getState().products;
  assert(!syncedProducts.some((p) => p.id === customId), 'syncFromServer does not resurrect deleted custom product');
  assert(!syncedProducts.some((p) => p.id === defaultId), 'syncFromServer does not resurrect deleted baseline product');

  console.log(`\n=== SUMMARY: Passed: ${passed} | Failed: ${failed} ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
