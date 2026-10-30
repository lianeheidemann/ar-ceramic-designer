import type { CeramicModel } from '../../shared/types'
import { glbBoundsMm, readGlbJson } from './glbBounds'
import { FILE_MATERIAL, fittedHeightMm, modelNameFromFile } from './importModel'

/** A .glb found in `defaults/`, before it is measured. */
export interface DefaultModelFile {
  id: string
  name: string
  url: string
  /** An image with the same name, e.g. `Red Panther.webp`. */
  thumbnailUrl?: string
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
const useFolder = import.meta.env.VITE_MODELS !== 'generated'
const bundledFiles: Record<string, string> = useFolder
  ? import.meta.glob('./defaults/*.{glb,GLB}', {
      query: '?url',
      import: 'default',
      eager: true,
    })
  : {}
/** Thumbnails for the default models, matched by file name. */
const bundledImages: Record<string, string> = useFolder
  ? import.meta.glob('./defaults/*.{webp,png,jpg,jpeg}', {
      query: '?url',
      import: 'default',
      eager: true,
    })
  : {}

/**
 * Default model entries from file paths and URLs, in file name order. The
 * id comes from the file name, so saved settings keep pointing to it.
 */
export function defaultModelFiles(
  files: Record<string, string>,
  images: Record<string, string> = {},
): DefaultModelFile[] {
  const used = new Set<string>()
  const imageByName = new Map(
    Object.entries(images).map(([path, url]) => [
      path.replace(/\.[^./]+$/, '').toLowerCase(),
      url,
    ]),
  )
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
      const thumbnailUrl = imageByName.get(
        path.replace(/\.glb$/i, '').toLowerCase(),
      )
      return { id, name, url, thumbnailUrl }
    })
}

/** The default .glb files bundled with the app (empty: use the catalog). */
export const defaultFiles = defaultModelFiles(bundledFiles, bundledImages)

/**
 * Measures the default models from their JSON chunk only (a few KB each;
 * the viewer downloads the whole file when it is shown). A file that cannot
 * be used is left out with a console warning.
 */
export async function loadDefaultModels(
  files: readonly DefaultModelFile[] = defaultFiles,
): Promise<DefaultModel[]> {
  const loaded = await Promise.all(
    files.map(
      async ({ id, name, url, thumbnailUrl }): Promise<DefaultModel | null> => {
        try {
          const { json, fileBytes } = await readGlbJson(url)
          const dimensionsMm = glbBoundsMm(json)
          if (!dimensionsMm) throw new Error('No geometry')
          return {
            model: {
              id,
              name,
              source: { kind: 'glb', url },
              dimensionsMm,
              defaultMaterial: { ...FILE_MATERIAL },
              license: 'Default model',
              fileBytes,
              thumbnailUrl,
            },
            realHeightMm: fittedHeightMm(dimensionsMm),
          }
        } catch (error) {
          console.warn(`Default model "${name}" left out:`, error)
          return null
        }
      },
    ),
  )
  return loaded.filter((entry) => entry !== null)
}
