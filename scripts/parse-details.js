const fs = require('fs');

const html = fs.readFileSync('zenin-full.html', 'utf8');

// Let's find hero section structure
const heroIndex = html.indexOf('hero') !== -1 ? html.indexOf('hero') : html.indexOf('pant');
console.log('Hero snippet around pant:\n', html.slice(heroIndex - 200, heroIndex + 1000));

// Let's extract all products with title, images, prices, badges
const productCards = [];
const cardRegex = /<li[^>]*class="[^"]*grid__item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
let match;
while ((match = cardRegex.exec(html)) !== null) {
  const cardHtml = match[1];
  const titleMatch = cardHtml.match(/class="card__heading[^"]*"[^>]*>\s*<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
  if (titleMatch) {
    const url = titleMatch[1];
    const title = titleMatch[2].trim();
    
    // images
    const imgs = [...cardHtml.matchAll(/\/\/zenin\.co\.in\/cdn\/shop\/files\/[^"'`\s\\?]+/gi)].map(m => 'https:' + m[0]);
    
    // prices
    const regularPriceMatch = cardHtml.match(/class="price-item price-item--regular"[^>]*>([\s\S]*?)<\/span>/i);
    const salePriceMatch = cardHtml.match(/class="price-item price-item--sale[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const badgeMatch = cardHtml.match(/badge[^>]*>([\s\S]*?)<\/span>/i);
    
    productCards.push({
      title,
      url,
      images: [...new Set(imgs)],
      regularPrice: regularPriceMatch ? regularPriceMatch[1].replace(/[\n\r\t]/g, '').trim() : null,
      salePrice: salePriceMatch ? salePriceMatch[1].replace(/[\n\r\t]/g, '').trim() : null,
      badge: badgeMatch ? badgeMatch[1].replace(/[\n\r\t]/g, '').trim() : null,
    });
  }
}

console.log('Extracted products count:', productCards.length);
fs.writeFileSync('zenin-products.json', JSON.stringify(productCards, null, 2));
console.log('Sample product:\n', JSON.stringify(productCards[0], null, 2));

