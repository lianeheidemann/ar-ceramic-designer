import { Box3, Vector3 } from 'three'
import type { CeramicModel, DimensionsMm } from '../../shared/types'
import { disposeObject } from '../viewer/sceneObjects'
import { createGltfLoader, unsupportedFeatures } from '../viewer/gltfLoader'
import { MAX_TRIANGLES, countTriangles } from '../viewer/simplify'
import { mToMm } from '../../shared/units'

/**
 * Pieces outside this size (largest side, in meters) are probably not at
 * real size: AI generators such as Tripo scale them to about 1 m.
 */
const MIN_SIZE_M = 0.01
const MAX_SIZE_M = 0.6
/** Largest side such pieces start with, in millimeters. */
const FIT_SIZE_MM = 200

export type ImportResult =
  | {
      ok: true
      model: CeramicModel
      /** Height to show the piece at, when the file's size is unlikely. */
      realHeightMm?: number
      warning?: string
    }
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

/**
 * Height that brings a piece of unlikely size (outside 1–60 cm) to a largest
 * side of 20 cm, or `undefined` when the file's size is plausible. Scaling by
 * the largest side keeps a wide plate from growing huge.
 */
export function fittedHeightMm({
  width,
  height,
  depth,
}: DimensionsMm): number | undefined {
  const largest = Math.max(width, height, depth)
  if (largest >= mToMm(MIN_SIZE_M) && largest <= mToMm(MAX_SIZE_M)) {
    return undefined
  }
  return Math.round((height * FIT_SIZE_MM) / largest)
}

/** Display name from a file name: no extension, no folders. */
export function modelNameFromFile(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? ''
  return base.replace(/\.glb$/i, '').trim() || 'Imported model'
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
    return { ok: false, error: `"${file.name}" is not a .glb file.` }
  }
  const unsupported = unsupportedFeatures(bytes)
  if (unsupported.length) {
    return {
      ok: false,
      error: `The model "${file.name}" uses ${unsupported.join(' and ')}, which the app cannot open yet. Export it again without it.`,
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
      error: `Could not read the model "${file.name}".`,
    }
  }
  if (box.isEmpty()) {
    return { ok: false, error: `The file "${file.name}" has no geometry.` }
  }
  const largest = Math.max(...box.getSize(new Vector3()).toArray())
  const dimensionsMm = dimensionsFromBox(box)
  const realHeightMm = fittedHeightMm(dimensionsMm)
  const model: CeramicModel = {
    id: `imported-${++importCount}`,
    name: modelNameFromFile(file.name),
    source: { kind: 'glb', url: URL.createObjectURL(file) },
    dimensionsMm,
    // Factors that keep the file's own look (see applyMaterial).
    defaultMaterial: {
      color: '#ffffff',
      roughness: 1,
      metalness: 1,
      clearcoat: 0,
    },
    license: 'File imported by the user',
  }
  const notes: string[] = []
  if (realHeightMm !== undefined) {
    notes.push(
      `In the file the piece measures ${formatLength(largest)}; it is shown at ${formatLength(FIT_SIZE_MM / 1000)}. Change it in Models → Real size.`,
    )
  }
  if (triangles > MAX_TRIANGLES) {
    notes.push(
      `It has ${formatTriangles(triangles)}; the app shows a simplified version with up to ${formatTriangles(MAX_TRIANGLES)} so it runs smoothly on phones.`,
    )
  }
  const warning = notes.length ? notes.join(' ') : undefined
  return { ok: true, model, realHeightMm, warning }
}

/** "98 cm", "1.2 m" or "4 mm", for messages. */
export function formatLength(meters: number): string {
  const format = (value: number, digits: number) =>
    value.toLocaleString('en-US', { maximumFractionDigits: digits })
  if (meters >= 1) return `${format(meters, 1)} m`
  if (meters >= 0.01) return `${format(meters * 100, 0)} cm`
  return `${format(meters * 1000, 0)} mm`
}

/** "1.9 million triangles", "940k triangles", for messages. */
export function formatTriangles(count: number): string {
  if (count >= 1_000_000) {
    const millions = (count / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })
    return `${millions} million triangles`
  }
  if (count >= 1000) return `${Math.round(count / 1000)}k triangles`
  return `${count} triangles`
}
