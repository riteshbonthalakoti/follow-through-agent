import sharp from 'sharp'
import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const outDir = join(process.cwd(), 'public', 'icons')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

async function makeIcon(size: number, outPath: string) {
  const fontSize = Math.round(size * 0.35)
  const cx = size / 2
  const cy = size / 2 + fontSize * 0.35

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#7c3aed"/>
  <text x="${cx}" y="${cy}" font-family="Arial, sans-serif" font-size="${fontSize}"
    font-weight="bold" fill="white" text-anchor="middle">FT</text>
</svg>`

  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath)
  console.log(`✅ ${outPath}`)
}

;(async () => {
  await makeIcon(192, join(outDir, 'icon-192x192.png'))
  await makeIcon(512, join(outDir, 'icon-512x512.png'))
})()
