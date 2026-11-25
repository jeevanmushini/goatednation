import { renderEmailLayout } from './baseTemplate';

export interface WelcomeEmailParams {
  name?: string;
  discountCode?: string;
}

/**
 * Zenin Tokyo Streetwear Welcome & Syndicate Onboarding Template
 */
export function getWelcomeEmailHtml({ name, discountCode = 'WELCOME10' }: WelcomeEmailParams): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';
  const customerName = name ? name.toUpperCase() : 'COLLECTOR';

  const content = `
    <!-- Top Badge -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 8px;">
          <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #FF4D00; background-color: #FFF2EC; padding: 4px 10px; border-radius: 2px; border: 1px solid #FFD4C2;">
            SYNDICATE CLEARANCE // メンバー登録
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 20px;">
          <h1 style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000000; line-height: 1.25;">
            WELCOME TO THE SYNDICATE, ${customerName}
          </h1>
        </td>
      </tr>
    </table>

    <!-- Manifesto Excerpt -->
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.7; color: #333333; margin-bottom: 24px; border-left: 3px solid #000000; padding-left: 16px;">
      You are now verified in the GOATED NATION network. We engineer uncompromising, heavyweight Tokyo streetwear engineered from high-density Japanese cotton, oversized brutalist geometry, and subculture anime archives. Limited production runs. No seasonal restocks.
    </div>

    <!-- Discount Coupon Perk Box -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; background-color: #F8F8F8; border: 1px dashed #000000; border-radius: 4px;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #666666; margin-bottom: 6px;">
            EXCLUSIVE INITIATION PRIVILEGE // 10% OFF FIRST DROP
          </div>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: 900; letter-spacing: 0.25em; color: #FF4D00; padding: 8px 16px; background-color: #FFFFFF; display: inline-block; border: 1px solid #E0E0E0; margin-bottom: 8px;">
            ${discountCode}
          </div>
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; color: #777777;">
            Apply this voucher code at checkout. Valid across all mainline capsules.
          </div>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
      <tr>
        <td align="center">
          <a href="${appUrl}/collections" style="display: block; width: 100%; max-width: 320px; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; text-align: center; padding: 14px 24px; text-decoration: none; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            EXPLORE THE DROPS &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Security & Support Notice -->
    <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #888888; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.6; border-top: 1px solid #EEEEEE; padding-top: 16px;">
      SYSTEM RECORD: SYNDICATE ID REGISTERED &bull; ZERO SPAM GUARANTEE &bull; VIP ACCESS ACTIVATED
    </div>
  `;

  return renderEmailLayout({
    title: 'WELCOME TO THE SYNDICATE // GOATED NATION',
    preheader: `Welcome ${customerName}. Here is your 10% initiation discount code: ${discountCode}`,
    content,
  });
}
