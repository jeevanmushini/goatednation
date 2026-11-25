import { renderEmailLayout } from './baseTemplate';

export interface ShippingUpdateParams {
  orderId: string;
  customerName?: string;
  awbCode?: string;
  courierName?: string;
  status: 'in_transit' | 'out_for_delivery' | 'delivered' | 'dispatched' | string;
  trackingUrl?: string;
}

/**
 * Zenin Tokyo Streetwear Real-time Logistics & Courier Tracking Template
 */
export function getShippingUpdateEmailHtml(params: ShippingUpdateParams): string {
  const {
    orderId,
    customerName = 'COLLECTOR',
    awbCode = 'PENDING',
    courierName = 'Shiprocket Express',
    status,
    trackingUrl,
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';
  const liveTrackingLink = trackingUrl || `https://shiprocket.co/tracking/${awbCode}`;

  let statusTitle = 'PACKAGE DISPATCHED';
  let statusBadge = 'DISPATCHED // 発送済み';
  let statusDescription = 'Your parcel has departed our fulfillment warehouse and has been handed over to the courier.';
  let badgeColor = '#FF4D00';
  let badgeBg = '#FFF2EC';

  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus.includes('out_for_delivery') || normalizedStatus.includes('out for delivery')) {
    statusTitle = 'OUT FOR DELIVERY';
    statusBadge = 'OUT FOR DELIVERY // 配達中';
    statusDescription = 'Your parcel is in the local courier van and will be delivered to your address today.';
    badgeColor = '#0066CC';
    badgeBg = '#EBF4FF';
  } else if (normalizedStatus.includes('delivered')) {
    statusTitle = 'PACKAGE DELIVERED';
    statusBadge = 'DELIVERED // 配達完了';
    statusDescription = 'Your parcel was successfully delivered. Welcome to the syndicate archive.';
    badgeColor = '#008844';
    badgeBg = '#E8F7EE';
  } else if (normalizedStatus.includes('in_transit') || normalizedStatus.includes('in transit')) {
    statusTitle = 'PARCEL IN TRANSIT';
    statusBadge = 'IN TRANSIT // 輸送中';
    statusDescription = 'Your parcel is actively moving through courier fulfillment hubs.';
    badgeColor = '#E67E22';
    badgeBg = '#FEF5E7';
  }

  const content = `
    <!-- Top Header -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 8px;">
          <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: ${badgeColor}; background-color: ${badgeBg}; padding: 4px 10px; border-radius: 2px;">
            ${statusBadge}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 6px;">
          <h1 style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000000;">
            ${statusTitle}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #777777; letter-spacing: 0.1em; padding-bottom: 24px;">
          ORDER: #${orderId} &bull; RECIPIENT: ${customerName.toUpperCase()}
        </td>
      </tr>
    </table>

    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #333333; margin-bottom: 24px;">
      ${statusDescription}
    </div>

    <!-- Logistics Card -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; background-color: #FAFAFA; border: 2px solid #000000; border-radius: 4px;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; color: #666666; letter-spacing: 0.15em; text-transform: uppercase; padding-bottom: 6px;">
                CARRIER LOGISTICS
              </td>
              <td align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; color: #000000; padding-bottom: 6px;">
                ${courierName.toUpperCase()}
              </td>
            </tr>
            <tr>
              <td style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; color: #666666; letter-spacing: 0.15em; text-transform: uppercase;">
                AWB TRACKING NUMBER
              </td>
              <td align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 800; color: #000000; letter-spacing: 0.05em;">
                ${awbCode}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Live Track Shipment CTA Button -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <a href="${liveTrackingLink}" target="_blank" style="display: block; width: 100%; max-width: 320px; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; text-align: center; padding: 14px 24px; text-decoration: none; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            TRACK SHIPMENT LIVE &rarr;
          </a>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${appUrl}/shipping/tracking?orderId=${encodeURIComponent(orderId)}" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #666666; text-decoration: underline;">
        View detailed tracking timeline on GOATED NATION
      </a>
    </div>
  `;

  return renderEmailLayout({
    title: `${statusTitle}: #${orderId} // GOATED NATION`,
    preheader: `Shipment update for order #${orderId}: ${statusTitle}. Carrier: ${courierName}`,
    content,
  });
}
