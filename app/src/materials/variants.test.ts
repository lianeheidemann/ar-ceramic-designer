import { describe, expect, it } from 'vitest'
import { catalog } from '../data/catalog'
import { findPreset, sameMaterial } from './presets'
import { defaultVariantMaterial } from './variants'

describe.each(catalog)('$name variants', (model) => {
  it('starts A on the original material', () => {
    expect(defaultVariantMaterial(model, 'A')).toBe(model.defaultMaterial)
  })

  it('starts B on another preset with the same color', () => {
    const b = defaultVariantMaterial(model, 'B')
    expect(b.color).toBe(model.defaultMaterial.color)
    expect(findPreset(b)).toBeDefined()
    expect(sameMaterial(b, model.defaultMaterial)).toBe(false)
  })

  it('returns the same B object every time', () => {
    expect(defaultVariantMaterial(model, 'B')).toBe(
      defaultVariantMaterial(model, 'B'),
    )
  })
})
