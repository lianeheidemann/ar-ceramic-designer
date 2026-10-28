/**
 * File name for a download, e.g. `ceramica-vase-a-2026-10-28.png`.
 * Only ever names new files; exported assets never overwrite the originals.
 */
export function downloadName(parts: string[], extension: string): string {
  const date = new Date().toISOString().slice(0, 10)
  const slug = ['ceramica', ...parts, date]
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  return `${slug}.${extension}`
}

/** Saves `blob` on the user's device under `filename`. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  // Revoke later: some browsers read the URL after `click()` returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
