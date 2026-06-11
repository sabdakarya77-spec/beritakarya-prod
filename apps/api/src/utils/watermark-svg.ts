import { INTER_BOLD_BASE64 } from './font-data'

/**
 * Creates a professional text-only watermark SVG for editorial/gallery photos.
 * Follows global media agency style (Reuters, AFP, AP) — NO background box,
 * semi-transparent white text with deep drop shadow for readability on any background.
 */
export function createMediaWatermarkSvg(
  text: string,
  options: {
    fontSize: number
    opacity?: number
  }
): Buffer {
  const { fontSize, opacity = 0.82 } = options

  // Approximate canvas size: SVG must be sized to fit the text
  const charWidth = fontSize * 0.58
  const paddingH = Math.floor(fontSize * 0.9)
  const paddingV = Math.floor(fontSize * 0.65)
  const textWidth = text.length * charWidth
  const svgW = Math.ceil(textWidth + paddingH * 2)
  const svgH = Math.ceil(fontSize + paddingV * 2)
  const cx = svgW / 2
  const cy = svgH / 2

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">
  <defs>
    <style>
      @font-face {
        font-family: 'WatermarkFont';
        src: url("data:font/woff2;base64,${INTER_BOLD_BASE64}") format('woff2');
        font-weight: bold;
      }
    </style>
    <!-- Multi-layer shadow for readability on any background color -->
    <filter id="wm-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="rgba(0,0,0,1)" flood-opacity="1"/>
    </filter>
    <filter id="wm-outline" x="-5%" y="-5%" width="110%" height="110%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="expanded"/>
      <feFlood flood-color="rgba(0,0,0,0.85)" result="color"/>
      <feComposite in="color" in2="expanded" operator="in" result="outline"/>
      <feMerge>
        <feMergeNode in="outline"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Shadow layer -->
  <text x="${cx}" y="${cy}"
        dominant-baseline="central" text-anchor="middle"
        font-family="WatermarkFont, Arial, sans-serif"
        font-size="${fontSize}" font-weight="bold"
        fill="rgba(255,255,255,${opacity})"
        filter="url(#wm-shadow)">${text}</text>
</svg>`

  return Buffer.from(svg)
}

/**
 * Creates a tiled diagonal watermark SVG for KYC identity documents.
 * Covers the entire document with repeating angled text — prevents screenshot theft.
 * Opacity ~40–45% for security visibility without completely obscuring content.
 */
export function createTiledWatermarkSvg(
  text: string,
  options: {
    tileWidth: number
    tileHeight: number
    imageWidth: number
    imageHeight: number
    fontSize: number
    opacity?: number
    color?: string
  }
): Buffer {
  const {
    tileWidth,
    tileHeight,
    fontSize,
    opacity = 0.42,
    color = `rgba(180,28,28,${opacity})`
  } = options

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${tileHeight}">
  <defs>
    <style>
      @font-face {
        font-family: 'WatermarkFont';
        src: url("data:font/woff2;base64,${INTER_BOLD_BASE64}") format('woff2');
        font-weight: bold;
      }
    </style>
    <filter id="kyc-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="1" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.25)" flood-opacity="1"/>
    </filter>
  </defs>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="WatermarkFont, Arial, sans-serif" font-size="${fontSize}"
        font-weight="bold" fill="${color}" letter-spacing="2.5"
        filter="url(#kyc-shadow)"
        transform="rotate(-35, ${tileWidth / 2}, ${tileHeight / 2})">${text}</text>
</svg>`

  return Buffer.from(svg)
}

/**
 * Creates a professional attribution stamp watermark banner.
 * Used at the bottom of KYC documents to assert ownership and restrict use.
 * Styled with a clean dark-red gradient look similar to agency press stamps.
 */
export function createStampWatermarkSvg(
  text: string,
  options: {
    width: number
    height: number
    boxWidth: number
    boxHeight: number
    fontSize?: number
    bgColor?: string
    textColor?: string
  }
): Buffer {
  const {
    width,
    height,
    boxWidth,
    boxHeight,
    fontSize = 13,
    bgColor = 'rgba(170,25,25,0.90)',
    textColor = 'white'
  } = options

  // Position: bottom-right with padding
  const rx = width - boxWidth - 12
  const ry = height - boxHeight - 10
  const cx = rx + boxWidth / 2
  const cy = ry + boxHeight / 2

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <style>
      @font-face {
        font-family: 'WatermarkFont';
        src: url("data:font/woff2;base64,${INTER_BOLD_BASE64}") format('woff2');
        font-weight: bold;
      }
    </style>
    <filter id="stamp-glow" x="-5%" y="-15%" width="110%" height="130%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="rgba(0,0,0,0.6)" flood-opacity="1"/>
    </filter>
    <linearGradient id="stamp-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(200,35,35,0.95);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(140,18,18,0.95);stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Outer shadow -->
  <rect x="${rx - 1}" y="${ry - 1}" width="${boxWidth + 2}" height="${boxHeight + 2}"
        rx="5" fill="rgba(0,0,0,0.45)" filter="url(#stamp-glow)"/>
  <!-- Main stamp background with gradient -->
  <rect x="${rx}" y="${ry}" width="${boxWidth}" height="${boxHeight}"
        rx="4" fill="url(#stamp-grad)"/>
  <!-- Top highlight line -->
  <rect x="${rx + 4}" y="${ry + 2}" width="${boxWidth - 8}" height="1.5"
        rx="1" fill="rgba(255,255,255,0.35)"/>
  <!-- Stamp text -->
  <text x="${cx}" y="${cy}"
        dominant-baseline="central" text-anchor="middle"
        font-family="WatermarkFont, Arial, sans-serif" font-size="${fontSize}"
        font-weight="bold" fill="${textColor}" letter-spacing="1.2">${text}</text>
</svg>`

  return Buffer.from(svg)
}
