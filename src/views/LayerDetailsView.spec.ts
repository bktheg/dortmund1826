import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import LayerDetailsView from './LayerDetailsView.vue'
import { encodeAddressParam, type BuildingAddress } from '@/utils/buildingAddresses'

vi.mock('axios', () => ({
    default: { get: vi.fn() }
}))

const sampleExport = {
    s: 'Südwall',
    q: 'Adressbuch Dortmund 1914',
    g: [
        {
            c: '7', h: '7', o: 'Sander', j: 'Bauuntern.', t: 'E',
            g: [{ b: ['Baugeschäfte'], n: 'Sander, Heinr.', f: 'F 3030' }]
        },
        {
            c: '2', h: '2', o: 'Stadt Dortmund', t: 'E*',
            g: [{ b: ['Schreinereien'], n: 'Wienand, Fritz', f: 'F 3034' }],
            b: [{ c: 'Behörden', u: 'Städtische Behörden', n: 'Magistrat' }]
        }
    ]
}

function haeuserbuchBuilding(id: string, street: string, number: string, oldNumber = '') {
    return { i: id, n: number, o: oldNumber, s: street, f: { t: 0, x: 'Flur 3 Nr. 245', s: [] }, b: [], e: [], a: [], l: [7.46, 51.51] }
}

const emptyHaeuserbuchExport = { q: 'Dortmunder Häuserbuch', u: '', b: [], t: [], s: [] }

function isHaeuserbuchUrl(url: unknown): boolean {
    return String(url).includes('haeuserbuch_')
}

// Every axios.get in this view is routed by URL: address book, Gewerbetype index and Häuserbuch.
function mockAxios(adressbuch: unknown, haeuserbuch: unknown = emptyHaeuserbuchExport) {
    vi.mocked(axios.get).mockImplementation((url: string) =>
        Promise.resolve({ data: isHaeuserbuchUrl(url) ? haeuserbuch : adressbuch }))
}

function createTestRouter(layername: string, addresses: BuildingAddress[]) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/layer/:layername/:addr', name: 'layer-details', component: LayerDetailsView },
            { path: '/layer/:layername/addressdata/by-gewerbetype/:gewerbetype', name: 'layer-gewerbetype', component: { template: '<div />' } }
        ]
    })
    router.push(`/layer/${layername}/${encodeAddressParam(addresses)}`)
    return router
}

function makeEmitter() {
    return { emit: vi.fn(), on: vi.fn(), off: vi.fn() }
}

async function mountAt(layername: string, addresses: BuildingAddress[]) {
    const router = createTestRouter(layername, addresses)
    await router.isReady()
    const wrapper = mount(LayerDetailsView, { global: { plugins: [router], provide: { emitter: makeEmitter() } } })
    await flushPromises()
    return wrapper
}

function byStreetCalls(): number {
    return vi.mocked(axios.get).mock.calls.filter(c => String(c[0]).includes('by-street')).length
}

