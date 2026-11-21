import { renderEmailLayout } from './baseTemplate';
import { Ticket } from '../../../types/ticket';

export interface TicketUpdateEmailParams {
  ticket: Ticket;
  messageText: string;
  senderName?: string;
  newStatus?: string;
  returnAwb?: string;
}

/**
 * Zenin Tokyo Streetwear Ticket Message / Status Update Template
 */
export function getTicketUpdateEmailHtml({
  ticket,
  messageText,
  senderName = 'GOATED SUPPORT // ADMIN',
  newStatus,
  returnAwb,
}: TicketUpdateEmailParams): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';
  const customerName = ticket.customerName.toUpperCase();
  const ticketUrl = `${appUrl}/support/${ticket.id}`;
  const displayStatus = (newStatus || ticket.status).replace(/_/g, ' ').toUpperCase();

  const content = `
    <!-- Top Header -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 8px;">
          <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #000000; background-color: #F4F4F4; padding: 4px 10px; border-radius: 2px; border: 1px solid #E0E0E0;">
            SUPPORT DESK DISPATCH // 進捗報告
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000000; line-height: 1.3;">
            UPDATE ON TICKET ${ticket.ticketNumber}
          </h1>
        </td>
      </tr>
    </table>

    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 20px;">
      Hello <strong>${customerName}</strong>, a new response or action was posted to your ticket:
    </div>

    <!-- Status Banner -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #F8F8F8; border-left: 4px solid #000000; padding: 12px 16px;">
      <tr>
        <td>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #888888; text-transform: uppercase; letter-spacing: 0.15em;">
            CURRENT TICKET STATUS:
          </div>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 800; color: #000000; text-transform: uppercase; margin-top: 2px;">
            ${displayStatus}
          </div>
        </td>
      </tr>
    </table>

    <!-- Message Content Box -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #FFFFFF; border: 2px solid #000000; border-radius: 4px;">
      <tr>
        <td style="padding: 20px;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">
            MESSAGE FROM ${senderName}:
          </div>
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #111111; white-space: pre-wrap;">
            ${messageText}
          </div>
        </td>
      </tr>
    </table>

    <!-- Return Pickup / Courier Details (if generated) -->
    ${returnAwb || ticket.shiprocketAwb ? `
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 4px;">
      <tr>
        <td style="padding: 16px 20px;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px;">
            REVERSE PICKUP WAYBILL GENERATED
          </div>
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; color: #15803D; line-height: 1.5;">
            Our courier partner (Delhivery/Blue Dart) will pick up the garment from your original delivery address. Please keep the tags intact and pack securely.
          </div>
          <div style="margin-top: 10px; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 900; color: #000000;">
            RETURN AWB: ${returnAwb || ticket.shiprocketAwb}
          </div>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Call to Action Button -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${ticketUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 2px;">
            REPLY ON SUPPORT PORTAL &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return renderEmailLayout({
    title: `UPDATE: Ticket ${ticket.ticketNumber} // GOATED NATION`,
    preheader: `New response on ticket ${ticket.ticketNumber}: "${messageText.slice(0, 80)}..."`,
    content,
  });
}
