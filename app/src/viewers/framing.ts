/** Extra room around the object when framing it. */
export const FRAMING_MARGIN = 1.25

/**
 * Camera distance at which a bounding sphere of `radius` fits the view,
 * both vertically and horizontally (narrow phone screens are limited by
 * the horizontal field of view).
 */
export function fitDistance(
  radius: number,
  verticalFovDeg: number,
  aspect: number,
): number {
  const halfVertical = (verticalFovDeg * Math.PI) / 360
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect)
  const halfFov = Math.min(halfVertical, halfHorizontal)
  return (radius / Math.sin(halfFov)) * FRAMING_MARGIN
}

/** Camera position around a target, in spherical coordinates. */
export interface Orbit {
  /** Distance from the target. */
  radius: number
  /** Angle from straight up, in radians (0 = above, π/2 = level). */
  polar: number
  /** Angle around the vertical axis, in radians. */
  azimuth: number
}

export interface OrbitLimits {
  minDistance: number
  maxDistance: number
  minPolar: number
  maxPolar: number
}

/**
 * Turns the camera around its target (keyboard control): `dAzimuth`
 * around the vertical axis, `dPolar` up or down, and scales the distance
 * by `zoom`. The result stays within `limits`.
 */
export function stepOrbit(
  orbit: Orbit,
  { dAzimuth = 0, dPolar = 0, zoom = 1 },
  limits: OrbitLimits,
): Orbit {
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))
  return {
    radius: clamp(orbit.radius * zoom, limits.minDistance, limits.maxDistance),
    polar: clamp(orbit.polar + dPolar, limits.minPolar, limits.maxPolar),
    azimuth: orbit.azimuth + dAzimuth,
  }
}
