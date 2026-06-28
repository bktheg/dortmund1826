import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAdressdatenStore, cleanStreet, cleanHnr, Adressbuch, Gebaeude, Gewerbe, Behoerde } from './adressdatenStore'
import axios from 'axios'

vi.mock('axios', () => ({
    default: { get: vi.fn() }
}))

describe('cleanStreet', () => {
    it('returns null/empty for null/empty input', () => {
        expect(cleanStreet(null as unknown as string)).toBe(null)
        expect(cleanStreet('')).toBe('')
    })

    it('lowercases, converts umlauts and replaces strasse with str.', () => {
        expect(cleanStreet('Südwall')).toBe('suedwall')
        expect(cleanStreet('Heiligegartenstraße')).toBe('heiligegartenstr.')
        expect(cleanStreet('Lindenstrasse')).toBe('lindenstr.')
    })

    it('applies the c -> k rule before front vowels/consonants', () => {
        expect(cleanStreet('Camp')).toBe('kamp')
    })

    it('replaces th and ph digraphs', () => {
        expect(cleanStreet('Theaterphilo')).toBe('teaterfilo')
    })

    it('special-cases kampstr.', () => {
        expect(cleanStreet('Kampstrasse')).toBe('1. kampstr.')
    })
})

describe('cleanHnr', () => {
    it('returns null for falsy input', () => {
        expect(cleanHnr('')).toBe(null)
        expect(cleanHnr(null as unknown as string)).toBe(null)
    })

    it('shortcuts plain numbers', () => {
        expect(cleanHnr('42')).toBe('42')
        expect(cleanHnr(' 7 ')).toBe('7')
    })

    it('merges number and trailing letter', () => {
        expect(cleanHnr('15 a')).toBe('15a')
    })

    it('reformats ranges with slash to dash', () => {
        expect(cleanHnr('15/17')).toBe('15-17')
    })

    it('converts fractions to letter suffixes by numerator (1->a, 2->b)', () => {
        expect(cleanHnr('15 1/2')).toBe('15a')
        expect(cleanHnr('15 2/3')).toBe('15b')
    })
})

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

describe('adressdatenStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('returns early without calling axios when street is empty', async () => {
        const store = useAdressdatenStore()
        await store.fetchAdressbuch('')
        expect(axios.get).not.toHaveBeenCalled()
    })

    it('maps raw export fields to domain classes', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: sampleExport })

        const store = useAdressdatenStore()
        await store.fetchAdressbuch('suedwall')

        const adressbuch = store.adressbuecher.get('suedwall')
        expect(adressbuch).toBeInstanceOf(Adressbuch)
        expect(adressbuch!.strasse).toBe('Südwall')
        expect(adressbuch!.quelle).toBe('Adressbuch Dortmund 1914')
        expect(adressbuch!.gebaeude).toHaveLength(2)

        const g7 = adressbuch!.gebaeude[0]
        expect(g7).toBeInstanceOf(Gebaeude)
        expect(g7.cleanedHnr).toBe('7')
        expect(g7.hnr).toBe('7')
        expect(g7.besitzer).toBe('Sander')
        expect(g7.beruf).toBe('Bauuntern.')
        expect(g7.typ).toBe('E')
        expect(g7.gewerbe[0]).toBeInstanceOf(Gewerbe)
        expect(g7.gewerbe[0].name).toBe('Sander, Heinr.')
        expect(g7.gewerbe[0].branchen).toEqual(['Baugeschäfte'])
        expect(g7.gewerbe[0].fernsprecher).toBe('F 3030')
        expect(g7.behoerden).toEqual([])

        const g2 = adressbuch!.gebaeude[1]
        expect(g2.behoerden[0]).toBeInstanceOf(Behoerde)
        expect(g2.behoerden[0].name).toBe('Magistrat')
        expect(g2.behoerden[0].unterkategorie).toBe('Städtische Behörden')
    })

    it('does not double the dot for streets already ending in a dot', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: sampleExport })

        const store = useAdressdatenStore()
        await store.fetchAdressbuch('betenstr.')

        const url = vi.mocked(axios.get).mock.calls[0][0] as string
        expect(url).toContain('/adressdaten/1914/betenstr.json?v=')
        expect(url).not.toContain('betenstr..json')
    })

    it('builds a normal filename for streets without a trailing dot', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: sampleExport })

        const store = useAdressdatenStore()
        await store.fetchAdressbuch('suedwall')

        const url = vi.mocked(axios.get).mock.calls[0][0] as string
        expect(url).toContain('/adressdaten/1914/suedwall.json?v=')
    })

    it('does not fetch again when the same street is requested twice', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: sampleExport })

        const store = useAdressdatenStore()
        await store.fetchAdressbuch('suedwall')
        await store.fetchAdressbuch('suedwall')

        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('sets store.error and clears loading on axios failure', async () => {
        const networkError = new Error('Netzwerkfehler')
        vi.mocked(axios.get).mockRejectedValueOnce(networkError)

        const store = useAdressdatenStore()
        await store.fetchAdressbuch('suedwall')

        expect(store.error).toBe(networkError)
        expect(store.loading.has('suedwall')).toBe(false)
        expect(store.adressbuecher.has('suedwall')).toBe(false)
    })

    it('getAdressbuch getter returns the cached entry', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: sampleExport })

        const store = useAdressdatenStore()
        await store.fetchAdressbuch('suedwall')

        expect(store.getAdressbuch('suedwall')?.strasse).toBe('Südwall')
        expect(store.getAdressbuch('unbekannt')).toBeUndefined()
    })
})
