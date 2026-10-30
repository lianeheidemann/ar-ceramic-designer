/**
 * Three.js renders into a WebXR Layers projection layer whenever the
 * browser offers `XRWebGLBinding.createProjectionLayer`. Hiding that method
 * while the session starts makes it use a classic XRWebGLLayer. Returns the
 * function that puts the method back.
 */
export function hideProjectionLayers(): () => void {
  const binding = (globalThis as { XRWebGLBinding?: { prototype: object } })
    .XRWebGLBinding
  const proto = binding?.prototype
  const descriptor =
    proto && Object.getOwnPropertyDescriptor(proto, 'createProjectionLayer')
  if (!proto || !descriptor?.configurable) return () => {}
  delete (proto as { createProjectionLayer?: unknown }).createProjectionLayer
  return () => Object.defineProperty(proto, 'createProjectionLayer', descriptor)
}
