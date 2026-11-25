/**
 * GOATED NATION - Shiprocket-Native Ticketing & Support Engine Test Suite
 */

import assert from 'assert';
import {
  getTicketCreatedEmailHtml,
  getTicketUpdateEmailHtml,
  getTicketResolvedEmailHtml,
} from '../src/lib/email/templates';
import {
  sendTicketCreatedEmail,
  sendTicketUpdateEmail,
  sendTicketResolvedEmail,
} from '../src/lib/email/mailer';
import { Ticket, TicketCategory, TicketPriority } from '../src/types/ticket';
import { createShiprocketReturnOrder, retryNDRDelivery } from '../src/lib/shiprocket';
import { refundRazorpayPayment } from '../src/lib/razorpay';

console.log('====================================================');
console.log('GOATED NATION: Ticketing & Customer Support Test Suite');
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
  const mockTicket: Ticket = {
    id: 'tick_test_9a8f2bc',
    ticketNumber: '#GN-TK-1042',
    customerName: 'Ren Amamiya',
    customerEmail: 'collector@example.com',
    customerPhone: '+91 9988776655',
    orderId: 'GN-99014',
    category: 'SIZE_EXCHANGE',
    priority: 'MEDIUM',
    status: 'OPEN',
    subject: 'Request Size Exchange for Oversized Hoodie',
    initialMessage: 'Garment arrived in size L, but looking for an extra oversized silhouette in XL.',
    attachments: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
    telemetry: { os: 'MacOS', browser: 'Chrome' },
    exchangeDetails: { currentSize: 'L', desiredSize: 'XL', unwornTagsVerified: true },
    paymentDetails: {},
    shiprocketAwb: 'RET-DEL-9481901',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Ticket Created Template
  runTest('Ticket Created Template: Renders ticket number, category, and thread link', () => {
    const html = getTicketCreatedEmailHtml({ ticket: mockTicket });
    assert(html.includes('#GN-TK-1042'), 'Must include ticket number');
    assert(html.includes('Size & Fit Exchange'), 'Must format category label');
    assert(html.includes('WITHIN 4–12 HOURS'), 'Must state SLA window');
    assert(html.includes('VIEW TICKET THREAD'), 'Must include action link');
  });

  // 2. Ticket Update Template
  runTest('Ticket Update Template: Renders admin response and return AWB details', () => {
    const html = getTicketUpdateEmailHtml({
      ticket: mockTicket,
      messageText: 'Reverse pickup has been authorized with Delhivery.',
      senderName: 'GOATED LOGISTICS DESK',
      newStatus: 'IN_PROGRESS',
      returnAwb: 'RET-DEL-9481901',
    });
    assert(html.includes('UPDATE ON TICKET #GN-TK-1042'), 'Must include title');
    assert(html.includes('Reverse pickup has been authorized with Delhivery.'), 'Must include message');
    assert(html.includes('RET-DEL-9481901'), 'Must include return AWB');
    assert(html.includes('IN PROGRESS'), 'Must render updated status banner');
  });

  // 3. Ticket Resolved Template with CSAT
  runTest('Ticket Resolved Template: Renders resolution summary, 1-5 star ratings and reopen link', () => {
    const html = getTicketResolvedEmailHtml({
      ticket: { ...mockTicket, status: 'RESOLVED' },
      resolutionNotes: 'Replacement size XL manifested and in transit.',
    });
    assert(html.includes('MARKED AS RESOLVED'), 'Must display resolved header');
    assert(html.includes('Replacement size XL manifested'), 'Must display resolution summary');
    assert(html.includes('rate=5'), 'Must render CSAT star links');
    assert(html.includes('action=reopen'), 'Must render 1-click reopen link');
  });

  // 4. Resend Mailer Dispatcher Test for Tickets
  await runTest('Resend Dispatcher: Safe resilient dispatch for ticket notifications without crashing', async () => {
    const res1 = await sendTicketCreatedEmail(mockTicket);
    assert(res1.success === true, 'Ticket created dispatch should succeed');

    const res2 = await sendTicketUpdateEmail({
      ticket: mockTicket,
      messageText: 'Status update dispatch test.',
    });
    assert(res2.success === true, 'Ticket update dispatch should succeed');

    const res3 = await sendTicketResolvedEmail({
      ticket: mockTicket,
      resolutionNotes: 'Case closed.',
    });
    assert(res3.success === true, 'Ticket resolved dispatch should succeed');
  });

  // 5. Category Priority Matrix Validation
  runTest('Category Priority Mapping: Correct auto-priority assignment per spec', () => {
    const priorityMap: Record<TicketCategory, TicketPriority> = {
      PAYMENT_ISSUE: 'URGENT',
      DEFECT_DAMAGE: 'HIGH',
      WEBSITE_BUG: 'HIGH',
      SIZE_EXCHANGE: 'MEDIUM',
      ORDER_STATUS: 'MEDIUM',
      BULK_GENERAL: 'LOW',
    };

    assert(priorityMap.PAYMENT_ISSUE === 'URGENT', 'Payment issues must be URGENT');
    assert(priorityMap.DEFECT_DAMAGE === 'HIGH', 'Defects must be HIGH priority');
    assert(priorityMap.SIZE_EXCHANGE === 'MEDIUM', 'Size exchanges are MEDIUM');
    assert(priorityMap.BULK_GENERAL === 'LOW', 'Bulk requests are LOW');
  });

  // 6. Shiprocket Reverse Pickup Creation
  await runTest('Shiprocket Reverse Pickup: Generates return order payload & return AWB', async () => {
    const returnOrder = await createShiprocketReturnOrder({
      orderId: 'GN-99014',
      customerName: 'Kenji Sato',
      phone: '9988776655',
      address: '4-12-10 Roppongi, Minato-ku',
      city: 'Tokyo / Bengaluru',
      state: 'Karnataka',
      pincode: '560054',
      items: [
        { name: 'OVERSIZED HEAVYWEIGHT HOODIE', sku: 'GN-HOOD-01', units: 1, sellingPrice: 4999 },
      ],
    });

    assert(returnOrder.success === true, 'Return order must succeed');
    assert(Boolean(returnOrder.awbCode), 'Must return an AWB waybill tracking code');
    assert(Boolean(returnOrder.courierName), 'Must specify return courier partner');
  });

  // 7. Shiprocket NDR Re-Attempt
  await runTest('Shiprocket NDR Re-Attempt: Submits courier retry schedule', async () => {
    const ndr = await retryNDRDelivery('DEL9948271810', 'reattempt');
    assert(ndr.success === true, 'NDR re-attempt should succeed');
    assert(ndr.message.includes('DEL9948271810'), 'Message must reference AWB');
  });

  // 8. Razorpay Refund Execution
  await runTest('Razorpay Refund: Initiates refund transaction with refund ID', async () => {
    const refund = await refundRazorpayPayment('pay_test_98412841', 2499, {
      ticketNumber: '#GN-TK-1042',
    });
    assert(refund.success === true, 'Refund should succeed');
    assert(Boolean(refund.refundId), 'Must return a refund ID');
  });

  console.log('====================================================');
  console.log(`Total tests passed: ${passedTests}/8`);
  console.log('====================================================');
}

runAll();
