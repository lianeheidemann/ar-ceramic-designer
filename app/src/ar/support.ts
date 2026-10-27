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
      reason: 'A realidade aumentada exige uma conexão segura (HTTPS).',
    }
  }
  if (!env.xr) {
    return {
      kind: 'unavailable',
      reason:
        'Este navegador não suporta WebXR. No Android, use o Chrome atualizado.',
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
      'Este dispositivo ou navegador não oferece realidade aumentada (WebXR). O visualizador 3D continua disponível.',
  }
}

/** User-facing message for a failed attempt to start or run AR. */
export function arErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Permissão negada. Autorize o uso da câmera para usar a realidade aumentada.'
    case 'NotSupportedError':
      return 'Este dispositivo não oferece os recursos de AR necessários (detecção de superfícies).'
    default:
      return 'Não foi possível iniciar a realidade aumentada.'
  }
}
