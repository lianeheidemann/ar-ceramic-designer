import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { DimensionsMm } from '../../shared/types'
import { unsupportedFeatures } from '../viewer/gltfLoader'
import { dimensionsFromBox, isGlb } from './importModel'

/** The parts of a glTF JSON that give its size. */
export interface GltfJson {
  scene?: number
  scenes?: { nodes?: number[] }[]
  nodes?: {
    children?: number[]
    mesh?: number
    matrix?: number[]
    translation?: number[]
    rotation?: number[]
    scale?: number[]
  }[]
  meshes?: { primitives: { attributes: { POSITION?: number } }[] }[]
  accessors?: {
    min?: number[]
    max?: number[]
    componentType?: number
    normalized?: boolean
  }[]
}

/** Largest value of each normalized integer type, by glTF component type. */
const NORMALIZED_MAX: Record<number, number> = {
  5120: 127,
  5121: 255,
  5122: 32767,
  5123: 65535,
}

/**
 * Size of a glTF scene from its JSON alone: the `min`/`max` every POSITION
 * accessor carries, through the node transforms. Reading this needs no
 * geometry, so a large file is measured from a few kilobytes.
 */
export function glbBoundsMm(json: GltfJson): DimensionsMm | undefined {
  const box = new Box3()
  const corner = new Vector3()
  const visit = (index: number, parent: Matrix4) => {
    const node = json.nodes?.[index]
    if (!node) return
    const local = node.matrix
      ? new Matrix4().fromArray(node.matrix)
      : new Matrix4().compose(
          new Vector3(...(node.translation ?? [0, 0, 0])),
          new Quaternion(...(node.rotation ?? [0, 0, 0, 1])),
          new Vector3(...(node.scale ?? [1, 1, 1])),
        )
    const world = parent.clone().multiply(local)
    for (const primitive of json.meshes?.[node.mesh ?? -1]?.primitives ?? []) {
      const accessor = json.accessors?.[primitive.attributes.POSITION ?? -1]
      if (!accessor?.min || !accessor.max) continue
      const unit = accessor.normalized
        ? (NORMALIZED_MAX[accessor.componentType ?? 0] ?? 1)
        : 1
      const [min, max] = [accessor.min, accessor.max].map((values) =>
        values.map((value) =>
          Math.max(value / unit, unit > 1 ? -1 : -Infinity),
        ),
      )
      for (let i = 0; i < 8; i++) {
        corner.set(
          i & 1 ? max[0] : min[0],
          i & 2 ? max[1] : min[1],
          i & 4 ? max[2] : min[2],
        )
        box.expandByPoint(corner.applyMatrix4(world))
      }
    }
    for (const child of node.children ?? []) visit(child, world)
  }
  const scene = json.scenes?.[json.scene ?? 0]
  for (const root of scene?.nodes ?? []) visit(root, new Matrix4())
  return box.isEmpty() ? undefined : dimensionsFromBox(box)
}

/** Bytes asked for first: the JSON chunk of a GLB is usually far smaller. */
const FIRST_BYTES = 64 * 1024

/** A GLB's JSON chunk and the whole file's size, from its header. */
export interface GlbHead {
  json: GltfJson
  fileBytes: number
}

/**
 * Reads only the header and JSON chunk of the GLB at `url`: it asks for the
 * first bytes with a Range request and, if the server sends the whole file
 * instead, stops the download once the JSON is in. Throws if it is not a
 * GLB the app can open.
 */
export async function readGlbJson(url: string): Promise<GlbHead> {
  let bytes = await readStart(url, FIRST_BYTES)
  if (bytes.byteLength < 20 || !isGlb(bytes.buffer)) {
    throw new Error('Not a .glb file')
  }
  const header = new DataView(bytes.buffer)
  const fileBytes = header.getUint32(8, true)
  const end = 20 + header.getUint32(12, true)
  if (bytes.byteLength < end) bytes = await readStart(url, end)
  if (bytes.byteLength < end) throw new Error('Incomplete .glb file')
  const unsupported = unsupportedFeatures(bytes.buffer)
  if (unsupported.length) throw new Error(`Uses ${unsupported.join(' and ')}`)
  const json = JSON.parse(
    new TextDecoder().decode(bytes.subarray(20, end)),
  ) as GltfJson
  return { json, fileBytes }
}

/** The first `length` bytes of `url` (fewer if the file is shorter). */
async function readStart(
  url: string,
  length: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(url, {
    headers: { Range: `bytes=0-${length - 1}` },
  })
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  try {
    while (received < length) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.length
    }
  } finally {
    reader.cancel().catch(() => {})
  }
  return concat(chunks, Math.min(received, length))
}

function concat(chunks: Uint8Array[], length: number): Uint8Array<ArrayBuffer> {
  const all = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    if (offset >= length) break
    all.set(chunk.subarray(0, length - offset), offset)
    offset += chunk.length
  }
  return all
}
