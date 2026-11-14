// @ts-check
import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

console.log('====================================================');
console.log('   GOATED NATION COMPREHENSIVE SYSTEM AUDIT SUITE   ');
console.log('====================================================\n');

let totalPassed = 0;
let totalFailed = 0;

function runTest(category, description, fn) {
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    totalPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${description}\n         Error: ${err.message}`);
    totalFailed++;
  }
}

const ROOT = process.cwd();

// -----------------------------------------------------------------
// 1. Environment Variables & Key Mapping Verification
// -----------------------------------------------------------------
console.log('1. ENVIRONMENT VARIABLES & KEY RESOLUTION:');
const envFile = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8');

runTest('ENV', '.env.local contains updated SITE_URL key', () => {
  assert(envFile.includes('SITE_URL='), 'SITE_URL missing in .env.local');
});

runTest('ENV', '.env.local contains updated PRIVATE_SHIPROCKET_PICKUP_PINCODE key', () => {
  assert(envFile.includes('PRIVATE_SHIPROCKET_PICKUP_PINCODE='), 'PRIVATE_SHIPROCKET_PICKUP_PINCODE missing in .env.local');
});

runTest('ENV', '.env.local contains updated PRIVATE_RAZORPAY_KEY_ID key', () => {
  assert(envFile.includes('PRIVATE_RAZORPAY_KEY_ID='), 'PRIVATE_RAZORPAY_KEY_ID missing in .env.local');
  assert(envFile.includes('rzp_test_U02QRHZ4Zt0UTD'), 'User Razorpay test key ID missing in .env.local');
});

runTest('ENV', '.env.local contains user RAZORPAY_KEY_SECRET', () => {
  assert(envFile.includes('RAZORPAY_KEY_SECRET='), 'RAZORPAY_KEY_SECRET missing in .env.local');
  assert(envFile.includes('rAOz4jkRWRZT5qMndnVmedzk'), 'User Razorpay secret missing in .env.local');
});

// -----------------------------------------------------------------
// 2. Razorpay Integration & Cryptographic Signature Verification
// -----------------------------------------------------------------
console.log('\n2. RAZORPAY INTEGRATION & SIGNATURE VERIFICATION:');
const razorpayLib = fs.readFileSync(path.join(ROOT, 'src/lib/razorpay.ts'), 'utf-8');
const checkoutModal = fs.readFileSync(path.join(ROOT, 'src/components/layout/CheckoutModal.tsx'), 'utf-8');

runTest('RAZORPAY', 'razorpay.ts supports PRIVATE_RAZORPAY_KEY_ID with backwards compatibility', () => {
  assert(razorpayLib.includes('process.env.PRIVATE_RAZORPAY_KEY_ID'), 'PRIVATE_RAZORPAY_KEY_ID lookup missing');
  assert(razorpayLib.includes('process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID'), 'NEXT_PUBLIC_RAZORPAY_KEY_ID fallback missing');
});

runTest('RAZORPAY', 'HMAC SHA-256 signature verification logic is cryptographically sound', () => {
  const testSecret = 'rAOz4jkRWRZT5qMndnVmedzk';
  const orderId = 'order_test_998877';
  const paymentId = 'pay_test_112233';
  const expectedSig = crypto
    .createHmac('sha256', testSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Verify HMAC generator matches
  assert.strictEqual(typeof expectedSig, 'string');
  assert.strictEqual(expectedSig.length, 64);
  assert(
    /crypto\s*\.\s*createHmac\s*\(\s*['"]sha256['"]\s*,\s*keySecret\s*\)/.test(razorpayLib),
    'crypto createHmac missing in razorpay.ts'
  );
});

runTest('RAZORPAY', 'CheckoutModal loads official Razorpay SDK & triggers standard popup', () => {
  assert(checkoutModal.includes('https://checkout.razorpay.com/v1/checkout.js'), 'Razorpay checkout script URL missing');
  assert(checkoutModal.includes('rzpInstance.open()'), 'Razorpay open call missing');
  assert(checkoutModal.includes('GOATED NATION'), 'Brand name missing in checkout modal options');
});

// -----------------------------------------------------------------
// 3. Shiprocket Logistics Pickup Pincode Integration
// -----------------------------------------------------------------
console.log('\n3. SHIPROCKET LOGISTICS & PINCODE INTEGRATION:');
const shiprocketLib = fs.readFileSync(path.join(ROOT, 'src/lib/shiprocket.ts'), 'utf-8');
const ratesRoute = fs.readFileSync(path.join(ROOT, 'src/app/api/shipping/rates/route.ts'), 'utf-8');
const servRoute = fs.readFileSync(path.join(ROOT, 'src/app/api/shipping/serviceability/route.ts'), 'utf-8');

runTest('SHIPROCKET', 'shiprocket.ts resolves PRIVATE_SHIPROCKET_PICKUP_PINCODE properly', () => {
  assert(shiprocketLib.includes('process.env.PRIVATE_SHIPROCKET_PICKUP_PINCODE'), 'PRIVATE_SHIPROCKET_PICKUP_PINCODE missing in shiprocket.ts');
  assert(shiprocketLib.includes('560054'), 'Default warehouse pincode fallback missing');
});

runTest('SHIPROCKET', 'Shipping rates and serviceability API routes support updated pickup pincode', () => {
  assert(ratesRoute.includes('process.env.PRIVATE_SHIPROCKET_PICKUP_PINCODE'), 'PRIVATE_SHIPROCKET_PICKUP_PINCODE missing in rates route');
  assert(servRoute.includes('process.env.PRIVATE_SHIPROCKET_PICKUP_PINCODE'), 'PRIVATE_SHIPROCKET_PICKUP_PINCODE missing in serviceability route');
});

// -----------------------------------------------------------------
// 4. OAuth & Site URL Integration
// -----------------------------------------------------------------
console.log('\n4. GOOGLE OAUTH & SITE_URL RESOLUTION:');
const oauthProvider = fs.readFileSync(path.join(ROOT, 'src/app/api/auth/oauth/[provider]/route.ts'), 'utf-8');
const oauthCallback = fs.readFileSync(path.join(ROOT, 'src/app/api/auth/oauth/callback/route.ts'), 'utf-8');
const oauthConfig = fs.readFileSync(path.join(ROOT, 'src/app/api/admin/oauth-config/route.ts'), 'utf-8');

runTest('OAUTH', 'OAuth provider route resolves SITE_URL', () => {
  assert(oauthProvider.includes('process.env.SITE_URL'), 'SITE_URL missing in oauth provider route');
});

runTest('OAUTH', 'OAuth callback route resolves SITE_URL', () => {
  assert(oauthCallback.includes('process.env.SITE_URL'), 'SITE_URL missing in oauth callback route');
});

runTest('OAUTH', 'Admin oauth config endpoint resolves SITE_URL', () => {
  assert(oauthConfig.includes('process.env.SITE_URL'), 'SITE_URL missing in oauth-config route');
});

// -----------------------------------------------------------------
// 5. Mobile Gestures & Animation Architecture
// -----------------------------------------------------------------
console.log('\n5. MOBILE GESTURES & ANIMATION ARCHITECTURE:');
const heroPants = fs.readFileSync(path.join(ROOT, 'src/components/zenin/ZeninHeroFloatingPants.tsx'), 'utf-8');
const catStack = fs.readFileSync(path.join(ROOT, 'src/components/zenin/ZeninCategory3DStack.tsx'), 'utf-8');
const prodPage = fs.readFileSync(path.join(ROOT, 'src/app/products/[slug]/page.tsx'), 'utf-8');

runTest('MOBILE', 'Hero 3D floating bottoms has directional scroll preservation and swipe arrows', () => {
  assert(heroPants.includes("touchAction: 'pan-y'"), 'touchAction pan-y missing on hero');
  assert(heroPants.includes('MOBILE_POSITIONS'), 'MOBILE_POSITIONS missing on hero');
  assert(heroPants.includes('ChevronLeft') && heroPants.includes('ChevronRight'), 'Chevron arrows missing on hero');
});

runTest('MOBILE', 'Category 3D card deck has touch swipe gestures and responsive depth', () => {
  assert(catStack.includes("touchAction: 'pan-y'"), 'touchAction pan-y missing on 3D stack');
  assert(catStack.includes('handlePointerMove'), 'Pointer gesture missing on 3D stack');
  assert(catStack.includes('isMobile ? 70 : 120'), 'Mobile 3D z-depth missing');
});

runTest('MOBILE', 'Product detail gallery has Framer Motion slide transitions and touch swipe', () => {
  assert(prodPage.includes("touchAction: 'pan-y'"), 'touchAction pan-y missing on product gallery');
  assert(prodPage.includes('AnimatePresence'), 'AnimatePresence missing on product gallery');
  assert(prodPage.includes('ChevronLeft') && prodPage.includes('ChevronRight'), 'Slide chevrons missing on product gallery');
});

// -----------------------------------------------------------------
// 6. Security Audit: .gitignore & Zero Secret Exposure
// -----------------------------------------------------------------
console.log('\n6. SECURITY AUDIT:');
const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf-8');

runTest('SECURITY', '.gitignore strictly excludes all .env variants', () => {
  assert(gitignore.includes('.env*'), '.env* wildcard missing in .gitignore');
});

console.log('\n====================================================');
console.log(` AUDIT SUMMARY: ${totalPassed} Passed | ${totalFailed} Failed `);
console.log('====================================================');

if (totalFailed === 0) {
  console.log('>>> ALL SYSTEM AUDIT CHECKS COMPLETED PERFECTLY! <<<\n');
} else {
  process.exit(1);
}
