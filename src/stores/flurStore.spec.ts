import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFlurStore } from './flurStore'
import axios from 'axios'

vi.mock('axios', () => ({
    default: { get: vi.fn() }
}))

const sampleAdmin = {
    k: [{ i: 'k1', n: 'Kreis 1', a: [] }],
    b: [{ i: 'b1', n: 'Bürgermeisterei 1', k: 'k1', a: [] }],
    g: [
        { i: 'mit-hb', n: 'Dortmund', b: 'b1', qv: '', qb: '', qm: '', qg: '', bb: [], a: [], hb: true },
        { i: 'ohne-hb', n: 'Somborn', b: 'b1', qv: '', qb: '', qm: '?', qg: '', bb: [], a: [], hb: false },
        { i: 'fehlt-hb', n: 'Berghofen', b: 'b1', qv: '', qb: '', qm: '', qg: '', bb: [], a: [] },
    ],
    f: [],
}

describe('flurStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('maps hb: true to haeuserbuch === true', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: sampleAdmin })

        const store = useFlurStore()
        await store.fetchFlure()

        expect(store.getGemeindeById('mit-hb').haeuserbuch).toBe(true)
    })

    it('maps hb: false to haeuserbuch === false', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: sampleAdmin })

        const store = useFlurStore()
        await store.fetchFlure()

        expect(store.getGemeindeById('ohne-hb').haeuserbuch).toBe(false)
    })

    it('defaults a missing hb key to haeuserbuch === false', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: sampleAdmin })

        const store = useFlurStore()
        await store.fetchFlure()

        expect(store.getGemeindeById('fehlt-hb').haeuserbuch).toBe(false)
    })
})
