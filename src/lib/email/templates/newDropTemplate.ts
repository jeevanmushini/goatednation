import { renderEmailLayout } from './baseTemplate';

export interface NewDropEmailParams {
  dropTitle: string;
  tagline?: string;
  description?: string;
  bannerUrl?: string;
  dropUrl?: string;
}

/**
 * Zenin Tokyo Streetwear Collection Drop & Capsule Announcement Template
 */
export function getNewDropEmailHtml(params: NewDropEmailParams): string {
  const {
    dropTitle,
    tagline = 'LIMITED CAPSULE RELEASE // 東京',
    description = 'The newest archive drop is live. High-density Japanese cotton, oversized silhouettes, and subversive anime iconography. Strictly limited quantities.',
    bannerUrl = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&auto=format&fit=crop&q=80',
    dropUrl,
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';
  const collectionLink = dropUrl || `${appUrl}/collections`;

  const content = `
    <!-- Top Header -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 8px;">
          <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #FF4D00; background-color: #FFF2EC; padding: 4px 10px; border-radius: 2px;">
            ${tagline}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000000; line-height: 1.2;">
            ${dropTitle}
          </h1>
        </td>
      </tr>
    </table>

    <!-- Full-Width Editorial Banner -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td>
          <a href="${collectionLink}">
            <img src="${bannerUrl}" alt="${dropTitle}" width="536" style="width: 100%; max-width: 536px; height: auto; display: block; border-radius: 4px; border: 1px solid #222222;" />
          </a>
        </td>
      </tr>
    </table>

    <!-- Manifesto / Description -->
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.7; color: #333333; margin-bottom: 28px; border-left: 3px solid #000000; padding-left: 16px;">
      ${description}
    </div>

    <!-- CTA Button -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <a href="${collectionLink}" style="display: block; width: 100%; max-width: 320px; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; text-align: center; padding: 14px 24px; text-decoration: none; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            SHOP THE DROP &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return renderEmailLayout({
    title: `NEW DROP: ${dropTitle} // GOATED NATION`,
    preheader: `${dropTitle} is now live in limited quantities.`,
    content,
  });
}
