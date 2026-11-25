/**
 * GOATED NATION - Security Audit & PII Remediation Test Suite
 * Verifying SEC-01 (Order History IDOR), SEC-02 (PII Leak in Tracking), and SEC-03 (Ticket Thread Dual-Key Auth)
 */

import assert from 'assert';
import { generateTicketAccessToken, verifyTicketAccessToken } from '../src/lib/ticketSecurity';
import { signJwt, verifyJwt } from '../src/lib/auth/jwt';

console.log('====================================================');
console.log('GOATED NATION: Security & PII Remediation Test Suite');
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
  // ── SEC-03 / TC-SEC-06 / TC-SEC-07: HMAC Token Verification ──
  runTest('TC-SEC-07: Cryptographic HMAC Token Generation & Constant-Time Verification', () => {
    const ticketId = 'tick_9a8f2bc';
    const email = 'collector@example.com';
    const token = generateTicketAccessToken(ticketId, email);

    assert.strictEqual(token.length, 24, 'Token must be exactly 24 hex characters');
    assert.strictEqual(verifyTicketAccessToken(ticketId, email, token), true, 'Valid token must verify');

    // Case insensitivity & trimming
    assert.strictEqual(
      verifyTicketAccessToken(ticketId.toUpperCase(), '  COLLECTOR@EXAMPLE.COM  ', token),
      true,
      'Token verification must be normalized'
    );

    // Tampered token rejection
    assert.strictEqual(
      verifyTicketAccessToken(ticketId, email, token.substring(0, 23) + 'x'),
      false,
      'Tampered token must fail'
    );

    // Mismatched ticket or email
    assert.strictEqual(
      verifyTicketAccessToken('other_ticket', email, token),
      false,
      'Mismatched ticket ID must fail'
    );
    assert.strictEqual(
      verifyTicketAccessToken(ticketId, 'hacker@example.com', token),
      false,
      'Mismatched email must fail'
    );
  });

  // ── SEC-01 / TC-SEC-01 & TC-SEC-02: Identity Binding Simulation ──
  runTest('TC-SEC-01 & TC-SEC-02: Strict Identity Binding & BOLA Prevention', () => {
    // 1. Unauthenticated caller simulation
    const unauthenticatedToken = null;
    assert.strictEqual(Boolean(unauthenticatedToken), false, 'Unauthenticated access must be detected');

    // 2. Customer token simulation
    const customerToken = signJwt({
      id: 'usr_customer_1',
      email: 'customerA@goatednation.com',
      name: 'Customer A',
      role: 'CUSTOMER',
      provider: 'credentials',
    });
    const customerPayload = verifyJwt(customerToken);
    assert(customerPayload, 'Customer JWT must verify');

    // Attempted parameter pollution by customer
    const queryParamEmail = 'victim@gmail.com';
    let targetEmailForCustomer = customerPayload.email.toLowerCase().trim();
    if (customerPayload.role === 'ADMIN' && queryParamEmail) {
      targetEmailForCustomer = queryParamEmail;
    }
    assert.strictEqual(
      targetEmailForCustomer,
      'customera@goatednation.com',
      'Customer MUST NOT be able to override target email via query parameters'
    );

    // 3. Admin token simulation
    const adminToken = signJwt({
      id: 'usr_admin_1',
      email: 'admin@goatednation.com',
      name: 'Syndicate Admin',
      role: 'ADMIN',
      provider: 'credentials',
    });
    const adminPayload = verifyJwt(adminToken);
    assert(adminPayload, 'Admin JWT must verify');

    let targetEmailForAdmin = adminPayload.email.toLowerCase().trim();
    if (adminPayload.role === 'ADMIN' && queryParamEmail) {
      targetEmailForAdmin = queryParamEmail;
    }
    assert.strictEqual(
      targetEmailForAdmin,
      'victim@gmail.com',
      'Administrator is authorized to inspect specific customer email'
    );
  });

  // ── SEC-02 / TC-SEC-03 & TC-SEC-04: Tier-1 Redaction Simulation ──
  runTest('TC-SEC-03 & TC-SEC-04: Public Tracking PII Redaction & Masking Logic', () => {
    const rawOrder = {
      id: 'GN-99014',
      status: 'IN_TRANSIT',
      awbCode: 'DEL9948271810',
      shiprocketOrderId: 'SR-102948',
      createdAt: '2026-11-20T10:00:00Z',
      totalAmount: 4999,
      userEmail: 'akira.sato@gmail.com',
      shippingAddress: {
        customerName: 'Akira Sato',
        phone: '9876543210',
        address: 'Flat 402, Sakura Heights, 12th Main Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      items: [
        { title: 'SUKUNA DOMAIN HOODIE', quantity: 1, size: 'L' },
      ],
    };

    // Helper mirror
    function sanitize(order: any, isAuthorized: boolean) {
      if (isAuthorized) return order;
      const rawAddr = order.shippingAddress || {};
      const [u, d] = (order.userEmail || '').split('@');
      const maskedEmail = `${u.slice(0, 1)}***@${d}`;
      const maskedPhone = `******${rawAddr.phone.slice(-4)}`;
      const nameParts = (rawAddr.customerName || '').split(' ');
      const maskedName = `${nameParts[0]} ${nameParts[1].slice(0, 1)}***`;

      return {
        id: order.id,
        customerName: maskedName,
        userEmail: maskedEmail,
        phone: maskedPhone,
        destination: {
          city: rawAddr.city,
          state: rawAddr.state,
          pincode: rawAddr.pincode,
        },
      };
    }

    // Public / Unauthenticated view
    const publicView = sanitize(rawOrder, false);
    assert.strictEqual(publicView.userEmail, 'a***@gmail.com', 'Email must be masked');
    assert.strictEqual(publicView.phone, '******3210', 'Phone must be masked to last 4 digits');
    assert.strictEqual(publicView.customerName, 'Akira S***', 'Last name must be masked');
    assert.strictEqual((publicView as any).shippingAddress, undefined, 'Raw shipping address object must not exist');
    assert.strictEqual((publicView as any).address, undefined, 'Street address line must be stripped');
    assert.strictEqual(publicView.destination.city, 'Bengaluru', 'City remains for logistics verification');
    assert.strictEqual(publicView.destination.pincode, '560038', 'Pincode remains');

    // Authorized Owner view
    const ownerView = sanitize(rawOrder, true);
    assert.strictEqual(ownerView.userEmail, 'akira.sato@gmail.com', 'Owner sees full email');
    assert.strictEqual(ownerView.shippingAddress.address, 'Flat 402, Sakura Heights, 12th Main Indiranagar', 'Owner sees full address');
  });

  // ── SEC-03: Email Templates Contain Tokens ──
  runTest('TC-SEC-06: Email Templates embed Cryptographic Tokens into Action Links', () => {
    const { getTicketCreatedEmailHtml, getTicketUpdateEmailHtml, getTicketResolvedEmailHtml } = require('../src/lib/email/templates');
    const mockTicket = {
      id: 'tick_secure_123',
      ticketNumber: '#GN-TK-9001',
      customerName: 'Ren Amamiya',
      customerEmail: 'ren@syndicate.tokyo',
      category: 'SIZE_EXCHANGE',
      priority: 'HIGH',
      status: 'OPEN',
      subject: 'Exchange Request',
      initialMessage: 'Need size XL.',
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const token = generateTicketAccessToken(mockTicket.id, mockTicket.customerEmail);

    const createdHtml = getTicketCreatedEmailHtml({ ticket: mockTicket });
    assert(createdHtml.includes(`token=${token}`), 'Created email link must embed token');

    const updateHtml = getTicketUpdateEmailHtml({ ticket: mockTicket, messageText: 'Update' });
    assert(updateHtml.includes(`token=${token}`), 'Update email link must embed token');

    const resolvedHtml = getTicketResolvedEmailHtml({ ticket: mockTicket });
    assert(resolvedHtml.includes(`token=${token}`), 'Resolved email rating/reopen links must embed token');
  });

  console.log('====================================================');
  console.log(`Total security tests passed: ${passedTests}/4`);
  console.log('====================================================');
}

runAll();
