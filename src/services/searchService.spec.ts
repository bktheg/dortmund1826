import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { SearchResult, SearchResultType, searchByTerm } from './searchService'
import { useFlurStore, Gemeinde, Buergermeisterei, Kreis } from '@/stores/flurStore'
import { useBezeichnungStore } from '@/stores/bezeichnungStore'
import { useEigentuemerStore } from '@/stores/eigentuemerStore'
import { useAllParzellenStore } from '@/stores/allParzellenStore'

// buildPath/isIncludedInFilter/mapTypeToEnum are module-private.

describe('SearchResult', () => {
    function makeResult(term: string, descriptions: string[] = []): SearchResult {
        // gemeinde is only used for display/routing — pass a minimal stub
        const result = new SearchResult(term, 'Kreis X', 'TestName', SearchResultType.BEZEICHNUNG, null as any)
        result.descriptions = descriptions
        return result
    }

    it('stores constructor arguments', () => {
        const r = makeResult('berg')
        expect(r.term).toBe('berg')
        expect(r.name).toBe('TestName')
        expect(r.typeEnum).toBe(SearchResultType.BEZEICHNUNG)
    })

    it('returns empty array when no descriptions', () => {
        expect(makeResult('test').getHighlightedDescriptions()).toEqual([])
    })

    it('highlights the term in the name, matching case-insensitively', () => {
        const r = new SearchResult('name', 'Kreis X', 'TestName', SearchResultType.BEZEICHNUNG)
        expect(r.getHighlightedName()).toBe('Test<b><u>Name</u></b>')
    })

    it('leaves the name untouched when the term does not occur in it', () => {
        const r = new SearchResult('berg', 'Kreis X', 'TestName', SearchResultType.BEZEICHNUNG)
        expect(r.getHighlightedName()).toBe('TestName')
    })

    it('escapes markup in the name and descriptions — they are rendered with v-html', () => {
        const r = new SearchResult('bau', 'Kreis X', '<b>Bau</b> & Co', SearchResultType.BEZEICHNUNG)
        r.descriptions = ['Tief & <script>']

        expect(r.getHighlightedName()).toBe('&lt;b&gt;<b><u>Bau</u></b>&lt;/b&gt; &amp; Co')
        expect(r.getHighlightedDescriptions()).toEqual(['Tief &amp; &lt;script&gt;'])
    })

    it('highlights term in the middle of a description', () => {
        const r = makeResult('berg', ['Hohenberg'])
        const [highlighted] = r.getHighlightedDescriptions()
        expect(highlighted).toBe('Hohen<b><u>berg</u></b>')
    })

    it('highlights term at the start of a description', () => {
        const r = makeResult('dor', ['Dortmund'])
        // search uses toLocaleLowerCase on the description, but the original case is preserved in output
        const [highlighted] = r.getHighlightedDescriptions()
        expect(highlighted).toBe('<b><u>Dor</u></b>tmund')
    })

    it('highlights term at the end of a description', () => {
        const r = makeResult('mund', ['Dortmund'])
        const [highlighted] = r.getHighlightedDescriptions()
        expect(highlighted).toBe('Dort<b><u>mund</u></b>')
    })

    it('handles multiple descriptions', () => {
        const r = makeResult('str', ['Hauptstraße', 'Nebenstraße'])
        const results = r.getHighlightedDescriptions()
        expect(results).toHaveLength(2)
        expect(results[0]).toContain('<b><u>')
        expect(results[1]).toContain('<b><u>')
    })

    it('returns the description unchanged when the term does not occur', () => {
        const r = makeResult('berg', ['Dortmund'])
        expect(r.getHighlightedDescriptions()).toEqual(['Dortmund'])
    })

    it('highlights case-insensitively when the term contains uppercase letters', () => {
        const r = makeResult('Berg', ['Hohenberg'])
        const [highlighted] = r.getHighlightedDescriptions()
        expect(highlighted).toBe('Hohen<b><u>berg</u></b>')
    })
})


