import { describe, expect, it } from 'vitest'
import { mToMm, mmToM } from './units'

describe('units', () => {
  it('converts millimeters to meters', () => {
    expect(mmToM(200)).toBe(0.2)
  })

  it('converts meters to millimeters', () => {
    expect(mToMm(0.15)).toBe(150)
  })
})
