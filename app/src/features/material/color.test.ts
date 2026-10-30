import { describe, expect, it } from 'vitest'
import { GLAZE_COLORS, hexToHsl, hslToHex, parseHex } from './color'

describe('colors', () => {
  it('converts hex to HSL and back', () => {
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 })
    expect(hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 })
    expect(hslToHex({ h: 120, s: 100, l: 25 })).toBe('#008000')
    // Whole-number HSL keeps every glaze within a few steps per channel.
    const channels = (hex: string) =>
      [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
    for (const { hex } of GLAZE_COLORS) {
      const back = channels(hslToHex(hexToHsl(hex)))
      channels(hex).forEach((value, i) =>
        expect(Math.abs(back[i] - value)).toBeLessThanOrEqual(3),
      )
    }
  })

  it('reads hex colors typed by hand', () => {
    expect(parseHex('#C8B6A6')).toBe('#c8b6a6')
    expect(parseHex(' 2f4f8f ')).toBe('#2f4f8f')
    expect(parseHex('#abc')).toBeUndefined()
    expect(parseHex('red')).toBeUndefined()
  })
})
