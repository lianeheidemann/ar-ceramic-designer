import { getModelById } from '../data/catalog'
import { findPreset } from '../materials/presets'
import type { VariantId } from '../materials/variants'
import type {
  CeramicModel,
  DimensionsMm,
  MaterialPresetId,
  MaterialSettings,
} from '../types/ceramic'

export const CONFIG_SCHEMA = 'ar-ceramic-designer/config'
export const CONFIG_VERSION = 1

/** Saved appearance of one model, as written to the exported `.json`. */
export interface CeramicConfig {
  schema: typeof CONFIG_SCHEMA
  version: typeof CONFIG_VERSION
  modelId: string
  /** Informative: the catalog size at export time; ignored on import. */
  dimensionsMm: DimensionsMm
  /** A is the regular material; B is present when comparing. */
  variants: { A: MaterialSettings; B?: MaterialSettings }
  /** Informative: the preset each variant matches, if any. */
  presets: Partial<Record<VariantId, MaterialPresetId>>
}

export type ParseResult =
  { ok: true; config: CeramicConfig } | { ok: false; error: string }

const COLOR_PATTERN = /^#[0-9a-f]{6}$/i
const UNIT_KEYS = ['roughness', 'metalness', 'clearcoat'] as const

export function createConfig(
  model: CeramicModel,
  variants: { A: MaterialSettings; B?: MaterialSettings },
): CeramicConfig {
  const presets: CeramicConfig['presets'] = {}
  for (const [variant, material] of Object.entries(variants)) {
    const preset = material && findPreset(material)
    if (preset) presets[variant as VariantId] = preset.id
  }
  return {
    schema: CONFIG_SCHEMA,
    version: CONFIG_VERSION,
    modelId: model.id,
    dimensionsMm: { ...model.dimensionsMm },
    variants: { ...variants },
    presets,
  }
}

/** Reads an exported configuration, rejecting anything it cannot reproduce. */
export function parseConfig(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return fail('O arquivo não é um JSON válido.')
  }
  if (!isRecord(data) || data.schema !== CONFIG_SCHEMA) {
    return fail('O arquivo não é uma configuração do AR Ceramic Designer.')
  }
  if (data.version !== CONFIG_VERSION) {
    return fail(
      `Versão de configuração não suportada: ${String(data.version)}.`,
    )
  }
  const model =
    typeof data.modelId === 'string' ? getModelById(data.modelId) : undefined
  if (!model) {
    return fail(`Modelo desconhecido: ${String(data.modelId)}.`)
  }
  if (!isRecord(data.variants)) {
    return fail('A configuração não tem materiais.')
  }
  const a = parseMaterial(data.variants.A)
  if (!a) return fail('Material da variante A inválido.')
  const variants: CeramicConfig['variants'] = { A: a }
  if (data.variants.B !== undefined) {
    const b = parseMaterial(data.variants.B)
    if (!b) return fail('Material da variante B inválido.')
    variants.B = b
  }
  return { ok: true, config: createConfig(model, variants) }
}

function parseMaterial(value: unknown): MaterialSettings | undefined {
  if (!isRecord(value)) return undefined
  const { color } = value
  if (typeof color !== 'string' || !COLOR_PATTERN.test(color)) return undefined
  const material = { color: color.toLowerCase() } as MaterialSettings
  for (const key of UNIT_KEYS) {
    const number = value[key]
    if (typeof number !== 'number' || !(number >= 0 && number <= 1)) {
      return undefined
    }
    material[key] = number
  }
  return material
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fail(error: string): ParseResult {
  return { ok: false, error }
}
