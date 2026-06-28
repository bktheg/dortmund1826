// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
    addrPropertyToParam,
    encodeAddressParam,
    decodeAddressParam,
    type BuildingAddress,
} from './buildingAddresses'

const STD_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Standard base64 (with +, / and = padding) — mirrors the tile pipeline output. */
function stdBase64(str: string): string {
    const bytes = new TextEncoder().encode(str)
    let out = ''
    for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i]
        const has1 = i + 1 < bytes.length
        const has2 = i + 2 < bytes.length
        const b1 = has1 ? bytes[i + 1] : 0
        const b2 = has2 ? bytes[i + 2] : 0
        out += STD_BASE64[b0 >> 2]
        out += STD_BASE64[((b0 & 0x03) << 4) | (b1 >> 4)]
        out += has1 ? STD_BASE64[((b1 & 0x0f) << 2) | (b2 >> 6)] : '='
        out += has2 ? STD_BASE64[b2 & 0x3f] : '='
    }
    return out
}

/** Mirror of how the tile pipeline produces the `addr` property (UTF-8 base64). */
function makeAddrProperty(raw: { s: string, h: string }[]): string {
    return stdBase64(JSON.stringify(raw))
}

describe('buildingAddresses', () => {
    it('round-trips a single address through encode/decode', () => {
        const addresses: BuildingAddress[] = [{ strasse: 'Südwall', hnr: '7' }]
        expect(decodeAddressParam(encodeAddressParam(addresses))).toEqual(addresses)
    })

    it('round-trips multiple addresses preserving order', () => {
        const addresses: BuildingAddress[] = [
            { strasse: 'Rheinischestraße', hnr: '60 2/2' },
            { strasse: 'Lindenstraße', hnr: '3a' },
        ]
        expect(decodeAddressParam(encodeAddressParam(addresses))).toEqual(addresses)
    })

    it('preserves umlauts and ß through the UTF-8 aware codec', () => {
        const param = encodeAddressParam([{ strasse: 'Rheinischestraße', hnr: '60 2/2' }])
        expect(decodeAddressParam(param)[0].strasse).toBe('Rheinischestraße')
    })

    it('produces a URL-safe param (no +, /, or = characters)', () => {
        const param = encodeAddressParam([{ strasse: 'Rheinischestraße', hnr: '60 2/2' }])
        expect(param).not.toMatch(/[+/=]/)
    })

    it('decodes a tile addr property via addrPropertyToParam', () => {
        const addr = makeAddrProperty([{ s: 'Rheinischestraße', h: '60 2/2' }])
        const param = addrPropertyToParam(addr)
        expect(decodeAddressParam(param)).toEqual([{ strasse: 'Rheinischestraße', hnr: '60 2/2' }])
    })

    it('returns [] for empty, null or undefined param', () => {
        expect(decodeAddressParam('')).toEqual([])
        expect(decodeAddressParam(null)).toEqual([])
        expect(decodeAddressParam(undefined)).toEqual([])
    })

    it('returns [] for a malformed param', () => {
        expect(decodeAddressParam('@@not-base64@@')).toEqual([])
    })

    it('returns [] when the payload is valid base64 but not a JSON array', () => {
        const notArray = addrPropertyToParam(stdBase64('{"s":"x"}'))
        expect(decodeAddressParam(notArray)).toEqual([])
    })

    it('fills missing street/hnr fields with empty strings', () => {
        const addr = addrPropertyToParam(stdBase64(JSON.stringify([{ s: 'Westenhellweg' }])))
        expect(decodeAddressParam(addr)).toEqual([{ strasse: 'Westenhellweg', hnr: '' }])
    })
})
