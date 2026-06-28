import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import LayerBuildingView from './LayerBuildingView.vue'
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

function createTestRouter(layername: string, addresses: BuildingAddress[]) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/layer/:layername/:addr', name: 'layer-building', component: LayerBuildingView }
        ]
    })
    router.push(`/layer/${layername}/${encodeAddressParam(addresses)}`)
    return router
}

async function mountAt(layername: string, addresses: BuildingAddress[]) {
    const router = createTestRouter(layername, addresses)
    await router.isReady()
    const wrapper = mount(LayerBuildingView, { global: { plugins: [router] } })
    await flushPromises()
    return wrapper
}

describe('LayerBuildingView', () => {
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
        vi.mocked(axios.get).mockResolvedValue({ data: sampleExport })

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '2' }])

        expect(wrapper.text()).toContain('Südwall 2')
        expect(wrapper.text()).toContain('Eigentümer: Stadt Dortmund E*')
        expect(wrapper.text()).toContain('Wienand, Fritz')
        expect(wrapper.text()).toContain('Magistrat')
        expect(wrapper.text()).not.toContain('Nicht gefunden')
    })

    it('matches the building by cleaned house number', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: sampleExport })

        const wrapper = await mountAt('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])

        expect(wrapper.text()).toContain('Südwall 7')
        expect(wrapper.text()).toContain('Eigentümer: Sander (Bauuntern.) E')
        expect(wrapper.text()).toContain('Sander, Heinr.')
    })

    it('renders one block per address when a building has several house numbers', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: sampleExport })

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
        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('fetches each distinct street when addresses span multiple streets', async () => {
        const lindenExport = {
            s: 'Lindenstraße',
            q: 'Adressbuch Dortmund 1914',
            g: [{ c: '3', h: '3', o: 'Brandt', j: 'Schlosser', t: 'E', g: [] }]
        }
        vi.mocked(axios.get).mockImplementation((url: string) =>
            Promise.resolve({ data: url.includes('lindenstr') ? lindenExport : sampleExport }))

        const wrapper = await mountAt('vector-do1914', [
            { strasse: 'Südwall', hnr: '7' },
            { strasse: 'Lindenstraße', hnr: '3' },
        ])

        expect(wrapper.text()).toContain('Südwall 7')
        expect(wrapper.text()).toContain('Lindenstraße 3')
        expect(wrapper.text()).toContain('Brandt')
        expect(axios.get).toHaveBeenCalledTimes(2)
    })

    it('shows "Nicht gefunden" for an address whose house number is missing, keeping other blocks', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: sampleExport })

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
                { path: '/layer/:layername/:addr', name: 'layer-building', component: LayerBuildingView }
            ]
        })
        router.push('/layer/vector-do1914/not-valid-base64')
        await router.isReady()
        const wrapper = mount(LayerBuildingView, { global: { plugins: [router] } })
        await flushPromises()

        expect(wrapper.text()).toContain('Nicht gefunden')
        expect(axios.get).not.toHaveBeenCalled()
    })

    it('re-fetches and re-renders when navigating to a different building on the same route', async () => {
        const lindenExport = {
            s: 'Lindenstraße',
            q: 'Adressbuch Dortmund 1914',
            g: [{ c: '3', h: '3', o: 'Brandt', j: 'Schlosser', t: 'E', g: [] }]
        }
        vi.mocked(axios.get).mockImplementation((url: string) =>
            Promise.resolve({ data: url.includes('lindenstr') ? lindenExport : sampleExport }))

        const router = createTestRouter('vector-do1914', [{ strasse: 'Südwall', hnr: '7' }])
        await router.isReady()
        const wrapper = mount(LayerBuildingView, { global: { plugins: [router] } })
        await flushPromises()
        expect(wrapper.text()).toContain('Südwall 7')

        await router.push(`/layer/vector-do1914/${encodeAddressParam([{ strasse: 'Lindenstraße', hnr: '3' }])}`)
        await flushPromises()
        expect(wrapper.text()).toContain('Lindenstraße 3')
        expect(wrapper.text()).toContain('Brandt')
    })
})
