import { renderEmailLayout } from './baseTemplate';

export interface RefundConfirmationParams {
  customerName: string;
  orderId: string;
  refundId: string;
  amount: number;
  paymentMethod?: string;
  reason?: string;
  items?: Array<{ title: string; size?: string; price: number }>;
}

/**
 * Zenin Tokyo Streetwear Digital Credit Note & Refund Receipt Template
 */
export function getRefundConfirmationEmailHtml(params: RefundConfirmationParams): string {
  const {
    customerName,
    orderId,
    refundId,
    amount,
    paymentMethod = 'Original Payment Source (Razorpay UPI / NetBanking / Card)',
    reason = 'Support Desk Return / Sizing Exchange Guarantee',
    items = [],
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';
  const issueDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const content = `
    <!-- Top Kanji Badge -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #16A34A; background-color: #0A2E16; border: 1px solid #16A34A; padding: 4px 14px; border-radius: 9999px; display: inline-block;">
        返金完了 // REFUND CREDITED
      </span>
      <h1 style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; color: #000000; margin: 14px 0 6px 0;">
        FINANCIAL CREDIT NOTE
      </h1>
      <p style="font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #666666; margin: 0;">
        Order #${orderId} &bull; Issued to ${customerName.toUpperCase()} on ${issueDate}
      </p>
    </div>

    <!-- Amount Hero Card -->
    <div style="background-color: #000000; border-radius: 8px; padding: 26px 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 6px;">
        TOTAL REFUND AMOUNT PROCESSED
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #16A34A; letter-spacing: -0.02em;">
        ₹${amount.toLocaleString('en-IN')}
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #AAAAAA; margin-top: 8px;">
        Funds will reflect in your source account within 3–5 business days via Razorpay.
      </div>
    </div>

    <!-- Transaction Audit Details Table -->
    <div style="background-color: #FAFAFA; border: 1px solid #E5E5E5; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #EEEEEE; padding-bottom: 8px; margin-bottom: 12px;">
        TRANSACTION AUDIT LEDGER
      </div>
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: 'Courier New', Courier, monospace; font-size: 11px;">
        <tr>
          <td style="color: #666666; padding: 6px 0;">RAZORPAY GATEWAY REFUND ID:</td>
          <td align="right" style="color: #000000; font-weight: 700;">${refundId}</td>
        </tr>
        <tr>
          <td style="color: #666666; padding: 6px 0;">ORIGINAL ORDER NUMBER:</td>
          <td align="right" style="color: #000000; font-weight: 700;">#${orderId}</td>
        </tr>
        <tr>
          <td style="color: #666666; padding: 6px 0;">DESTINATION ACCOUNT:</td>
          <td align="right" style="color: #000000; font-weight: 700;">${paymentMethod}</td>
        </tr>
        <tr>
          <td style="color: #666666; padding: 6px 0;">REASON FOR CREDIT:</td>
          <td align="right" style="color: #000000; font-weight: 700;">${reason}</td>
        </tr>
        <tr>
          <td style="color: #666666; padding: 6px 0;">SETTLEMENT TIMELINE:</td>
          <td align="right" style="color: #16A34A; font-weight: 700;">3–5 BUSINESS DAYS</td>
        </tr>
      </table>
    </div>

    ${
      items.length > 0
        ? `
    <!-- Items Refunded -->
    <div style="margin-bottom: 24px;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">
        RETURNED SYNDICATE PIECES
      </div>
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: 'Courier New', Courier, monospace; font-size: 11px;">
        ${items
          .map(
            (item) => `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; color: #000000; font-weight: 700;">
              ${item.title.toUpperCase()}${item.size ? ` [SIZE: ${item.size}]` : ''}
            </td>
            <td align="right" style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; color: #000000;">
              ₹${item.price.toLocaleString('en-IN')}
            </td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    `
        : ''
    }

    <!-- Security & Guarantee Notice -->
    <div style="background-color: #F5F5F5; border-left: 3px solid #16A34A; padding: 12px 14px; margin-bottom: 24px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #555555; line-height: 1.6;">
      <strong>OFFICIAL SYNDICATE CREDIT NOTE:</strong> This email serves as your formal proof of return fund transfer. If you do not see the credit reflected in your statement after 5 business days, please quote Razorpay Refund ID <strong>${refundId}</strong> directly to your bank or our support desk.
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="${appUrl}/settings" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; padding: 14px 28px; border-radius: 4px; text-decoration: none;">
        VIEW ORDER & REFUND ARCHIVE &rarr;
      </a>
    </div>
  `;

  return renderEmailLayout({
    title: `CREDIT NOTE: Refund #${refundId} Processed // GOATED NATION`,
    preheader: `Refund Confirmation for Order #${orderId}: ₹${amount.toLocaleString('en-IN')} credited to your account.`,
    content,
  });
}
