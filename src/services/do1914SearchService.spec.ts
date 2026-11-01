import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { searchDo1914 } from './do1914SearchService'
import { SearchResultType } from './searchService'
import { useAdressbuchNameStore } from '@/stores/adressbuchNameStore'
import { useAdressdatenStore } from '@/stores/adressdatenStore'
import {
    Adresse,
    GewerbeEintrag,
    BehoerdeEintrag,
    BesitzerEintrag,
    StrasseIndexEintrag
} from '@/models/adressbuch'

const CENTER:[number, number] = [7.457269, 51.513639]

function adresse(strasse = 'Musterstraße', hnr = '1'):Adresse {
    return new Adresse(strasse, hnr, 'musterstr.', hnr)
}

function seed() {
    const nameStore = useAdressbuchNameStore()
    const adressdatenStore = useAdressdatenStore()

    nameStore.gewerbe = [
        new GewerbeEintrag('Meier', 'Nachfolger', ['Bäcker'], 'Hinterhaus', 'F 1', adresse(), [8], CENTER)
    ]
    nameStore.behoerden = [
        new BehoerdeEintrag('Magistrat', 'Bauamt', 'Behörden', 'Städtisch', '', adresse('Rathausstraße', '2'), [9], CENTER)
    ]
    nameStore.besitzer = [
        new BesitzerEintrag('Schulz', 'Kaufmann', 'E', adresse('Musterstraße', '3'), [10], CENTER)
    ]
    adressdatenStore.strassenIndex = [
        new StrasseIndexEintrag('Musterstraße', 'musterstrasse.json', CENTER)
    ]

    return { nameStore, adressdatenStore }
}

