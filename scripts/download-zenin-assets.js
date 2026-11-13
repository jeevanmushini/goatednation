const fs = require('fs');
const path = require('path');

const ASSETS = [
  // Pants for floating carousel
  { name: 'pant1.png', url: 'https://zenin.co.in/cdn/shop/files/pant1s.png?width=1000' },
  { name: 'pant2.png', url: 'https://zenin.co.in/cdn/shop/files/pant2.png?width=1000' },
  { name: 'pant3.png', url: 'https://zenin.co.in/cdn/shop/files/pant3ss.png?width=1000' },
  { name: 'pant4.png', url: 'https://zenin.co.in/cdn/shop/files/pant5.png?width=1000' },
  { name: 'pant5.png', url: 'https://zenin.co.in/cdn/shop/files/pant6.png?width=1000' },
  { name: 'pant6.png', url: 'https://zenin.co.in/cdn/shop/files/pant_8.png?width=1000' },
  { name: 'pant7.png', url: 'https://zenin.co.in/cdn/shop/files/pant_7.png?width=1000' },

  // Products
  { name: 'product1-main.jpg', url: 'https://zenin.co.in/cdn/shop/files/web1s.jpg?width=1000' },
  { name: 'product1-hover.jpg', url: 'https://zenin.co.in/cdn/shop/files/web3-6_7cf68fc5-bb42-4e91-acf6-665b418ba0c1.jpg?width=1000' },

  { name: 'product2-main.jpg', url: 'https://zenin.co.in/cdn/shop/files/W1-23.jpg?width=1000' },
  { name: 'product2-hover.jpg', url: 'https://zenin.co.in/cdn/shop/files/w2-25.jpg?width=1000' },

  { name: 'product3-main.jpg', url: 'https://zenin.co.in/cdn/shop/files/a1ss.jpg?width=1000' },
  { name: 'product3-hover.jpg', url: 'https://zenin.co.in/cdn/shop/files/a4-3.jpg?width=1000' },

  { name: 'product4-main.jpg', url: 'https://zenin.co.in/cdn/shop/files/berserkbagmock.jpg?width=1000' },
  { name: 'product4-hover.jpg', url: 'https://zenin.co.in/cdn/shop/files/berserkbag1.jpg?width=1000' },

  { name: 'product5-main.jpg', url: 'https://zenin.co.in/cdn/shop/files/w2s-2.jpg?width=1000' },
  { name: 'product5-hover.jpg', url: 'https://zenin.co.in/cdn/shop/files/w1-20.jpg?width=1000' },

  { name: 'product6-main.jpg', url: 'https://zenin.co.in/cdn/shop/files/aizenweb1.jpg?width=1000' },
  { name: 'product6-hover.jpg', url: 'https://zenin.co.in/cdn/shop/files/aizenweb2.jpg?width=1000' },

  // Card stack gallery
  { name: 'stack-backpack.jpg', url: 'https://zenin.co.in/cdn/shop/files/backpackcollection.jpg?width=1000' },
  { name: 'stack-jacket.jpg', url: 'https://zenin.co.in/cdn/shop/files/W2_6048f97c-7344-4633-be03-4078572c4ab3.jpg?width=1000' },
  { name: 'stack-hoodie.jpg', url: 'https://zenin.co.in/cdn/shop/files/W2_c73c0e9a-68a9-4ab7-ad83-2780a0d86305.jpg?width=1000' },
  { name: 'stack-vest.jpg', url: 'https://zenin.co.in/cdn/shop/files/w2-16.jpg?width=1000' },

  // Editorial banner
  { name: 'editorial-banner.jpg', url: 'https://zenin.co.in/cdn/shop/files/webwallpaperss.jpg?width=2000' },

  // Background concrete texture
  { name: 'concrete-bg.png', url: 'https://zenin.co.in/cdn/shop/files/ChatGPT_Image_Jul_27_2026_at_04_30_22_AM.png?width=2000' }
];

async function downloadAll() {
  const targetDir = path.join(__dirname, '..', 'public', 'images', 'zenin');
  console.log('Downloading assets to', targetDir);

  for (const item of ASSETS) {
    const dest = path.join(targetDir, item.name);
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buffer);
        console.log(`✓ Downloaded ${item.name} (${Math.round(buffer.length / 1024)} KB)`);
      } else {
        console.warn(`✗ Failed ${item.name}: ${res.status}`);
      }
    } catch (e) {
      console.error(`✗ Error ${item.name}:`, e.message);
    }
  }
}

downloadAll();

