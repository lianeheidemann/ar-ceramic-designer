import { LatheGeometry, SplineCurve, Vector2, type BufferGeometry } from 'three'
import type {
  CeramicModel,
  ModelSource,
  ProfilePointMm,
} from '../types/ceramic'
import { mmToM } from '../utils/units'

type LatheSource = Extract<ModelSource, { kind: 'lathe' }>

/** Limits the miter at sharp corners to this multiple of the wall. */
const MAX_MITER = 3

/** Points sampled per profile segment when smoothing. */
const SAMPLES_PER_SEGMENT = 8

/**
 * Smooths an outer profile with a Catmull-Rom curve through its points so
 * the wall looks wheel-thrown instead of faceted. The flat base (first
 * segment, from the axis outwards) is kept straight.
 */
export function smoothProfileMm(
  profileMm: readonly ProfilePointMm[],
): ProfilePointMm[] {
  if (profileMm.length < 3) return [...profileMm]
  const wall = profileMm.slice(1).map(([r, h]) => new Vector2(r, h))
  const curve = new SplineCurve(wall)
  const sampled = curve
    .getPoints((wall.length - 1) * SAMPLES_PER_SEGMENT)
    .map(({ x, y }) => [x, y] as const)
  return [profileMm[0], ...sampled]
}

/**
 * Turns an outer profile (bottom center → rim) into a closed solid profile:
 * the outer surface followed by the inner surface, offset inwards by the
 * wall thickness, back down to the axis.
 */
export function solidProfileMm(
  profileMm: readonly ProfilePointMm[],
  wallMm: number,
): ProfilePointMm[] {
  const points = profileMm.map(([r, h]) => new Vector2(r, h))

  // Inward normal of each segment: the tangent rotated by +90°.
  const segmentNormals = points.slice(1).map((point, i) => {
    const tangent = point.clone().sub(points[i]).normalize()
    return new Vector2(-tangent.y, tangent.x)
  })

  const inner = points.map((point, i) => {
    const before = segmentNormals[Math.max(i - 1, 0)]
    const after = segmentNormals[Math.min(i, segmentNormals.length - 1)]
    const miter = before.clone().add(after).normalize()
    const length = Math.min(wallMm / miter.dot(after), wallMm * MAX_MITER)
    return point.clone().addScaledVector(miter, length)
  })

  // The offset wall can rise above the rim; cut it where it crosses the
  // rim height so the rim ends flat.
  const rimHeight = points[points.length - 1].y
  const crossing = inner.findIndex((point) => point.y > rimHeight)
  if (crossing > 0) {
    const below = inner[crossing - 1]
    const above = inner[crossing]
    const t = (rimHeight - below.y) / (above.y - below.y)
    inner.splice(crossing, Infinity, below.clone().lerp(above, t))
  }

  const innerProfile = inner.map(({ x, y }) => [Math.max(x, 0), y] as const)
  return [...profileMm, ...innerProfile.reverse()]
}

/**
 * Revolves a lathe source around the vertical (Y) axis. Units are meters,
 * with the origin at the center of the base so the object rests on y = 0.
 */
export function createLatheGeometry(
  source: LatheSource,
  segments = 64,
): BufferGeometry {
  const outer = smoothProfileMm(source.profileMm)
  const profile = solidProfileMm(outer, source.wallMm).map(
    ([r, h]) => new Vector2(mmToM(r), mmToM(h)),
  )
  return new LatheGeometry(profile, segments)
}

export function createModelGeometry(model: CeramicModel): BufferGeometry {
  switch (model.source.kind) {
    case 'lathe':
      return createLatheGeometry(model.source)
    case 'glb':
      throw new Error(
        `O modelo "${model.id}" é um GLB e deve ser carregado pelo visualizador.`,
      )
  }
}
