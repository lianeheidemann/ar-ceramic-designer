import { Box3, Vector3 } from 'three'
import type { CeramicModel, DimensionsMm } from '../types/ceramic'
import { disposeObject } from '../viewers/CeramicViewer'
import { createGltfLoader, unsupportedFeatures } from '../viewers/gltfLoader'
import { MAX_TRIANGLES, countTriangles } from '../viewers/simplify'
import { mToMm } from './units'

/**
 * Pieces outside this size (largest side, in meters) are probably not at
 * real size: AI generators such as Tripo scale them to about 1 m.
 */
const MIN_SIZE_M = 0.01
const MAX_SIZE_M = 0.6

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
  let triangles: number
  try {
    const gltf = await createGltfLoader().parseAsync(bytes, '')
    box = new Box3().setFromObject(gltf.scene)
    triangles = countTriangles(gltf.scene)
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
  const notes: string[] = []
  if (largest < MIN_SIZE_M || largest > MAX_SIZE_M) {
    notes.push(
      `No arquivo a peça mede ${formatLength(largest)}; ajuste a altura real na aba Modelos.`,
    )
  }
  if (triangles > MAX_TRIANGLES) {
    notes.push(
      `Ele tem ${formatTriangles(triangles)}; o app mostra uma versão simplificada com até ${formatTriangles(MAX_TRIANGLES)} para ficar leve no celular.`,
    )
  }
  const warning = notes.length ? notes.join(' ') : undefined
  return { ok: true, model, warning }
}

/** "98 cm", "1,2 m" or "4 mm", for messages. */
export function formatLength(meters: number): string {
  const format = (value: number, digits: number) =>
    value.toLocaleString('pt-BR', { maximumFractionDigits: digits })
  if (meters >= 1) return `${format(meters, 1)} m`
  if (meters >= 0.01) return `${format(meters * 100, 0)} cm`
  return `${format(meters * 1000, 0)} mm`
}

/** "1,9 milhão de triângulos", "940 mil triângulos", for messages. */
export function formatTriangles(count: number): string {
  if (count >= 1_000_000) {
    const millions = (count / 1_000_000).toLocaleString('pt-BR', {
      maximumFractionDigits: 1,
    })
    return `${millions} ${count >= 2_000_000 ? 'milhões' : 'milhão'} de triângulos`
  }
  if (count >= 1000) return `${Math.round(count / 1000)} mil triângulos`
  return `${count} triângulos`
}
