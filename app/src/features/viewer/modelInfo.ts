import { Mesh, Texture, type Object3D } from 'three'
import { meshMaterials } from './modelMaterials'
import { countTriangles } from './simplify'

/** What a loaded model is made of, for the Details panel. */
export interface ModelInfo {
  /** Triangles drawn (after any simplification). */
  triangles: number
  /** Triangles in the file, before simplification. */
  fileTriangles: number
  /** Distinct textures, and the largest side among them in pixels. */
  textures: number
  maxTextureSize: number
}

/** Counts triangles and textures of `root`; `fileTriangles` defaults to it. */
export function modelInfo(root: Object3D, fileTriangles?: number): ModelInfo {
  const textures = new Set<Texture>()
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    for (const material of meshMaterials(node)) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture) textures.add(value)
      }
    }
  })
  let maxTextureSize = 0
  for (const texture of textures) {
    const image = texture.image as { width?: number; height?: number } | null
    maxTextureSize = Math.max(
      maxTextureSize,
      image?.width ?? 0,
      image?.height ?? 0,
    )
  }
  const triangles = countTriangles(root)
  return {
    triangles,
    fileTriangles: fileTriangles ?? triangles,
    textures: textures.size,
    maxTextureSize,
  }
}
