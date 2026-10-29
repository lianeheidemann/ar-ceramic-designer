import { describe, expect, it } from 'vitest'
import { catalog } from '../data/catalog'
import { presetMaterial, sameMaterial } from '../materials/presets'
import { CONFIG_SCHEMA, createConfig, parseConfig } from './config'

const model = catalog[0]
const a = { color: '#336699', roughness: 0.6, metalness: 0.1, clearcoat: 0 }
const b = presetMaterial('glazed', '#aa5533')

function exported(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    ...createConfig(model, { A: a, B: b }),
    ...overrides,
  })
}

function errorOf(text: string) {
  const result = parseConfig(text)
  return result.ok ? undefined : result.error
}

describe('configuration export', () => {
  it('reimports the same model and materials', () => {
    const result = parseConfig(exported())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.config.modelId).toBe(model.id)
    expect(sameMaterial(result.config.variants.A, a)).toBe(true)
    expect(sameMaterial(result.config.variants.B!, b)).toBe(true)
  })

  it('records the version, dimensions and matching presets', () => {
    const config = createConfig(model, { A: a, B: b })
    expect(config.schema).toBe(CONFIG_SCHEMA)
    expect(config.version).toBe(1)
    expect(config.dimensionsMm).toEqual(model.dimensionsMm)
    expect(config.presets).toEqual({ B: 'glazed' })
  })

  it('leaves B out when there is no comparison', () => {
    const result = parseConfig(JSON.stringify(createConfig(model, { A: a })))
    expect(result.ok && result.config.variants.B).toBeUndefined()
  })
})

describe('configuration import', () => {
  it('rejects malformed JSON', () => {
    expect(errorOf('{ not json')).toMatch(/not valid JSON/)
  })

  it('rejects other JSON files', () => {
    expect(errorOf('{"name": "something else"}')).toMatch(/not an AR Ceramic/)
    expect(errorOf('[]')).toMatch(/not an AR Ceramic/)
  })

  it('rejects unsupported versions', () => {
    expect(errorOf(exported({ version: 2 }))).toMatch(/version/i)
  })

  it('rejects unknown model ids', () => {
    expect(errorOf(exported({ modelId: 'teapot' }))).toMatch(/teapot/)
  })

  it.each([
    ['an invalid color', { ...a, color: 'blue' }],
    ['a value above 1', { ...a, roughness: 1.5 }],
    ['a negative value', { ...a, metalness: -0.1 }],
    ['a missing value', { color: a.color, roughness: 0.5, metalness: 0 }],
    ['a non-numeric value', { ...a, clearcoat: '1' }],
  ])('rejects a material with %s', (_, material) => {
    expect(errorOf(exported({ variants: { A: material } }))).toMatch(
      /variant A/,
    )
  })
})