describe('searchDo1914', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        seed()
    })

    it('returns nothing for an empty term', () => {
        expect(searchDo1914('', 100)).toEqual([])
    })

    it('finds a Gewerbe by name, by Namenszusatz and by Adresszusatz', () => {
        for (const term of ['meier', 'nachfolger', 'hinterhaus']) {
            const results = searchDo1914(term, 100)
            const gewerbe = results.filter(r => r.typeEnum === SearchResultType.GEWERBE)
            expect(gewerbe).toHaveLength(1)
            expect(gewerbe[0].name).toBe('Meier')
            expect(gewerbe[0].typeLabel).toBe('Gewerbe')
            expect(gewerbe[0].typeCss).toBe('gewerbe')
            expect(gewerbe[0].locationDesc).toBe('Musterstraße 1')
        }
    })

    it('lists the matched fields as descriptions so they can be highlighted', () => {
        const [gewerbe] = searchDo1914('nachfolger', 100).filter(r => r.typeEnum === SearchResultType.GEWERBE)
        expect(gewerbe.descriptions).toEqual(['Bäcker', 'Nachfolger'])
        expect(gewerbe.getHighlightedDescriptions()).toEqual(['Bäcker', '<b><u>Nachfolger</u></b>'])
    })

    it('does not repeat a matched name as a description — it is already the title', () => {
        const [gewerbe] = searchDo1914('meier', 100).filter(r => r.typeEnum === SearchResultType.GEWERBE)
        expect(gewerbe.name).toBe('Meier')
        expect(gewerbe.descriptions).toEqual(['Bäcker'])
    })

    it('shows the Branchen of a Gewerbe, comma-joined', () => {
        const nameStore = useAdressbuchNameStore()
        nameStore.gewerbe = [
            new GewerbeEintrag('Meier', '', ['Bäcker', 'Konditor'], '', '', adresse(), [], CENTER),
            new GewerbeEintrag('Schmidt', '', [], '', '', adresse(), [], CENTER)
        ]

        const results = searchDo1914('m', 100).filter(r => r.typeEnum === SearchResultType.GEWERBE)

        expect(results.find(r => r.name === 'Meier')?.descriptions).toEqual(['Bäcker, Konditor'])
        // no Branchen -> no description line at all
        expect(results.find(r => r.name === 'Schmidt')?.descriptions).toEqual([])
    })

    it('shows Kategorie > Unterkategorie of a Behörde', () => {
        const [behoerde] = searchDo1914('magistrat', 100).filter(r => r.typeEnum === SearchResultType.BEHOERDE)
        expect(behoerde.descriptions).toEqual(['Behörden > Städtisch'])
    })

    it('omits an empty Behörden-Unterkategorie instead of leaving a dangling separator', () => {
        const nameStore = useAdressbuchNameStore()
        nameStore.behoerden = [
            new BehoerdeEintrag('Magistrat', '', 'Behörden', '', '', adresse(), [], CENTER)
        ]

        const [behoerde] = searchDo1914('magistrat', 100).filter(r => r.typeEnum === SearchResultType.BEHOERDE)
        expect(behoerde.descriptions).toEqual(['Behörden'])
    })

    it('finds a Behörde by name and by detail', () => {
        for (const term of ['magistrat', 'bauamt']) {
            const [behoerde] = searchDo1914(term, 100).filter(r => r.typeEnum === SearchResultType.BEHOERDE)
            expect(behoerde.name).toBe('Magistrat')
            expect(behoerde.typeLabel).toBe('Behörde')
            expect(behoerde.locationDesc).toBe('Rathausstraße 2')
        }
    })

    it('finds an Eigentümer by name', () => {
        const [besitzer] = searchDo1914('schulz', 100).filter(r => r.typeEnum === SearchResultType.ADRESSBUCH_BESITZER)
        expect(besitzer.name).toBe('Schulz')
        expect(besitzer.typeLabel).toBe('Eigentümer')
        expect(besitzer.typeCss).toBe('besitzer')
    })

    it('finds a Straße and locates it on its own coordinate', () => {
        const [strasse] = searchDo1914('musterstra', 100).filter(r => r.typeEnum === SearchResultType.STRASSE)
        expect(strasse.name).toBe('Musterstraße')
        expect(strasse.typeLabel).toBe('Straße')
        expect(strasse.location).toEqual(CENTER)
        expect(strasse.zoom).toBe(16)
    })

    it('routes a Straße result to its street page, other types not', () => {
        const results = searchDo1914('m', 100)
        const strasse = results.find(r => r.typeEnum === SearchResultType.STRASSE)!
        expect(strasse.route).toEqual({ name: 'layer-street', params: { layername: 'vector-do1914', streetname: 'Musterstraße' } })
        expect(results.filter(r => r.typeEnum !== SearchResultType.STRASSE).every(r => !r.route)).toBe(true)
    })

    it('matches case-insensitively', () => {
        expect(searchDo1914('meier', 100).some(r => r.name === 'Meier')).toBe(true)
    })

    it('gives a result a location and a zoom when its entry has a building center', () => {
        const [gewerbe] = searchDo1914('meier', 100).filter(r => r.typeEnum === SearchResultType.GEWERBE)
        expect(gewerbe.location).toEqual(CENTER)
        expect(gewerbe.zoom).toBe(16)
    })

    it('still lists an entry without a matching building, but it cannot move the map', () => {
        const nameStore = useAdressbuchNameStore()
        nameStore.gewerbe = [
            new GewerbeEintrag('Meier', '', ['Bäcker'], '', '', adresse(), [], undefined)
        ]

        const [gewerbe] = searchDo1914('meier', 100).filter(r => r.typeEnum === SearchResultType.GEWERBE)
        expect(gewerbe.name).toBe('Meier')
        expect(gewerbe.location).toBeUndefined()
        expect(gewerbe.zoom).toBeUndefined()
    })

    it('never returns more than maxResults hits', () => {
        const nameStore = useAdressbuchNameStore()
        nameStore.besitzer = Array.from({ length: 10 }, (_, i) =>
            new BesitzerEintrag(`Schulz ${i}`, '', 'E', adresse('Musterstraße', `${i}`), [], undefined))

        expect(searchDo1914('schulz', 3)).toHaveLength(3)
    })

    it('never lets one category eat the whole budget and starve the others', () => {
        const nameStore = useAdressbuchNameStore()
        const adressdatenStore = useAdressdatenStore()

        // "muster" matches 50 streets and 50 owners: a naive first-loop-wins cap would
        // return 20 streets and no owner at all.
        adressdatenStore.strassenIndex = Array.from({ length: 50 }, (_, i) =>
            new StrasseIndexEintrag(`Musterstraße ${i}`, `musterstrasse-${i}.json`, CENTER))
        nameStore.gewerbe = []
        nameStore.behoerden = []
        nameStore.besitzer = Array.from({ length: 50 }, (_, i) =>
            new BesitzerEintrag(`Muster ${i}`, '', 'E', adresse('Musterstraße', `${i}`), [], CENTER))

        const results = searchDo1914('muster', 20)

        expect(results).toHaveLength(20)
        expect(results.filter(r => r.typeEnum === SearchResultType.STRASSE)).toHaveLength(10)
        expect(results.filter(r => r.typeEnum === SearchResultType.ADRESSBUCH_BESITZER)).toHaveLength(10)
    })

    it('redistributes budget a category cannot use', () => {
        const nameStore = useAdressbuchNameStore()
        const adressdatenStore = useAdressdatenStore()

        adressdatenStore.strassenIndex = [new StrasseIndexEintrag('Musterstraße', 'musterstrasse.json', CENTER)]
        nameStore.gewerbe = []
        nameStore.behoerden = []
        nameStore.besitzer = Array.from({ length: 20 }, (_, i) =>
            new BesitzerEintrag(`Muster ${i}`, '', 'E', adresse('Musterstraße', `${i}`), [], CENTER))

        const results = searchDo1914('muster', 10)

        expect(results).toHaveLength(10)
        expect(results.filter(r => r.typeEnum === SearchResultType.STRASSE)).toHaveLength(1)
        expect(results.filter(r => r.typeEnum === SearchResultType.ADRESSBUCH_BESITZER)).toHaveLength(9)
    })

    it('sorts each category by name, collating umlauts the German way', () => {
        const nameStore = useAdressbuchNameStore()
        nameStore.besitzer = [
            new BesitzerEintrag('Schulze', '', 'E', adresse(), [], CENTER),
            new BesitzerEintrag('Schafer', '', 'E', adresse(), [], CENTER),
            new BesitzerEintrag('Schäfer', '', 'E', adresse(), [], CENTER),
            new BesitzerEintrag('Schmidt', '', 'E', adresse(), [], CENTER)
        ]

        const names = searchDo1914('sch', 100)
            .filter(r => r.typeEnum === SearchResultType.ADRESSBUCH_BESITZER)
            .map(r => r.name)

        // "Schäfer" sorts with "Scha...", not after "Schulze" as a naive codepoint sort would put it
        expect(names).toEqual(['Schafer', 'Schäfer', 'Schmidt', 'Schulze'])
    })

    it('keeps the alphabetically first hits when a category is truncated', () => {
        const nameStore = useAdressbuchNameStore()
        const adressdatenStore = useAdressdatenStore()
        adressdatenStore.strassenIndex = []
        nameStore.gewerbe = []
        nameStore.behoerden = []
        nameStore.besitzer = [
            new BesitzerEintrag('Zimmermann', '', 'E', adresse(), [], CENTER),
            new BesitzerEintrag('Albers', '', 'E', adresse(), [], CENTER),
            new BesitzerEintrag('Meier', '', 'E', adresse(), [], CENTER)
        ]

        const names = searchDo1914('e', 2).map(r => r.name)

        expect(names).toEqual(['Albers', 'Meier'])
    })

    it('sorts the whole list by name across categories, not category by category', () => {
        const nameStore = useAdressbuchNameStore()
        const adressdatenStore = useAdressdatenStore()

        adressdatenStore.strassenIndex = [new StrasseIndexEintrag('Musterweg', 'musterweg.json', CENTER)]
        nameStore.gewerbe = [
            new GewerbeEintrag('Musterbäcker', '', ['Bäcker'], '', '', adresse(), [], CENTER)
        ]
        nameStore.behoerden = []
        nameStore.besitzer = [
            new BesitzerEintrag('Musterle', '', 'E', adresse(), [], CENTER),
            new BesitzerEintrag('Musteramt', '', 'E', adresse(), [], CENTER)
        ]

        const results = searchDo1914('muster', 100)

        // Interleaved by name — an Eigentümer first, then a Gewerbe, then an Eigentümer, then a Straße
        expect(results.map(r => r.name)).toEqual(['Musteramt', 'Musterbäcker', 'Musterle', 'Musterweg'])
        expect(results.map(r => r.typeEnum)).toEqual([
            SearchResultType.ADRESSBUCH_BESITZER,
            SearchResultType.GEWERBE,
            SearchResultType.ADRESSBUCH_BESITZER,
            SearchResultType.STRASSE
        ])
    })

    it('returns no hits for a term nothing matches', () => {
        expect(searchDo1914('gibtesnicht', 100)).toEqual([])
    })
})

