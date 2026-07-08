/**
 * Domain DTOs and pure mappers for the address-book `by-name/` and
 * `by-gewerbe-type/` data families (Export Address Book output).
 *
 * The `by-street/` family lives in `adressdatenStore` and is intentionally
 * separate. Both families here keep every key in their JSON (empty values are
 * empty strings, never omitted), so mapping is straightforward with no
 * falsy-omission handling.
 *
 * Every entry carries BOTH the raw address (`strasse`/`hnr`, for display) and
 * the pre-normalized address (`cleanStrasse`/`cleanHnr`, for matching against
 * map/tile data). The export already normalized these — never re-run
 * `cleanStreet`/`cleanHnr` on them.
 */

/** Raw address quartet shared by every flat by-name / by-gewerbe-type entry. */
type AdresseExport = {
    s: string,  // Straße (raw)
    h: string,  // Hausnummer (raw)
    cs: string, // Straße (normalisiert)
    ch: string  // Hausnummer (normalisiert)
}

export type GewerbeTypeExport = {
    slug: string,   // Dateiname ohne .json
    t: string[],    // Bezeichnung(en)
    c: number       // Anzahl Einträge
}

export type GewerbeTypeEintragExport = AdresseExport & {
    n: string,   // Name/Firma
    z: string,   // Namenszusatz
    a: string,   // Adresszusatz
    f: string,   // Fernsprecher
    bi?: number[] // Gebäude-IDs (ogc_fid); fehlt, wenn kein Gebäude matcht
}

export type GewerbeTypeListeExport = {
    t: string[],                        // Quell-Bezeichnung(en)
    q: string,                          // Quelle
    e: GewerbeTypeEintragExport[]       // Einträge
}

export type GewerbeNameEintragExport = AdresseExport & {
    n: string,      // Name/Firma
    z: string,      // Namenszusatz
    b: string[],    // Branchen
    a: string,      // Adresszusatz
    f: string       // Fernsprecher
}

export type BehoerdeNameEintragExport = AdresseExport & {
    n: string,  // Name
    z: string,  // Detail/Namenszusatz
    k: string,  // Kategorie (im by-name als `k`, nicht `c`)
    u: string,  // Unterkategorie
    f: string   // Fernsprecher
}

export type BesitzerNameEintragExport = AdresseExport & {
    n: string,  // Besitzer
    j: string,  // Beruf
    t: string   // Art des Besitzers: E oder E*
}

export type NameListeExport<E> = {
    q: string,  // Quelle
    e: E[]      // Einträge
}

export class Adresse {
    constructor(
        public strasse: string,
        public hnr: string,
        public cleanStrasse: string,
        public cleanHnr: string
    ) {}
}

export class GewerbeType {
    constructor(
        public slug: string,
        public bezeichnungen: string[],
        public anzahl: number
    ) {}
}

export class GewerbeTypeEintrag {
    constructor(
        public name: string,
        public namenszusatz: string,
        public adresszusatz: string,
        public fernsprecher: string,
        public adresse: Adresse,
        public buildingIds: number[]
    ) {}
}

export class GewerbeTypeListe {
    constructor(
        public bezeichnungen: string[],
        public quelle: string,
        public eintraege: GewerbeTypeEintrag[]
    ) {}
}

export class GewerbeEintrag {
    constructor(
        public name: string,
        public namenszusatz: string,
        public branchen: string[],
        public adresszusatz: string,
        public fernsprecher: string,
        public adresse: Adresse
    ) {}
}

export class BehoerdeEintrag {
    constructor(
        public name: string,
        public namenszusatz: string,
        public kategorie: string,
        public unterkategorie: string,
        public fernsprecher: string,
        public adresse: Adresse
    ) {}
}

export class BesitzerEintrag {
    constructor(
        public name: string,
        public beruf: string,
        public typ: string,
        public adresse: Adresse
    ) {}
}

function mapAdresse(e: AdresseExport): Adresse {
    return new Adresse(e.s ?? '', e.h ?? '', e.cs ?? '', e.ch ?? '')
}

export function mapGewerbeType(e: GewerbeTypeExport): GewerbeType {
    return new GewerbeType(e.slug ?? '', e.t ?? [], e.c ?? 0)
}

export function mapGewerbeTypeEintrag(e: GewerbeTypeEintragExport): GewerbeTypeEintrag {
    return new GewerbeTypeEintrag(e.n, e.z, e.a, e.f, mapAdresse(e), e.bi ?? [])
}

export function mapGewerbeTypeListe(data: GewerbeTypeListeExport): GewerbeTypeListe {
    return new GewerbeTypeListe(data.t ?? [], data.q ?? '', data.e?.map(mapGewerbeTypeEintrag) ?? [])
}

export function mapGewerbeEintrag(e: GewerbeNameEintragExport): GewerbeEintrag {
    return new GewerbeEintrag(e.n, e.z, e.b ?? [], e.a, e.f, mapAdresse(e))
}

export function mapBehoerdeEintrag(e: BehoerdeNameEintragExport): BehoerdeEintrag {
    return new BehoerdeEintrag(e.n, e.z, e.k, e.u, e.f, mapAdresse(e))
}

export function mapBesitzerEintrag(e: BesitzerNameEintragExport): BesitzerEintrag {
    return new BesitzerEintrag(e.n, e.j, e.t, mapAdresse(e))
}
