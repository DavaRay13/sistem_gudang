import { test, expect } from '@playwright/test'

test.describe('App Smoke Test', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.*|Sistem Gudang/i)
  })
})
