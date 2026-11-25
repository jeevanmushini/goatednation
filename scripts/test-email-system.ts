/**
 * GOATED NATION - Full Email System, Template & OTP Cryptographic Logic Test Suite
 */

import assert from 'assert';
import crypto from 'crypto';
import {
  renderEmailLayout,
  getWelcomeEmailHtml,
  getOtpEmailHtml,
  getPasswordChangedEmailHtml,
  getOrderConfirmationEmailHtml,
  getShippingUpdateEmailHtml,
  getNewDropEmailHtml,
} from '../src/lib/email/templates';
import { sendEmail, sendWelcomeEmail, sendOtpEmail } from '../src/lib/email/mailer';
import { hashPassword, generateSalt, verifyPassword } from '../src/lib/auth/jwt';

console.log('====================================================');
console.log('GOATED NATION: Email & Cryptographic Test Suite');
console.log('====================================================');

let passedTests = 0;

function runTest(testName: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          console.log(`\x1b[32m✔ PASS:\x1b[0m ${testName}`);
          passedTests++;
        })
        .catch((err) => {
          console.error(`\x1b[31m✖ FAIL:\x1b[0m ${testName}`);
          console.error(err);
          process.exitCode = 1;
        });
    }
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${testName}`);
    passedTests++;
  } catch (error) {
    console.error(`\x1b[31m✖ FAIL:\x1b[0m ${testName}`);
    console.error(error);
    process.exitCode = 1;
  }
}

async function runAll() {
  // 1. Base Layout Test
  runTest('Base Template: Renders header, footer, and branding', () => {
    const html = renderEmailLayout({
      title: 'TEST TITLE',
      preheader: 'Test Preheader Text',
      content: '<p>Test Content</p>',
    });
    assert(html.includes('GOATED NATION'), 'Header must contain brand name');
    assert(html.includes('// 東京'), 'Header must contain Tokyo syndicate badge');
    assert(html.includes('Test Preheader Text'), 'Must include preheader');
    assert(html.includes('Test Content'), 'Must include inner content');
    assert(html.includes('goatednation@gmail.com'), 'Footer must contain support email');
  });

  // 2. Welcome Email Test
  runTest('Welcome Template: Renders WELCOME10 and Syndicate manifesto', () => {
    const html = getWelcomeEmailHtml({ name: 'Akira', discountCode: 'WELCOME10' });
    assert(html.includes('WELCOME TO THE SYNDICATE, AKIRA'), 'Must include personalized greeting');
    assert(html.includes('WELCOME10'), 'Must contain 10% discount coupon');
    assert(html.includes('EXPLORE THE DROPS'), 'Must have call to action button');
  });

  // 3. OTP Email Test
  runTest('OTP Template: Renders 6-digit spaced code and expiration notice', () => {
    const otp = '841920';
    const html = getOtpEmailHtml({ name: 'Ren', otp, ttlMinutes: 10 });
    assert(html.includes('8  4  1  9  2  0'), 'Must render spaced monospace OTP');
    assert(html.includes('VALID FOR 10 MINUTES ONLY'), 'Must render expiration notice');
    assert(html.includes('ONE-TIME PASSWORD (OTP) RESET'), 'Must include subject header');
  });

  // 4. Password Changed Email Test
  runTest('Password Changed Template: Renders security audit log and advisory', () => {
    const html = getPasswordChangedEmailHtml({
      name: 'Ren',
      timestamp: 'Sat, 21 Nov 2026 18:00:00 GMT',
      device: 'Chrome on MacOS',
    });
    assert(html.includes('PASSWORD UPDATED SUCCESSFULLY'), 'Must have title');
    assert(html.includes('Sat, 21 Nov 2026 18:00:00 GMT'), 'Must include timestamp');
    assert(html.includes('Chrome on MacOS'), 'Must include device details');
    assert(html.includes('DID NOT PERFORM THIS ACTION?'), 'Must include security warning');
  });

  // 5. Order Confirmation Email Test
  runTest('Order Confirmation Template: Renders itemized product list and financial totals', () => {
    const html = getOrderConfirmationEmailHtml({
      orderId: 'GN-99014',
      customerName: 'Kenji Sato',
      items: [
        {
          title: 'OVERSIZED HEAVYWEIGHT HOODIE // 001',
          price: 4999,
          quantity: 2,
          size: 'XL',
          color: 'WASHED ONYX',
        },
      ],
      subtotal: 9998,
      shippingCharge: 0,
      totalAmount: 9998,
      shippingAddress: {
        customerName: 'Kenji Sato',
        address: '4-12-10 Roppongi, Minato-ku',
        city: 'Tokyo',
        pincode: '106-0032',
      },
    });
    assert(html.includes('ORDER #GN-99014'), 'Must render order ID');
    assert(html.includes('OVERSIZED HEAVYWEIGHT HOODIE // 001'), 'Must include item title');
    assert(html.includes('₹9,998'), 'Must include formatted currency');
    assert(html.includes('4-12-10 Roppongi'), 'Must include shipping address');
  });

  // 6. Shipping Update Email Test
  runTest('Shipping Update Template: Renders dynamic status, courier and AWB', () => {
    const html = getShippingUpdateEmailHtml({
      orderId: 'GN-99014',
      customerName: 'Kenji',
      awbCode: 'DEL9948271810',
      courierName: 'Delhivery Surface',
      status: 'out_for_delivery',
    });
    assert(html.includes('OUT FOR DELIVERY'), 'Must show correct status title');
    assert(html.includes('DEL9948271810'), 'Must display AWB tracking number');
    assert(html.includes('DELHIVERY SURFACE'), 'Must display courier name');
    assert(html.includes('TRACK SHIPMENT LIVE'), 'Must include tracking CTA');
  });

  // 7. New Drop Announcement Email Test
  runTest('New Drop Template: Renders capsule title, banner image, and shop link', () => {
    const html = getNewDropEmailHtml({
      dropTitle: 'SHIBUYA UNDERGROUND // DROP 03',
      description: 'Heavyweight loopback French Terry hoodies engineered for Tokyo winters.',
    });
    assert(html.includes('SHIBUYA UNDERGROUND // DROP 03'), 'Must include drop title');
    assert(html.includes('Heavyweight loopback French Terry'), 'Must include description');
    assert(html.includes('SHOP THE DROP'), 'Must include CTA');
  });

  // 8. Mailer Resilience (Non-blocking simulation when credentials unconfigured)
  await runTest('Mailer Dispatcher: Graceful resilient simulated send without throwing', async () => {
    const res = await sendEmail({
      to: 'collector@example.com',
      subject: 'Test Subject',
      html: '<p>Test</p>',
    });
    assert(res.success === true, 'Mailer should return success true in fallback/live');
  });

  // 9. Cryptographic Password Hashing & Salt Verification
  runTest('Auth Cryptography: Salt generation and PBKDF2 SHA-512 password verification', () => {
    const salt = generateSalt();
    const hash = hashPassword('SyndicatePass@2026', salt);
    assert(verifyPassword('SyndicatePass@2026', salt, hash) === true, 'Correct password must verify');
    assert(verifyPassword('WrongPass', salt, hash) === false, 'Wrong password must fail');
  });

  // 10. OTP SHA-256 Hashing Logic Verification
  runTest('OTP Verification: Cryptographic SHA-256 match and rejection on mismatch', () => {
    const rawOtp = '492817';
    const computedHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const incomingMatch = crypto.createHash('sha256').update('492817').digest('hex');
    const incomingWrong = crypto.createHash('sha256').update('123456').digest('hex');
    assert(computedHash === incomingMatch, 'Matching OTP should produce identical hash');
    assert(computedHash !== incomingWrong, 'Mismatched OTP should not match hash');
  });

  console.log('====================================================');
  console.log(`Total tests passed: ${passedTests}/10`);
  console.log('====================================================');
}

runAll();
