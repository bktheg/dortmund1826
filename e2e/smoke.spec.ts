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

test('somborn parzelle surfaces unknown Mutterrolle and Häuserbuch absence', async ({ page }) => {
    await page.goto('/parzelle/somborn/1/1')
    await expect(page.locator('#contentview')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#contentview')).toContainText('Parzelle Nr. 1', { timeout: 15000 })
    // Somborn's Mutterrolle source is '?', which must now render as an "Unbekannt" row
    // instead of being suppressed. The value sits in the <dt> immediately after the label <dd>.
    await expect(page.locator('.properties dd', { hasText: 'Mutterrolle' })).toBeVisible()
    const mutterrolleValue = page.locator('.properties dd:has-text("Mutterrolle") + dt')
    await expect(mutterrolleValue).toContainText('Unbekannt')
    // No Häuserbuch is on file for Somborn — the absence notice must be shown
    await expect(page.locator('#contentview')).toContainText('Kein Häuserbuch')
})

test('dortmund parzelle shows no Häuserbuch absence notice', async ({ page }) => {
    await page.goto('/parzelle/dortmund/1/1')
    await expect(page.locator('#contentview')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#contentview')).toContainText('Parzelle Nr. 1', { timeout: 15000 })
    // Dortmund has a Häuserbuch — the absence notice must not appear
    await expect(page.locator('#contentview')).not.toContainText('Kein Häuserbuch')
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

test('phonetic search finds spelling variants only when enabled', async ({ page }) => {
    await page.goto('/search/lage/schmitt')
    await expect(page.locator('#searchresult li')).toHaveCount(0)

    await page.goto('/search/lage/schmitt?ph=1')
    await expect(page.getByLabel('Ähnlich klingende Namen')).toBeChecked()
    await expect(page.locator('#searchresult')).toContainText('Schmidt')

    await page.goto('/search/parzelle/1-2?ph=1')
    await expect(page.getByLabel('Ähnlich klingende Namen')).toHaveCount(0)
})

test.describe('search result type filter', () => {
    test('toggling a type hides its rows, is kept in the URL and survives a reload', async ({ page }) => {
        await page.goto('/search/lage/bach')
        const buttons = page.locator('.typefilter button')
        await expect(buttons.nth(1)).toBeVisible({ timeout: 15000 })

        const first = buttons.first()
        const key = (await first.getAttribute('class'))!.match(/type-(\w+)/)![1]
        await expect(first).toHaveAttribute('aria-pressed', 'true')
        await expect(page.locator(`#searchresult li.type-${key}`).first()).toBeVisible()

        await first.click()
        await expect(first).toHaveAttribute('aria-pressed', 'false')
        await expect(page.locator(`#searchresult li.type-${key}`)).toHaveCount(0)
        await expect(page).toHaveURL(new RegExp(`hide=${key}`))

        await page.reload()
        await expect(page.locator('.typefilter button').first()).toHaveAttribute('aria-pressed', 'false', { timeout: 15000 })
        await expect(page.locator(`#searchresult li.type-${key}`)).toHaveCount(0)

        await page.locator('.typefilter button').first().click()
        await expect(page.locator(`#searchresult li.type-${key}`).first()).toBeVisible()
        await expect(page).not.toHaveURL(/hide=/)
    })

    test('a deep link hides the given types and a new search type clears them', async ({ page }) => {
        await page.goto('/search/lage/bach?hide=flur,admin')
        await expect(page.locator('#searchresult li').first()).toBeVisible({ timeout: 15000 })
        await expect(page.locator('#searchresult li.type-flur')).toHaveCount(0)
        await expect(page.locator('#searchresult li.type-admin')).toHaveCount(0)

        await page.locator('.searchtype').click()
        await page.getByText('nach Eigentümer').click()
        await expect(page).not.toHaveURL(/hide=/)
    })

    test('hiding every type keeps the buttons and shows a hint', async ({ page }) => {
        await page.goto('/search/lage/bach')
        const buttons = page.locator('.typefilter button')
        await expect(buttons.nth(1)).toBeVisible({ timeout: 15000 })

        const count = await buttons.count()
        for( let i = 0; i < count; i++ ) {
            await buttons.nth(i).click()
        }
        await expect(page.getByText('Alle Ergebnistypen sind ausgeblendet.')).toBeVisible()
        await expect(page.locator('#searchresult li')).toHaveCount(0)
        await expect(page.locator('.typefilter button[aria-pressed="false"]')).toHaveCount(count)

        await buttons.first().click()
        await expect(page.getByText('Alle Ergebnistypen sind ausgeblendet.')).toHaveCount(0)
        await expect(page.locator('#searchresult li').first()).toBeVisible()
    })
})
