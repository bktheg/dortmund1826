import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParzelleStore, Parzelle } from './parzelleStore'
import axios from 'axios'

vi.mock('axios', () => ({
    default: { get: vi.fn() }
}))

const sampleExport = {
    n: '123a',
    f: '0.50',
    r: '10',
    e: 'Müller, Johann',
    a: '42',
    k: 'A',
    l: 'Am Berg',
    t: 'Acker',
    p: [51.5, 7.4],
    i: [],
    b: null,
    u: [],
}

describe('parzelleStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('returns early without calling axios when gemeinde is empty', async () => {
        const store = useParzelleStore()
        await store.fetchParzellen('', 1)
        expect(axios.get).not.toHaveBeenCalled()
    })

    it('returns early without calling axios when flur is 0', async () => {
        const store = useParzelleStore()
        await store.fetchParzellen('gem01', 0)
        expect(axios.get).not.toHaveBeenCalled()
    })

    it('maps ParzelleExport fields to Parzelle domain class', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: [sampleExport] })

        const store = useParzelleStore()
        await store.fetchParzellen('gem01', 1)

        const parzellen = store.parzellen.get('gem01')?.get(1)
        expect(parzellen).toHaveLength(1)
        const p = parzellen![0]
        expect(p).toBeInstanceOf(Parzelle)
        expect(p.gemeindeId).toBe('gem01')
        expect(p.flur).toBe(1)
        expect(p.parzelle).toBe('123a')
        expect(p.eigentuemer).toBe('Müller, Johann')
        expect(p.artikelNr).toBe('42')
        expect(p.flaeche).toBe('0.50')
        expect(p.reinertrag).toBe('10')
        expect(p.typ).toBe('Acker')
        expect(p.klasse).toBe('A')
        expect(p.lage).toBe('Am Berg')
        expect(p.position).toEqual([51.5, 7.4])
        expect(p.buildings).toEqual([])
        expect(p.subareas).toEqual([])
    })

    it('maps buildings array entries to ParzelleBuilding instances', async () => {
        const exportWithBuildings = {
            ...sampleExport,
            b: [{ b: 'Wohnhaus', n: '12a' }, { b: 'Scheune', n: '' }],
        }
        vi.mocked(axios.get).mockResolvedValueOnce({ data: [exportWithBuildings] })

        const store = useParzelleStore()
        await store.fetchParzellen('gem01', 1)

        const buildings = store.parzellen.get('gem01')?.get(1)?.[0].buildings
        expect(buildings).toHaveLength(2)
        expect(buildings![0].bezeichnung).toBe('Wohnhaus')
        expect(buildings![0].hnr).toBe('12a')
        expect(buildings![1].bezeichnung).toBe('Scheune')
    })

    it('maps subarea (u) entries to ParzelleSubarea instances', async () => {
        const exportWithSubareas = {
            ...sampleExport,
            u: [{ e: 'Meyer, Fritz', a: '88', t: 'Wohnhaus', k: 'II', f: '0,0230', r: '0,05' }],
        }
        vi.mocked(axios.get).mockResolvedValueOnce({ data: [exportWithSubareas] })

        const store = useParzelleStore()
        await store.fetchParzellen('gem01', 1)

        const subareas = store.parzellen.get('gem01')?.get(1)?.[0].subareas
        expect(subareas).toHaveLength(1)
        expect(subareas![0].eigentuemer).toBe('Meyer, Fritz')
        expect(subareas![0].artikelNr).toBe('88')
        expect(subareas![0].typ).toBe('Wohnhaus')
        expect(subareas![0].klasse).toBe('II')
        expect(subareas![0].flaeche).toBe('0,0230')
        expect(subareas![0].reinertrag).toBe('0,05')
    })

    it('maps subarea entries with omitted optional fields to undefined', async () => {
        const exportWithSparseSubarea = {
            ...sampleExport,
            u: [{ e: 'Krause, Otto', a: '55' }],
        }
        vi.mocked(axios.get).mockResolvedValueOnce({ data: [exportWithSparseSubarea] })

        const store = useParzelleStore()
        await store.fetchParzellen('gem01', 1)

        const subareas = store.parzellen.get('gem01')?.get(1)?.[0].subareas
        expect(subareas).toHaveLength(1)
        expect(subareas![0].eigentuemer).toBe('Krause, Otto')
        expect(subareas![0].artikelNr).toBe('55')
        expect(subareas![0].typ).toBeUndefined()
        expect(subareas![0].klasse).toBeUndefined()
        expect(subareas![0].flaeche).toBeUndefined()
        expect(subareas![0].reinertrag).toBeUndefined()
    })

    it('maps a missing u field to an empty subareas array', async () => {
        const exportWithoutSubareas = { ...sampleExport } as Partial<typeof sampleExport>
        delete exportWithoutSubareas.u
        vi.mocked(axios.get).mockResolvedValueOnce({ data: [exportWithoutSubareas] })

        const store = useParzelleStore()
        await store.fetchParzellen('gem01', 1)

        const subareas = store.parzellen.get('gem01')?.get(1)?.[0].subareas
        expect(subareas).toEqual([])
    })

    it('maps InfoExport entries in i field via mapInfos', async () => {
        const exportWithInfos = {
            ...sampleExport,
            i: [{ t: 'wikipedia', a: { page: 'Dortmund' } }],
        }
        vi.mocked(axios.get).mockResolvedValueOnce({ data: [exportWithInfos] })

        const store = useParzelleStore()
        await store.fetchParzellen('gem01', 1)

        const info = store.parzellen.get('gem01')?.get(1)?.[0].info
        expect(info).toHaveLength(1)
    })

    it('does not fetch again when same gemeinde/flur is requested twice', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: [] })

        const store = useParzelleStore()
        await store.fetchParzellen('gem01', 1)
        await store.fetchParzellen('gem01', 1)

        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('sets store.error and clears loading key on axios failure', async () => {
        const networkError = new Error('Netzwerkfehler')
        vi.mocked(axios.get).mockRejectedValueOnce(networkError)

        const store = useParzelleStore()
        await store.fetchParzellen('gem01', 1)

        expect(store.error).toBe(networkError)
        expect(store.loading.has('gem01-1')).toBe(false)
        expect(store.parzellen.has('gem01')).toBe(false)
    })
})
