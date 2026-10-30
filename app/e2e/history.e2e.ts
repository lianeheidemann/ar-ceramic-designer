import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Reset view' })).toBeVisible()
})

test('undoes and redoes finish and size edits', async ({ page }) => {
  const undo = page.getByRole('button', { name: 'Undo' })
  const redo = page.getByRole('button', { name: 'Redo' })
  await expect(undo).toBeDisabled()
  await expect(redo).toBeDisabled()

  const height = page.getByLabel('Height (cm)')
  await height.fill('30')
  await page.getByRole('tab', { name: 'Material' }).click()
  await page.getByRole('button', { name: 'Glossy', exact: true }).click()
  const glossy = page.getByRole('button', { name: 'Glossy', exact: true })
  await expect(glossy).toHaveAttribute('aria-pressed', 'true')

  await undo.click()
  await expect(glossy).toHaveAttribute('aria-pressed', 'false')
  await expect(redo).toBeEnabled()
  await undo.click()
  await page.getByRole('tab', { name: 'Models' }).click()
  await expect(height).toHaveValue('20')
  await expect(undo).toBeDisabled()

  await redo.click()
  await expect(height).toHaveValue('30')
  await redo.click()
  await page.getByRole('tab', { name: 'Material' }).click()
  await expect(glossy).toHaveAttribute('aria-pressed', 'true')
  await expect(redo).toBeDisabled()
})

test('counts a quick run of steps as one, and takes Ctrl+Z', async ({
  page,
}) => {
  const taller = page.getByRole('button', { name: '1 cm taller' })
  await taller.click()
  await taller.click()
  await taller.click()
  await expect(page.getByLabel('Height (cm)')).toHaveValue('23')
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Control+z')
  await expect(page.getByLabel('Height (cm)')).toHaveValue('20')
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled()
  await page.keyboard.press('Control+Shift+z')
  await expect(page.getByLabel('Height (cm)')).toHaveValue('23')
})

test('goes back to the edited piece when undoing', async ({ page }) => {
  await page.getByLabel('Height (cm)').fill('25')
  await page.getByRole('button', { name: /Bowl/ }).click()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('button', { name: /Vase/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByLabel('Height (cm)')).toHaveValue('20')
})
