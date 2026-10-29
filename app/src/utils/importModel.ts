import { Box3, Vector3 } from 'three'
import type { CeramicModel, DimensionsMm } from '../types/ceramic'
import { disposeObject } from '../viewers/CeramicViewer'
import { createGltfLoader, unsupportedFeatures } from '../viewers/gltfLoader'
import { mToMm } from './units'

/** Pieces outside this size (largest side, in meters) are probably not in meters. */
const MIN_SIZE_M = 0.01
const MAX_SIZE_M = 2

export type ImportResult =
  | { ok: true; model: CeramicModel; warning?: string }
  | { ok: false; error: string }

/** Whether `bytes` start like a binary glTF file ("glTF" magic). */
export function isGlb(bytes: ArrayBuffer): boolean {
  if (bytes.byteLength < 4) return false
  const magic = new Uint8Array(bytes, 0, 4)
  return String.fromCharCode(...magic) === 'glTF'
}

/** Size of a bounding box given in meters, rounded to millimeters. */
export function dimensionsFromBox(box: Box3): DimensionsMm {
  const size = box.getSize(new Vector3())
  return {
    width: Math.round(mToMm(size.x)),
    height: Math.round(mToMm(size.y)),
    depth: Math.round(mToMm(size.z)),
  }
}

/** Display name from a file name: no extension, no folders. */
export function modelNameFromFile(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? ''
  return base.replace(/\.glb$/i, '').trim() || 'Modelo importado'
}

let importCount = 0

/**
 * Reads a .glb file picked by the user and turns it into a catalog entry
 * the viewer can load (and place in AR). glTF is in meters, so its size is
 * taken as real-world size. The file stays in the browser.
 */
export async function importGlb(file: File): Promise<ImportResult> {
  const bytes = await file.arrayBuffer()
  if (!isGlb(bytes)) {
    return { ok: false, error: `"${file.name}" não é um arquivo .glb.` }
  }
  const unsupported = unsupportedFeatures(bytes)
  if (unsupported.length) {
    return {
      ok: false,
      error: `O modelo "${file.name}" usa ${unsupported.join(' e ')}, que o app ainda não abre. Exporte de novo sem essa compressão.`,
    }
  }
  let box: Box3
  try {
    const gltf = await createGltfLoader().parseAsync(bytes, '')
    box = new Box3().setFromObject(gltf.scene)
    disposeObject(gltf.scene)
  } catch {
    return {
      ok: false,
      error: `Não foi possível ler o modelo "${file.name}".`,
    }
  }
  if (box.isEmpty()) {
    return { ok: false, error: `O arquivo "${file.name}" não tem geometria.` }
  }
  const largest = Math.max(...box.getSize(new Vector3()).toArray())
  const model: CeramicModel = {
    id: `importado-${++importCount}`,
    name: modelNameFromFile(file.name),
    source: { kind: 'glb', url: URL.createObjectURL(file) },
    dimensionsMm: dimensionsFromBox(box),
    // Factors that keep the file's own look (see applyMaterial).
    defaultMaterial: {
      color: '#ffffff',
      roughness: 1,
      metalness: 1,
      clearcoat: 0,
    },
    license: 'Arquivo importado pelo usuário',
  }
  const warning =
    largest < MIN_SIZE_M || largest > MAX_SIZE_M
      ? 'O tamanho parece fora de escala: o arquivo deveria estar em metros.'
      : undefined
  return { ok: true, model, warning }
}
