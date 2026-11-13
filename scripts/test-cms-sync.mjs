import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
};
globalThis.localStorage = globalThis.window.localStorage;

async function runTests() {
  console.log('=== STARTING CMS IMAGE & TEXT CHANGE VERIFICATION TEST ===\n');

  const jiti = require('jiti')(__filename);
  const { useCmsStore } = jiti('../src/lib/cms/cmsStore.ts');
  const store = useCmsStore.getState();

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

  // --- TEST 1: ANNOUNCEMENT BAR TEXT UPDATES ---
  console.log('Test 1: Admin Announcement Bar Texts');
  const initialHighlight = store.announcement?.highlightText;
  const initialText = store.announcement?.text;
  console.log(`  Initial highlight: "${initialHighlight}" | Text: "${initialText}"`);

  useCmsStore.getState().updateAnnouncement({
    highlightText: 'FLASH SALE 30% OFF',
    text: 'USE CODE FLASH30 AT CHECKOUT',
    ctaText: 'GRAB NOW',
    ctaLink: '/collections/all-products',
    countdownDays: 5,
  });

  const updatedAnn = useCmsStore.getState().announcement;
  assert(updatedAnn.highlightText === 'FLASH SALE 30% OFF', 'Announcement highlight text updated to FLASH SALE 30% OFF');
  assert(updatedAnn.text === 'USE CODE FLASH30 AT CHECKOUT', 'Announcement copy text updated to USE CODE FLASH30 AT CHECKOUT');
  assert(updatedAnn.ctaText === 'GRAB NOW', 'Announcement CTA button updated to GRAB NOW');
  assert(updatedAnn.ctaLink === '/collections/all-products', 'Announcement CTA link updated to /collections/all-products');
  assert(updatedAnn.countdownDays === 5, 'Announcement countdown days updated to 5');

  // --- TEST 2: HERO 3D FLOATING BOTTOMS IMAGE & TEXT UPDATES ---
  console.log('\nTest 2: Admin Hero 3D Floating Bottoms (Image & Texts)');
  const firstBottom = useCmsStore.getState().heroBottoms[0];
  console.log(`  Current Pant #1: "${firstBottom.name}" | Image: "${firstBottom.image}"`);

  const newPantImage = 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80';
  const newPantName = 'CUSTOM MECHA COMBAT JOGGERS // V2';
  const newPantPrice = 'Rs. 2,499';

  useCmsStore.getState().updateHeroBottom(firstBottom.id, {
    name: newPantName,
    image: newPantImage,
    price: newPantPrice,
    badge: 'VERIFIED TEST',
  });

  const updatedFirstBottom = useCmsStore.getState().heroBottoms[0];
  assert(updatedFirstBottom.name === newPantName, 'Hero Bottom title updated');
  assert(updatedFirstBottom.image === newPantImage, 'Hero Bottom image URL updated');
  assert(updatedFirstBottom.price === newPantPrice, 'Hero Bottom price tag updated');
  assert(updatedFirstBottom.badge === 'VERIFIED TEST', 'Hero Bottom badge updated');

  // Test adding new silhouette
  const initialBottomsCount = useCmsStore.getState().heroBottoms.length;
  useCmsStore.getState().addHeroBottom({
    name: 'EXPERIMENTAL NINJA TECH PANTS',
    kanji: '忍 // CARBON COATED',
    price: 'Rs. 2,999',
    image: 'https://zenin.co.in/cdn/shop/files/pant6.png',
    color: 'Stealth Carbon',
    badge: 'NEW DROP',
  });
  const newBottomsCount = useCmsStore.getState().heroBottoms.length;
  assert(newBottomsCount === initialBottomsCount + 1, `Added new pant silhouette (Total: ${newBottomsCount})`);

  // --- TEST 3: EDITORIAL BANNER IMAGE & TEXT UPDATES ---
  console.log('\nTest 3: Admin Editorial Banner (Image & Texts)');
  const initialEditorial = useCmsStore.getState().editorialBanner;
  console.log(`  Initial Editorial: Followers: "${initialEditorial?.followersText}" | Image: "${initialEditorial?.image}"`);

  const newBannerImage = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80';
  useCmsStore.getState().updateEditorialBanner({
    image: newBannerImage,
    followersText: '300K TOKYO SYNDICATE',
    ctaText: 'FOLLOW THE MOVEMENT',
    instagramUrl: 'https://instagram.com/mycustombrand',
  });

  const updatedEditorial = useCmsStore.getState().editorialBanner;
  assert(updatedEditorial.image === newBannerImage, 'Editorial Banner image updated');
  assert(updatedEditorial.followersText === '300K TOKYO SYNDICATE', 'Editorial Followers text updated');
  assert(updatedEditorial.ctaText === 'FOLLOW THE MOVEMENT', 'Editorial CTA text updated');
  assert(updatedEditorial.instagramUrl === 'https://instagram.com/mycustombrand', 'Editorial Instagram link updated');

  // --- TEST 4: 3D STACK CATEGORY CARDS IMAGE & TEXT UPDATES ---
  console.log('\nTest 4: Admin 3D Category Stack Cards (Image & Texts)');
  const firstCard = useCmsStore.getState().stackCards[0];
  console.log(`  Initial Stack Card #1: "${firstCard.title}" | Image: "${firstCard.image}"`);

  const newCardImage = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80';
  useCmsStore.getState().updateStackCard(firstCard.id, {
    title: 'CYBER TACTICAL RIG // MODULAR',
    category: 'TECHWEAR',
    subtitle: 'BALLISTIC NYLON • WATERPROOF ZIPPERS',
    image: newCardImage,
    link: '/collections/vest',
  });

  const updatedFirstCard = useCmsStore.getState().stackCards[0];
  assert(updatedFirstCard.title === 'CYBER TACTICAL RIG // MODULAR', 'Stack card title updated');
  assert(updatedFirstCard.category === 'TECHWEAR', 'Stack card category updated');
  assert(updatedFirstCard.subtitle === 'BALLISTIC NYLON • WATERPROOF ZIPPERS', 'Stack card subtitle updated');
  assert(updatedFirstCard.image === newCardImage, 'Stack card image updated');
  assert(updatedFirstCard.link === '/collections/vest', 'Stack card link updated');

  // --- TEST 5: PRODUCT CATALOG (IMAGE, TITLE, PRICE UPDATES) ---
  console.log('\nTest 5: Admin Products (Image, Title, Price)');
  const productToEdit = useCmsStore.getState().products[0];
  console.log(`  Initial Product: "${productToEdit.title}" | Price: Rs. ${productToEdit.price}`);

  const updatedProductImage = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80';
  useCmsStore.getState().updateProduct(productToEdit.id, {
    title: 'RYUJIN DRAGON GOLD LIMITED EDITION',
    price: 8999,
    originalPrice: 12999,
    badge: 'ULTRA RARE',
    images: [updatedProductImage, productToEdit.images[1] || updatedProductImage],
  });

  const updatedProduct = useCmsStore.getState().products.find((p) => p.id === productToEdit.id);
  assert(updatedProduct.title === 'RYUJIN DRAGON GOLD LIMITED EDITION', 'Product title updated');
  assert(updatedProduct.price === 8999, 'Product price updated');
  assert(updatedProduct.originalPrice === 12999, 'Product originalPrice updated');
  assert(updatedProduct.badge === 'ULTRA RARE', 'Product badge updated');
  assert(updatedProduct.images[0] === updatedProductImage, 'Product primary image updated');

  // Test adding a brand new product
  const newCustomProduct = {
    id: 'prod-custom-999',
    slug: 'custom-oversized-cyber-hoodie',
    title: 'CUSTOM OVERSIZED CYBER HOODIE',
    anime: 'Cyberpunk Tokyo',
    category: 'hoodies',
    price: 3499,
    originalPrice: 5999,
    discountPercent: 42,
    rating: 5.0,
    reviewCount: 1,
    badge: 'NEW RELEASE',
    images: [newBannerImage, updatedProductImage],
    description: 'Exclusive 460 GSM heavyweight cotton hoodie.',
    details: {
      gsm: '460 GSM',
      fabric: '100% French Terry Cotton',
      fit: 'Oversized Boxy',
      printType: 'High Density Puff',
      care: ['Machine wash cold'],
    },
    sizes: ['M', 'L', 'XL'],
    colors: [{ name: 'Onyx Black', hex: '#111111', class: 'bg-[#111111]' }],
    inStock: true,
    stockCount: 20,
    isFeatured: true,
    isNewDrop: true,
    reviews: [],
  };

  useCmsStore.getState().addProduct(newCustomProduct);
  const foundNewProduct = useCmsStore.getState().products.find((p) => p.id === 'prod-custom-999');
  assert(Boolean(foundNewProduct), 'New custom product added to CMS product catalog');
  assert(foundNewProduct.title === 'CUSTOM OVERSIZED CYBER HOODIE', 'New product title verified');
  assert(foundNewProduct.images[0] === newBannerImage, 'New product primary image verified');

  // --- TEST 6: GLOBAL SITE SETTINGS (BRAND NAME, CONTACT, SOCIALS) ---
  console.log('\nTest 6: Admin Site Settings (Brand Name, Announcement, Socials)');
  useCmsStore.getState().updateSettings({
    brandName: 'NEO TOKYO STREETS',
    instagramUrl: 'https://instagram.com/neotokyo',
    supportEmail: 'contact@neotokyo.jp',
    announcementEnabled: true,
  });

  const updatedSettings = useCmsStore.getState().settings;
  assert(updatedSettings.brandName === 'NEO TOKYO STREETS', 'Site settings brandName updated');
  assert(updatedSettings.instagramUrl === 'https://instagram.com/neotokyo', 'Site settings Instagram link updated');
  assert(updatedSettings.supportEmail === 'contact@neotokyo.jp', 'Site settings support email updated');

  // --- TEST 7: LOCALSTORAGE PERSISTENCE SYNC ---
  console.log('\nTest 7: LocalStorage Persistence Sync');
  useCmsStore.getState().publishChanges();
  const rawStorage = storageMap.get('animestreet-cms-data');
  assert(Boolean(rawStorage), 'Zustand state successfully persisted into localStorage ("animestreet-cms-data")');
  if (rawStorage) {
    const parsed = JSON.parse(rawStorage);
    assert(parsed.state.settings.brandName === 'NEO TOKYO STREETS', 'Persisted brandName matches updated value');
    assert(parsed.state.announcement.highlightText === 'FLASH SALE 30% OFF', 'Persisted announcement matches updated value');
    assert(parsed.state.heroBottoms[0].name === newPantName, 'Persisted hero bottom name matches updated value');
    assert(parsed.state.heroBottoms[0].image === newPantImage, 'Persisted hero bottom image matches updated value');
    assert(parsed.state.editorialBanner.image === newBannerImage, 'Persisted editorial banner image matches updated value');
  }

  console.log(`\n=== VERIFICATION SUMMARY ===`);
  console.log(`Total Passed: ${passed} | Total Failed: ${failed}`);
  if (failed === 0) {
    console.log(`\n>>> ALL CMS IMAGE AND TEXT SYNCHRONIZATION TESTS PASSED PERFECTLY! <<<`);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
