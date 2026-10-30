export type ArSupport =
  | { kind: 'checking' }
  | { kind: 'supported' }
  | { kind: 'unavailable'; reason: string }

interface ArEnvironment {
  isSecureContext: boolean
  xr?: Pick<XRSystem, 'isSessionSupported'>
}

/** Whether this browser can start an immersive AR session, and if not, why. */
export async function checkArSupport(
  env: ArEnvironment = {
    isSecureContext: window.isSecureContext,
    xr: navigator.xr,
  },
): Promise<ArSupport> {
  if (!env.isSecureContext) {
    return {
      kind: 'unavailable',
      reason: 'Augmented reality needs a secure connection (HTTPS).',
    }
  }
  if (!env.xr) {
    return {
      kind: 'unavailable',
      reason:
        'This browser does not support WebXR. On Android, use an up-to-date Chrome.',
    }
  }
  try {
    if (await env.xr.isSessionSupported('immersive-ar')) {
      return { kind: 'supported' }
    }
  } catch {
    // Treated as unsupported below.
  }
  return {
    kind: 'unavailable',
    reason:
      'This device or browser does not offer augmented reality (WebXR). The 3D viewer is still available.',
  }
}

/** User-facing message for a failed attempt to start or run AR. */
export function arErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Permission denied. Allow camera access to use augmented reality.'
    case 'NotSupportedError':
      return 'This device lacks the AR features needed (surface detection).'
    default:
      return 'Could not start augmented reality.'
  }
}
