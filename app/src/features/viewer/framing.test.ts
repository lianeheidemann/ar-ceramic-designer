import { describe, expect, it } from 'vitest'
import { FRAMING_MARGIN, fitDistance, stepOrbit } from './framing'

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

describe('stepOrbit', () => {
  const limits = {
    minDistance: 0.5,
    maxDistance: 2,
    minPolar: 0,
    maxPolar: Math.PI / 2,
  }
  const start = { radius: 1, polar: 1, azimuth: 0 }

  it('turns around the vertical axis without limits', () => {
    const turned = stepOrbit(start, { dAzimuth: -4 * Math.PI }, limits)
    expect(turned).toEqual({ ...start, azimuth: -4 * Math.PI })
  })

  it('stops above the horizon and at the top', () => {
    expect(stepOrbit(start, { dPolar: 2 }, limits).polar).toBe(Math.PI / 2)
    expect(stepOrbit(start, { dPolar: -2 }, limits).polar).toBe(0)
  })

  it('zooms within the allowed distances', () => {
    expect(stepOrbit(start, { zoom: 0.8 }, limits).radius).toBeCloseTo(0.8)
    expect(stepOrbit(start, { zoom: 0.1 }, limits).radius).toBe(0.5)
    expect(stepOrbit(start, { zoom: 10 }, limits).radius).toBe(2)
  })
})
