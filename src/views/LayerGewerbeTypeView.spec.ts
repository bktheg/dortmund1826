import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import LayerGewerbeTypeView from './LayerGewerbeTypeView.vue'

vi.mock('axios', () => ({
    default: { get: vi.fn() }
}))

const listeExport = {
    t: ['Baugeschäfte'],
    q: 'Adressbuch Dortmund 1914',
    e: [
        { n: 'Sander, Heinr.', z: 'Nachf.', a: 'Hof', f: 'F 3030', s: 'Südwall', h: '7', cs: 'suedwall', ch: '7', bi: [8, 7855], bc: [7.45, 51.51] },
        { n: 'Vogel', z: '', a: '', f: '', s: 'Südwall', h: '9', cs: 'suedwall', ch: '9', bi: [12], bc: [7.47, 51.52] },
        { n: 'Krause', z: '', a: '', f: '', s: 'Südwall', h: '7', cs: 'suedwall', ch: '7', bi: [8] },
    ]
}

function makeEmitter() {
    return { emit: vi.fn(), on: vi.fn(), off: vi.fn() }
}

async function mountAt(layername: string, slug: string, emitter = makeEmitter()) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/layer/:layername/addressdata/by-gewerbetype/:gewerbetype', name: 'layer-gewerbetype', component: LayerGewerbeTypeView }
        ]
    })
    router.push(`/layer/${layername}/addressdata/by-gewerbetype/${slug}`)
    await router.isReady()
    const wrapper = mount(LayerGewerbeTypeView, { global: { plugins: [router], provide: { emitter } } })
    await flushPromises()
    return { wrapper, emitter }
}

describe('LayerGewerbeTypeView', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('renders the headline, source and a row per entry', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: listeExport })

        const { wrapper } = await mountAt('vector-do1914', 'baugeschaefte')

        expect(wrapper.find('h1').text()).toBe('Baugeschäfte')
        expect(wrapper.text()).toContain('Quelle: Adressbuch Dortmund 1914')
        expect(wrapper.findAll('tbody tr')).toHaveLength(3)
        expect(wrapper.text()).toContain('Sander, Heinr.')
        expect(wrapper.text()).toContain('Südwall 9')
    })

    it('emits deduped building ids once the list has loaded', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: listeExport })

        const { emitter } = await mountAt('vector-do1914', 'baugeschaefte')

        const call = emitter.emit.mock.calls.find(
            c => c[0] === 'map-highlight-buildings' && Array.isArray(c[1]))
        expect(call?.[1]).toEqual([8, 7855, 12])
    })

    it('zooms the map to fit all entries with a known location', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: listeExport })

        const { emitter } = await mountAt('vector-do1914', 'baugeschaefte')

        const call = emitter.emit.mock.calls.find(c => c[0] === 'map-highlight-location')
        expect(call).toBeDefined()
        const [min, max] = call![1].location
        expect(min[0]).toBeLessThanOrEqual(7.45)
        expect(min[1]).toBeLessThanOrEqual(51.51)
        expect(max[0]).toBeGreaterThanOrEqual(7.47)
        expect(max[1]).toBeGreaterThanOrEqual(51.52)
    })

    it('enables the vector-do1914 layer when opened', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: listeExport })

        const { emitter } = await mountAt('vector-do1914', 'baugeschaefte')

        expect(emitter.emit).toHaveBeenCalledWith('map-enable-layer', 'vector-do1914')
    })

    it('shows "Nicht gefunden" for an unsupported layer and does not fetch', async () => {
        const { wrapper } = await mountAt('andere-ebene', 'baugeschaefte')

        expect(wrapper.text()).toContain('Nicht gefunden')
        expect(axios.get).not.toHaveBeenCalled()
    })

    it('clears the highlight on unmount', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: listeExport })

        const { wrapper, emitter } = await mountAt('vector-do1914', 'baugeschaefte')
        emitter.emit.mockClear()
        wrapper.unmount()

        expect(emitter.emit).toHaveBeenCalledWith('map-highlight-buildings', null)
    })
})
