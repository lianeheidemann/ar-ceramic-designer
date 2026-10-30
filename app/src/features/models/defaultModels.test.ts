import { describe, expect, it } from 'vitest'
import { defaultModelFiles } from './defaultModels'

describe('defaultModelFiles', () => {
  it('names models after their files, in file name order', () => {
    expect(
      defaultModelFiles({
        './defaults/Tall Vase.glb': '/assets/tall.glb',
        './defaults/bowl-2.GLB': '/assets/bowl.glb',
        './defaults/Xícara Azul.glb': '/assets/cup.glb',
      }),
    ).toEqual(
      [
        { id: 'bowl-2', name: 'bowl-2', url: '/assets/bowl.glb' },
        { id: 'tall-vase', name: 'Tall Vase', url: '/assets/tall.glb' },
        { id: 'xicara-azul', name: 'Xícara Azul', url: '/assets/cup.glb' },
      ].map((file) => ({ ...file, thumbnailUrl: undefined })),
    )
  })

  it('pairs each model with an image of the same name', () => {
    const files = defaultModelFiles(
      {
        './defaults/Tall Vase.glb': '/tall.glb',
        './defaults/Bowl.glb': '/b.glb',
      },
      {
        './defaults/tall vase.webp': '/tall.webp',
        './defaults/Other.png': '/o.png',
      },
    )
    expect(files.map(({ thumbnailUrl }) => thumbnailUrl)).toEqual([
      undefined,
      '/tall.webp',
    ])
  })

  it('keeps ids unique and skips other files', () => {
    const files = defaultModelFiles({
      './defaults/Vase.glb': '/a.glb',
      './defaults/vase.GLB': '/b.glb',
      './defaults/notes.txt': '/c.txt',
    })
    expect(files.map(({ id }) => id)).toEqual(['vase', 'vase-2'])
  })
})
