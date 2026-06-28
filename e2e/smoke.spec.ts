import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
    // Suppress mapboxgl errors — no API token in test environment
    page.on('console', msg => {
        if (msg.text().toLowerCase().includes('mapbox')) return
        if (msg.type() === 'error' && msg.text().toLowerCase().includes('token')) return
    })
    // Suppress uncaught mapbox exceptions so they don't surface as pageerror failures
    page.on('pageerror', err => {
        if (err.message.toLowerCase().includes('mapbox') || err.message.toLowerCase().includes('access token')) return
        throw err
    })
})

test('home loads with nav menu', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav#menu')).toBeVisible()
    await expect(page.locator('nav#menu a', { hasText: 'Suche' })).toBeVisible()
})

test('search returns results for "somborn"', async ({ page }) => {
    await page.goto('/search/lage/somborn')
    // Wait for at least one result — data loads async after mount + 200ms debounce
    const firstResult = page.locator('#searchresult li').first()
    await expect(firstResult).toBeVisible({ timeout: 15000 })
    await expect(page.locator('#searchresult')).toContainText('Somborn')
})

test('parzelle view renders eigentuemer and location', async ({ page }) => {
    await page.goto('/parzelle/somborn/1/1')
    // Wait for content panel to mount, then for async data to replace the loading spinner
    await expect(page.locator('#contentview')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#contentview')).toContainText('Parzelle Nr. 1', { timeout: 15000 })
    // "Marre, Johan Röttg. zu Sonborn" is the eigentuemer in parzellen_somborn_1.json;
    // only renders inside v-if="parzelle?.artikelNr", so this confirms parzelle data loaded
    await expect(page.locator('#contentview')).toContainText('Marre')
})

test('quellen view renders static content', async ({ page }) => {
    await page.goto('/quellen')
    await expect(page.locator('#contentview')).toBeVisible()
    await expect(page.locator('#contentview')).toContainText('Dargestellte Informationen')
})

test('haeuserbuch view renders building entry', async ({ page }) => {
    // Building id "Adolfstraße_1_229b XI" from public/haeuserbuch_dortmund.json
    await page.goto('/haeuserbuch/dortmund/Adolfstra%C3%9Fe_1_229b%20XI')
    await expect(page.locator('#contentview')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#contentview')).toContainText('Eintrag im Häuserbuch', { timeout: 15000 })
    // "Wilhelm Schürmann" is the owner in the fixture — confirms building data loaded
    await expect(page.locator('#contentview')).toContainText('Wilhelm')
})

test('mutterrolle view renders name and table row', async ({ page }) => {
    await page.goto('/mutterrolle/somborn/1')
    // Wait for content panel to mount, then for async data to replace the loading spinner
    await expect(page.locator('#contentview')).toBeVisible({ timeout: 10000 })
    // "Blömer zu Lütgendortmund" is mutterrolle name; "in der Voede" is first row lage
    await expect(page.locator('#contentview')).toContainText('Blömer zu Lütgendortmund', { timeout: 15000 })
    await expect(page.locator('#contentview')).toContainText('in der Voede')
})
