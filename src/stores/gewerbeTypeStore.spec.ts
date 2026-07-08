import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGewerbeTypeStore } from './gewerbeTypeStore'
import { GewerbeType, GewerbeTypeListe } from '../models/adressbuch'
import axios from 'axios'

vi.mock('axios', () => ({
    default: { get: vi.fn() }
}))

const indexExport = {
    q: 'Adressbuch Dortmund 1914',
    e: [
        { slug: 'baecker', t: ['Bäcker'], c: 42 },
        { slug: 'schreiner', t: ['Schreiner', 'Tischler'], c: 7 }
    ]
}

const listeExport = {
    t: ['Bäcker'],
    q: 'Adressbuch Dortmund 1914',
    e: [
        { n: 'Meier', z: '', a: '', f: 'F 1', s: 'Musterstraße', h: '1', cs: 'musterstr.', ch: '1' }
    ]
}

describe('gewerbeTypeStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('fetches and maps the index', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: indexExport })
        const store = useGewerbeTypeStore()
        await store.fetchIndex()

        const url = vi.mocked(axios.get).mock.calls[0][0] as string
        expect(url).toContain('/adressdaten/1914/by-gewerbe-type/_index.json?v=')
        expect(store.index).toHaveLength(2)
        expect(store.index[0]).toBeInstanceOf(GewerbeType)
        expect(store.index[0].slug).toBe('baecker')
        expect(store.index[1].bezeichnungen).toEqual(['Schreiner', 'Tischler'])
    })

    it('does not fetch the index twice', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: indexExport })
        const store = useGewerbeTypeStore()
        await store.fetchIndex()
        await store.fetchIndex()
        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('fetches, maps and caches a per-slug type file', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: listeExport })
        const store = useGewerbeTypeStore()
        await store.fetchGewerbeType('baecker')

        const url = vi.mocked(axios.get).mock.calls[0][0] as string
        expect(url).toContain('/adressdaten/1914/by-gewerbe-type/baecker.json?v=')

        const liste = store.getListe('baecker')
        expect(liste).toBeInstanceOf(GewerbeTypeListe)
        expect(liste!.eintraege[0].name).toBe('Meier')
        expect(liste!.eintraege[0].adresse.cleanStrasse).toBe('musterstr.')
    })

    it('does not fetch the same slug twice', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: listeExport })
        const store = useGewerbeTypeStore()
        await store.fetchGewerbeType('baecker')
        await store.fetchGewerbeType('baecker')
        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('returns early without calling axios for an empty slug', async () => {
        const store = useGewerbeTypeStore()
        await store.fetchGewerbeType('')
        expect(axios.get).not.toHaveBeenCalled()
    })

    it('sets error and leaves the index empty on failure', async () => {
        const err = new Error('Netzwerkfehler')
        vi.mocked(axios.get).mockRejectedValueOnce(err)
        const store = useGewerbeTypeStore()
        await store.fetchIndex()
        expect(store.error).toBe(err)
        expect(store.index).toEqual([])
        expect(store.loadingIndex).toBe(false)
    })

    it('sets error and leaves the slug uncached on failure', async () => {
        const err = new Error('Netzwerkfehler')
        vi.mocked(axios.get).mockRejectedValueOnce(err)
        const store = useGewerbeTypeStore()
        await store.fetchGewerbeType('baecker')
        expect(store.error).toBe(err)
        expect(store.getListe('baecker')).toBeUndefined()
        expect(store.loading.has('baecker')).toBe(false)
    })
})
