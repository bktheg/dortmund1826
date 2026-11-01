import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import LayerStreetView from './LayerStreetView.vue'

vi.mock('axios', () => ({
    default: { get: vi.fn() }
}))

const streetExport = {
    q: 'Adressbuch Dortmund 1914',
    s: 'Südwall',
    g: [
        { c: '15b', h: '15b', o: 'Meier' },
        { c: '9', h: '9', o: 'Schulz', j: 'Kaufmann', g: [{ n: 'Vogel', b: ['Bäcker'] }] },
        { c: '15', h: '15', b: [{ n: 'Amt', c: 'x', u: 'y' }] },
        { c: '2', h: '2' }
    ]
}

function makeEmitter() {
    return { emit: vi.fn(), on: vi.fn(), off: vi.fn() }
}

async function mountAt(layername: string, street: string, from = true) {
    const emitter = makeEmitter()
    const router = createRouter({
        history: createWebHistory(),
        routes: [
            { path: '/search/:t?', name: 'search', component: { template: '<div/>' } },
            { path: '/layer/:layername/addressdata/by-streetname/:streetname', name: 'layer-street', component: LayerStreetView }
        ]
    })
    if (from) {
        router.push('/search/lage')
        await router.isReady()
    }
    await router.push(`/layer/${layername}/addressdata/by-streetname/${encodeURIComponent(street)}`)
    const wrapper = mount(LayerStreetView, { global: { plugins: [router], provide: { emitter } } })
    await flushPromises()
    return { wrapper, router, emitter }
}

describe('LayerStreetView', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('renders the street name as title and rows sorted by house number', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: streetExport })
        const { wrapper } = await mountAt('vector-do1914', 'Südwall')

        expect(wrapper.find('h1').text()).toBe('Südwall')
        const first = wrapper.findAll('tbody tr').map(r => r.findAll('td')[0].text())
        expect(first).toEqual(['Südwall 2', 'Südwall 9', 'Südwall 15', 'Südwall 15b'])
        expect(wrapper.text()).toContain('Schulz (Kaufmann)')
        expect(wrapper.text()).toContain('Vogel')
        expect(wrapper.text()).toContain('Bäcker')
        expect(wrapper.text()).toContain('Amt')
    })

    it('shows a back link that returns to the search page', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: streetExport })
        const { wrapper, router } = await mountAt('vector-do1914', 'Südwall')

        const link = wrapper.find('a.backToSearch')
        expect(link.exists()).toBe(true)
        await link.trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/search/lage')
    })

    it('links an address with a known position and pans the map on click', async () => {
        const adresse = { s: 'Südwall', h: '9', cs: 'suedwall', ch: '9' }
        vi.mocked(axios.get).mockImplementation(async (url: string) => {
            if (url.includes('by-name/owners')) {
                return { data: { q: '', e: [{ n: 'Schulz', j: '', t: '', ...adresse, bi: [5], bc: [7.45, 51.51] }] } }
            }
            if (url.includes('by-name/')) {
                return { data: { q: '', e: [] } }
            }
            return { data: streetExport }
        })
        const { wrapper, emitter } = await mountAt('vector-do1914', 'Südwall')

        const rows = wrapper.findAll('tbody tr')
        expect(rows[0].find('td a').exists()).toBe(false)
        const link = rows[1].find('td a')
        expect(link.text()).toBe('Südwall 9')
        await link.trigger('click')
        expect(emitter.emit).toHaveBeenCalledWith('map-highlight-buildings', [5])
        expect(emitter.emit).toHaveBeenCalledWith('map-highlight-location', { location: [7.45, 51.51], zoom: 16 })
    })

    it('shows "Nicht gefunden" for an unsupported layer without fetching', async () => {
        const { wrapper } = await mountAt('andere-ebene', 'Südwall')
        expect(wrapper.text()).toContain('Nicht gefunden')
        expect(axios.get).not.toHaveBeenCalled()
    })

    it('shows "Nicht gefunden" when the street file cannot be loaded', async () => {
        vi.mocked(axios.get).mockRejectedValue(new Error('404'))
        const { wrapper } = await mountAt('vector-do1914', 'Nirgendwo')
        expect(wrapper.text()).toContain('Nicht gefunden')
    })
})
