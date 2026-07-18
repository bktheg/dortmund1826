import { describe, it, expect } from 'vitest'
import { matchesHnr } from './addressComparatorService'

describe('matchesHnr', () => {
    it('matches identical house numbers', () => {
        expect(matchesHnr('7', '7')).toBe(true)
    })

    it('does not match different single house numbers', () => {
        expect(matchesHnr('7', '9')).toBe(false)
    })

    it('matches a single number inside a range', () => {
        expect(matchesHnr('15', '13-17')).toBe(true)
        expect(matchesHnr('13-17', '15')).toBe(true)
    })

    it('matches the boundary of a range', () => {
        expect(matchesHnr('13', '13-17')).toBe(true)
        expect(matchesHnr('17', '13-17')).toBe(true)
    })

    it('does not match a number outside a range', () => {
        expect(matchesHnr('19', '13-17')).toBe(false)
    })

    it('never matches across even and odd', () => {
        expect(matchesHnr('14', '13-17')).toBe(false)
        expect(matchesHnr('16', '13')).toBe(false)
    })

    it('matches overlapping ranges', () => {
        expect(matchesHnr('11-15', '13-19')).toBe(true)
    })

    it('matches a letter-suffixed number inside a letter range', () => {
        expect(matchesHnr('15b', '15a-c')).toBe(true)
        expect(matchesHnr('15d', '15a-c')).toBe(false)
    })

    it('returns false for null or empty inputs', () => {
        expect(matchesHnr(null, '7')).toBe(false)
        expect(matchesHnr('7', null)).toBe(false)
        expect(matchesHnr('', '7')).toBe(false)
    })

    it('returns false (no throw) for an unparseable house number', () => {
        expect(matchesHnr('abc', '13-17')).toBe(false)
    })

    it('matches a #-prefixed house number against its plain form', () => {
        expect(matchesHnr('#15', '15')).toBe(true)
        expect(matchesHnr('15', '#15')).toBe(true)
        expect(matchesHnr('#15', '13-17')).toBe(true)
        expect(matchesHnr('#15', '17')).toBe(false)
    })

    it('matches a space-separated fraction against its plain number range', () => {
        expect(matchesHnr('10 1/2', '10 1/2')).toBe(true)
        expect(matchesHnr('10 1/2', '10-12')).toBe(true)
        expect(matchesHnr('10 1/2', '12-14')).toBe(false)
    })
})
