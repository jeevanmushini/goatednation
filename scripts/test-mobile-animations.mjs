// @ts-check
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== MOBILE RESPONSIVE & ANIMATIONS VERIFICATION SUITE ===\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`[PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${description}\n       Error: ${err.message}`);
    failed++;
  }
}

const ROOT = process.cwd();

// ----------------------------------------------------
// 1. Hero 3D Floating Bottoms
// ----------------------------------------------------
console.log('--- 1. Testing ZeninHeroFloatingPants (Mobile Gestures & Animations) ---');
const heroFile = fs.readFileSync(path.join(ROOT, 'src/components/zenin/ZeninHeroFloatingPants.tsx'), 'utf-8');

test('Hero Floating Bottoms has MOBILE_POSITIONS with clean preview peeks', () => {
  assert(heroFile.includes('MOBILE_POSITIONS'), 'MOBILE_POSITIONS definition missing');
  assert(heroFile.includes('[-1]: { x: -56'), 'Left peek offset missing');
  assert(heroFile.includes('[0]: { x: 0'), 'Center active pant position missing');
  assert(heroFile.includes('[1]: { x: 56'), 'Right peek offset missing');
});

test('Hero Floating Bottoms preserves vertical native scrolling (pan-y)', () => {
  assert(heroFile.includes("touchAction: 'pan-y'"), "touchAction: 'pan-y' style missing");
  assert(heroFile.includes('Math.abs(dy) > Math.abs(dx)'), 'Vertical scroll intent check missing');
  assert(heroFile.includes('isVerticalScroll.current = true'), 'Vertical scroll lock missing');
});

test('Hero Floating Bottoms has responsive drag sensitivity for mobile screens', () => {
  assert(
    /isMobile\s*\?\s*\(dragOffsetPx\s*\/\s*360\)\s*\*\s*45/.test(heroFile),
    'Responsive drag shift formula missing'
  );
});

test('Hero Floating Bottoms provides quick-slide chevron buttons for touch users', () => {
  assert(heroFile.includes('ChevronLeft'), 'ChevronLeft button missing');
  assert(heroFile.includes('ChevronRight'), 'ChevronRight button missing');
  assert(heroFile.includes('slidePrev()'), 'slidePrev click handler missing');
  assert(heroFile.includes('slideNext()'), 'slideNext click handler missing');
});

test('Hero Floating Bottoms has Framer Motion spring physics and AnimatePresence title transitions', () => {
  assert(heroFile.includes("type: 'spring'"), 'Framer Motion spring physics missing');
  assert(heroFile.includes('AnimatePresence'), 'AnimatePresence title transition missing');
});

// ----------------------------------------------------
// 2. Category 3D Stack
// ----------------------------------------------------
console.log('\n--- 2. Testing ZeninCategory3DStack (Mobile Gestures & 3D Depth) ---');
const stackFile = fs.readFileSync(path.join(ROOT, 'src/components/zenin/ZeninCategory3DStack.tsx'), 'utf-8');

test('Category 3D Stack has mobile viewport detection', () => {
  assert(stackFile.includes('isMobile'), 'isMobile state missing');
  assert(stackFile.includes('window.innerWidth < 768'), 'Mobile breakpoint check missing');
});

test('Category 3D Stack has touch swipe gestures with pan-y preservation', () => {
  assert(stackFile.includes("touchAction: 'pan-y'"), "touchAction: 'pan-y' missing");
  assert(stackFile.includes('handlePointerDown'), 'handlePointerDown handler missing');
  assert(stackFile.includes('handlePointerMove'), 'handlePointerMove handler missing');
  assert(stackFile.includes('handlePointerUp'), 'handlePointerUp handler missing');
  assert(stackFile.includes('Math.abs(dy) > Math.abs(dx)'), 'Vertical scroll guard missing');
});

test('Category 3D Stack has mobile-tuned 3D depth and scale', () => {
  assert(stackFile.includes('isMobile ? normalizedOffset * 48 : normalizedOffset * 75'), 'Mobile 3D translation offset missing');
  assert(stackFile.includes('isMobile ? 70 : 120'), 'Mobile z-depth missing');
  assert(stackFile.includes('w-[260px] sm:w-[340px]'), 'Responsive card width missing');
});

test('Category 3D Stack has touch-friendly navigation controls and pagination dots', () => {
  assert(stackFile.includes('ChevronLeft'), 'ChevronLeft button missing');
  assert(stackFile.includes('ChevronRight'), 'ChevronRight button missing');
  assert(stackFile.includes('safeActiveIndex === idx'), 'Pagination indicator active state missing');
});

// ----------------------------------------------------
// 3. Product Detail Page Gallery
// ----------------------------------------------------
console.log('\n--- 3. Testing ProductDetailPage (Gallery Swipe & Slide Animations) ---');
const productPageFile = fs.readFileSync(path.join(ROOT, 'src/app/products/[slug]/page.tsx'), 'utf-8');

