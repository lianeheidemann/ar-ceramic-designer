import { describe, expect, it } from 'vitest'
import { catalog } from '../data/catalog'
import {
  applyPreset,
  findPreset,
  materialPresets,
  presetMaterial,
  sameMaterial,
} from './presets'

describe('material presets', () => {
  it('keeps the color when applying a preset', () => {
    const glazed = applyPreset(presetMaterial('matte', '#336699'), 'glazed')
    expect(glazed.color).toBe('#336699')
    expect(findPreset(glazed)?.id).toBe('glazed')
  })

  it.each(materialPresets)('recognizes the $name preset', (preset) => {
    expect(findPreset(presetMaterial(preset.id, '#ffffff'))?.id).toBe(preset.id)
  })

  it('reports no preset after a manual adjustment', () => {
    const adjusted = { ...presetMaterial('glossy', '#ffffff'), roughness: 0.6 }
    expect(findPreset(adjusted)).toBeUndefined()
  })

  // A GLB model starts on its own textures instead.
  it('starts every generated catalog model on a preset', () => {
    for (const model of catalog.filter((m) => m.source.kind === 'lathe')) {
      expect(findPreset(model.defaultMaterial)).toBeDefined()
    }
  })

  it('compares colors case-insensitively', () => {
    expect(
      sameMaterial(
        presetMaterial('matte', '#AABBCC'),
        presetMaterial('matte', '#aabbcc'),
      ),
    ).toBe(true)
  })
})
