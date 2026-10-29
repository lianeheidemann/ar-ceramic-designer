import { BufferAttribute, Mesh, type Object3D } from 'three'
import { MeshoptSimplifier } from 'three/addons/libs/meshopt_simplifier.module.js'

/**
 * Triangle budget for a whole model on a phone. AI generators (Tripo and
 * others) export a million triangles or more; past this the viewer keeps
 * a simplified copy, the normal map still carries the fine detail.
 */
export const MAX_TRIANGLES = 300_000

/** Largest distortion allowed when simplifying, relative to the mesh size. */
const MAX_ERROR = 0.02

function meshes(root: Object3D): Mesh[] {
  const found: Mesh[] = []
  root.traverse((node) => {
    if (node instanceof Mesh) found.push(node)
  })
  return found
}

function triangles(mesh: Mesh): number {
  const { index, attributes } = mesh.geometry
  return (index ? index.count : attributes.position.count) / 3
}

export function countTriangles(root: Object3D): number {
  return meshes(root).reduce((sum, mesh) => sum + triangles(mesh), 0)
}

/**
 * Triangles each mesh may keep so the total fits `max`, shared in
 * proportion to their size. Meshes are left whole when the total fits.
 */
export function triangleBudget(counts: number[], max: number): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total <= max) return counts
  return counts.map((count) => Math.floor((count * max) / total))
}

/** Simplified indices per model URL, so a model is simplified only once. */
const cache = new Map<string, (Uint32Array | null)[]>()

/**
 * Reduces the triangles of an over-detailed model in place (index buffers
 * only: vertices, UVs and textures stay as they are). Mesh borders are
 * locked, so seams and rims do not crack.
 */
export async function simplifyHeavyMeshes(
  root: Object3D,
  cacheKey: string,
  max = MAX_TRIANGLES,
): Promise<void> {
  const list = meshes(root)
  let indices = cache.get(cacheKey)
  if (!indices) {
    const budget = triangleBudget(list.map(triangles), max)
    if (budget.every((count, i) => count >= triangles(list[i]))) return
    await MeshoptSimplifier.ready
    indices = list.map((mesh, i) => simplifyMesh(mesh, budget[i]))
    cache.set(cacheKey, indices)
  }
  list.forEach((mesh, i) => {
    const simplified = indices[i]
    if (simplified) mesh.geometry.setIndex(new BufferAttribute(simplified, 1))
  })
}

function simplifyMesh(mesh: Mesh, target: number): Uint32Array | null {
  const { index, attributes } = mesh.geometry
  if (!index || target >= index.count / 3) return null
  // Quantized (normalized integer) positions are read back as floats.
  const position = attributes.position
  const positions = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) {
    positions[i * 3] = position.getX(i)
    positions[i * 3 + 1] = position.getY(i)
    positions[i * 3 + 2] = position.getZ(i)
  }
  const [simplified] = MeshoptSimplifier.simplify(
    new Uint32Array(index.array),
    positions,
    3,
    target * 3,
    MAX_ERROR,
    ['LockBorder'],
  )
  return simplified
}
