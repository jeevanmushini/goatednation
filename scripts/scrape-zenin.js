const fs = require('fs');

async function scrapeFullSite() {
  const res = await fetch('https://zenin.co.in/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  fs.writeFileSync('zenin-full.html', html);

  // Extract all product cards, titles, prices, image URLs
  const imgRegex = /\/\/(?:zenin\.co\.in|cdn\.shopify\.com)\/s\/files\/[^"'`\s\\]+/g;
  const cdnShopRegex = /\/\/zenin\.co\.in\/cdn\/shop\/files\/[^"'`\s\\?]+/g;
  
  const allImages = [...new Set([...(html.match(imgRegex) || []), ...(html.match(cdnShopRegex) || [])])];
  console.log('Total unique images found:', allImages.length);
  console.log('Top 30 images:\n', allImages.slice(0, 30).join('\n'));

  // Also extract product data if in JSON (Shopify often has window.ShopifyAnalytics or JSON objects)
  const productCards = [];
  const cardMatches = [...html.matchAll(/class="card__heading[^"]*"[^>]*>\s*<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
  console.log('Product titles found:', cardMatches.length);
  cardMatches.forEach(m => {
    console.log('Product:', m[2].trim(), '->', m[1]);
  });
}

scrapeFullSite();

