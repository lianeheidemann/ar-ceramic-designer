import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Reset view' })).toBeVisible()
})

test('starts on Models and shows one panel at a time', async ({ page }) => {
  const tabs = page.getByRole('tablist', { name: 'Controls' })
  await expect(tabs.getByRole('tab')).toHaveText([
    'Models',
    'Material',
    'Settings',
  ])
  await expect(page.getByRole('tab', { name: 'Models' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('button', { name: /Vase/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Glossy' })).toBeHidden()

  await page.getByRole('tab', { name: 'Material' }).click()
  await expect(page.getByRole('button', { name: 'Glossy' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Compare A/B' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Vase/ })).toBeHidden()

  await page.getByRole('tab', { name: 'Settings' }).click()
  await expect(
    page.getByRole('button', { name: 'Export (.json)' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Import' })).toBeVisible()
})

test('moves between tabs with the arrow keys', async ({ page }) => {
  const models = page.getByRole('tab', { name: 'Models' })
  await models.focus()
  await page.keyboard.press('ArrowRight')
  const material = page.getByRole('tab', { name: 'Material' })
  await expect(material).toBeFocused()
  await expect(material).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('End')
  await expect(page.getByRole('tab', { name: 'Settings' })).toBeFocused()
  // Wraps around.
  await page.keyboard.press('ArrowRight')
  await expect(models).toBeFocused()
  await expect(models).toHaveAttribute('aria-selected', 'true')
})

test('keeps a panel state while another tab is open', async ({ page }) => {
  await page.getByRole('tab', { name: 'Material' }).click()
  await page.getByRole('button', { name: 'Glossy' }).click()
  await page.getByRole('tab', { name: 'Models' }).click()
  await page.getByRole('tab', { name: 'Material' }).click()
  await expect(page.getByRole('button', { name: 'Glossy' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
