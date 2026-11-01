import { describe, it, expect } from 'vitest'
import { buildGebaeudefHighlightFilter, resolveTopHover } from './hoverUtils'

describe('buildGebaeudefHighlightFilter', () => {
    it('filters on gebaeude_id only', () => {
        expect(buildGebaeudefHighlightFilter(42)).toEqual(['==', ['get', 'gebaeude_id'], 42])
    })

    it('keeps id 0 as a valid id', () => {
        expect(buildGebaeudefHighlightFilter(0)).toEqual(['==', ['get', 'gebaeude_id'], 0])
    })

    it('matches nothing when the feature has no gebaeude_id', () => {
        expect(buildGebaeudefHighlightFilter(undefined)).toBe(false)
        expect(buildGebaeudefHighlightFilter(null)).toBe(false)
    })
})

describe('resolveTopHover', () => {
    const feat = (id: number) => ({ id })

    it('returns null when there are no candidates', () => {
        expect(resolveTopHover([])).toBeNull()
    })

    it('returns null when every candidate has no features', () => {
        expect(resolveTopHover([
            { storeIndex: 0, features: [] },
            { storeIndex: 3, features: [] },
        ])).toBeNull()
    })

    it('returns the only candidate that has features', () => {
        const winner = { storeIndex: 4, features: [feat(1)] }
        expect(resolveTopHover([
            { storeIndex: 0, features: [] },
            winner,
        ])).toBe(winner)
    })

    it('picks the lowest store index among candidates with features', () => {
        const high = { storeIndex: 0, features: [feat(1)] }
        const low = { storeIndex: 4, features: [feat(2)] }
        expect(resolveTopHover([low, high])).toBe(high)
    })

    it('generalizes to N (>2) layers and ignores empty ones', () => {
        const a = { storeIndex: 5, features: [feat(1)] }
        const b = { storeIndex: 2, features: [feat(2)] }
        const c = { storeIndex: 1, features: [] }
        const d = { storeIndex: 3, features: [feat(3)] }
        expect(resolveTopHover([a, b, c, d])).toBe(b)
    })

    it('preserves arbitrary payload on the winning candidate', () => {
        const winner = { storeIndex: 1, features: [feat(9)], layerId: 'vector-do1914' }
        const result = resolveTopHover([
            { storeIndex: 2, features: [feat(8)], layerId: '1826' },
            winner,
        ])
        expect(result?.layerId).toBe('vector-do1914')
    })
})
