import type {RouteLocationRaw} from 'vue-router'
import type {Gemeinde} from '../stores/flurStore'
import {useFlurStore} from '../stores/flurStore'
import {useBezeichnungStore} from '../stores/bezeichnungStore'
import {useEigentuemerStore} from '../stores/eigentuemerStore'

export type SearchResult = {
    locationDesc:string,
    name:string,
    location:number[]|null,
    typeEnum:SearchResultType,
    route:RouteLocationRaw|null,
    gemeinde:Gemeinde
}

export enum SearchResultType {
    BEZEICHNUNG=1,
    BEZEICHNUNG_LINE=2,
    GEBAEUDE=3,
    GEWAESSER=4,
    FLUR=5,
    ORT=6,
    OWNER=7
}


export function searchByTerm(term:string, searchType:string, adminFilter:string[], maxResults:number):SearchResult[] {
    if( !term ) {
        return [];
    }

    let result = [];
    const flurStore = useFlurStore();
    
    if( searchType == "lage" ) { 
        const bezeichnungStore = useBezeichnungStore();

        for( const bz of bezeichnungStore.bezeichnungen ) {
            if( bz.n.toLocaleLowerCase().includes(term) ) {
                const flur = flurStore.getFlurById(bz.g, bz.f);
                const gemeinde = flurStore.getGemeindeById(bz.g);
                result.push({
                    locationDesc: flur != null ? `Kreis ${flur.kreis} > Bürgermeisterei ${flur.bmstr} > Gemeinde ${flur.gem} > Flur ${flur.nr} gnt. ${flur.name}` : "",
                    location: bz.l,
                    name: bz.n,
                    typeEnum: mapTypeToEnum(bz.t),
                    gemeinde: gemeinde
                } as SearchResult);
            }
        }
        for( const flur of flurStore.flure ) {
            const gemeinde = flurStore.getGemeindeById(flur.gid);
            if( flur.name.toLocaleLowerCase().includes(term) ) {
                result.push({
                    locationDesc: `Kreis ${flur.kreis} > Bürgermeisterei ${flur.bmstr} > Gemeinde ${flur.gem}`,
                    location: flur.box,
                    name: `Flur ${flur.nr} gnt. ${flur.name}`,
                    typeEnum: SearchResultType.FLUR,
                    gemeinde: gemeinde
                } as SearchResult);
            }
        }
    }
    else {
        const eigentuemerStore = useEigentuemerStore();
        for( const owner of eigentuemerStore.eigentuemer ) {
            if( owner.name && owner.name.toLocaleLowerCase().includes(term) ) {
                const gemeinde = flurStore.getGemeindeById(owner.gemeindeId);
                result.push({
                    locationDesc: `Kreis ${gemeinde.kreis} > Bürgermeisterei ${gemeinde.buergermeisterei} > Gemeinde ${gemeinde.name}`,
                    location: null,
                    name: owner.name,
                    typeEnum: SearchResultType.OWNER,
                    route: {name: "mutterrolle", params:{gemeinde:owner.gemeindeId, artikelNr: owner.id}},
                    gemeinde: gemeinde
                } as SearchResult);
            }
        }
    }

    if( !adminFilter.includes('__all') ) {
        result = result.filter(r => adminFilter.includes(r.gemeinde.id) || adminFilter.includes('kreis-'+r.gemeinde.kreis) || adminFilter.includes('bmstr-'+r.gemeinde.buergermeisterei));
    }
    result.sort((a,b) => b.typeEnum-a.typeEnum)

    return result.slice(0,maxResults);
}

function mapTypeToEnum(type:number):SearchResultType {
    if( type == null ) {
        return SearchResultType.BEZEICHNUNG;
    }
    switch(type) {
    case 0:
        return SearchResultType.BEZEICHNUNG;
    case 1:
        return SearchResultType.ORT;
    case 101:
        return SearchResultType.GEWAESSER;
    case 102:
        return SearchResultType.BEZEICHNUNG_LINE;
    case 50:
        return SearchResultType.GEBAEUDE;
    }
    return SearchResultType.BEZEICHNUNG;
}