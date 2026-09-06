import sharp from 'sharp'
import { writeFileSync } from 'fs'

// Icon SVG — near-black square background, white loop-arc + bold checkmark
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="24" fill="#1a1a1a"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="7" stroke-linecap="round"
    stroke-dasharray="150 38" transform="rotate(-38 50 50)"/>
  <path d="M74 25 L83 33 L72 36" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M34 51 L45 63 L68 38" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
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
