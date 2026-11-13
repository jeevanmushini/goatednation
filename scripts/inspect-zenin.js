const fs = require('fs');

async function inspectZenin() {
  try {
    const res = await fetch('https://zenin.co.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('HTML Length:', html.length);
    fs.writeFileSync('zenin-dump.html', html.slice(0, 100000));
    
    // Find CDN links (Shopify CDN is commonly cdn.shopify.com)
    const matches = html.match(/https:\/\/cdn\.shopify\.com\/s\/files\/[^"'`\s\\]+/g) || [];
    const unique = [...new Set(matches)];
    console.log('Shopify CDN assets found:', unique.length);
    console.log('First 20 CDN links:\n', unique.slice(0, 20).join('\n'));
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectZenin();

