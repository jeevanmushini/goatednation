import { renderEmailLayout } from './baseTemplate';
import { Ticket } from '../../../types/ticket';
import { generateTicketAccessToken } from '../../ticketSecurity';

export interface TicketCreatedEmailParams {
  ticket: Ticket;
}

const CATEGORY_NAMES: Record<string, string> = {
  SIZE_EXCHANGE: 'Size & Fit Exchange',
  ORDER_STATUS: 'Tracking & Courier Delay',
  DEFECT_DAMAGE: 'Defective Print / Damaged Fabric',
  PAYMENT_ISSUE: 'Payment Debited / UPI Inquiries',
  WEBSITE_BUG: 'Website Bug & Technical Glitch',
  BULK_GENERAL: 'Bulk Orders & General Inquiries',
};

/**
 * Zenin Tokyo Streetwear Ticket Created Notification Template
 */
export function getTicketCreatedEmailHtml({ ticket }: TicketCreatedEmailParams): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';
  const customerName = ticket.customerName.toUpperCase();
  const categoryLabel = CATEGORY_NAMES[ticket.category] || ticket.category;
  const token = generateTicketAccessToken(ticket.id, ticket.customerEmail);
  const ticketUrl = `${appUrl}/support/${ticket.id}?token=${token}`;

  const content = `
    <!-- Top Header -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 8px;">
          <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #000000; background-color: #F4F4F4; padding: 4px 10px; border-radius: 2px; border: 1px solid #E0E0E0;">
            SYNDICATE SUPPORT // 受注受付
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000000; line-height: 1.3;">
            TICKET ${ticket.ticketNumber} LOGGED
          </h1>
        </td>
      </tr>
    </table>

    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 24px;">
      Hello <strong>${customerName}</strong>, your support request has been registered in the GOATED NATION resolution queue. Our support specialists have been notified and will review your case.
    </div>

    <!-- Ticket Summary Card -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #FAFAFA; border: 1px solid #EAEAEA; border-radius: 4px;">
      <tr>
        <td style="padding: 18px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #888888; text-transform: uppercase; width: 35%;">
                TICKET NUMBER:
              </td>
              <td style="padding-bottom: 10px; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 800; color: #000000;">
                ${ticket.ticketNumber}
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #888888; text-transform: uppercase;">
                CATEGORY:
              </td>
              <td style="padding-bottom: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; font-weight: 700; color: #000000;">
                ${categoryLabel}
              </td>
            </tr>
            ${ticket.orderId ? `
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #888888; text-transform: uppercase;">
                ORDER REFERENCE:
              </td>
              <td style="padding-bottom: 10px; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 700; color: #000000;">
                #${ticket.orderId}
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #888888; text-transform: uppercase;">
                PRIORITY:
              </td>
              <td style="padding-bottom: 10px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 2px; ${
                  ticket.priority === 'URGENT'
                    ? 'background-color: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5;'
                    : ticket.priority === 'HIGH'
                    ? 'background-color: #FFEDD5; color: #EA580C; border: 1px solid #FDBA74;'
                    : 'background-color: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE;'
                }">
                  ${ticket.priority}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #888888; text-transform: uppercase;">
                SLA RESOLUTION WINDOW:
              </td>
              <td style="padding-bottom: 10px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #16A34A; font-weight: 700;">
                WITHIN 4–12 HOURS
              </td>
            </tr>
          </table>

          <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #EEEEEE; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; line-height: 1.6; color: #555555;">
            <strong style="color: #000000; font-family: 'Courier New', Courier, monospace; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">INITIAL INQUIRY:</strong>
            ${ticket.initialMessage.replace(/\n/g, '<br>')}
          </div>
        </td>
      </tr>
    </table>

    <!-- Call to Action Button -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${ticketUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 2px;">
            VIEW TICKET THREAD & REPLIES &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Advisory -->
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; line-height: 1.6; color: #777777; background-color: #F8F8F8; border-left: 3px solid #000000; padding: 12px 14px;">
      <strong>Note:</strong> You can view updates, reply directly, or upload additional photos at any time on the live ticket tracking page above.
    </div>
  `;

  return renderEmailLayout({
    title: `TICKET OPENED: ${ticket.ticketNumber} // GOATED NATION`,
    preheader: `Your support ticket ${ticket.ticketNumber} has been received. Expected review within 4–12 hours.`,
    content,
  });
}
