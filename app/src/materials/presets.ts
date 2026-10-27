import type {
  Finish,
  MaterialPresetId,
  MaterialSettings,
} from '../types/ceramic'

export interface MaterialPreset {
  id: MaterialPresetId
  name: string
  finish: Finish
}

export const materialPresets: readonly MaterialPreset[] = [
  {
    id: 'matte',
    name: 'Fosco',
    finish: { roughness: 0.9, metalness: 0, clearcoat: 0 },
  },
  {
    id: 'glossy',
    name: 'Brilhante',
    finish: { roughness: 0.25, metalness: 0, clearcoat: 0 },
  },
  {
    // A rough clay body under a smooth glaze layer.
    id: 'glazed',
    name: 'Vitrificado',
    finish: { roughness: 0.45, metalness: 0, clearcoat: 1 },
  },
]

/** Values closer than this are treated as equal when matching presets. */
const TOLERANCE = 0.005

export function getPreset(id: MaterialPresetId): MaterialPreset {
  const preset = materialPresets.find((p) => p.id === id)
  if (!preset) throw new Error(`Preset desconhecido: ${id}`)
  return preset
}

export function presetMaterial(
  id: MaterialPresetId,
  color: string,
): MaterialSettings {
  return { color, ...getPreset(id).finish }
}

/** Switches to a preset's finish, keeping the current color. */
export function applyPreset(
  settings: MaterialSettings,
  id: MaterialPresetId,
): MaterialSettings {
  return presetMaterial(id, settings.color)
}

/** The preset whose finish matches `settings`, if any. */
export function findPreset(
  settings: MaterialSettings,
): MaterialPreset | undefined {
  return materialPresets.find(({ finish }) =>
    (Object.keys(finish) as (keyof Finish)[]).every(
      (key) => Math.abs(finish[key] - settings[key]) < TOLERANCE,
    ),
  )
}

export function sameMaterial(a: MaterialSettings, b: MaterialSettings) {
  return (
    a.color.toLowerCase() === b.color.toLowerCase() &&
    a.roughness === b.roughness &&
    a.metalness === b.metalness &&
    a.clearcoat === b.clearcoat
  )
}
