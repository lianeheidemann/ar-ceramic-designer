import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await expect(
    page.getByRole('button', { name: 'Reiniciar vista' }),
  ).toBeVisible()
})

test('starts on Modelos and shows one panel at a time', async ({ page }) => {
  const tabs = page.getByRole('tablist', { name: 'Controles' })
  await expect(tabs.getByRole('tab')).toHaveText([
    'Modelos',
    'Material',
    'Configuração',
  ])
  await expect(page.getByRole('tab', { name: 'Modelos' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('button', { name: /Vaso/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Brilhante' })).toBeHidden()

  await page.getByRole('tab', { name: 'Material' }).click()
  await expect(page.getByRole('button', { name: 'Brilhante' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Comparar A/B' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Vaso/ })).toBeHidden()

  await page.getByRole('tab', { name: 'Configuração' }).click()
  await expect(
    page.getByRole('button', { name: 'Exportar (.json)' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Importar' })).toBeVisible()
})

test('moves between tabs with the arrow keys', async ({ page }) => {
  const models = page.getByRole('tab', { name: 'Modelos' })
  await models.focus()
  await page.keyboard.press('ArrowRight')
  const material = page.getByRole('tab', { name: 'Material' })
  await expect(material).toBeFocused()
  await expect(material).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('End')
  await expect(page.getByRole('tab', { name: 'Configuração' })).toBeFocused()
  // Wraps around.
  await page.keyboard.press('ArrowRight')
  await expect(models).toBeFocused()
  await expect(models).toHaveAttribute('aria-selected', 'true')
})

test('keeps a panel state while another tab is open', async ({ page }) => {
  await page.getByRole('tab', { name: 'Material' }).click()
  await page.getByRole('button', { name: 'Brilhante' }).click()
  await page.getByRole('tab', { name: 'Modelos' }).click()
  await page.getByRole('tab', { name: 'Material' }).click()
  await expect(page.getByRole('button', { name: 'Brilhante' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
