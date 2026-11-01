// Historic Prussian area units, mirrored from genmap's unitConversion.ts
const FUSS_PER_RUTE = 100; // 100, not 144
const RUTEN_PER_MORGEN = 180;
const SQM_PER_100_FUSS = 14.18457880;

/** Parses "Morgen.Ruten.Fuß" (Fuß may use a decimal comma) into total Fuß; missing parts count as 0. */
export function areaToFuss(area?:string|null):number|undefined {
    if( !area ) {
        return undefined;
    }
    const parts = area.trim().split('.');
    if( parts.length > 3 ) {
        return undefined;
    }
    const morgen = parts[0] ? Number(parts[0]) : 0;
    const ruten = parts[1] ? Number(parts[1]) : 0;
    const fuss = parts[2] ? Number(parts[2].replace(',', '.')) : 0;
    if( [morgen, ruten, fuss].some(n => !Number.isFinite(n)) ) {
        return undefined;
    }
    return morgen*RUTEN_PER_MORGEN*FUSS_PER_RUTE + ruten*FUSS_PER_RUTE + fuss;
}

export function fussToSquareMeters(fuss:number):number {
    return fuss/100 * SQM_PER_100_FUSS;
}

export function areaToSquareMeters(area?:string|null):number|undefined {
    const fuss = areaToFuss(area);
    return fuss === undefined ? undefined : fussToSquareMeters(fuss);
}

const sqmFormat = new Intl.NumberFormat('de-DE', {maximumFractionDigits: 1});

export function formatSquareMeterTooltip(area?:string|null):string|undefined {
    const sqm = areaToSquareMeters(area);
    return sqm === undefined ? undefined : `≈ ${sqmFormat.format(sqm)} m²`;
}
