import sharp from 'sharp'
import { writeFileSync } from 'fs'

// Icon SVG — violet circle background, white loop-arc + checkmark
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <!-- Background circle -->
  <rect width="100" height="100" rx="22" fill="#7c3aed"/>

  <!-- Outer arc (loop closing) — circle minus a gap at top-right -->
  <circle cx="50" cy="50" r="27" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="5" stroke-linecap="round"
    stroke-dasharray="140 30" stroke-dashoffset="-5" transform="rotate(-30 50 50)"/>

  <!-- Arrow tip at arc end -->
  <path d="M72 28 L80 36 L70 38" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Checkmark -->
  <path d="M36 50 L46 61 L64 39" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

for (const size of [192, 512]) {
  const svg = iconSvg(size)
  const buf = await sharp(Buffer.from(svg)).png().toBuffer()
  writeFileSync(`public/icons/icon-${size}x${size}.png`, buf)
  console.log(`✓ icon-${size}x${size}.png (${buf.length} bytes)`)
}

// Also generate favicon.ico equivalent as 32x32 png
const fav = await sharp(Buffer.from(iconSvg(32))).png().toBuffer()
writeFileSync('public/favicon.png', fav)
console.log(`✓ favicon.png`)

// Apple touch icon 180x180
const apple = await sharp(Buffer.from(iconSvg(180))).png().toBuffer()
writeFileSync('public/apple-touch-icon.png', apple)
console.log(`✓ apple-touch-icon.png`)
