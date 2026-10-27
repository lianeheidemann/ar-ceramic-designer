import { describe, expect, it } from 'vitest'
import { FRAMING_MARGIN, fitDistance } from './framing'

describe('fitDistance', () => {
  it('fits a sphere in a 60° vertical field of view', () => {
    // sin(30°) = 0.5, so the sphere touches the view at twice its radius.
    expect(fitDistance(1, 60, 2)).toBeCloseTo(2 * FRAMING_MARGIN)
  })

  it('grows with the radius', () => {
    expect(fitDistance(0.2, 35, 1.5)).toBeCloseTo(2 * fitDistance(0.1, 35, 1.5))
  })

  it('moves further away on narrow (portrait) screens', () => {
    expect(fitDistance(0.1, 35, 0.5)).toBeGreaterThan(fitDistance(0.1, 35, 1.5))
  })
})
