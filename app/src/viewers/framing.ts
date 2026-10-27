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
