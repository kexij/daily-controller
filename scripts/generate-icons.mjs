import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const outDir = path.join(process.cwd(), 'public', 'icons')

const gradient = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>`

const glyph = `
  <path d="M 300 530 L 452 682 L 742 396"
        fill="none" stroke="#ffffff" stroke-width="94"
        stroke-linecap="round" stroke-linejoin="round"/>`

function roundedIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    ${gradient}
    <rect x="0" y="0" width="1024" height="1024" rx="232" ry="232" fill="url(#bg)"/>
    ${glyph}
  </svg>`
}

function fullBleedIcon(size, scale) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    ${gradient}
    <rect x="0" y="0" width="1024" height="1024" fill="url(#bg)"/>
    <g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${glyph}</g>
  </svg>`
}

const targets = [
  { file: 'icon-192.png', svg: roundedIcon(192), size: 192 },
  { file: 'icon-512.png', svg: roundedIcon(512), size: 512 },
  { file: 'maskable-512.png', svg: fullBleedIcon(512, 0.6), size: 512 },
  { file: 'apple-touch-icon.png', svg: fullBleedIcon(180, 0.66), size: 180 },
]

await mkdir(outDir, { recursive: true })

for (const { file, svg, size } of targets) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, file))
  console.log('wrote', path.join('public', 'icons', file))
}