describe('LayerDetailsView', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('shows only "Nicht gefunden" for an unsupported layer and does not fetch', async () => {
        const wrapper = await mountAt('andere-ebene', [{ strasse: 'Südwall', hnr: '7' }])
        expect(wrapper.text()).toContain('Nicht gefunden')
        expect(axios.get).not.toHaveBeenCalled()
    })

    it('renders street + house number from JSON, owner, Gewerbe and Behörde', async () => {
        mockAxios(sampleExport)

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '2' }])

        expect(wrapper.text()).toContain('Südwall 2')
        expect(wrapper.text()).toContain('Eigentümer: Stadt Dortmund E*')
        expect(wrapper.text()).toContain('Wienand, Fritz')
        expect(wrapper.text()).toContain('Magistrat')
        expect(wrapper.text()).not.toContain('Nicht gefunden')
    })

    it('matches the building by cleaned house number', async () => {
        mockAxios(sampleExport)

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])

        expect(wrapper.text()).toContain('Südwall 7')
        expect(wrapper.text()).toContain('Eigentümer: Sander (Bauuntern.) E')
        expect(wrapper.text()).toContain('Sander, Heinr.')
    })

    it('renders one block per address when a building has several house numbers', async () => {
        mockAxios(sampleExport)

        const wrapper = await mountAt('vector-do1914', [
            { strasse: 'Südwall', hnr: '7' },
            { strasse: 'Südwall', hnr: '2' },
        ])

        const blocks = wrapper.findAll('.address-block')
        expect(blocks).toHaveLength(2)
        expect(wrapper.text()).toContain('Südwall 7')
        expect(wrapper.text()).toContain('Sander, Heinr.')
        expect(wrapper.text()).toContain('Südwall 2')
        expect(wrapper.text()).toContain('Magistrat')
        // A single street is fetched once even though it carries two addresses.
        expect(byStreetCalls()).toBe(1)
    })

    it('fetches each distinct street when addresses span multiple streets', async () => {
        const lindenExport = {
            s: 'Lindenstraße',
            q: 'Adressbuch Dortmund 1914',
            g: [{ c: '3', h: '3', o: 'Brandt', j: 'Schlosser', t: 'E', g: [] }]
        }
        vi.mocked(axios.get).mockImplementation((url: string) =>
            Promise.resolve({ data: isHaeuserbuchUrl(url) ? emptyHaeuserbuchExport : (url.includes('lindenstr') ? lindenExport : sampleExport) }))

        const wrapper = await mountAt('vector-do1914', [
            { strasse: 'Südwall', hnr: '7' },
            { strasse: 'Lindenstraße', hnr: '3' },
        ])

        expect(wrapper.text()).toContain('Südwall 7')
        expect(wrapper.text()).toContain('Lindenstraße 3')
        expect(wrapper.text()).toContain('Brandt')
        expect(byStreetCalls()).toBe(2)
    })

    it('matches a house number that falls inside a ranged address-book entry', async () => {
        const rangeExport = {
            s: 'Südwall',
            q: 'Adressbuch Dortmund 1914',
            g: [{ c: '13-17', h: '13-17', o: 'Krause', j: 'Kaufmann', t: 'E', g: [] }]
        }
        mockAxios(rangeExport)

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '15' }])

        expect(wrapper.text()).toContain('Südwall 13-17')
        expect(wrapper.text()).toContain('Krause')
        expect(wrapper.text()).not.toContain('Nicht gefunden')
    })

    it('renders a ranged entry once when several URL addresses overlap it (dedupe)', async () => {
        const rangeExport = {
            s: 'Südwall',
            q: 'Adressbuch Dortmund 1914',
            g: [{ c: '13-19', h: '13-19', o: 'Krause', j: 'Kaufmann', t: 'E', g: [] }]
        }
        mockAxios(rangeExport)

        const wrapper = await mountAt('vector-do1914', [
            { strasse: 'Südwall', hnr: '15' },
            { strasse: 'Südwall', hnr: '17' },
        ])

        const blocks = wrapper.findAll('.address-block')
        expect(blocks).toHaveLength(1)
        expect(blocks[0].text()).toContain('Südwall 13-19')
        // The fully-deduped second address contributes no "Nicht gefunden".
        expect(wrapper.text()).not.toContain('Nicht gefunden')
    })

    it('keeps a distinct second match while deduping the shared ranged entry', async () => {
        const mixedExport = {
            s: 'Südwall',
            q: 'Adressbuch Dortmund 1914',
            g: [
                { c: '13-19', h: '13-19', o: 'Krause', j: 'Kaufmann', t: 'E', g: [] },
                { c: '17', h: '17', o: 'Vogel', j: 'Bäcker', t: 'E', g: [] },
            ]
        }
        mockAxios(mixedExport)

        const wrapper = await mountAt('vector-do1914', [
            { strasse: 'Südwall', hnr: '15' },
            { strasse: 'Südwall', hnr: '17' },
        ])

        const blocks = wrapper.findAll('.address-block')
        expect(blocks).toHaveLength(2)
        expect(blocks[0].text()).toContain('Südwall 13-19')
        expect(blocks[1].text()).toContain('Südwall 17')
        expect(wrapper.text()).toContain('Vogel')
        expect(wrapper.text()).not.toContain('Nicht gefunden')
    })

    it('keeps same house numbers on different streets distinct', async () => {
        const lindenExport = {
            s: 'Lindenstraße',
            q: 'Adressbuch Dortmund 1914',
            g: [{ c: '7', h: '7', o: 'Brandt', j: 'Schlosser', t: 'E', g: [] }]
        }
        vi.mocked(axios.get).mockImplementation((url: string) =>
            Promise.resolve({ data: isHaeuserbuchUrl(url) ? emptyHaeuserbuchExport : (url.includes('lindenstr') ? lindenExport : sampleExport) }))

        const wrapper = await mountAt('vector-do1914', [
            { strasse: 'Südwall', hnr: '7' },
            { strasse: 'Lindenstraße', hnr: '7' },
        ])

        const blocks = wrapper.findAll('.address-block')
        expect(blocks).toHaveLength(2)
        expect(wrapper.text()).toContain('Südwall 7')
        expect(wrapper.text()).toContain('Lindenstraße 7')
    })

    it('shows "Nicht gefunden" for an address whose house number is missing, keeping other blocks', async () => {
        mockAxios(sampleExport)

        const wrapper = await mountAt('vector-do1914', [
            { strasse: 'Südwall', hnr: '7' },
            { strasse: 'Südwall', hnr: '999' },
        ])

        expect(wrapper.text()).toContain('Südwall 7')
        expect(wrapper.text()).toContain('Südwall 999')
        expect(wrapper.text()).toContain('Nicht gefunden')
    })

    it('shows "Nicht gefunden" when the address param is invalid', async () => {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/layer/:layername/:addr', name: 'layer-details', component: LayerDetailsView }
            ]
        })
        router.push('/layer/vector-do1914/not-valid-base64')
        await router.isReady()
        const wrapper = mount(LayerDetailsView, { global: { plugins: [router], provide: { emitter: makeEmitter() } } })
        await flushPromises()

        expect(wrapper.text()).toContain('Nicht gefunden')
        expect(byStreetCalls()).toBe(0)
    })

    it('renders a Gewerbe branche as a link when it resolves to a type slug', async () => {
        const index = { q: 'Adressbuch Dortmund 1914', e: [{ slug: 'baugeschaefte', t: ['Baugeschäfte'], c: 5 }] }
        vi.mocked(axios.get).mockImplementation((url: string) =>
            Promise.resolve({ data: isHaeuserbuchUrl(url) ? emptyHaeuserbuchExport : (url.includes('by-gewerbe-type') ? index : sampleExport) }))

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])

        const link = wrapper.findAll('a').find(a => a.text() === 'Baugeschäfte')
        expect(link).toBeTruthy()
        expect(link!.attributes('href')).toContain('by-gewerbetype/baugeschaefte')
    })

    it('renders a Gewerbe branche as plain text when no type slug matches', async () => {
        const index = { q: 'Adressbuch Dortmund 1914', e: [{ slug: 'baecker', t: ['Bäcker'], c: 5 }] }
        vi.mocked(axios.get).mockImplementation((url: string) =>
            Promise.resolve({ data: isHaeuserbuchUrl(url) ? emptyHaeuserbuchExport : (url.includes('by-gewerbe-type') ? index : sampleExport) }))

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])

        expect(wrapper.text()).toContain('Baugeschäfte')
        expect(wrapper.findAll('a').some(a => a.text() === 'Baugeschäfte')).toBe(false)
    })

    it('re-fetches and re-renders when navigating to a different building on the same route', async () => {
        const lindenExport = {
            s: 'Lindenstraße',
            q: 'Adressbuch Dortmund 1914',
            g: [{ c: '3', h: '3', o: 'Brandt', j: 'Schlosser', t: 'E', g: [] }]
        }
        vi.mocked(axios.get).mockImplementation((url: string) =>
            Promise.resolve({ data: isHaeuserbuchUrl(url) ? emptyHaeuserbuchExport : (url.includes('lindenstr') ? lindenExport : sampleExport) }))

        const router = createTestRouter('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])
        await router.isReady()
        const wrapper = mount(LayerDetailsView, { global: { plugins: [router], provide: { emitter: makeEmitter() } } })
        await flushPromises()
        expect(wrapper.text()).toContain('Südwall 7')

        await router.push(`/layer/vector-do1914/${encodeAddressParam([{ strasse: 'Lindenstraße', hnr: '3' }])}`)
        await flushPromises()
        expect(wrapper.text()).toContain('Lindenstraße 3')
        expect(wrapper.text()).toContain('Brandt')
    })

    it('groups a Gewerbe entry under its own heading, with the Fernsprecher on the identity line', async () => {
        const layoutExport = {
            s: 'Südwall',
            q: 'Adressbuch Dortmund 1914',
            g: [{
                c: '1', h: '1', o: 'Bauverein', t: 'E*',
                g: [{ b: ['Bergwerks-Bedarfs-Artikel'], n: 'Brügmann, Artur E.', z: 'Ecke Betenstr.', f: 'F 805' }],
                b: [{ c: 'Behörden', u: 'Vereinslokal', n: 'Tierschutz-Verein', f: 'F 3008' }]
            }]
        }
        mockAxios(layoutExport)

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '1' }])

        const headings = wrapper.findAll('h3').map(h => h.text())
        expect(headings).toContain('Gewerbe')
        expect(headings).toContain('Behörden')

        const kopf = wrapper.findAll('.eintrag-kopf')[0]
        expect(kopf.find('.eintrag-name').text()).toBe('Brügmann, Artur E.')
        expect(kopf.find('.eintrag-zusatz').text()).toBe('Ecke Betenstr.')
        expect(kopf.find('.eintrag-fernsprecher').text()).toBe('F 805')
        // The Branche sits on its own line below, no longer between name and Fernsprecher.
        expect(kopf.text()).not.toContain('Bergwerks-Bedarfs-Artikel')
        expect(wrapper.findAll('.eintrag-kategorie')[0].text()).toContain('Bergwerks-Bedarfs-Artikel')
    })

    it('renders the Häuserbuch entry whose current house number matches the address', async () => {
        mockAxios(sampleExport, {
            q: 'Dortmunder Häuserbuch', u: '', t: [], s: [],
            b: [haeuserbuchBuilding('Suedwall_7', 'Südwall', '7')]
        })

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])

        expect(wrapper.text()).toContain('Eintrag im Häuserbuch')
        expect(wrapper.text()).toContain('Südwall 7')
    })

    it('titles the Häuserbuch block with the current address, not the 1826 house number', async () => {
        const westenExport = {
            s: 'Westenhellweg',
            q: 'Adressbuch Dortmund 1914',
            g: [{ c: '30', h: '30', o: 'Krause', j: 'Kaufmann', t: 'E', g: [] }]
        }
        mockAxios(westenExport, {
            q: 'Dortmunder Häuserbuch', u: '', t: [], s: [],
            b: [haeuserbuchBuilding('Westenhellweg_30_310', 'Westenhellweg', '30', '310')]
        })

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Westenhellweg', hnr: '30' }])

        const title = wrapper.findAll('h3').find(h => h.text().includes('Eintrag im Häuserbuch'))
        expect(title!.text()).toContain('Eintrag im Häuserbuch für Westenhellweg 30')
        expect(wrapper.text()).not.toContain('Hausnummer 310')
    })

    it('renders one Häuserbuch block per matching building', async () => {
        mockAxios(sampleExport, {
            q: 'Dortmunder Häuserbuch', u: '', t: [], s: [],
            b: [
                haeuserbuchBuilding('Suedwall_7', 'Südwall', '7'),
                haeuserbuchBuilding('Suedwall_7-9', 'Südwall', '7-9')
            ]
        })

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])

        const entries = wrapper.findAll('h3').filter(h => h.text().includes('Eintrag im Häuserbuch'))
        expect(entries).toHaveLength(2)
    })

    it('matches Häuserbuch numbers written as a range', async () => {
        const rangeExport = {
            s: 'Südwall',
            q: 'Adressbuch Dortmund 1914',
            g: [{ c: '29', h: '29', o: 'Krause', j: 'Kaufmann', t: 'E', g: [] }]
        }
        mockAxios(rangeExport, {
            q: 'Dortmunder Häuserbuch', u: '', t: [], s: [],
            b: [haeuserbuchBuilding('Suedwall_29-31', 'Südwall', '29/31')]
        })

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '29' }])

        expect(wrapper.text()).toContain('Eintrag im Häuserbuch')
    })

    it('shows no Häuserbuch block when no building matches street and house number', async () => {
        mockAxios(sampleExport, {
            q: 'Dortmunder Häuserbuch', u: '', t: [], s: [],
            b: [
                haeuserbuchBuilding('Brueckstr_7', 'Brückstraße', '7'),
                haeuserbuchBuilding('Suedwall_9', 'Südwall', '9')
            ]
        })

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])

        expect(wrapper.text()).toContain('Südwall 7')
        expect(wrapper.text()).not.toContain('Eintrag im Häuserbuch')
    })

    it('skips Häuserbuch buildings without a usable house number', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        mockAxios(sampleExport, {
            q: 'Dortmunder Häuserbuch', u: '', t: [], s: [],
            b: [
                haeuserbuchBuilding('Suedwall_ohne', 'Südwall', 'ohne'),
                haeuserbuchBuilding('Suedwall_leer', 'Südwall', '')
            ]
        })

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])

        expect(wrapper.text()).not.toContain('Eintrag im Häuserbuch')
        expect(logSpy).not.toHaveBeenCalled()
        logSpy.mockRestore()
    })

    it('still renders the address-book content when the Häuserbuch cannot be loaded', async () => {
        vi.mocked(axios.get).mockImplementation((url: string) =>
            isHaeuserbuchUrl(url) ? Promise.reject(new Error('404')) : Promise.resolve({ data: sampleExport }))

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])

        expect(wrapper.text()).toContain('Südwall 7')
        expect(wrapper.text()).toContain('Sander, Heinr.')
        expect(wrapper.text()).not.toContain('Eintrag im Häuserbuch')
    })
})
