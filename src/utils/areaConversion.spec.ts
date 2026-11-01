// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { areaToFuss, areaToSquareMeters, formatSquareMeterTooltip } from './areaConversion'

describe('areaConversion', () => {
    it('converts a full value (1 Morgen = 18000 Fuß)', () => {
        expect(areaToFuss('1.0.0')).toBe(18000)
        expect(areaToSquareMeters('1.0.0')).toBeCloseTo(2553.22, 1)
        expect(formatSquareMeterTooltip('1.0.0')).toBe('≈ 2.553,2 m²')
    })

    it('handles decimal-comma Fuß', () => {
        expect(areaToFuss('0.12.34,5')).toBe(1234.5)
    })

    it('treats missing parts as 0', () => {
        expect(areaToFuss('0.5')).toBe(500)
        expect(areaToFuss('2')).toBe(36000)
    })

    it('returns undefined for empty input', () => {
        expect(formatSquareMeterTooltip('')).toBeUndefined()
        expect(formatSquareMeterTooltip(undefined)).toBeUndefined()
        expect(formatSquareMeterTooltip(null)).toBeUndefined()
    })

    it('returns undefined for garbage without throwing', () => {
        expect(formatSquareMeterTooltip('abc')).toBeUndefined()
        expect(formatSquareMeterTooltip('1.2.3.4')).toBeUndefined()
        expect(formatSquareMeterTooltip('1.x.3')).toBeUndefined()
    })
})
