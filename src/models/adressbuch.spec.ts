import { describe, it, expect } from 'vitest'
import {
    Adresse,
    GewerbeType,
    GewerbeTypeEintrag,
    GewerbeTypeListe,
    GewerbeEintrag,
    BehoerdeEintrag,
    BesitzerEintrag,
    mapGewerbeType,
    mapGewerbeTypeListe,
    mapGewerbeEintrag,
    mapBehoerdeEintrag,
    mapBesitzerEintrag
} from './adressbuch'

describe('mapGewerbeType', () => {
    it('maps the index entry and defaults missing arrays/counts', () => {
        const gt = mapGewerbeType({ slug: 'baecker', t: ['Bäcker', 'Konditor'], c: 42 })
        expect(gt).toBeInstanceOf(GewerbeType)
        expect(gt.slug).toBe('baecker')
        expect(gt.bezeichnungen).toEqual(['Bäcker', 'Konditor'])
        expect(gt.anzahl).toBe(42)
    })
})

describe('mapGewerbeTypeListe', () => {
    it('maps labels and entries with the shared address quartet', () => {
        const liste = mapGewerbeTypeListe({
            t: ['Bäcker'],
            q: 'Adressbuch Dortmund 1914',
            e: [{ n: 'Meier', z: '', a: '', f: '', s: 'Musterstraße', h: '1', cs: 'musterstr.', ch: '1' }]
        })
        expect(liste).toBeInstanceOf(GewerbeTypeListe)
        expect(liste.bezeichnungen).toEqual(['Bäcker'])
        expect(liste.quelle).toBe('Adressbuch Dortmund 1914')
        expect(liste.eintraege).toHaveLength(1)
        const eintrag = liste.eintraege[0]
        expect(eintrag).toBeInstanceOf(GewerbeTypeEintrag)
        expect(eintrag.name).toBe('Meier')
        expect(eintrag.adresse).toBeInstanceOf(Adresse)
        expect(eintrag.adresse.strasse).toBe('Musterstraße')
        expect(eintrag.adresse.hnr).toBe('1')
        expect(eintrag.adresse.cleanStrasse).toBe('musterstr.')
        expect(eintrag.adresse.cleanHnr).toBe('1')
    })

    it('maps the building ids (bi) and defaults them to empty when absent', () => {
        const liste = mapGewerbeTypeListe({
            t: ['Bäcker'],
            q: '',
            e: [
                { n: 'Meier', z: '', a: '', f: '', s: 'M', h: '1', cs: 'm', ch: '1', bi: [8, 7855] },
                { n: 'Vogel', z: '', a: '', f: '', s: 'M', h: '2', cs: 'm', ch: '2' },
            ]
        })
        expect(liste.eintraege[0].buildingIds).toEqual([8, 7855])
        expect(liste.eintraege[1].buildingIds).toEqual([])
    })

    it('preserves empty-string fields verbatim and does not crash', () => {
        const liste = mapGewerbeTypeListe({
            t: [],
            q: '',
            e: [{ n: '', z: '', a: '', f: '', s: '', h: '', cs: '', ch: '' }]
        })
        expect(liste.eintraege[0].name).toBe('')
        expect(liste.eintraege[0].namenszusatz).toBe('')
        expect(liste.eintraege[0].adresse.strasse).toBe('')
    })

    it('defaults a missing entry array to empty', () => {
        const liste = mapGewerbeTypeListe({ t: ['X'], q: '', e: undefined as unknown as [] })
        expect(liste.eintraege).toEqual([])
    })
})

describe('mapGewerbeEintrag (by-name)', () => {
    it('maps name, branchen and address', () => {
        const g = mapGewerbeEintrag({
            n: 'Meier', z: 'Nachf.', b: ['Bäcker', 'Konditor'], a: 'Hof', f: 'F 1',
            s: 'Musterstraße', h: '1', cs: 'musterstr.', ch: '1'
        })
        expect(g).toBeInstanceOf(GewerbeEintrag)
        expect(g.name).toBe('Meier')
        expect(g.namenszusatz).toBe('Nachf.')
        expect(g.branchen).toEqual(['Bäcker', 'Konditor'])
        expect(g.adresszusatz).toBe('Hof')
        expect(g.fernsprecher).toBe('F 1')
        expect(g.adresse.cleanStrasse).toBe('musterstr.')
    })

    it('defaults a missing branchen array to empty', () => {
        const g = mapGewerbeEintrag({
            n: 'X', z: '', b: undefined as unknown as string[], a: '', f: '',
            s: '', h: '', cs: '', ch: ''
        })
        expect(g.branchen).toEqual([])
    })
})

describe('mapBehoerdeEintrag (by-name)', () => {
    it('maps the by-name kategorie from `k` (not `c`)', () => {
        const b = mapBehoerdeEintrag({
            n: 'Magistrat', z: 'Detail', k: 'Behörden', u: 'Städtische Behörden', f: '',
            s: 'Musterstraße', h: '1', cs: 'musterstr.', ch: '1'
        })
        expect(b).toBeInstanceOf(BehoerdeEintrag)
        expect(b.name).toBe('Magistrat')
        expect(b.namenszusatz).toBe('Detail')
        expect(b.kategorie).toBe('Behörden')
        expect(b.unterkategorie).toBe('Städtische Behörden')
        expect(b.adresse.hnr).toBe('1')
    })
})

describe('mapBesitzerEintrag (by-name owners)', () => {
    it('maps owner, occupation, type and address', () => {
        const o = mapBesitzerEintrag({
            n: 'Schulz', j: 'Kaufmann', t: 'E',
            s: 'Musterstraße', h: '1', cs: 'musterstr.', ch: '1'
        })
        expect(o).toBeInstanceOf(BesitzerEintrag)
        expect(o.name).toBe('Schulz')
        expect(o.beruf).toBe('Kaufmann')
        expect(o.typ).toBe('E')
        expect(o.adresse.strasse).toBe('Musterstraße')
    })
})
