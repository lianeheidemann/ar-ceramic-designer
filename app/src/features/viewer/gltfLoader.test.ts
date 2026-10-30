import { describe, expect, it } from 'vitest'
import { unsupportedFeatures } from './gltfLoader'

/** A minimal GLB: header plus a JSON chunk (no binary chunk). */
function glb(json: object): ArrayBuffer {
  let text = JSON.stringify(json)
  while (text.length % 4) text += ' '
  const body = new TextEncoder().encode(text)
  const bytes = new Uint8Array(20 + body.length)
  const view = new DataView(bytes.buffer)
  bytes.set(new TextEncoder().encode('glTF'), 0)
  view.setUint32(4, 2, true)
  view.setUint32(8, bytes.length, true)
  view.setUint32(12, body.length, true)
  bytes.set(new TextEncoder().encode('JSON'), 16)
  bytes.set(body, 20)
  return bytes.buffer
}

describe('unsupportedFeatures', () => {
  it('accepts plain and Meshopt-compressed files', () => {
    expect(unsupportedFeatures(glb({ asset: { version: '2.0' } }))).toEqual([])
    expect(
      unsupportedFeatures(
        glb({
          extensionsUsed: ['EXT_meshopt_compression', 'KHR_mesh_quantization'],
        }),
      ),
    ).toEqual([])
  })

  it('names Draco and KTX2, which need decoders the app does not ship', () => {
    expect(
      unsupportedFeatures(
        glb({
          extensionsUsed: ['KHR_draco_mesh_compression', 'KHR_texture_basisu'],
        }),
      ),
    ).toEqual(['Draco compression', 'KTX2 (Basis) textures'])
  })

  it('does not fail on a damaged file', () => {
    expect(unsupportedFeatures(new ArrayBuffer(8))).toEqual([])
  })
})