describe('searchByTerm', () => {
    const ALL = ['__all']

    beforeEach(() => {
        setActivePinia(createPinia())
        const kreis = new Kreis('k', 'Dortmund', [])
        const gemeinde = new Gemeinde('g', 'Castrop', new Buergermeisterei('b', 'Bochum', kreis, []), '', '', '', '', [], [], false)
        useFlurStore().gemeinden = [gemeinde]

        useBezeichnungStore().bezeichnungen = [
            { g: 'g', f: 1, n: 'Meyers Kamp', l: [7, 51] },
            { g: 'g', f: 1, n: 'Maier Wiese', l: [7, 51] },
            { g: 'g', f: 1, n: 'Meierhof', l: [7, 51] },
            { g: 'g', f: 1, n: 'Schmidts Kamp', l: [7, 51] },
            { g: 'g', f: 1, n: 'Müllers Hof', l: [7, 51] },
            { g: 'g', f: 1, n: 'Im Hochmeierfeld', l: [7, 51] }
        ] as any
        useEigentuemerStore().eigentuemer = [
            { gemeindeId: 'g', id: '1', name: 'Meier, Johann' },
            { gemeindeId: 'g', id: '2', name: 'Meyer, Karl' },
            { gemeindeId: 'g', id: '3', name: 'Schulz' }
        ] as any
    })

    const names = (term:string, type:string, phonetic?:boolean) =>
        searchByTerm(term, type, ALL, 100, phonetic === undefined ? undefined : { phonetic }).map(r => r.name)

    it('behaves exactly as before while the option is off', () => {
        expect(names('meyer', 'lage')).toEqual(['Meyers Kamp'])
        expect(names('meyer', 'lage', false)).toEqual(['Meyers Kamp'])
        expect(names('meyer', 'owner', false)).toEqual(['Meyer, Karl'])
    })

    it('adds spelling variants after the exact hits', () => {
        expect(names('meyer', 'owner', true)).toEqual(['Meyer, Karl', 'Meier, Johann'])
        expect(names('meyer', 'lage', true)).toEqual(['Meyers Kamp', 'Maier Wiese', 'Meierhof', 'Im Hochmeierfeld'])
    })

    it('finds Schmidt by the partial term schmit and by Schmitt', () => {
        expect(names('schmit', 'lage', true)).toEqual(['Schmidts Kamp'])
        expect(names('schmitt', 'lage', true)).toEqual(['Schmidts Kamp'])
    })

    it('treats umlaut spellings alike', () => {
        for (const term of ['müller', 'muller', 'mueller']) {
            expect(names(term, 'lage', true)).toContain('Müllers Hof')
        }
    })

    it('does not match phonetically on a single-digit code or without letters', () => {
        expect(names('m', 'owner', true)).toEqual(['Meier, Johann', 'Meyer, Karl'])
        expect(names('x', 'owner', true)).toEqual([])
        expect(names('12-3', 'owner', true)).toEqual([])
    })

    it('does not apply to a Parzelle search', () => {
        const store = useAllParzellenStore()
        store.parzellen = [{ gemeindeId: 'g', flur: 1, parzelle: '2', artikel: '1', location: [7, 51] }] as any
        const off = searchByTerm('1-2', 'parzelle', ALL, 100)
        const on = searchByTerm('1-2', 'parzelle', ALL, 100, { phonetic: true })
        expect(on.map(r => r.name)).toEqual(off.map(r => r.name))
        expect(on.every(r => !r.phoneticOnly)).toBe(true)
    })

    it('highlights the whole matched word of a phonetic-only hit', () => {
        const [, variant] = searchByTerm('meyer', 'owner', ALL, 100, { phonetic: true })
        expect(variant.phoneticOnly).toBe(true)
        expect(variant.getHighlightedName()).toBe('<b><u class="phonetic" title="Klingt ähnlich">Meier</u></b>, Johann')
    })

    it('lists phonetic hits best match first: same sound, name at the start, name inside a compound', () => {
        const results = searchByTerm('meyer', 'lage', ALL, 100, { phonetic: true })
        expect(results.map(r => [r.name, r.matchRank])).toEqual([
            ['Meyers Kamp', 0], ['Maier Wiese', 1], ['Meierhof', 2], ['Im Hochmeierfeld', 3]
        ])
        expect(results[3].getHighlightedName()).toBe('Im Hoch<b><u class="phonetic" title="Klingt ähnlich">meier</u></b>feld')
    })

    it('keeps exact hits ahead of phonetic ones even when the result list is truncated', () => {
        const results = searchByTerm('meyer', 'owner', ALL, 1, { phonetic: true })
        expect(results.map(r => r.name)).toEqual(['Meyer, Karl'])
    })
})


describe('searchByTerm type filter', () => {
    const ALL = ['__all']

    beforeEach(() => {
        setActivePinia(createPinia())
        const kreis = new Kreis('k', 'Dortmund', [])
        const gemeinde = new Gemeinde('g', 'Castrop', new Buergermeisterei('b', 'Bochum', kreis, []), '', '', '', '', [], [], false)
        useFlurStore().gemeinden = [gemeinde]

        const bach = (n:string, t:number) => ({ g: 'g', f: 1, n, l: [7, 51], t })
        useBezeichnungStore().bezeichnungen = [
            ...[1, 2, 3, 4, 5, 6].map(i => bach(`Bach ${i}`, 101)),
            ...[1, 2, 3].map(i => bach(`Bachwiese ${i}`, 0))
        ] as any
    })

    it('reports every type with its uncapped count, even when capped or hidden', () => {
        let counts:any[] = []
        const hidden = new Set(['gewaesser'])
        const found = searchByTerm('bach', 'lage', ALL, 2, { hiddenTypes: hidden, onTypeCounts: c => counts = c })

        expect(counts).toEqual([
            { key: 'gewaesser', label: 'Gewässer', count: 6 },
            { key: 'name', label: 'Bezeichnung', count: 3 }
        ])
        expect(found).toHaveLength(2)
    })

    it('hands the budget of a hidden type to the others', () => {
        const visible = searchByTerm('bach', 'lage', ALL, 5)
        expect(visible.filter(r => r.typeEnum == SearchResultType.BEZEICHNUNG)).toHaveLength(0)

        const filtered = searchByTerm('bach', 'lage', ALL, 5, { hiddenTypes: new Set(['gewaesser']) })
        expect(filtered).toHaveLength(3)
        expect(filtered.every(r => r.typeEnum == SearchResultType.BEZEICHNUNG)).toBe(true)
    })

    it('is unchanged without the options', () => {
        expect(searchByTerm('bach', 'lage', ALL, 100)).toHaveLength(9)
    })
})

