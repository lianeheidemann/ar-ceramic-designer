import { Mesh, SphereGeometry } from 'three'
import { describe, expect, it } from 'vitest'
import { countTriangles, simplifyHeavyMeshes, triangleBudget } from './simplify'

describe('triangleBudget', () => {
  it('leaves models within the budget whole', () => {
    expect(triangleBudget([100, 50], 300)).toEqual([100, 50])
  })

  it('shares the budget in proportion to each mesh', () => {
    expect(triangleBudget([1_500_000, 500_000], 300_000)).toEqual([
      225_000, 75_000,
    ])
  })
})

describe('simplifyHeavyMeshes', () => {
  it('cuts the triangles of a heavy mesh, keeping its vertices', async () => {
    const mesh = new Mesh(new SphereGeometry(0.1, 64, 32))
    const before = countTriangles(mesh)
    const vertices = mesh.geometry.attributes.position.count
    await simplifyHeavyMeshes(mesh, 'test-sphere', 500)
    const after = countTriangles(mesh)
    expect(before).toBeGreaterThan(3000)
    expect(after).toBeLessThanOrEqual(500)
    expect(after).toBeGreaterThan(100)
    expect(mesh.geometry.attributes.position.count).toBe(vertices)
  })

  it('leaves light meshes untouched', async () => {
    const mesh = new Mesh(new SphereGeometry(0.1, 8, 6))
    const index = mesh.geometry.index
    await simplifyHeavyMeshes(mesh, 'test-light', 500)
    expect(mesh.geometry.index).toBe(index)
  })

  it('reuses the simplified result for the same file', async () => {
    const first = new Mesh(new SphereGeometry(0.1, 64, 32))
    await simplifyHeavyMeshes(first, 'test-cache', 500)
    const second = new Mesh(new SphereGeometry(0.1, 64, 32))
    await simplifyHeavyMeshes(second, 'test-cache', 500)
    expect(countTriangles(second)).toBe(countTriangles(first))
  })
})