describe('searchDo1914 phonetic option', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        const { nameStore } = seed()
        nameStore.besitzer = [
            new BesitzerEintrag('Meyer', 'Kaufmann', 'E', adresse(), [10], CENTER),
            new BesitzerEintrag('Maier', 'Schmied', 'E', adresse(), [11], CENTER)
        ]
    })

    it('finds nothing extra while the option is off', () => {
        const results = searchDo1914('meyer', 100, { phonetic: false })
        expect(results.map(r => r.name)).toEqual(['Meyer'])
        expect(searchDo1914('meyer', 100).map(r => r.name)).toEqual(['Meyer'])
    })

    it('adds spelling variants across categories and marks them phonetic-only', () => {
        const results = searchDo1914('meyer', 100, { phonetic: true })
        expect(results.map(r => r.name).sort()).toEqual(['Maier', 'Meier', 'Meyer'])
        expect(results.find(r => r.name === 'Meyer')!.phoneticOnly).toBe(false)
        expect(results.find(r => r.name === 'Maier')!.phoneticOnly).toBe(true)
        expect(results.find(r => r.name === 'Maier')!.getHighlightedName()).toBe('<b><u class="phonetic" title="Klingt ähnlich">Maier</u></b>')
    })

    it('drops phonetic-only hits first when the budget is exhausted', () => {
        const names = searchDo1914('meyer', 2, { phonetic: true }).map(r => r.name)
        expect(names).toContain('Meyer')
        expect(names).not.toContain('Maier')
    })

    it('ignores a too-short code', () => {
        expect(searchDo1914('m', 100, { phonetic: true }).map(r => r.name).sort())
            .toEqual(searchDo1914('m', 100).map(r => r.name).sort())
    })
})

