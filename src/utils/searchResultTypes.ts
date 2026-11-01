import type { SearchResult } from '@/services/searchService'

export enum SearchResultType {
    BEZEICHNUNG=1,
    BEZEICHNUNG_LINE=2,
    GEBAEUDE=3,
    GEWAESSER=4,
    ADMIN=5,
    FLUR=6,
    ORT=7,
    OWNER=8,
    PARZELLE=9,
    GEWERBE=10,
    BEHOERDE=11,
    STRASSE=12,
    ADRESSBUCH_BESITZER=13
}

export type ResultTypeCount = {
    key:string
    label:string
    count:number
}

export function getTypeLabel(type:SearchResultType):string | undefined {
    switch(type) {
        case SearchResultType.ADMIN:
            return "Verwaltungseinheit";
        case SearchResultType.FLUR:
            return "Flur";
        case SearchResultType.ORT:
            return "Dorf/Stadt";
        case SearchResultType.BEZEICHNUNG:
        case SearchResultType.BEZEICHNUNG_LINE:
            return "Bezeichnung";
        case SearchResultType.GEWAESSER:
            return "Gewässer";
        case SearchResultType.GEBAEUDE:
            return "Gebäude";
        case SearchResultType.OWNER:
            return "Eigentümer";
    }
}

export function getTypeCss(type:SearchResultType):string | undefined {
    switch(type) {
        case SearchResultType.ADMIN:
            return "admin";
        case SearchResultType.FLUR:
            return "flur";
        case SearchResultType.ORT:
            return "town";
        case SearchResultType.BEZEICHNUNG:
        case SearchResultType.BEZEICHNUNG_LINE:
            return "name";
        case SearchResultType.GEWAESSER:
            return "gewaesser";
        case SearchResultType.GEBAEUDE:
            return "gebaeude";
        case SearchResultType.OWNER:
            return "owner";
    }
}

export function getResultLabel(match:SearchResult):string | undefined {
    return match.typeLabel ?? getTypeLabel(match.typeEnum)
}

// Also the key a result type is toggled by.
export function getResultCss(match:SearchResult):string | undefined {
    return match.typeCss ?? getTypeCss(match.typeEnum)
}

// Types in order of first appearance. Results without a type key (Parzelle hits) are
// not a toggleable type and are left out.
export function countResultTypes(results:SearchResult[]):ResultTypeCount[] {
    const counts = new Map<string, ResultTypeCount>()
    for( const r of results ) {
        const key = getResultCss(r)
        if( !key ) {
            continue
        }
        const entry = counts.get(key)
        if( entry ) {
            entry.count++
        }
        else {
            counts.set(key, {key, label:getResultLabel(r) ?? key, count:1})
        }
    }
    return [...counts.values()]
}

export function withoutHiddenTypes(results:SearchResult[], hiddenTypes?:ReadonlySet<string>):SearchResult[] {
    if( !hiddenTypes || hiddenTypes.size == 0 ) {
        return results
    }
    return results.filter(r => {
        const key = getResultCss(r)
        return !key || !hiddenTypes.has(key)
    })
}
