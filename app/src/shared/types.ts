/** Real-world size of an object, in millimeters. */
export interface DimensionsMm {
  width: number
  height: number
  depth: number
}

/** Physically based material parameters for a ceramic finish. */
export interface MaterialSettings {
  /** Hex color, e.g. `#e8e2d6`. */
  color: string
  /** 0 (mirror) to 1 (fully matte). */
  roughness: number
  /** 0 (dielectric, typical ceramic) to 1 (metal). */
  metalness: number
  /** 0 (none) to 1 (full) glossy glaze layer over the base material. */
  clearcoat: number
}

/** Surface treatment of a material, everything except its color. */
export type Finish = Omit<MaterialSettings, 'color'>

export type MaterialPresetId = 'matte' | 'glossy' | 'glazed'

/** A point of a lathe profile: `[radius, height]` in millimeters. */
export type ProfilePointMm = readonly [radius: number, height: number]

/** Where a model's geometry comes from. */
export type ModelSource =
  /** Generated in code by revolving a profile around the vertical axis. */
  | {
      kind: 'lathe'
      /** Outer surface, from the bottom center on the axis up to the rim. */
      profileMm: readonly ProfilePointMm[]
      /** Wall and base thickness. */
      wallMm: number
    }
  /** Loaded from a GLB/glTF file, e.g. under `public/models/`. */
  | { kind: 'glb'; url: string }

export interface CeramicModel {
  id: string
  name: string
  source: ModelSource
  dimensionsMm: DimensionsMm
  defaultMaterial: MaterialSettings
  /** Source and license of the asset. */
  license: string
  /** Size of the .glb file in bytes (models loaded from a file). */
  fileBytes?: number
}
