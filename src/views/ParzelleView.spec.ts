import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import ParzelleView from './ParzelleView.vue'

vi.mock('axios', () => ({
    default: { get: vi.fn() }
}))

const adminExport = {
    k: [{ i: 'kreis-dortmund', n: 'Dortmund', a: [] }],
    b: [{ i: 'bgm-dortmund', n: 'Dortmund', k: 'kreis-dortmund', a: [] }],
    g: [{ i: 'gem01', n: 'Gemeinde 1', b: 'bgm-dortmund', qv: '', qb: '', qm: '', qg: '', bb: [], a: [], hb: true }],
    f: [{ g: 'gem01', n: 1, name: 'Innenstadt', qmap: '', box: [], lt: '' }],
}

function parzelleExport(overrides: Record<string, unknown> = {}) {
    return {
        n: '245', f: '4,1230', r: '0,12', e: 'Schulte, Wilhelm', a: '142',
        k: 'II', l: 'Am Wall', t: 'Acker', p: [7.46, 51.51], i: [], b: [],
        ...overrides,
    }
}

async function mountAt(nr: string) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/parzelle/:gemeinde/:flur/:nr', name: 'parzelle', component: ParzelleView },
            { path: '/mutterrolle/:gemeinde/:artikelNr', name: 'mutterrolle', component: { template: '<div/>' } },
        ]
    })
    router.push(`/parzelle/gem01/1/${nr}`)
    await router.isReady()
    const wrapper = mount(ParzelleView, { global: { plugins: [router] } })
    await flushPromises()
    return wrapper
}

describe('ParzelleView subareas table', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('does not render the subareas block when the parcel has no subareas', async () => {
        vi.mocked(axios.get).mockImplementation((url: string) => {
            if (url.includes('/admin.json')) return Promise.resolve({ data: adminExport })
            if (url.includes('/parzellen_')) return Promise.resolve({ data: [parzelleExport({ u: [] })] })
            return Promise.reject(new Error(`unexpected request: ${url}`))
        })

        const wrapper = await mountAt('245')

        expect(wrapper.text()).not.toContain('Teilflächen')
        expect(wrapper.find('table.subareas').exists()).toBe(false)
    })

    it('renders only columns with data, and links Eigentümer to the mutterrolle route', async () => {
        vi.mocked(axios.get).mockImplementation((url: string) => {
            if (url.includes('/admin.json')) return Promise.resolve({ data: adminExport })
            if (url.includes('/parzellen_')) {
                return Promise.resolve({
                    data: [parzelleExport({
                        u: [
                            { e: 'Meyer, Fritz', a: '88', t: 'Wohnhaus', k: 'II', f: '0,0230' },
                            { e: 'Schulte, Anna', a: '91', t: 'Garten', k: 'III', f: '0,0110' },
                        ]
                    })]
                })
            }
            return Promise.resolve({ data: [] })
        })

        const wrapper = await mountAt('245')

        expect(wrapper.text()).toContain('Teilflächen (andere Eigentümer)')
        const headers = wrapper.findAll('table.subareas th').map(h => h.text())
        expect(headers).toEqual(['Eigentümer', 'Kulturart', 'Klasse', 'Größe'])
        expect(headers).not.toContain('Reinertrag')

        const rows = wrapper.findAll('table.subareas tbody tr')
        expect(rows).toHaveLength(2)

        const firstRowLink = rows[0].find('a')
        expect(firstRowLink.text()).toBe('Meyer, Fritz (88)')
        expect(firstRowLink.attributes('href')).toContain('/mutterrolle/gem01/88')
    })

    it('shows the Reinertrag column when at least one subarea has it', async () => {
        vi.mocked(axios.get).mockImplementation((url: string) => {
            if (url.includes('/admin.json')) return Promise.resolve({ data: adminExport })
            if (url.includes('/parzellen_')) {
                return Promise.resolve({
                    data: [parzelleExport({
                        u: [
                            { e: 'Meyer, Fritz', a: '88' },
                            { e: 'Schulte, Anna', a: '91', r: '0,02' },
                        ]
                    })]
                })
            }
            return Promise.resolve({ data: [] })
        })

        const wrapper = await mountAt('245')

        const headers = wrapper.findAll('table.subareas th').map(h => h.text())
        expect(headers).toEqual(['Eigentümer', 'Reinertrag'])

        const rows = wrapper.findAll('table.subareas tbody tr')
        expect(rows[0].findAll('td')).toHaveLength(2)
        expect(rows[0].findAll('td')[1].text()).toBe('')
        expect(rows[1].findAll('td')[1].text()).toBe('0,02')
    })
})
