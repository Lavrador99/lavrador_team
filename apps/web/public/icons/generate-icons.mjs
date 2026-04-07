// Run once: node apps/web/public/icons/generate-icons.mjs
// Generates PWA icons using only built-in Node.js — no canvas needed.
// Creates SVG icons that browsers accept as PWA icons.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function makeSvg(size) {
  const r = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.38);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#c8f542"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui, sans-serif" font-weight="800" font-size="${fontSize}"
    fill="#0a0a0f">LT</text>
</svg>`;
}

for (const size of [192, 512]) {
  const svg = makeSvg(size);
  fs.writeFileSync(path.join(__dirname, `icon-${size}x${size}.svg`), svg);
  console.log(`✓ icon-${size}x${size}.svg`);
}
