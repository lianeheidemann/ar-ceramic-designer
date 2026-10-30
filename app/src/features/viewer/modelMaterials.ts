import {
  Color,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Material,
  type Object3D,
} from 'three'
import type { MaterialSettings } from '../../shared/types'

export function meshMaterials(mesh: Mesh): Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
}

/**
 * Gives every mesh its own material instances: glTF files may share one
 * material between meshes, and edits must not leak between them.
 */
export function cloneMaterials(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const clones = meshMaterials(node).map((material) => material.clone())
    node.material = Array.isArray(node.material) ? clones : clones[0]
  })
}

/** A GLB material's own values, kept so edits can be undone. */
interface FileMaterial {
  color: Color
  roughness: number
  metalness: number
}

/** Remembers each GLB material's own color, roughness and metalness. */
export function keepFileMaterials(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    for (const material of meshMaterials(node)) {
      if (!(material instanceof MeshStandardMaterial)) continue
      const original: FileMaterial = {
        color: material.color.clone(),
        roughness: material.roughness,
        metalness: material.metalness,
      }
      material.userData.original = original
    }
  })
}

/**
 * Sets a model's finish. Generated models take the values as they are; on
 * GLB models they scale the file's own values, as glTF factors do, so the
 * defaults (white, 1, 1) leave the file's look untouched.
 */
export function applyMaterial(
  root: Object3D,
  settings: MaterialSettings,
): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    for (const material of meshMaterials(node)) {
      if (!(material instanceof MeshStandardMaterial)) continue
      const original = material.userData.original as FileMaterial | undefined
      material.color.set(settings.color)
      material.roughness = settings.roughness
      material.metalness = settings.metalness
      if (original) {
        material.color.multiply(original.color)
        material.roughness *= original.roughness
        material.metalness *= original.metalness
      }
      if (material instanceof MeshPhysicalMaterial) {
        material.clearcoat = settings.clearcoat
      }
    }
  })
}