describe('searchDo1914 type filter', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        const { nameStore, adressdatenStore } = seed()
        adressdatenStore.strassenIndex = Array.from({ length: 10 }, (_, i) =>
            new StrasseIndexEintrag(`Meierstraße ${i}`, `m${i}.json`, CENTER))
        nameStore.gewerbe = [new GewerbeEintrag('Meier', '', [], '', '', adresse(), [8], CENTER)]
    })

    it('counts all matches per type, uncapped', () => {
        let counts:any[] = []
        searchDo1914('meier', 3, { onTypeCounts: c => counts = c })

        expect(counts.map(c => [c.key, c.count])).toEqual([['strasse', 10], ['gewerbe', 1]])
    })

    it('redistributes the budget of a hidden category', () => {
        const all = searchDo1914('meier', 4)
        expect(all.filter(r => r.typeEnum === SearchResultType.GEWERBE)).toHaveLength(1)
        expect(all.filter(r => r.typeEnum === SearchResultType.STRASSE)).toHaveLength(3)

        const withoutGewerbe = searchDo1914('meier', 4, { hiddenTypes: new Set(['gewerbe']) })
        expect(withoutGewerbe).toHaveLength(4)
        expect(withoutGewerbe.every(r => r.typeEnum === SearchResultType.STRASSE)).toBe(true)
    })
})
