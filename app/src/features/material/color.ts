/** Hue (0–360°), saturation and lightness (0–100%). */
export interface Hsl {
  h: number
  s: number
  l: number
}

/** Ceramic glaze colors offered as swatches. */
export const GLAZE_COLORS: readonly { name: string; hex: string }[] = [
  { name: 'Porcelain', hex: '#f4f1ea' },
  { name: 'Ivory', hex: '#e8e2d6' },
  { name: 'Sand', hex: '#c8b6a6' },
  { name: 'Ochre', hex: '#c8913a' },
  { name: 'Terracotta', hex: '#b5653a' },
  { name: 'Oxblood', hex: '#7a2e2a' },
  { name: 'Celadon', hex: '#9db8a0' },
  { name: 'Jade', hex: '#5f8f78' },
  { name: 'Cobalt', hex: '#2f4f8f' },
  { name: 'Slate', hex: '#6b7a86' },
  { name: 'Charcoal', hex: '#3a3532' },
  { name: 'White', hex: '#ffffff' },
]

const HEX = /^#?([0-9a-f]{6})$/i

/** A six-digit hex color (`#a1b2c3`, `a1b2c3`) in lower case, or `undefined`. */
export function parseHex(text: string): string | undefined {
  const match = HEX.exec(text.trim())
  return match ? `#${match[1].toLowerCase()}` : undefined
}

export function hexToHsl(hex: string): Hsl {
  const value = Number.parseInt(hex.slice(1), 16)
  const r = ((value >> 16) & 255) / 255
  const g = ((value >> 8) & 255) / 255
  const b = (value & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sat = s / 100
  const light = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const channel = (n: number) =>
    Math.round(
      255 * (light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))),
    )
  return `#${[0, 8, 4]
    .map((n) => channel(n).toString(16).padStart(2, '0'))
    .join('')}`
}
