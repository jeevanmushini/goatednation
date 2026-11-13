const fs = require('fs');

const html = fs.readFileSync('zenin-dump.html', 'utf8');

// Find all image tags
const imgTags = html.match(/<img[^>]+>/gi) || [];
console.log('Total img tags in first 100k:', imgTags.length);
imgTags.slice(0, 15).forEach((t, i) => console.log(`${i}: ${t}`));

// Find background-image or src attributes
const srcs = html.match(/(?:src|srcset|data-src)="([^"]+)"/gi) || [];
console.log('Total src attributes:', srcs.length);
console.log('Sample srcs:\n', srcs.slice(0, 15).join('\n'));

// Find navigation links
const navLinks = html.match(/<a[^>]+href="[^"]*"[^>]*>[^<]+<\/a>/gi) || [];
console.log('Sample links:\n', navLinks.slice(0, 20).join('\n'));