test('Product Gallery has Framer Motion AnimatePresence slide transitions', () => {
  assert(productPageFile.includes('AnimatePresence'), 'AnimatePresence missing in product gallery');
  assert(productPageFile.includes('mode="popLayout"'), 'popLayout mode missing');
  assert(productPageFile.includes('slideDirection'), 'slideDirection state missing');
  assert(productPageFile.includes("x: slideDirection > 0 ? '100%' : '-100%'"), 'Slide animation coordinate calculation missing');
});

test('Product Gallery has horizontal touch swipe gesture handling', () => {
  assert(productPageFile.includes("touchAction: 'pan-y'"), "touchAction: 'pan-y' missing on gallery");
  assert(productPageFile.includes('slideNext()'), 'slideNext missing');
  assert(productPageFile.includes('slidePrev()'), 'slidePrev missing');
  assert(productPageFile.includes('dx < -30'), 'Swipe left threshold missing');
  assert(productPageFile.includes('dx > 30'), 'Swipe right threshold missing');
});

test('Product Gallery has on-image navigation chevrons and counter badge', () => {
  assert(productPageFile.includes('ChevronLeft'), 'ChevronLeft arrow missing');
  assert(productPageFile.includes('ChevronRight'), 'ChevronRight arrow missing');
  assert(productPageFile.includes('selectedImageIndex + 1'), 'Image counter badge missing');
});

// ----------------------------------------------------
// 4. Header & Mobile Menu Drawer
// ----------------------------------------------------
console.log('\n--- 4. Testing ZeninHeader (Mobile Navigation Drawer Animation) ---');
const headerFile = fs.readFileSync(path.join(ROOT, 'src/components/zenin/ZeninHeader.tsx'), 'utf-8');

test('Mobile header drawer has animated Framer Motion slide-down transition', () => {
  assert(headerFile.includes('AnimatePresence'), 'AnimatePresence missing in header');
  assert(headerFile.includes('motion.div'), 'motion.div missing in mobile drawer');
  assert(headerFile.includes("height: 'auto'"), 'Height expand animation missing');
  assert(headerFile.includes('height: 0'), 'Height collapse animation missing');
});

test('Mobile header has hamburger toggle button with accessibility label', () => {
  assert(headerFile.includes('aria-label="Toggle Menu"'), 'Toggle Menu aria-label missing');
  assert(headerFile.includes('isMobileMenuOpen'), 'isMobileMenuOpen state missing');
});

// ----------------------------------------------------
// 5. Product Grid Cards Mobile Accessibility
// ----------------------------------------------------
console.log('\n--- 5. Testing ProductCard & ZeninNewArrivals (Mobile Touch Accessibility) ---');
const productCardFile = fs.readFileSync(path.join(ROOT, 'src/components/product/ProductCard.tsx'), 'utf-8');
const arrivalsFile = fs.readFileSync(path.join(ROOT, 'src/components/zenin/ZeninNewArrivals.tsx'), 'utf-8');

test('ProductCard Wishlist button is visible on mobile touch devices', () => {
  assert(productCardFile.includes('opacity-100 sm:opacity-0 sm:group-hover:opacity-100'), 'Mobile wishlist visibility class missing');
});

test('ZeninNewArrivals Quick Add button is directly accessible on mobile screens', () => {
  assert(arrivalsFile.includes('opacity-100 sm:opacity-0 sm:group-hover:opacity-100'), 'Mobile quick add visibility class missing');
});

// ----------------------------------------------------
// 6. Responsive Viewport & Meta Verification
// ----------------------------------------------------
console.log('\n--- 6. Testing Responsive Viewport Configuration ---');
const layoutFile = fs.readFileSync(path.join(ROOT, 'src/app/layout.tsx'), 'utf-8');

test('Root layout configures Next.js mobile viewport specification', () => {
  assert(layoutFile.includes('export const viewport: Viewport'), 'Viewport export missing');
  assert(layoutFile.includes('width: "device-width"'), 'device-width missing in viewport');
  assert(layoutFile.includes('initialScale: 1'), 'initialScale missing in viewport');
});

test('Root layout has smooth scrolling and anti-aliased font rendering', () => {
  assert(layoutFile.includes('scroll-smooth'), 'scroll-smooth class missing');
  assert(layoutFile.includes('antialiased'), 'antialiased class missing');
});

console.log('\n=== VERIFICATION SUMMARY ===');
console.log(`Total Passed: ${passed} | Total Failed: ${failed}`);
if (failed === 0) {
  console.log('\n>>> ALL MOBILE ANIMATIONS & GESTURES VERIFIED SUCCESSFULLY! <<<');
} else {
  process.exit(1);
}
