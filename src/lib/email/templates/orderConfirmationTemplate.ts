import { renderEmailLayout } from './baseTemplate';

export interface OrderConfirmationItem {
  id?: string;
  title: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

export interface OrderConfirmationParams {
  orderId: string;
  customerName?: string;
  items: OrderConfirmationItem[];
  subtotal: number;
  shippingCharge?: number;
  discount?: number;
  totalAmount: number;
  shippingAddress?: {
    customerName?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
}

/**
 * Zenin Tokyo Streetwear Visual Itemized Order Receipt Template
 */
export function getOrderConfirmationEmailHtml(params: OrderConfirmationParams): string {
  const {
    orderId,
    customerName = 'COLLECTOR',
    items = [],
    subtotal = 0,
    shippingCharge = 0,
    discount = 0,
    totalAmount = 0,
    shippingAddress,
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';
  const orderDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Render product rows with images and streetwear specifications
  const itemsHtml = items
    .map((item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      const thumbnail =
        item.image ||
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80';

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #EEEEEE;" valign="top">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td width="64" valign="top" style="padding-right: 14px;">
                  <img src="${thumbnail}" alt="${item.title}" width="64" height="64" style="width: 64px; height: 64px; object-fit: cover; border-radius: 4px; border: 1px solid #E5E5E5; display: block;" />
                </td>
                <td valign="top">
                  <div style="font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 700; color: #000000; text-transform: uppercase;">
                    ${item.title}
                  </div>
                  <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #777777; margin-top: 3px; letter-spacing: 0.1em;">
                    ${item.size ? `SIZE: ${item.size} ` : ''}${item.color ? `&bull; COLOR: ${item.color} ` : ''}&bull; QTY: ${item.quantity}
                  </div>
                </td>
                <td align="right" valign="top" style="font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 700; color: #000000;">
                  ₹${itemTotal.toLocaleString('en-IN')}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join('');

  const content = `
    <!-- Top Header & Order Meta -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 8px;">
          <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #FF4D00; background-color: #FFF2EC; padding: 4px 10px; border-radius: 2px; border: 1px solid #FFD4C2;">
            ORDER CONFIRMED // 受注完了
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 6px;">
          <h1 style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000000;">
            ORDER #${orderId}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #777777; letter-spacing: 0.1em; padding-bottom: 24px;">
          DATE: ${orderDate} &bull; CUSTOMER: ${customerName.toUpperCase()}
        </td>
      </tr>
    </table>

    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #333333; margin-bottom: 24px;">
      Payment verified. Your syndicate acquisition has entered our Tokyo-standard fulfillment queue. You will receive live courier dispatch and AWB tracking alerts once the parcel departs the hub.
    </div>

    <!-- Itemized List Table -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <th align="left" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 2px solid #000000; padding-bottom: 8px;">
          ITEM SUMMARY
        </th>
        <th align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 2px solid #000000; padding-bottom: 8px;">
          PRICE
        </th>
      </tr>
      ${itemsHtml}
    </table>

    <!-- Financial Totals Table -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
      <tr>
        <td style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #666666; padding: 4px 0;">
          SUBTOTAL
        </td>
        <td align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #111111; padding: 4px 0;">
          ₹${subtotal.toLocaleString('en-IN')}
        </td>
      </tr>
      ${
        discount > 0
          ? `<tr>
              <td style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #FF4D00; padding: 4px 0;">
                DISCOUNT APPLIED
              </td>
              <td align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #FF4D00; padding: 4px 0;">
                -₹${discount.toLocaleString('en-IN')}
              </td>
            </tr>`
          : ''
      }
      <tr>
        <td style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #666666; padding: 4px 0;">
          EXPRESS COURIER SHIPPING
        </td>
        <td align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #111111; padding: 4px 0;">
          ${shippingCharge === 0 ? 'FREE' : `₹${shippingCharge.toLocaleString('en-IN')}`}
        </td>
      </tr>
      <tr>
        <td style="font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 900; color: #000000; padding-top: 10px; border-top: 2px solid #000000;">
          TOTAL PAID
        </td>
        <td align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 900; color: #000000; padding-top: 10px; border-top: 2px solid #000000;">
          ₹${totalAmount.toLocaleString('en-IN')}
        </td>
      </tr>
    </table>

    ${
      shippingAddress
        ? `<!-- Shipping Destination Box -->
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; background-color: #FAFAFA; border: 1px solid #E5E5E5; border-radius: 4px;">
            <tr>
              <td style="padding: 16px 20px;">
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #666666; margin-bottom: 6px;">
                  DELIVERY DESTINATION // 配送先
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 700; color: #000000; margin-bottom: 4px;">
                  ${shippingAddress.customerName || customerName}
                </div>
                <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; line-height: 1.5; color: #555555;">
                  ${shippingAddress.address || ''}<br>
                  ${shippingAddress.city ? `${shippingAddress.city}, ` : ''}${shippingAddress.state ? `${shippingAddress.state} ` : ''}${shippingAddress.pincode || ''}<br>
                  ${shippingAddress.phone ? `Phone: ${shippingAddress.phone}` : ''}
                </div>
              </td>
            </tr>
          </table>`
        : ''
    }

    <!-- CTA Button -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
      <tr>
        <td align="center">
          <a href="${appUrl}/account" style="display: block; width: 100%; max-width: 320px; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; text-align: center; padding: 14px 24px; text-decoration: none; border-radius: 4px;">
            VIEW ORDER IN ACCOUNT &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return renderEmailLayout({
    title: `ORDER CONFIRMED: #${orderId} // GOATED NATION`,
    preheader: `Thank you for your order #${orderId}. Total paid: ₹${totalAmount.toLocaleString('en-IN')}`,
    content,
  });
}
