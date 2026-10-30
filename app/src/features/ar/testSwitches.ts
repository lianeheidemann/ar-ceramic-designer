/**
 * Switches for testing AR on a phone: `?debug=1` shows what the session
 * sees and draws; `?cube=1` adds a test cube in front of the phone;
 * `?layer=projection` lets Three.js render into a WebXR Layers projection
 * layer (shows nothing on the S23 Ultra; to reproduce that only).
 */
const params = new URLSearchParams(window.location.search)
export const AR_DEBUG = params.has('debug')
export const AR_TEST_CUBE = params.get('cube') === '1'
export const AR_PROJECTION_LAYER = params.get('layer') === 'projection'
