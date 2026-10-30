import type { CeramicModel } from '../../shared/types'
import { FILE_MATERIAL, measureGlb, modelNameFromFile } from './importModel'

/** A .glb found in `defaults/`, before it is measured. */
export interface DefaultModelFile {
  id: string
  name: string
  url: string
}

/** A measured default model and the height it starts at, if fitted. */
export interface DefaultModel {
  model: CeramicModel
  realHeightMm?: number
}

/**
 * The .glb files in `defaults/`, found at build time: Vite copies each one
 * to the build and gives its URL. `VITE_MODELS=generated` ignores them (the
 * end-to-end tests run on the generated models).
 */
const bundledFiles: Record<string, string> =
  import.meta.env.VITE_MODELS === 'generated'
    ? {}
    : import.meta.glob('./defaults/*.{glb,GLB}', {
        query: '?url',
        import: 'default',
        eager: true,
      })

/**
 * Default model entries from file paths and URLs, in file name order. The
 * id comes from the file name, so saved settings keep pointing to it.
 */
export function defaultModelFiles(
  files: Record<string, string>,
): DefaultModelFile[] {
  const used = new Set<string>()
  return Object.entries(files)
    .filter(([path]) => /\.glb$/i.test(path))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, url]) => {
      const name = modelNameFromFile(path)
      const slug =
        name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'model'
      let id = slug
      for (let n = 2; used.has(id); n++) id = `${slug}-${n}`
      used.add(id)
      return { id, name, url }
    })
}

/** The default .glb files bundled with the app (empty: use the catalog). */
export const defaultFiles = defaultModelFiles(bundledFiles)

/**
 * Fetches and measures the default models. A file that cannot be used is
 * left out with a console warning.
 */
export async function loadDefaultModels(
  files: readonly DefaultModelFile[] = defaultFiles,
): Promise<DefaultModel[]> {
  const loaded = await Promise.all(
    files.map(async ({ id, name, url }): Promise<DefaultModel | null> => {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const measure = await measureGlb(await response.arrayBuffer(), name)
        if (!measure.ok) throw new Error(measure.error)
        return {
          model: {
            id,
            name,
            source: { kind: 'glb', url },
            dimensionsMm: measure.dimensionsMm,
            defaultMaterial: { ...FILE_MATERIAL },
            license: 'Default model',
          },
          realHeightMm: measure.realHeightMm,
        }
      } catch (error) {
        console.warn(`Default model "${name}" left out:`, error)
        return null
      }
    }),
  )
  return loaded.filter((entry) => entry !== null)
}
