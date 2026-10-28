import { expect, test, type Page } from '@playwright/test'
import { installFakeXr, type FakeXrControl } from './fakeXr'

declare global {
  interface Window {
    fakeXr: FakeXrControl
  }
}

/** Changes what the fake AR device "sees". */
function setXr(page: Page, values: Partial<FakeXrControl>) {
  return page.evaluate((v) => Object.assign(window.fakeXr, v), values)
}

const hint = (page: Page) => page.locator('.ar-hint')
const overlay = (page: Page) => page.locator('.ar-overlay')

/** A tap on the camera image, away from the hint and the exit button. */
const tapScreen = (page: Page) =>
  overlay(page).click({ position: { x: 180, y: 300 } })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(installFakeXr)
  await page.goto('./')
})

test('guides from opening AR to placing and moving the piece', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Ver em AR' }).click()
  await setXr(page, { tracking: true })
  await expect(hint(page)).toHaveText(/Procurando uma superfície/)
  await expect(page.locator('.ar-scan')).toBeVisible()

  await setXr(page, { plane: [0, 0, -1] })
  await expect(hint(page)).toHaveText(/Superfície encontrada/)
  await expect(page.locator('.ar-scan')).toBeHidden()

  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Peça posicionada/)

  // Chrome also reports the same tap as an XR select, sometimes much later;
  // it must not count as a second tap.
  await page.evaluate(() => window.fakeXr.select())
  await page.waitForTimeout(300)
  await expect(hint(page)).toHaveText(/Peça posicionada/)

  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Toque para colocar a peça aqui/)
  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Peça posicionada/)
})

test('warns when tapping before a surface is found', async ({ page }) => {
  await page.getByRole('button', { name: 'Ver em AR' }).click()
  await setXr(page, { tracking: true })
  await expect(hint(page)).toHaveText(/Procurando uma superfície/)
  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Nenhuma superfície detectada/)
})

test('leaves AR and gets the 3D viewer back', async ({ page }) => {
  const openAr = page.getByRole('button', { name: 'Ver em AR' })
  await openAr.click()
  await setXr(page, { tracking: true, plane: [0, 0, -1] })
  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Peça posicionada/)

  await page.getByRole('button', { name: 'Sair do AR' }).click()
  await expect(overlay(page)).toBeHidden()
  await expect(openAr).toBeEnabled()

  // A second session starts from scratch.
  await setXr(page, { tracking: false, plane: null })
  await openAr.click()
  await expect(hint(page)).toHaveText(/Procurando uma superfície/)
  expect(await page.evaluate(() => window.fakeXr.sessions)).toBe(2)
})

test('explains a denied camera permission', async ({ page }) => {
  await setXr(page, { failNext: 'NotAllowedError' })
  const openAr = page.getByRole('button', { name: 'Ver em AR' })
  await openAr.click()
  await expect(page.getByRole('alert')).toHaveText(/Permissão negada/)
  await expect(overlay(page)).toBeHidden()
  await expect(openAr).toBeEnabled()
})

/** The number after `label` in the debug panel, e.g. `draw calls: 2`. */
async function debugNumber(page: Page, label: string): Promise<number> {
  const text = await page.locator('.ar-debug').textContent()
  const match = text?.match(new RegExp(`${label}: (\\d+)`))
  if (!match) throw new Error(`"${label}" not in the debug panel: ${text}`)
  return Number(match[1])
}

test('shows diagnostics with ?debug=1', async ({ page }) => {
  await page.goto('./?debug=1')
  await page.getByRole('button', { name: 'Ver em AR' }).click()
  await setXr(page, { tracking: true, viewer: [0, 0.5, 0], plane: [0, 0, -2] })
  const panel = page.locator('.ar-debug')
  await expect(panel).toContainText('superfície: sim')
  await expect(panel).toContainText('anel: 2.06 m do celular, 0.5 m abaixo')
  await expect(panel).toContainText('visível: anel sim · peça não · cubo não')
  await expect(panel).toContainText('erro: —')
  await expect.poll(() => debugNumber(page, 'frames')).toBeGreaterThan(0)
  // Only the ring is drawn before the piece is placed.
  await expect.poll(() => debugNumber(page, 'draw calls')).toBe(1)
})

test('draws a test cube with ?cubo=1', async ({ page }) => {
  await page.goto('./?debug=1&cubo=1')
  await page.getByRole('button', { name: 'Ver em AR' }).click()
  // Ring in view: the fake phone looks straight ahead.
  await setXr(page, { tracking: true, viewer: [0, 0.5, 0], plane: [0, 0, -2] })
  await expect(page.locator('.ar-debug')).toContainText('cubo sim')
  // The ring and the cube.
  await expect.poll(() => debugNumber(page, 'draw calls')).toBe(2)
})
