const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');

async function buildCss() {
  const inputFile = path.join(__dirname, '../src/app/globals.css');
  const outputFile = path.join(__dirname, '../src/app/tailwind.css');

  const css = fs.readFileSync(inputFile, 'utf8');
  const result = await postcss([tailwind]).process(css, { from: inputFile, to: outputFile });

  fs.writeFileSync(outputFile, result.css);
  console.log(`[Tailwind] Successfully compiled Tailwind CSS (${result.css.length} bytes) to ${outputFile}`);
}

buildCss().catch((err) => {
  console.error('[Tailwind] Build error:', err);
  process.exit(1);
});

