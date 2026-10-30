import { describe, expect, it } from 'vitest'
import { glbBoundsMm, type GltfJson } from './glbBounds'

const box = (min: number[], max: number[], extra = {}): GltfJson => ({
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
  accessors: [{ min, max, ...extra }],
})

describe('glbBoundsMm', () => {
  it('reads the POSITION bounds in millimeters', () => {
    expect(glbBoundsMm(box([-0.5, 0, -0.28], [0.5, 0.51, 0.28]))).toEqual({
      width: 1000,
      height: 510,
      depth: 560,
    })
  })

  it('applies node transforms down the tree', () => {
    const json: GltfJson = {
      ...box([-1, -1, -1], [1, 1, 1]),
      nodes: [
        { children: [1], scale: [0.05, 0.05, 0.05] },
        {
          mesh: 0,
          translation: [10, 0, 0],
          rotation: [0, 0.7071068, 0, 0.7071068],
        },
      ],
    }
    expect(glbBoundsMm(json)).toEqual({ width: 100, height: 100, depth: 100 })
  })

  it('dequantizes normalized positions', () => {
    const json: GltfJson = {
      ...box([-32767, 0, -16384], [32767, 32767, 16384], {
        componentType: 5122,
        normalized: true,
      }),
      nodes: [{ mesh: 0, scale: [0.2, 0.2, 0.2] }],
    }
    expect(glbBoundsMm(json)).toEqual({ width: 400, height: 200, depth: 200 })
  })

  it('has no size without geometry', () => {
    expect(glbBoundsMm({ scenes: [{ nodes: [] }] })).toBeUndefined()
  })
})
