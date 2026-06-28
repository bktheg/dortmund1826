/**
 * Encoding helpers for multi-address building links on the `vector-do1914` layer.
 *
 * A `gebaeudef` tile feature carries an `addr` property: a standard-base64 encoded
 * JSON array of `{ s: street, h: houseNumber }` pairs (one entry per house number
 * that falls inside the building polygon). The `/layer/:layername/:addr` route
 * carries the same payload as a single URL-safe (base64url) param so a building
 * with several addresses can be rendered on one page.
 *
 * The base64 codec is hand-rolled over raw bytes rather than using `btoa`/`atob`
 * so it behaves identically in the browser, Node and jsdom (jsdom's `btoa` rejects
 * even valid input in our test environment).
 */

export interface BuildingAddress {
    strasse: string
    hnr: string
}

/** Raw per-address shape as stored in the tile `addr` property and the route param. */
type AddressExport = { s: string, h: string }

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

const BASE64URL_LOOKUP: Record<string, number> = (() => {
    const lookup: Record<string, number> = {}
    for (let i = 0; i < BASE64URL_ALPHABET.length; i++) {
        lookup[BASE64URL_ALPHABET[i]] = i
    }
    return lookup
})()

function base64ToBase64Url(b64: string): string {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function bytesToBase64Url(bytes: Uint8Array): string {
    let out = ''
    for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i]
        const has1 = i + 1 < bytes.length
        const has2 = i + 2 < bytes.length
        const b1 = has1 ? bytes[i + 1] : 0
        const b2 = has2 ? bytes[i + 2] : 0
        out += BASE64URL_ALPHABET[b0 >> 2]
        out += BASE64URL_ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)]
        if (has1) {
            out += BASE64URL_ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)]
        }
        if (has2) {
            out += BASE64URL_ALPHABET[b2 & 0x3f]
        }
    }
    return out
}

function base64UrlToBytes(param: string): Uint8Array {
    const bytes: number[] = []
    let buffer = 0
    let bits = 0
    for (const ch of param) {
        if (ch === '=') {
            break
        }
        const value = BASE64URL_LOOKUP[ch]
        if (value === undefined) {
            throw new Error('invalid base64url character')
        }
        buffer = (buffer << 6) | value
        bits += 6
        if (bits >= 8) {
            bits -= 8
            bytes.push((buffer >> bits) & 0xff)
        }
    }
    return Uint8Array.from(bytes)
}

/**
 * Convert a building's standard-base64 `addr` tile property into the URL-safe
 * route param (pure ASCII transform — the payload itself is never decoded).
 */
export function addrPropertyToParam(addr: string): string {
    return base64ToBase64Url(addr)
}

/**
 * Build the URL-safe route param from explicit address pairs. Used as a fallback
 * when a feature has no `addr` property (older tiles / single legacy street+hnr).
 */
export function encodeAddressParam(addresses: BuildingAddress[]): string {
    const raw: AddressExport[] = addresses.map(a => ({ s: a.strasse, h: a.hnr }))
    return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(raw)))
}

/**
 * Decode a route param back into address pairs. Tolerant: returns `[]` for any
 * missing / malformed / non-array payload so the view can show "Nicht gefunden".
 */
export function decodeAddressParam(param: string | undefined | null): BuildingAddress[] {
    if (!param) {
        return []
    }
    try {
        const json = new TextDecoder().decode(base64UrlToBytes(param))
        const raw = JSON.parse(json)
        if (!Array.isArray(raw)) {
            return []
        }
        return raw
            .filter((e: AddressExport) => e != null && (e.s != null || e.h != null))
            .map((e: AddressExport) => ({ strasse: e.s ?? '', hnr: e.h ?? '' }))
    } catch {
        return []
    }
}
