import { Box3, Mesh } from 'three'
import { describe, expect, it } from 'vitest'
import { catalog } from '../data/catalog'
import { mmToM } from '../utils/units'
import { createModelGeometry, solidProfileMm } from './lathe'

const MAX_TRIANGLES = 20_000

describe('solidProfileMm', () => {
  const profile = [
    [0, 0],
    [50, 0],
    [60, 100],
  ] as const
  const solid = solidProfileMm(profile, 4)

  it('starts and ends on the axis', () => {
    expect(solid[0]).toEqual([0, 0])
    expect(solid.at(-1)?.[0]).toBe(0)
  })

  it('places the inner base one wall above the outer base', () => {
    expect(solid.at(-1)?.[1]).toBeCloseTo(4)
  })

  it('keeps every radius on or outside the axis', () => {
    for (const [r] of solid) expect(r).toBeGreaterThanOrEqual(0)
  })
})

describe.each(catalog)('$name geometry', (model) => {
  const geometry = createModelGeometry(model)
  const box = new Box3().setFromObject(new Mesh(geometry))

  it('matches the catalog dimensions in meters', () => {
    const { width, height, depth } = model.dimensionsMm
    expect(box.max.x - box.min.x).toBeCloseTo(mmToM(width), 6)
    expect(box.max.y - box.min.y).toBeCloseTo(mmToM(height), 6)
    expect(box.max.z - box.min.z).toBeCloseTo(mmToM(depth), 6)
  })

  it('rests on y = 0', () => {
    expect(box.min.y).toBeCloseTo(0, 6)
  })

  it('stays within the mobile triangle budget', () => {
    const triangles = (geometry.index?.count ?? 0) / 3
    expect(triangles).toBeGreaterThan(0)
    expect(triangles).toBeLessThan(MAX_TRIANGLES)
  })
})
