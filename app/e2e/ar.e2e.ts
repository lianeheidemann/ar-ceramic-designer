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
  await page.getByRole('button', { name: 'View in AR' }).click()
  await setXr(page, { tracking: true })
  await expect(hint(page)).toHaveText(/Looking for a surface/)
  await expect(page.locator('.ar-scan')).toBeVisible()

  await setXr(page, { plane: [0, 0, -1] })
  await expect(hint(page)).toHaveText(/Surface found/)
  await expect(page.locator('.ar-scan')).toBeHidden()

  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Piece placed/)

  // Chrome also reports the same tap as an XR select, sometimes much later;
  // it must not count as a second tap.
  await page.evaluate(() => window.fakeXr.select())
  await page.waitForTimeout(300)
  await expect(hint(page)).toHaveText(/Piece placed/)

  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Tap to place the piece here/)
  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Piece placed/)
})

test('changes the piece size with − and + without moving it', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'View in AR' }).click()
  await setXr(page, { tracking: true, plane: [0, 0, -1] })
  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Piece placed/)

  const size = page.locator('.ar-size [role=status]')
  await expect(size).toHaveText('20 cm')
  await page.getByRole('button', { name: 'Larger' }).click()
  await expect(size).toHaveText('21 cm')
  // The tap stays on the button: the piece is not picked up to move.
  await expect(hint(page)).toHaveText(/Piece placed/)

  await page.getByRole('button', { name: 'Smaller' }).click()
  await page.getByRole('button', { name: 'Smaller' }).click()
  await expect(size).toHaveText('19 cm')
  await expect(hint(page)).toHaveText(/Piece placed/)

  // The new size stays after AR.
  await page.getByRole('button', { name: 'Exit AR' }).click()
  await expect(page.getByRole('button', { name: /Vase/ })).toContainText(
    '× 190 mm',
  )
})

test('turns the piece with ‹ and › without moving it', async ({ page }) => {
  await page.goto('./?debug=1')
  await page.getByRole('button', { name: 'View in AR' }).click()
  await setXr(page, { tracking: true, plane: [0, 0, -1] })
  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Piece placed/)

  const panel = page.locator('.ar-debug')
  await expect(panel).toContainText('turn: 0°')
  await page.getByRole('button', { name: 'Turn right' }).click()
  await page.getByRole('button', { name: 'Turn right' }).click()
  await expect(panel).toContainText('turn: 30°')
  await page.getByRole('button', { name: 'Turn left' }).click()
  await expect(panel).toContainText('turn: 15°')
  // The taps stay on the buttons: the piece is not picked up to move.
  await expect(hint(page)).toHaveText(/Piece placed/)

  // The 3D viewer gets the piece back as it was.
  await page.getByRole('button', { name: 'Exit AR' }).click()
  await page.getByRole('button', { name: 'View in AR' }).click()
  await expect(panel).toContainText('turn: 0°')
})

test('warns when tapping before a surface is found', async ({ page }) => {
  await page.getByRole('button', { name: 'View in AR' }).click()
  await setXr(page, { tracking: true })
  await expect(hint(page)).toHaveText(/Looking for a surface/)
  await tapScreen(page)
  await expect(hint(page)).toHaveText(/No surface detected/)
})

test('leaves AR and gets the 3D viewer back', async ({ page }) => {
  const openAr = page.getByRole('button', { name: 'View in AR' })
  await openAr.click()
  await setXr(page, { tracking: true, plane: [0, 0, -1] })
  await tapScreen(page)
  await expect(hint(page)).toHaveText(/Piece placed/)

  await page.getByRole('button', { name: 'Exit AR' }).click()
  await expect(overlay(page)).toBeHidden()
  await expect(openAr).toBeEnabled()

  // A second session starts from scratch.
  await setXr(page, { tracking: false, plane: null })
  await openAr.click()
  await expect(hint(page)).toHaveText(/Looking for a surface/)
  expect(await page.evaluate(() => window.fakeXr.sessions)).toBe(2)
})

