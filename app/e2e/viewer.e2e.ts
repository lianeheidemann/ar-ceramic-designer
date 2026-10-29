import { expect, test, type Page } from '@playwright/test'

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
  await page.getByRole('button', { name: 'Brilhante' }).click()
  await expect.poll(() => stat(page, 'desenhados')).toBeGreaterThan(frames)
})

test('keeps GPU memory flat when switching models', async ({ page }) => {
  const geometries = await stat(page, 'geometrias')
  const textures = await stat(page, 'texturas')
  for (let i = 0; i < 4; i++) {
    // The teacup is a GLB with textures; they must be freed too.
    for (const name of [/Tigela/, /Xícara/, /Prato/, /Vaso/]) {
      await page.getByRole('button', { name }).click()
      await loaded(page)
    }
  }
  await expect.poll(() => stat(page, 'geometrias')).toBe(geometries)
  expect(await stat(page, 'texturas')).toBe(textures)
})

test('loads the teacup GLB with its textures', async ({ page }) => {
  const textures = await stat(page, 'texturas')
  await page.getByRole('button', { name: /Xícara/ }).click()
  await loaded(page)
  await expect.poll(() => stat(page, 'geometrias')).toBe(2)
  expect(await stat(page, 'texturas')).toBeGreaterThan(textures)
  await expect(page.getByRole('alert')).toBeHidden()
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
  await page.getByRole('button', { name: 'Brilhante' }).click()
  await loseContext(page, 'loseContext')
  await page.getByRole('button', { name: 'Recarregar visualizador' }).click()
  await loaded(page)
  await expect(page.getByRole('alert')).toBeHidden()
  // The custom material survives the rebuild.
  await expect(page.getByText('Acabamento')).toBeVisible()
  await expect.poll(() => stat(page, 'desenhados')).toBeGreaterThan(0)
})
