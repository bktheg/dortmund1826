import { describe, it, expect } from 'vitest'
import { koelnerPhonetik, phoneticSkeleton } from './koelnerPhonetik'
import { createPhoneticMatcher } from './phoneticMatch'

describe('koelnerPhonetik', () => {
    it.each([
        ['Müller-Lüdenscheidt', '65752682'],
        ['Breschnew', '17863'],
        ['Wikipedia', '3412'],
        ['Meier', '67'],
        ['Meyer', '67'],
        ['Maier', '67'],
        ['Schmidt', '862'],
        ['Schmitt', '862'],
        ['Thomas', '268'],
        ['Tomas', '268'],
        ['Müller', '657'],
        ['Mueller', '657'],
        ['Muller', '657'],
        ['Straße', '8278'],
        ['Anna', '06']
    ])('encodes %s as %s', (word, code) => {
        expect(koelnerPhonetik(word)).toBe(code)
    })

    it('returns an empty code for input without letters', () => {
        expect(koelnerPhonetik('12-3')).toBe('')
        expect(koelnerPhonetik('')).toBe('')
    })
})

describe('phoneticSkeleton', () => {
    it.each([
        ['Meier', '6a7'],
        ['Meyer', '6a7'],
        ['Mayer', '6a7'],
        ['Vaerst', '3a782'],
        ['Fahrst', '3a782'],
        ['Kurl', '4o75'],
        ['Courl', '4o75'],
        ['Karl', '4a75']
    ])('encodes %s as %s', (word, skeleton) => {
        expect(phoneticSkeleton(word)).toBe(skeleton)
    })
})

describe('createPhoneticMatcher', () => {
    it('reports how loosely the text matched, the loosest query word deciding', () => {
        const match = createPhoneticMatcher('mayer')
        expect(match('Meyer')?.kind).toBe('equal')
        expect(match('Meierfeld')?.kind).toBe('start')
        expect(match('in Meiers Berge')?.kind).toBe('start')
        expect(match('Hochmeier')?.kind).toBe('inside')
        expect(createPhoneticMatcher('hans meyer')('Hans Hochmeier')?.kind).toBe('inside')
        expect(createPhoneticMatcher('hans meyer')('Hans Maier')?.kind).toBe('equal')
    })

    it('returns just the matching characters inside a compound', () => {
        const pick = (text:string) => createPhoneticMatcher('mayer')(text)!.ranges.map(([from, to]) => text.substring(from, to))
        expect(pick('Im Hochmeierfeld')).toEqual(['meier'])
        expect(pick('Im Meierfeld')).toEqual(['Meier'])
        expect(pick('Meierhof')).toEqual(['Meier'])
        expect(pick('in Meiers Berge')).toEqual(['Meier'])
        expect(pick('Hacheneier Mark')).toEqual(['neier'])
        expect(pick('Johann Meyer')).toEqual(['Meyer'])
        expect(pick('Albersmeyer')).toEqual(['meyer'])
    })

    it('matches a spelling variant and returns the whole word range', () => {
        const match = createPhoneticMatcher('meyer')
        expect(match('Johann Meier')?.ranges).toEqual([[7, 12]])
    })

    it('finds the end-inflected form while partial typing works for variants', () => {
        const match = createPhoneticMatcher('schmit')
        expect(match('Schmidts')).not.toBeNull()
        expect(match('Schmidt')).not.toBeNull()
        expect(match('Schmitt')).not.toBeNull()
        expect(match('Meier')).toBeNull()
        for (const name of ['Sundern', 'Schandellenholz', 'Schneider']) {
            expect(match(name), name).toBeNull()
        }
    })

    it('ignores how vowels are spelled but not where they are', () => {
        const match = createPhoneticMatcher('mayer')
        for (const name of ['Meier', 'Meyer', 'Maier', 'Meer']) {
            expect(match(name), name).not.toBeNull()
        }
        for (const name of ['Nro', 'Mertmann', 'Mohrenstecker', 'Mörtmann', 'Niermann', 'Möritz', 'Mehring', 'Mark', 'Maria']) {
            expect(match(name), name).toBeNull()
        }
        expect(createPhoneticMatcher('fahrst')('Vaerst')).not.toBeNull()
    })

    it('allows one more letter of difference for long names', () => {
        for (const query of ['mallinckrodt', 'malinkrot', 'mallinkrodt', 'mallinckrod']) {
            const match = createPhoneticMatcher(query)
            for (const name of ['Mallinckrodt', 'Malinkrot', 'Mallinkrodt', 'Mallinckrod']) {
                expect(match(name), `${query} ~ ${name}`).not.toBeNull()
            }
        }
    })

    it('keeps front and back vowels apart: Kurl finds Courl, not Karl or Kärling', () => {
        const match = createPhoneticMatcher('kurl')
        expect(match('Gemeinde Courl')).not.toBeNull()
        for (const name of ['Karl', 'Kärling', 'Gröllmann']) {
            expect(match(name), name).toBeNull()
        }
    })

    it('finds the name at the end of a compound or after an inflection, but not behind a lone vowel', () => {
        const match = createPhoneticMatcher('mayer')
        for (const text of ['Der Hochmeier Kamp', 'Hacheneier Mark', 'in Meiers Berge', 'Im Meierfeld', 'Im Hochmeierfeld', 'Hochmeiers Kamp', 'Meierhof', 'Meierkamp']) {
            expect(match(text), text).not.toBeNull()
        }
        for (const text of ['am Unnaer Wege', 'Flur 27 gnt. Nierholz', 'Schulte Mehring', 'Nierfeld', 'Krämer', 'Wethmar']) {
            expect(match(text), text).toBeNull()
        }
    })

    it('does not match for a query code shorter than two digits', () => {
        expect(createPhoneticMatcher('m')('Meier')).toBeNull()
    })

    it('requires every query word, in any order', () => {
        const match = createPhoneticMatcher('hans meyer')
        expect(match('Maier, Hans')?.ranges).toHaveLength(2)
        expect(match('Maier, Karl')).toBeNull()
    })

    it('never matches a term without letters', () => {
        expect(createPhoneticMatcher('12-3')('12-3')).toBeNull()
    })
})
