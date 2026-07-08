import { describe, it, expect } from 'vitest'
import { buildBuildingIdHighlightFilter } from './gewerbeHighlight'

describe('buildBuildingIdHighlightFilter', () => {
    it('returns false for an empty list', () => {
        expect(buildBuildingIdHighlightFilter([])).toBe(false)
    })

    it('builds an id-membership filter over the feature id', () => {
        expect(buildBuildingIdHighlightFilter([8, 7855])).toEqual(
            ['in', ['id'], ['literal', [8, 7855]]])
    })
})
