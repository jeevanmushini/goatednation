import { renderEmailLayout } from './baseTemplate';

export interface OtpEmailParams {
  name?: string;
  otp: string;
  ttlMinutes?: number;
}

/**
 * Zenin Tokyo Streetwear Cryptographic OTP Access Code Template
 */
export function getOtpEmailHtml({ name, otp, ttlMinutes = 10 }: OtpEmailParams): string {
  const customerName = name ? name.toUpperCase() : 'MEMBER';
  // Formatted with spaces between digits for crisp visual readability
  const formattedOtp = otp.split('').join('  ');

  const content = `
    <!-- Top Header -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 8px;">
          <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #FF4D00; background-color: #FFF2EC; padding: 4px 10px; border-radius: 2px; border: 1px solid #FFD4C2;">
            SECURITY ACCESS CLEARANCE // 認証コード
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000000; line-height: 1.3;">
            ONE-TIME PASSWORD (OTP) RESET
          </h1>
        </td>
      </tr>
    </table>

    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 24px;">
      Hello <strong>${customerName}</strong>, a request was received to reset your GOATED NATION account credentials. Use the 6-digit security code below to complete your verification:
    </div>

    <!-- Prominent Monospace OTP Display Box -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #FAFAFA; border: 2px solid #000000; border-radius: 4px;">
      <tr>
        <td style="padding: 24px 16px; text-align: center;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #666666; margin-bottom: 8px;">
            ONE-TIME SECURITY CODE
          </div>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 0.35em; color: #000000; padding: 12px 24px; background-color: #FFFFFF; border: 1px solid #E0E0E0; display: inline-block;">
            ${formattedOtp}
          </div>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; color: #FF4D00; letter-spacing: 0.1em; margin-top: 12px;">
            VALID FOR ${ttlMinutes} MINUTES ONLY
          </div>
        </td>
      </tr>
    </table>

    <!-- Security Advisory Details -->
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; line-height: 1.6; color: #666666; background-color: #F8F8F8; border-left: 3px solid #777777; padding: 12px 14px; margin-bottom: 24px;">
      <strong>SECURITY NOTICE:</strong> Never share this code with anyone. GOATED NATION staff will never ask for your verification code or password. If you did not initiate this request, you can safely ignore this transmission.
    </div>

    <!-- Bottom Meta -->
    <div style="font-family: 'Courier New', Courier, monospace; font-size: 9px; color: #999999; text-transform: uppercase; letter-spacing: 0.15em; border-top: 1px solid #EEEEEE; padding-top: 14px;">
      MAXIMUM ATTEMPTS: 5 &bull; ENCRYPTED WITH SHA-256 &bull; TIMEOUT: ${ttlMinutes}m
    </div>
  `;

  return renderEmailLayout({
    title: 'SECURITY CODE: Password Reset // GOATED NATION',
    preheader: `Your 6-digit security code is ${otp}. Valid for ${ttlMinutes} minutes.`,
    content,
  });
}
