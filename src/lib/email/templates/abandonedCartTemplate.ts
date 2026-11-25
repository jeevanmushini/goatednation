import { renderEmailLayout } from './baseTemplate';

export interface AbandonedCartItem {
  id?: string;
  title: string;
  price: number;
  quantity?: number;
  size?: string;
  color?: string;
  image?: string;
}

export interface AbandonedCartParams {
  customerName?: string;
  items: AbandonedCartItem[];
  totalAmount: number;
  restoreCartUrl: string;
}

/**
 * Zenin Tokyo Streetwear Abandoned Cart & Dropped Checkout Recovery Template
 * Recovers 10–18% of dropped revenue with high urgency streetwear copy and 1-click restore link.
 */
export function getAbandonedCartEmailHtml(params: AbandonedCartParams): string {
  const {
    customerName = 'COLLECTOR',
    items = [],
    totalAmount = 0,
    restoreCartUrl,
  } = params;

  const content = `
    <!-- Top Urgent Kanji Badge -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #FF4D00; background-color: #2A0E00; border: 1px solid #FF4D00; padding: 4px 14px; border-radius: 9999px; display: inline-block;">
        カート復元 // BAG TEMPORARILY RESERVED
      </span>
      <h1 style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; color: #000000; margin: 14px 0 6px 0;">
        DON&apos;T SLEEP ON THIS DROP.
      </h1>
      <p style="font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #666666; margin: 0;">
        ${customerName.toUpperCase()}, syndicate pieces are produced in limited batches. Your bag is held for a short window.
      </p>
    </div>

    <!-- Items In Bag Table -->
    <div style="background-color: #FFFFFF; border: 1px solid #E5E5E5; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #EEEEEE; padding-bottom: 8px; margin-bottom: 12px;">
        RESERVED GARMENTS (${items.length} PIECES)
      </div>
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: 'Courier New', Courier, monospace;">
        ${items
          .map((item) => {
            const thumbnail =
              item.image ||
              'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80';
            const itemPrice = item.price || 0;
            const qty = item.quantity || 1;

            return `
          <tr>
            <td width="60" valign="top" style="padding: 10px 0; border-bottom: 1px solid #F0F0F0;">
              <img src="${thumbnail}" alt="${item.title}" width="56" height="56" style="width: 56px; height: 56px; object-fit: cover; border-radius: 4px; border: 1px solid #E5E5E5; display: block;" />
            </td>
            <td valign="top" style="padding: 10px 12px; border-bottom: 1px solid #F0F0F0;">
              <div style="font-size: 12px; font-weight: 700; color: #000000; text-transform: uppercase;">
                ${item.title}
              </div>
              <div style="font-size: 10px; color: #777777; margin-top: 2px;">
                ${item.size ? `SIZE: ${item.size} ` : ''}${item.color ? `&bull; COLOR: ${item.color} ` : ''}&bull; QTY: ${qty}
              </div>
            </td>
            <td align="right" valign="top" style="padding: 10px 0; border-bottom: 1px solid #F0F0F0; font-size: 12px; font-weight: 700; color: #000000;">
              ₹${(itemPrice * qty).toLocaleString('en-IN')}
            </td>
          </tr>
        `;
          })
          .join('')}
      </table>

      <!-- Subtotal Summary -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: 'Courier New', Courier, monospace; margin-top: 14px;">
        <tr>
          <td style="font-size: 11px; color: #666666; text-transform: uppercase;">
            TOTAL ESTIMATED VALUE:
          </td>
          <td align="right" style="font-size: 16px; font-weight: 800; color: #FF4D00;">
            ₹${totalAmount.toLocaleString('en-IN')}
          </td>
        </tr>
      </table>
    </div>

    <!-- Urgency Scarcity Banner -->
    <div style="background-color: #000000; border-radius: 8px; padding: 18px 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #FF4D00; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px;">
        LIMITED VAULT ALLOCATION
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #DDDDDD; line-height: 1.5;">
        Once capsule allocations deplete, restocks are not scheduled. Restore your cart with one tap below.
      </div>
    </div>

    <!-- 1-Click Restore CTA Button -->
    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="${restoreCartUrl}" style="display: inline-block; background-color: #FF4D00; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; padding: 16px 36px; border-radius: 4px; text-decoration: none; box-shadow: 0 4px 12px rgba(255, 77, 0, 0.3);">
        RESTORE BAG & COMPLETE CHECKOUT &rarr;
      </a>
    </div>
  `;

  return renderEmailLayout({
    title: `YOUR BAG IS RESERVED // GOATED NATION`,
    preheader: `Syndicate pieces are scarce. Your bag with ${items.length} item(s) is reserved for a short window.`,
    content,
  });
}
