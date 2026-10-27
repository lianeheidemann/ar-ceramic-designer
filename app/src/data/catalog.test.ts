import { describe, expect, it } from 'vitest'
import {
  catalog,
  defaultModelId,
  getModelById,
  profileDimensionsMm,
} from './catalog'

describe('catalog', () => {
  it('has unique ids', () => {
    const ids = catalog.map((model) => model.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has positive dimensions for every model', () => {
    for (const { dimensionsMm } of catalog) {
      expect(dimensionsMm.width).toBeGreaterThan(0)
      expect(dimensionsMm.height).toBeGreaterThan(0)
      expect(dimensionsMm.depth).toBeGreaterThan(0)
    }
  })

  it('finds models by id', () => {
    expect(getModelById(defaultModelId)?.id).toBe(defaultModelId)
    expect(getModelById('missing')).toBeUndefined()
  })

  it('derives dimensions from a lathe profile', () => {
    expect(
      profileDimensionsMm([
        [0, 10],
        [60, 40],
        [30, 210],
      ]),
    ).toEqual({ width: 120, height: 200, depth: 120 })
  })
})