test('explains a denied camera permission', async ({ page }) => {
  await setXr(page, { failNext: 'NotAllowedError' })
  const openAr = page.getByRole('button', { name: 'View in AR' })
  await openAr.click()
  await expect(page.getByRole('alert')).toHaveText(/Permission denied/)
  await expect(overlay(page)).toBeHidden()
  await expect(openAr).toBeEnabled()
})

/** The number after `label` in the debug panel, e.g. `draw calls: 2`. */
async function debugNumber(page: Page, label: string): Promise<number> {
  const text = await page.locator('.ar-debug').textContent()
  const match = text?.match(new RegExp(`${label}:? (\\d+)`))
  if (!match) throw new Error(`"${label}" not in the debug panel: ${text}`)
  return Number(match[1])
}

test('shows diagnostics with ?debug=1', async ({ page }) => {
  await page.goto('./?debug=1')
  await page.getByRole('button', { name: 'View in AR' }).click()
  await setXr(page, { tracking: true, viewer: [0, 0.5, 0], plane: [0, 0, -2] })
  const panel = page.locator('.ar-debug')
  await expect(panel).toContainText('surface: yes')
  await expect(panel).toContainText('ring: 2.06 m from the phone, 0.5 m below')
  await expect(panel).toContainText('visible: ring yes · piece no · cube no')
  await expect(panel).toContainText('error: —')
  await expect.poll(() => debugNumber(page, 'drawn')).toBeGreaterThan(0)
  // Only the ring is drawn before the piece is placed.
  await expect.poll(() => debugNumber(page, 'draw calls')).toBe(1)
})

test('draws a test cube with ?cube=1', async ({ page }) => {
  await page.goto('./?debug=1&cube=1')
  await page.getByRole('button', { name: 'View in AR' }).click()
  // Ring in view: the fake phone looks straight ahead.
  await setXr(page, { tracking: true, viewer: [0, 0.5, 0], plane: [0, 0, -2] })
  await expect(page.locator('.ar-debug')).toContainText('cube yes')
  // The ring and the cube.
  await expect.poll(() => debugNumber(page, 'draw calls')).toBe(2)
})

test.describe('with WebXR Layers that fail to draw', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(installFakeXr, { brokenLayers: true })
  })

  test('?layer=projection reproduces the frame loop never running', async ({
    page,
  }) => {
    await page.goto('./?debug=1&cube=1&layer=projection')
    await page.getByRole('button', { name: 'View in AR' }).click()
    await setXr(page, {
      tracking: true,
      viewer: [0, 0.5, 0],
      plane: [0, 0, -2],
    })
    const panel = page.locator('.ar-debug')
    await expect(panel).toContainText('layer: projection')
    await expect(panel).toContainText('getViewSubImage failed (fake)')
    // The app's frames run only until tracking starts (no pose, no layer
    // drawing); after that the session keeps going without them.
    const app = await debugNumber(page, 'app')
    const session = await debugNumber(page, 'session')
    await page.waitForTimeout(500)
    expect(await debugNumber(page, 'app')).toBe(app)
    expect(await debugNumber(page, 'session')).toBeGreaterThan(session)
    // The same symptom as on the phone: no surface, nothing drawn.
    await expect(hint(page)).toHaveText(/Looking for a surface/)
  })

  test('draws the ring and the cube into a classic XRWebGLLayer', async ({
    page,
  }) => {
    await page.goto('./?debug=1&cube=1')
    await page.getByRole('button', { name: 'View in AR' }).click()
    await setXr(page, {
      tracking: true,
      viewer: [0, 0.5, 0],
      plane: [0, 0, -2],
    })
    const panel = page.locator('.ar-debug')
    await expect(panel).toContainText('layer: webgl')
    await expect(hint(page)).toHaveText(/Surface found/)
    // The ring and the cube.
    await expect.poll(() => debugNumber(page, 'draw calls')).toBe(2)
    await expect(panel).toContainText('uncaught error: —')
  })
})
