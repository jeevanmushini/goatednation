import { renderEmailLayout } from './baseTemplate';

export interface PasswordChangedEmailParams {
  name?: string;
  timestamp?: string;
  device?: string;
}

/**
 * Zenin Tokyo Streetwear Security Alert: Password Updated Successfully
 */
export function getPasswordChangedEmailHtml({
  name,
  timestamp,
  device,
}: PasswordChangedEmailParams): string {
  const customerName = name ? name.toUpperCase() : 'MEMBER';
  const eventTime = timestamp || new Date().toUTCString();
  const deviceSummary = device || 'Web Browser';

  const content = `
    <!-- Top Header -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 8px;">
          <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #008844; background-color: #E8F7EE; padding: 4px 10px; border-radius: 2px; border: 1px solid #B8E6CB;">
            SECURITY ALERT // パスワード変更
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000000; line-height: 1.3;">
            PASSWORD UPDATED SUCCESSFULLY
          </h1>
        </td>
      </tr>
    </table>

    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #333333; margin-bottom: 20px;">
      Hello <strong>${customerName}</strong>, your GOATED NATION account password was successfully updated and cryptographic credentials have been salted and verified.
    </div>

    <!-- Event Audit Record Table -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #FBFBFB; border: 1px solid #E5E5E5; border-radius: 4px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; color: #666666; letter-spacing: 0.15em; text-transform: uppercase; padding-bottom: 6px;">
                TIMESTAMP (UTC)
              </td>
              <td align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 600; color: #000000; padding-bottom: 6px;">
                ${eventTime}
              </td>
            </tr>
            <tr>
              <td style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; color: #666666; letter-spacing: 0.15em; text-transform: uppercase;">
                ORIGINATING CLIENT
              </td>
              <td align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 600; color: #000000;">
                ${deviceSummary}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Urgent Advisory -->
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; line-height: 1.6; color: #990000; background-color: #FFF5F5; border: 1px solid #FED7D7; border-left: 4px solid #E53E3E; padding: 14px; margin-bottom: 24px; border-radius: 3px;">
      <strong>DID NOT PERFORM THIS ACTION?</strong><br>
      If you did not request this change, your credentials may be compromised. Please immediately reply to this email or contact syndicate security at <a href="mailto:goatednation@gmail.com" style="color: #990000; font-weight: bold; text-decoration: underline;">goatednation@gmail.com</a>.
    </div>
  `;

  return renderEmailLayout({
    title: 'SECURITY ALERT: Password Updated // GOATED NATION',
    preheader: `Your account password was updated at ${eventTime}.`,
    content,
  });
}
