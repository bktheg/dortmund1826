import { describe, it, expect } from 'vitest'
import { mapInfo, mapInfos, WikipediaInfo, CommonInfo, HaeuserbuchInfo } from './infoService'

describe('mapInfo', () => {
    it('returns null for null input', () => {
        expect(mapInfo(null as any)).toBeNull()
    })

    it('returns null when type is missing', () => {
        expect(mapInfo({ t: '', a: {} })).toBeNull()
    })

    it('maps wikipedia type', () => {
        const result = mapInfo({ t: 'wikipedia', a: { page: 'Dortmund' } })
        expect(result).toBeInstanceOf(WikipediaInfo)
        expect((result as WikipediaInfo).page).toBe('Dortmund')
    })

    it('maps common type', () => {
        const result = mapInfo({ t: 'common', a: { t: 'Beschreibung', s: 'StADo', u: 'https://example.com' } })
        expect(result).toBeInstanceOf(CommonInfo)
        const info = result as CommonInfo
        expect(info.info).toBe('Beschreibung')
        expect(info.source).toBe('StADo')
        expect(info.url).toBe('https://example.com')
    })

    it('maps haeuserbuch type', () => {
        const result = mapInfo({ t: 'haeuserbuch', a: { g: 'gem-01', x: 'street-42' } })
        expect(result).toBeInstanceOf(HaeuserbuchInfo)
        const info = result as HaeuserbuchInfo
        expect(info.gemeinde).toBe('gem-01')
        expect(info.id).toBe('street-42')
    })

    it('returns null for unknown type', () => {
        expect(mapInfo({ t: 'UNKNOWN', a: {} })).toBeNull()
    })
})

describe('mapInfos', () => {
    it('returns empty array for null', () => {
        expect(mapInfos(null)).toEqual([])
    })

    it('returns empty array for undefined', () => {
        expect(mapInfos(undefined)).toEqual([])
    })

    it('filters out null-mapped entries', () => {
        const result = mapInfos([
            { t: 'wikipedia', a: { page: 'Berlin' } },
            { t: null as any, a: {} },
        ])
        expect(result).toHaveLength(1)
        expect(result[0]).toBeInstanceOf(WikipediaInfo)
    })

    it('maps all valid entries', () => {
        const result = mapInfos([
            { t: 'wikipedia', a: { page: 'Seite1' } },
            { t: 'common', a: { t: 'txt', s: 'src', u: 'url' } },
        ])
        expect(result).toHaveLength(2)
    })
})
