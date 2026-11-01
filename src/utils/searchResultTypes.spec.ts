import { describe, it, expect } from 'vitest'
import { SearchResult } from '@/services/searchService'
import {
    SearchResultType,
    getResultCss,
    getResultLabel,
    countResultTypes,
    withoutHiddenTypes
} from './searchResultTypes'

function result(type:SearchResultType, typeLabel?:string, typeCss?:string):SearchResult {
    const r = new SearchResult('x', '', 'Name', type)
    r.typeLabel = typeLabel
    r.typeCss = typeCss
    return r
}

describe('searchResultTypes', () => {
    it('maps Bezeichnung and Bezeichnung-Linie to one key and label', () => {
        for (const type of [SearchResultType.BEZEICHNUNG, SearchResultType.BEZEICHNUNG_LINE]) {
            expect(getResultCss(result(type))).toBe('name')
            expect(getResultLabel(result(type))).toBe('Bezeichnung')
        }
    })

    it('keeps Verwaltungseinheit, Flur and Dorf/Stadt apart despite the shared colour', () => {
        const keys = [SearchResultType.ADMIN, SearchResultType.FLUR, SearchResultType.ORT].map(t => getResultCss(result(t)))
        expect(keys).toEqual(['admin', 'flur', 'town'])
    })

    it('prefers the label and key a layer provides', () => {
        const r = result(SearchResultType.GEWERBE, 'Gewerbe', 'gewerbe')
        expect(getResultCss(r)).toBe('gewerbe')
        expect(getResultLabel(r)).toBe('Gewerbe')
    })

    it('counts every type in order of first appearance and skips untyped hits', () => {
        const counts = countResultTypes([
            result(SearchResultType.GEWAESSER),
            result(SearchResultType.BEZEICHNUNG),
            result(SearchResultType.BEZEICHNUNG_LINE),
            result(SearchResultType.PARZELLE),
            result(SearchResultType.GEWAESSER)
        ])
        expect(counts).toEqual([
            {key:'gewaesser', label:'Gewässer', count:2},
            {key:'name', label:'Bezeichnung', count:2}
        ])
    })

    it('removes hidden types only', () => {
        const all = [result(SearchResultType.GEWAESSER), result(SearchResultType.FLUR), result(SearchResultType.PARZELLE)]
        expect(withoutHiddenTypes(all, new Set(['gewaesser'])).map(r => r.typeEnum))
            .toEqual([SearchResultType.FLUR, SearchResultType.PARZELLE])
        expect(withoutHiddenTypes(all, new Set())).toBe(all)
        expect(withoutHiddenTypes(all, undefined)).toBe(all)
    })
})
