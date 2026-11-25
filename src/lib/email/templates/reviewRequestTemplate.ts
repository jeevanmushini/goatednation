import { renderEmailLayout } from './baseTemplate';

export interface ReviewRequestParams {
  customerName: string;
  orderId?: string;
  productId?: string;
  productTitle: string;
  productImage?: string;
  productSlug?: string;
}

/**
 * Zenin Tokyo Streetwear Post-Delivery Review Nudge Template
 * Embeds 1-click star ratings linking directly to the product review form.
 */
export function getReviewRequestEmailHtml(params: ReviewRequestParams): string {
  const {
    customerName,
    orderId,
    productId,
    productTitle,
    productImage = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
    productSlug = productId || 'drop',
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';
  const reviewBaseUrl = `${appUrl}/products/${productSlug}#reviews`;

  const content = `
    <!-- Top Kanji Badge -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #FF4D00; background-color: #2A0E00; border: 1px solid #FF4D00; padding: 4px 14px; border-radius: 9999px; display: inline-block;">
        レビュー // RATE YOUR DROP
      </span>
      <h1 style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; color: #000000; margin: 14px 0 6px 0;">
        HOW DOES THE HEAVYWEIGHT FIT?
      </h1>
      <p style="font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #666666; margin: 0;">
        ${customerName.toUpperCase()}, your recent parcel has arrived. Your fit feedback guides the syndicate.
      </p>
    </div>

    <!-- Product Showcase Card -->
    <div style="background-color: #FAFAFA; border: 1px solid #E5E5E5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <div style="margin-bottom: 14px;">
        <img src="${productImage}" alt="${productTitle}" width="160" height="160" style="width: 160px; height: 160px; object-fit: cover; border-radius: 6px; border: 1px solid #DCDCDC; display: inline-block;" />
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 4px;">
        ${productTitle}
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #777777;">
        ${orderId ? `From Order #${orderId} &bull; ` : ''}100% French Terry / Heavyweight Tokyo Cut
      </div>
    </div>

    <!-- 1-Click Interactive Star Rating -->
    <div style="background-color: #000000; border-radius: 8px; padding: 24px 16px; text-align: center; margin-bottom: 24px;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #AAAAAA; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px;">
        CLICK A STAR TO SUBMIT YOUR RATING INSTANTLY
      </div>
      <div style="font-size: 28px; line-height: 1;">
        <a href="${reviewBaseUrl}?rating=1" style="color: #FFB800; text-decoration: none; padding: 0 4px;" title="1 Star - Poor">&#9733;</a>
        <a href="${reviewBaseUrl}?rating=2" style="color: #FFB800; text-decoration: none; padding: 0 4px;" title="2 Stars - Fair">&#9733;</a>
        <a href="${reviewBaseUrl}?rating=3" style="color: #FFB800; text-decoration: none; padding: 0 4px;" title="3 Stars - Good">&#9733;</a>
        <a href="${reviewBaseUrl}?rating=4" style="color: #FFB800; text-decoration: none; padding: 0 4px;" title="4 Stars - Great">&#9733;</a>
        <a href="${reviewBaseUrl}?rating=5" style="color: #FFB800; text-decoration: none; padding: 0 4px;" title="5 Stars - Legendary">&#9733;</a>
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #777777; margin-top: 10px; letter-spacing: 0.1em;">
        (1: POOR &bull; 3: TRUE TO SIZE &bull; 5: LEGENDARY QUALITY)
      </div>
    </div>

    <!-- Feedback Prompt Callout -->
    <div style="background-color: #F8F8F8; border-left: 3px solid #FF4D00; padding: 12px 14px; margin-bottom: 24px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #555555; line-height: 1.6;">
      <strong>WHY YOUR VOICE MATTERS:</strong> GOATED NATION drops are limited and non-restocked. Real collector feedback on sizing, silhouette drape, and wash durability guides future capsules.
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="${reviewBaseUrl}" style="display: inline-block; background-color: #FF4D00; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; padding: 14px 28px; border-radius: 4px; text-decoration: none;">
        WRITE VERIFIED REVIEW &rarr;
      </a>
    </div>
  `;

  return renderEmailLayout({
    title: `HOW DOES IT FIT? Review your ${productTitle} // GOATED NATION`,
    preheader: `Share your thoughts on the ${productTitle}. Click a star to submit your review in 1 tap.`,
    content,
  });
}
