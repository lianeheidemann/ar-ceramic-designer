import type {
  CeramicModel,
  DimensionsMm,
  ProfilePointMm,
} from '../../shared/types'
import { smoothProfileMm } from './lathe'
import { presetMaterial } from '../material/presets'

const GENERATED_LICENSE = 'Generated in code (MIT)'

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
    wallMm: number
  },
): CeramicModel {
  const { profileMm, wallMm, ...rest } = model
  return {
    ...rest,
    source: { kind: 'lathe', profileMm, wallMm },
    dimensionsMm: profileDimensionsMm(smoothProfileMm(profileMm)),
    license: GENERATED_LICENSE,
  }
}

export const catalog: readonly CeramicModel[] = [
  latheModel({
    id: 'vase',
    name: 'Vase',
    wallMm: 5,
    profileMm: [
      [0, 0],
      [40, 0],
      [50, 30],
      [60, 90],
      [45, 150],
      [30, 180],
      [35, 200],
    ],
    defaultMaterial: presetMaterial('matte', '#c8b6a6'),
  }),
  latheModel({
    id: 'bowl',
    name: 'Bowl',
    wallMm: 4,
    profileMm: [
      [0, 0],
      [35, 0],
      [45, 5],
      [65, 35],
      [75, 70],
    ],
    defaultMaterial: presetMaterial('glazed', '#e8e2d6'),
  }),
  latheModel({
    id: 'plate',
    name: 'Plate',
    wallMm: 4,
    profileMm: [
      [0, 0],
      [80, 0],
      [90, 3],
      [110, 18],
      [120, 25],
    ],
    defaultMaterial: presetMaterial('glossy', '#f4f1ea'),
  }),
]

export const defaultModelId = catalog[0].id

export function getModelById(id: string): CeramicModel | undefined {
  return catalog.find((model) => model.id === id)
}
