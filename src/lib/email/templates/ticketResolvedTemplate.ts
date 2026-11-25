import { renderEmailLayout } from './baseTemplate';
import { Ticket } from '../../../types/ticket';
import { generateTicketAccessToken } from '../../ticketSecurity';

export interface TicketResolvedEmailParams {
  ticket: Ticket;
  resolutionNotes?: string;
}

/**
 * Zenin Tokyo Streetwear Ticket Resolved & CSAT Feedback Template
 */
export function getTicketResolvedEmailHtml({
  ticket,
  resolutionNotes,
}: TicketResolvedEmailParams): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';
  const customerName = ticket.customerName.toUpperCase();
  const token = generateTicketAccessToken(ticket.id, ticket.customerEmail);
  const ticketUrl = `${appUrl}/support/${ticket.id}?token=${token}`;
  const finalNotes = resolutionNotes || ticket.resolutionNotes || 'All requested actions for this ticket have been finalized by our support staff.';

  const content = `
    <!-- Top Header -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 8px;">
          <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #16A34A; background-color: #F0FDF4; padding: 4px 10px; border-radius: 2px; border: 1px solid #BBF7D0;">
            CASE RESOLVED // 解決完了
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000000; line-height: 1.3;">
            TICKET ${ticket.ticketNumber} MARKED AS RESOLVED
          </h1>
        </td>
      </tr>
    </table>

    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 24px;">
      Hello <strong>${customerName}</strong>, your support request regarding <strong>${ticket.subject}</strong> has been resolved.
    </div>

    <!-- Resolution Notes Box -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; background-color: #FAFAFA; border: 1px solid #EAEAEA; border-radius: 4px;">
      <tr>
        <td style="padding: 20px;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">
            FINAL RESOLUTION SUMMARY:
          </div>
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #111111;">
            ${finalNotes.replace(/\n/g, '<br>')}
          </div>
        </td>
      </tr>
    </table>

    <!-- 1-Click CSAT Rating Experience -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; background-color: #FFFFFF; border: 2px solid #000000; border-radius: 4px;">
      <tr>
        <td align="center" style="padding: 24px 16px;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: #000000; margin-bottom: 6px;">
            HOW DID WE PERFORM? // 満足度調査
          </div>
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; color: #666666; margin-bottom: 18px;">
            Click a star rating to help us engineer better streetwear experiences:
          </div>
          
          <table border="0" cellpadding="0" cellspacing="0" align="center">
            <tr>
              ${[1, 2, 3, 4, 5].map((star) => `
                <td style="padding: 0 6px;">
                  <a href="${ticketUrl}&rate=${star}" target="_blank" style="display: block; width: 44px; height: 44px; line-height: 44px; text-align: center; background-color: #F8F8F8; border: 1px solid #D0D0D0; border-radius: 4px; text-decoration: none; font-size: 18px; color: #F59E0B;">
                    ★
                  </a>
                  <div style="text-align: center; font-family: 'Courier New', Courier, monospace; font-size: 9px; color: #999999; margin-top: 4px;">${star}</div>
                </td>
              `).join('')}
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Still Need Help? Reopen Action -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; color: #888888; margin-bottom: 10px;">
            Is your issue still unresolved or do you need further adjustments?
          </div>
          <a href="${ticketUrl}&action=reopen" target="_blank" style="display: inline-block; background-color: transparent; color: #000000; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: underline; padding: 6px 12px;">
            [ REOPEN THIS TICKET IN 1-CLICK ]
          </a>
        </td>
      </tr>
    </table>
  `;

  return renderEmailLayout({
    title: `RESOLVED: Ticket ${ticket.ticketNumber} // GOATED NATION`,
    preheader: `Ticket ${ticket.ticketNumber} has been resolved. Please rate your support experience.`,
    content,
  });
}
