import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAdressbuchNameStore } from './adressbuchNameStore'
import { GewerbeEintrag, BehoerdeEintrag, BesitzerEintrag } from '../models/adressbuch'
import axios from 'axios'

vi.mock('axios', () => ({
    default: { get: vi.fn() }
}))

const gewerbeExport = {
    q: 'Adressbuch Dortmund 1914',
    e: [{ n: 'Meier', z: '', b: ['Bäcker', 'Konditor'], a: '', f: 'F 1', s: 'Musterstraße', h: '1', cs: 'musterstr.', ch: '1' }]
}
const behoerdenExport = {
    q: 'Adressbuch Dortmund 1914',
    e: [{ n: 'Magistrat', z: '', k: 'Behörden', u: 'Städtische Behörden', f: '', s: 'Musterstraße', h: '1', cs: 'musterstr.', ch: '1' }]
}
const ownersExport = {
    q: 'Adressbuch Dortmund 1914',
    e: [{ n: 'Schulz', j: 'Kaufmann', t: 'E', s: 'Musterstraße', h: '1', cs: 'musterstr.', ch: '1' }]
}

describe('adressbuchNameStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('fetches and maps the gewerbe list', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: gewerbeExport })
        const store = useAdressbuchNameStore()
        await store.fetchGewerbe()

        const url = vi.mocked(axios.get).mock.calls[0][0] as string
        expect(url).toContain('/adressdaten/1914/by-name/gewerbe.json?v=')
        expect(store.gewerbe[0]).toBeInstanceOf(GewerbeEintrag)
        expect(store.gewerbe[0].branchen).toEqual(['Bäcker', 'Konditor'])
        expect(store.gewerbe[0].adresse.cleanStrasse).toBe('musterstr.')
    })

    it('fetches and maps the behoerden list (kategorie from `k`)', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: behoerdenExport })
        const store = useAdressbuchNameStore()
        await store.fetchBehoerden()

        const url = vi.mocked(axios.get).mock.calls[0][0] as string
        expect(url).toContain('/adressdaten/1914/by-name/behoerden.json?v=')
        expect(store.behoerden[0]).toBeInstanceOf(BehoerdeEintrag)
        expect(store.behoerden[0].kategorie).toBe('Behörden')
    })

    it('fetches and maps the besitzer (owners) list', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: ownersExport })
        const store = useAdressbuchNameStore()
        await store.fetchBesitzer()

        const url = vi.mocked(axios.get).mock.calls[0][0] as string
        expect(url).toContain('/adressdaten/1914/by-name/owners.json?v=')
        expect(store.besitzer[0]).toBeInstanceOf(BesitzerEintrag)
        expect(store.besitzer[0].beruf).toBe('Kaufmann')
    })

    it('loads each list at most once', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: gewerbeExport })
        const store = useAdressbuchNameStore()
        await store.fetchGewerbe()
        await store.fetchGewerbe()
        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('loads behoerden at most once', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: behoerdenExport })
        const store = useAdressbuchNameStore()
        await store.fetchBehoerden()
        await store.fetchBehoerden()
        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('loads besitzer at most once', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: ownersExport })
        const store = useAdressbuchNameStore()
        await store.fetchBesitzer()
        await store.fetchBesitzer()
        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('does not re-fetch a list that legitimately came back empty', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: { q: 'Adressbuch Dortmund 1914', e: [] } })
        const store = useAdressbuchNameStore()
        await store.fetchGewerbe()
        await store.fetchGewerbe()
        expect(store.gewerbe).toEqual([])
        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('does not re-fetch a list whose request failed — callers may retry on every keystroke', async () => {
        vi.mocked(axios.get).mockRejectedValue(new Error('Netzwerkfehler'))
        const store = useAdressbuchNameStore()
        await store.fetchBesitzer()
        await store.fetchBesitzer()
        await store.fetchBesitzer()
        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('sets errorGewerbe and leaves the gewerbe list empty on failure', async () => {
        const err = new Error('Netzwerkfehler')
        vi.mocked(axios.get).mockRejectedValueOnce(err)
        const store = useAdressbuchNameStore()
        await store.fetchGewerbe()
        expect(store.errorGewerbe).toBe(err)
        expect(store.gewerbe).toEqual([])
        expect(store.loadingGewerbe).toBe(false)
    })

    it('sets errorBehoerden and leaves the behoerden list empty on failure', async () => {
        const err = new Error('Netzwerkfehler')
        vi.mocked(axios.get).mockRejectedValueOnce(err)
        const store = useAdressbuchNameStore()
        await store.fetchBehoerden()
        expect(store.errorBehoerden).toBe(err)
        expect(store.behoerden).toEqual([])
        expect(store.loadingBehoerden).toBe(false)
    })

    it('sets errorBesitzer and leaves the besitzer list empty on failure', async () => {
        const err = new Error('Netzwerkfehler')
        vi.mocked(axios.get).mockRejectedValueOnce(err)
        const store = useAdressbuchNameStore()
        await store.fetchBesitzer()
        expect(store.errorBesitzer).toBe(err)
        expect(store.besitzer).toEqual([])
        expect(store.loadingBesitzer).toBe(false)
    })
})
