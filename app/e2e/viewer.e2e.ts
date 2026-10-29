import { expect, test, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

/**
 * A textured GLB (the CC0 Diffuse Transmission Teacup, textures shrunk to
 * 128 px), imported like a user would. Kept with the tests, apart from the
 * models published in public/.
 */
const TEACUP = fileURLToPath(
  new URL('./fixtures/xicara-porcelana.glb', import.meta.url),
)

/** A 10 cm box compressed with Meshopt, like gltfpack and Tripo output. */
const MESHOPT_BOX = fileURLToPath(
  new URL('./fixtures/caixa-meshopt.glb', import.meta.url),
)

/** A 1 m box: AI generators such as Tripo scale pieces to about 1 m. */
const ONE_METER_BOX = fileURLToPath(
  new URL('./fixtures/caixa-1m.glb', import.meta.url),
)

/** The message the Importar button shows after reading a file. */
const importMessage = (page: Page) =>
  page.locator('.config-message[role=status]')

/** Shows one tab of the controls panel. */
const openTab = (page: Page, name: 'Modelos' | 'Material' | 'Configuração') =>
  page.getByRole('tab', { name }).click()

/** Picks `file` with the Importar button's file input. */
const importFile = (page: Page, file: Parameters<Page['setInputFiles']>[1]) =>
  page.locator('input[type=file]').setInputFiles(file)

const panel = (page: Page) => page.locator('.viewer-debug')

/** The number after `label` in the 3D viewer's debug panel. */
async function stat(page: Page, label: string): Promise<number> {
  const text = await panel(page).textContent()
  const match = text?.match(new RegExp(`${label}:? (-?\\d+(?:\\.\\d+)?)`))
  if (!match) throw new Error(`"${label}" not in the debug panel: ${text}`)
  return Number(match[1])
}

/** Waits until the current model is shown. */
const loaded = (page: Page) =>
  expect(page.getByRole('button', { name: 'Reiniciar vista' })).toBeVisible()

/** Calls the WEBGL_lose_context extension on the viewer's canvas. */
function loseContext(page: Page, action: 'loseContext' | 'restoreContext') {
  return page.evaluate((name) => {
    // Keep the extension: once the context is lost, getExtension gives null.
    const store = window as unknown as { loseContextExt?: WEBGL_lose_context }
    if (!store.loseContextExt) {
      const canvas = document.querySelector(
        '.viewer canvas',
      ) as HTMLCanvasElement
      const extension = canvas
        .getContext('webgl2')
        ?.getExtension('WEBGL_lose_context')
      if (!extension) throw new Error('WEBGL_lose_context unavailable')
      store.loseContextExt = extension
    }
    store.loseContextExt[name]()
  }, action)
}

test.beforeEach(async ({ page }) => {
  await page.goto('./?debug=1')
  await loaded(page)
  await expect(panel(page)).toBeVisible()
})

test('stops drawing while nothing changes', async ({ page }) => {
  // Let the first frames settle.
  await expect.poll(() => stat(page, 'quadros/s')).toBe(0)
  const frames = await stat(page, 'desenhados')
  await page.waitForTimeout(1000)
  expect(await stat(page, 'desenhados')).toBe(frames)

  // A material change draws again.
  await openTab(page, 'Material')
  await page.getByRole('button', { name: 'Brilhante' }).click()
  await expect.poll(() => stat(page, 'desenhados')).toBeGreaterThan(frames)
})

test('keeps GPU memory flat when switching models', async ({ page }) => {
  const geometries = await stat(page, 'geometrias')
  const textures = await stat(page, 'texturas')
  // An imported GLB with textures; they must be freed too.
  await importFile(page, TEACUP)
  await loaded(page)
  for (let i = 0; i < 4; i++) {
    for (const name of [/Tigela/, /^xicara-porcelana/, /Prato/, /Vaso/]) {
      await page.getByRole('button', { name }).click()
      await loaded(page)
    }
  }
  await expect.poll(() => stat(page, 'geometrias')).toBe(geometries)
  expect(await stat(page, 'texturas')).toBe(textures)
})

test('imports a .glb model and shows it with its textures', async ({
  page,
}) => {
  const textures = await stat(page, 'texturas')
  await importFile(page, TEACUP)
  await expect(importMessage(page)).toContainText(
    'Modelo "xicara-porcelana" importado.',
  )
  const option = page.getByRole('button', { name: /^xicara-porcelana/ })
  await expect(option).toContainText('⌀ 149 × 70 mm')
  await expect(option).toHaveAttribute('aria-pressed', 'true')
  await loaded(page)
  await expect.poll(() => stat(page, 'geometrias')).toBe(2)
  expect(await stat(page, 'texturas')).toBeGreaterThan(textures)
  await expect(page.getByRole('alert')).toBeHidden()
})

test('removes an imported model with its × button', async ({ page }) => {
  // Catalog models cannot be removed.
  await expect(page.getByRole('button', { name: /^Remover/ })).toHaveCount(0)

  await importFile(page, TEACUP)
  await loaded(page)
  const remove = page.getByRole('button', { name: 'Remover xicara-porcelana' })
  await expect(remove).toBeVisible()
  await remove.click()

  await expect(
    page.getByRole('button', { name: /^xicara-porcelana/ }),
  ).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Vaso/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await loaded(page)
  await expect(page.getByRole('alert')).toBeHidden()

  // It can be imported again.
  await importFile(page, TEACUP)
  await expect(
    page.getByRole('button', { name: /^xicara-porcelana/ }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('imports a Meshopt-compressed .glb (gltfpack, Tripo)', async ({
  page,
}) => {
  await importFile(page, MESHOPT_BOX)
  await expect(importMessage(page)).toContainText(
    'Modelo "caixa-meshopt" importado.',
  )
  await expect(
    page.getByRole('button', { name: /^caixa-meshopt/ }),
  ).toContainText('⌀ 100 × 100 mm')
  await loaded(page)
  await expect(page.getByRole('alert')).toBeHidden()
  await expect.poll(() => stat(page, 'triângulos')).toBe(12)
})

test('sets the real height of an imported piece', async ({ page }) => {
  // Only imported models have a real-size field.
  await expect(page.getByLabel('Altura (cm)')).toHaveCount(0)

  await importFile(page, ONE_METER_BOX)
  await expect(importMessage(page)).toContainText(
    'No arquivo a peça mede 1 m; ajuste a altura real na aba Modelos.',
  )
  const option = page.getByRole('button', { name: /^caixa-1m/ })
  await expect(option).toContainText('⌀ 1000 × 1000 mm')
  await loaded(page)

  const height = page.getByLabel('Altura (cm)')
  await expect(height).toHaveValue('100')
  await height.fill('7')
  await expect(option).toContainText('⌀ 70 × 70 mm')
  await expect(page.getByText('Peça: ⌀ 70 × 70 mm')).toBeVisible()

  // The size stays with the model while others are shown.
  await page.getByRole('button', { name: /Vaso/ }).click()
  await expect(page.getByLabel('Altura (cm)')).toHaveCount(0)
  await option.click()
  await expect(page.getByLabel('Altura (cm)')).toHaveValue('7')

  await page.getByRole('button', { name: 'Usar o tamanho do arquivo' }).click()
  await expect(option).toContainText('⌀ 1000 × 1000 mm')
})

test('explains a .glb that uses Draco compression', async ({ page }) => {
  await openTab(page, 'Configuração')
  const json = JSON.stringify({
    asset: { version: '2.0' },
    extensionsUsed: ['KHR_draco_mesh_compression'],
    extensionsRequired: ['KHR_draco_mesh_compression'],
  }).padEnd(84, ' ')
  const header = Buffer.alloc(20)
  header.write('glTF', 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(20 + json.length, 8)
  header.writeUInt32LE(json.length, 12)
  header.write('JSON', 16)
  await importFile(page, {
    name: 'draco.glb',
    mimeType: 'model/gltf-binary',
    buffer: Buffer.concat([header, Buffer.from(json)]),
  })
  await expect(page.getByRole('alert')).toContainText(
    'usa compressão Draco, que o app ainda não abre',
  )
})

test('rejects a broken .glb and keeps the list', async ({ page }) => {
  const models = await page.locator('.model-option').count()
  await openTab(page, 'Configuração')
  await importFile(page, {
    name: 'quebrado.glb',
    mimeType: 'model/gltf-binary',
    buffer: Buffer.from('glTF\x02\x00\x00\x00 not really a model'),
  })
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível ler o modelo "quebrado.glb".',
  )
  expect(await page.locator('.model-option').count()).toBe(models)
})

test('still imports .json configurations', async ({ page }) => {
  await importFile(page, {
    name: 'prato.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        schema: 'ar-ceramic-designer/config',
        version: 1,
        modelId: 'plate',
        variants: {
          A: { color: '#2a5c8a', roughness: 0.5, metalness: 0, clearcoat: 0 },
        },
      }),
    ),
  })
  await expect(importMessage(page)).toContainText(
    'Configuração "prato.json" aplicada.',
  )
  await expect(page.getByRole('button', { name: /Prato/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('turns, zooms and resets the view with the keyboard', async ({ page }) => {
  const canvas = page.getByLabel(/Peça em 3D/)
  await canvas.focus()
  await expect(canvas).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => stat(page, 'câmera')).toBe(30)
  await page.keyboard.press('ArrowLeft')
  await expect.poll(() => stat(page, 'câmera')).toBe(15)
  await page.keyboard.press('Home')
  await expect.poll(() => stat(page, 'câmera')).toBe(0)
})

test('turns off the camera glide for reduced motion', async ({ page }) => {
  await expect(panel(page)).toContainText('amortecimento: sim')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await loaded(page)
  await expect(panel(page)).toContainText('amortecimento: não')
})

test('recovers when the GPU context is lost', async ({ page }) => {
  await loseContext(page, 'loseContext')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('interrompido pelo sistema')

  await loseContext(page, 'restoreContext')
  await expect(alert).toBeHidden()
  const frames = await stat(page, 'desenhados')
  await page.getByRole('button', { name: 'Reiniciar vista' }).click()
  await expect.poll(() => stat(page, 'desenhados')).toBeGreaterThan(frames)
})

test('rebuilds the viewer on request after a context loss', async ({
  page,
}) => {
  await openTab(page, 'Material')
  await page.getByRole('button', { name: 'Brilhante' }).click()
  await loseContext(page, 'loseContext')
  await page.getByRole('button', { name: 'Recarregar visualizador' }).click()
  await loaded(page)
  await expect(page.getByRole('alert')).toBeHidden()
  // The custom material survives the rebuild.
  await expect(page.getByText('Acabamento')).toBeVisible()
  await expect.poll(() => stat(page, 'desenhados')).toBeGreaterThan(0)
})
