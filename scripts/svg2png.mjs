/**
 * svg2png.mjs — render an SVG string to PNG via sharp.
 * Usage: node svg2png.mjs <width_px>
 * Reads SVG from stdin, writes PNG to stdout.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const widthPx = parseInt(process.argv[2] || '560', 10);

const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', async () => {
  const svg = Buffer.concat(chunks);
  try {
    const png = await sharp(svg, { density: 144 }).resize(widthPx).png().toBuffer();
    process.stdout.write(png);
  } catch (e) {
    process.stderr.write('SVG render error: ' + e.message + '\n');
    process.exit(1);
  }
});
