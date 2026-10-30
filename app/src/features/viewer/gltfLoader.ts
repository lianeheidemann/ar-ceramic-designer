import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

/**
 * GLB loader shared by the viewer and the import check. It reads Meshopt
 * compression (gltfpack, Tripo and other generators), which needs no
 * extra files; Draco and KTX2 textures would need decoders served apart.
 */
export function createGltfLoader(): GLTFLoader {
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
}

/** Extensions a file may require that this app cannot read, with a name to show. */
const UNSUPPORTED: Record<string, string> = {
  KHR_draco_mesh_compression: 'Draco compression',
  KHR_texture_basisu: 'KTX2 (Basis) textures',
}

/**
 * Names of the unsupported features a GLB uses, read from its JSON chunk
 * (empty if none, or if the chunk cannot be read).
 */
export function unsupportedFeatures(glb: ArrayBuffer): string[] {
  try {
    const view = new DataView(glb)
    const jsonLength = view.getUint32(12, true)
    const json = JSON.parse(
      new TextDecoder().decode(new Uint8Array(glb, 20, jsonLength)),
    ) as { extensionsUsed?: string[] }
    return (json.extensionsUsed ?? [])
      .filter((name) => name in UNSUPPORTED)
      .map((name) => UNSUPPORTED[name])
  } catch {
    return []
  }
}
