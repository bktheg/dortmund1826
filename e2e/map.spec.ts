import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
        if (msg.text().toLowerCase().includes('mapbox')) return
        if (msg.type() === 'error' && msg.text().toLowerCase().includes('token')) return
    })
    page.on('pageerror', err => {
        if (err.message.toLowerCase().includes('mapbox') || err.message.toLowerCase().includes('access token')) return
        throw err
    })
})

test('map container and layer nav are present', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#map')).toBeAttached()
    await expect(page.locator('nav#layer')).toBeVisible()
})

test('layer checkboxes are checked by default', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#layer1826')).toBeChecked()
    await expect(page.locator('#layer1826grenzen')).toBeChecked()
    await expect(page.locator('#layerHeute')).toBeChecked()
})

test('dynamic layer names are rendered in layer nav', async ({ page }) => {
    await page.goto('/')
    // Dynamic layers are added in mounted() before mapboxgl.Map(); v-for renders them
    await expect(page.locator('nav#layer')).toContainText('1826', { timeout: 10000 })
    await expect(page.locator('nav#layer')).toContainText('Uraufnahme')
    await expect(page.locator('nav#layer')).toContainText('Neuaufnahme')
    await expect(page.locator('nav#layer')).toContainText('Heute')
})

test('clicking the 1826 checkbox toggles it off', async ({ page }) => {
    await page.goto('/')
    const checkbox = page.locator('#layer1826')
    await expect(checkbox).toBeChecked()
    await checkbox.click()
    await expect(checkbox).not.toBeChecked()
})

test('clicking the Heute checkbox toggles it off', async ({ page }) => {
    await page.goto('/')
    const checkbox = page.locator('#layerHeute')
    await expect(checkbox).toBeChecked()
    await checkbox.click()
    await expect(checkbox).not.toBeChecked()
})

test('nav shows Schließen link on non-home routes', async ({ page }) => {
    await page.goto('/quellen')
    await expect(page.locator('nav#menu')).toContainText('Schließen')
    await expect(page.locator('nav#menu a', { hasText: 'Suche' })).not.toBeAttached()
})
