const fs = require('fs');

const html = fs.readFileSync('zenin-full.html', 'utf8');

// Find all sections in the body
const sections = [...html.matchAll(/<section[^>]*id="([^"]*)"[^>]*class="([^"]*)"[^>]*>/gi)];
console.log('Sections count:', sections.length);
sections.forEach(s => {
  console.log(`id="${s[1]}" class="${s[2]}"`);
});

// Let's inspect the announcement bar
const annIndex = html.indexOf('announcement');
if (annIndex !== -1) {
  console.log('--- ANNOUNCEMENT BAR ---');
  console.log(html.slice(annIndex - 100, annIndex + 1500));
}

// Let's inspect the hero banner (the one with the glowing neon ring and pants)
const pantIndex = html.indexOf('pant1s.png');
if (pantIndex !== -1) {
  console.log('--- HERO PANTS SECTION ---');
  console.log(html.slice(pantIndex - 300, pantIndex + 800));
}

