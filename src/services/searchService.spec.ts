import { describe, it, expect } from 'vitest'
import { SearchResult, SearchResultType } from './searchService'

// Only SearchResult is exported; buildPath/isIncludedInFilter/mapTypeToEnum are module-private.

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
})
