import { describe, it, expect } from 'vitest'
import { expandSourceToAbbr, expandSourceToDetailedSource, expandSourceToText } from './quellenService'

describe('expandSourceToAbbr', () => {
    it('returns empty string for undefined', () => {
        expect(expandSourceToAbbr(undefined)).toBe('')
    })

    it('returns stado link for null (falls back to stado default)', () => {
        expect(expandSourceToAbbr(null)).toBe('<a href="#quelle-sta-dortmund">StADo</a>')
    })

    it('returns stado link', () => {
        expect(expandSourceToAbbr('stado')).toBe('<a href="#quelle-sta-dortmund">StADo</a>')
    })

    it('extracts prefix before colon and maps to link', () => {
        expect(expandSourceToAbbr('stado:162/001')).toBe('<a href="#quelle-sta-dortmund">StADo</a>')
    })

    it('returns lav link', () => {
        expect(expandSourceToAbbr('lav')).toBe('<a href="#quelle-lav-nrw-w">LAV NRW W</a>')
    })

    it('returns Recklinghausen link', () => {
        expect(expandSourceToAbbr('ka recklinghausen')).toBe('<a href="#quelle-ka-recklinghausen">Recklinghausen</a>')
    })

    it('returns "unbekannt" for ?', () => {
        expect(expandSourceToAbbr('?')).toBe('unbekannt')
    })

    it('returns stado link for empty string (empty string normalizes to stado)', () => {
        expect(expandSourceToAbbr('')).toBe('<a href="#quelle-sta-dortmund">StADo</a>')
    })

    it('returns Ennepe-Ruhr link', () => {
        expect(expandSourceToAbbr('ka ennepe-ruhr')).toBe('<a href="#quelle-ka-ennepe-ruhr">Ennepe-Ruhr</a>')
    })

    it('returns Hagen link', () => {
        expect(expandSourceToAbbr('ka hagen')).toBe('<a href="#quelle-ka-hagen">Stadt Hagen</a>')
    })

    it('returns Herne link', () => {
        expect(expandSourceToAbbr('ka herne')).toBe('<a href="#quelle-ka-herne">Stadt Herne</a>')
    })

    it('returns source as-is for unknown archive', () => {
        expect(expandSourceToAbbr('custom-archive')).toBe('custom-archive')
    })
})

describe('expandSourceToDetailedSource', () => {
    it('returns empty string for undefined', () => {
        expect(expandSourceToDetailedSource(undefined)).toBe('')
    })

    it('returns archive name without bestaende', () => {
        expect(expandSourceToDetailedSource('stado')).toBe('Stadtarchiv Dortmund')
    })

    it('appends bestaende when colon-separated list is present', () => {
        expect(expandSourceToDetailedSource('stado:162/001,162/002'))
            .toBe('Stadtarchiv Dortmund Best. 162/001, Best. 162/002')
    })

    it('handles single bestand', () => {
        expect(expandSourceToDetailedSource('lav:K551')).toBe('Landesarchiv NRW Abteilung Westfalen Best. K551')
    })
})

describe('expandSourceToText', () => {
    it('returns empty string for undefined', () => {
        expect(expandSourceToText(undefined)).toBe('')
    })

    it('returns full stado description', () => {
        expect(expandSourceToText('stado')).toContain('Stadtarchiv Dortmund')
    })

    it('returns full lav description', () => {
        expect(expandSourceToText('lav')).toContain('Landesarchiv NRW')
    })

    it('returns source as-is for unknown archive', () => {
        expect(expandSourceToText('sonderarchiv')).toBe('sonderarchiv')
    })
})
