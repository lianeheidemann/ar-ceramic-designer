import type {
  CeramicModel,
  DimensionsMm,
  ProfilePointMm,
} from '../types/ceramic'

const GENERATED_LICENSE = 'Gerado por código (MIT)'

/** Bounding size of a lathe profile revolved around the vertical axis. */
export function profileDimensionsMm(
  profile: readonly ProfilePointMm[],
): DimensionsMm {
  const radii = profile.map(([r]) => r)
  const heights = profile.map(([, h]) => h)
  const diameter = 2 * Math.max(...radii)
  return {
    width: diameter,
    height: Math.max(...heights) - Math.min(...heights),
    depth: diameter,
  }
}

function latheModel(
  model: Omit<CeramicModel, 'source' | 'dimensionsMm' | 'license'> & {
    profileMm: readonly ProfilePointMm[]
  },
): CeramicModel {
  const { profileMm, ...rest } = model
  return {
    ...rest,
    source: { kind: 'lathe', profileMm },
    dimensionsMm: profileDimensionsMm(profileMm),
    license: GENERATED_LICENSE,
  }
}

export const catalog: readonly CeramicModel[] = [
  latheModel({
    id: 'vase',
    name: 'Vaso',
    profileMm: [
      [0, 0],
      [40, 0],
      [50, 30],
      [60, 90],
      [45, 150],
      [30, 180],
      [35, 200],
    ],
    defaultMaterial: { color: '#c8b6a6', roughness: 0.6, metalness: 0 },
  }),
  latheModel({
    id: 'bowl',
    name: 'Tigela',
    profileMm: [
      [0, 0],
      [35, 0],
      [45, 5],
      [65, 35],
      [75, 70],
    ],
    defaultMaterial: { color: '#e8e2d6', roughness: 0.3, metalness: 0 },
  }),
  latheModel({
    id: 'plate',
    name: 'Prato',
    profileMm: [
      [0, 0],
      [80, 0],
      [90, 3],
      [110, 18],
      [120, 25],
    ],
    defaultMaterial: { color: '#f4f1ea', roughness: 0.2, metalness: 0 },
  }),
]

export const defaultModelId = catalog[0].id

export function getModelById(id: string): CeramicModel | undefined {
  return catalog.find((model) => model.id === id)
}
