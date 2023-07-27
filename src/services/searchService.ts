import type { RouteLocationRaw } from 'vue-router'
import { Gemeinde, Buergermeisterei, Flur } from '@/stores/flurStore'
import { useFlurStore } from '@/stores/flurStore'
import { useBezeichnungStore } from '@/stores/bezeichnungStore'
import { useEigentuemerStore } from '@/stores/eigentuemerStore'
import { useAllParzellenStore } from '@/stores/allParzellenStore'
import { useHaeuserbuchStore } from '@/stores/haeuserbuchStore'

export class SearchResult {
    public descriptions:string[] = []
    public route?:RouteLocationRaw
    public location?:number[]

    constructor(
        public term:string,
        public locationDesc:string,
        public name:string,
        public typeEnum:SearchResultType,
        public gemeinde:Gemeinde) {}

    getHighlightedDescriptions():string[] {
        return this.descriptions.map(h => {
            const idx = h.toLocaleLowerCase().indexOf(this.term)
            const idx2 = idx + this.term.length
            return h.substring(0,idx) + '<b><u>' + h.substring(idx,idx2) + '</u></b>' + h.substring(idx2)
        })
    }
}

export enum SearchResultType {
    BEZEICHNUNG=1,
    BEZEICHNUNG_LINE=2,
    GEBAEUDE=3,
    GEWAESSER=4,
    ADMIN=5,
    FLUR=6,
    ORT=7,
    OWNER=8,
    PARZELLE=9
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
                const searchResult = new SearchResult(
                    term,
                    flur != null ? buildPath(flur) : buildPath(gemeinde),
                    bz.n,
                    mapTypeToEnum(bz.t),
                    gemeinde
                )
                searchResult.location = bz.l
                result.push(searchResult)
            }
        }
        for( const gemeinde of flurStore.gemeinden ) {
            if( gemeinde.name.toLocaleLowerCase().includes(term) ) {
                const searchResult = new SearchResult(
                    term,
                    buildPath(gemeinde.buergermeisterei),
                    `Gemeinde ${gemeinde.name}`,
                    SearchResultType.ADMIN,
                    gemeinde
                )
                searchResult.location = gemeinde.bbox
                result.push(searchResult)
            }
        }
        for( const flur of flurStore.flure ) {
            const gemeinde = flur.gemeinde;
            if( flur.name.toLocaleLowerCase().includes(term) ) {
                const searchResult = new SearchResult(
                    term,
                    buildPath(gemeinde),
                    `Flur ${flur.nr} gnt. ${flur.name}`,
                    SearchResultType.FLUR,
                    gemeinde
                )
                searchResult.location = flur.bbox
                result.push(searchResult)
            }
        }

        result.sort((a,b) => b.typeEnum-a.typeEnum)
    }
    else if( searchType == "owner" ) {
        const eigentuemerStore = useEigentuemerStore();
        for( const owner of eigentuemerStore.eigentuemer ) {
            if( owner.name && owner.name.toLocaleLowerCase().includes(term) ) {
                const gemeinde = flurStore.getGemeindeById(owner.gemeindeId);
                const searchResult = new SearchResult(
                    term,
                    buildPath(gemeinde),
                    owner.name,
                    SearchResultType.OWNER,
                    gemeinde
                )
                searchResult.route = {name: "mutterrolle", params:{gemeinde:owner.gemeindeId, artikelNr: owner.id}}
                result.push(searchResult);
            }
        }
    }
    else if( searchType == "parzelle" ) {
        if( term.match(/[0-9]+\-[0-9]+[a-zA-Z]?/) ) {
            const allParzellenStore = useAllParzellenStore()
            const eigentuemerStore = useEigentuemerStore()
            for( const p of allParzellenStore.parzellen ) {
                if( `${p.flur}-${p.parzelle}`.includes(term) ) {
                    const gemeinde = flurStore.getGemeindeById(p.gemeindeId);
                    if( !isIncludedInFilter(adminFilter, gemeinde) ) {
                        continue
                    }
                    const eigentuemer = eigentuemerStore.eigentuemer.find(e => e.gemeindeId == p.gemeindeId && e.id == p.artikel);
                    const searchResult = new SearchResult(
                        term,
                        buildPath(gemeinde),
                        `${p.flur}-${p.parzelle} (${eigentuemer?.name})`,
                        SearchResultType.PARZELLE,
                        gemeinde
                    )
                    searchResult.location = p.location
                    result.push(searchResult);
                    
                    if( result.length > maxResults ) {
                        break;
                    }
                }
            }
        }
    }
    else if( searchType == "haeuserbuch" ) {
        const hbStore = useHaeuserbuchStore();
        for( const hb of hbStore.haeuserbuecher.values() ) {
            for( const street of hb.streets ) {
                const hits:string[] = []
                if( street.name.toLocaleLowerCase().includes(term) ) {
                    hits.push(street.name)
                }
                for( const info of street.infos ) {
                    if( info.text.toLocaleLowerCase().includes(term) ) {
                        hits.push(info.text)
                    }
                }

                if( hits.length > 0 ) {
                    const gemeinde = flurStore.getGemeindeById(hb.gemeindeId);
                    const searchResult = new SearchResult(
                        term,
                        buildPath(gemeinde),
                        street.name,
                        SearchResultType.BEZEICHNUNG_LINE,
                        gemeinde
                    )
                    searchResult.route = {name: "haeuserbuch", params:{gemeinde:gemeinde.id, id: street.id}}
                    searchResult.descriptions = hits
                    result.push(searchResult);

                    if( result.length > maxResults ) {
                        break;
                    }
                }
            }

            for( const building of hb.buildings ) {
                const hits:string[] = []
                for( const info of building.infos ) {
                    if( info.text.toLocaleLowerCase().includes(term) ) {
                        hits.push(info.text)
                    }
                }
                for( const info of building.ownerList ) {
                    if( info.text.toLocaleLowerCase().includes(term) ) {
                        hits.push((info.year ? info.year+' ' : '') + info.text)
                    }
                }
                for( const info of building.additionalInfos ) {
                    if( info.text.toLocaleLowerCase().includes(term) ) {
                        hits.push(info.text)
                    }
                }

                if( hits.length > 0 ) {
                    const gemeinde = flurStore.getGemeindeById(hb.gemeindeId);
                    const searchResult = new SearchResult(
                        term,
                        buildPath(gemeinde),
                        building.getAddress() || '',
                        SearchResultType.GEBAEUDE,
                        gemeinde
                    )
                    searchResult.route = {name: "haeuserbuch", params:{gemeinde:gemeinde.id, id: building.id}}
                    searchResult.descriptions = hits
                    result.push(searchResult);

                    if( result.length > maxResults ) {
                        break;
                    }
                }
            }
        }
    }

    if( !adminFilter.includes('__all') ) {
        result = result.filter(r => isIncludedInFilter(adminFilter, r.gemeinde));
    }


    return result.slice(0,maxResults);
}

function buildPath(admin:Gemeinde|Buergermeisterei|Flur):string {
    if( admin instanceof Gemeinde ) {
        return `Kreis ${admin.buergermeisterei.kreis.name} > Bürgermeisterei ${admin.buergermeisterei.name} > Gemeinde ${admin.name}`
    }
    else if( admin instanceof Buergermeisterei ) {
        `Kreis ${admin.kreis.name} > Bürgermeisterei ${admin.name}`
    }
    else if( admin instanceof Flur ) {
        `Kreis ${admin.gemeinde.buergermeisterei.kreis.name} > Bürgermeisterei ${admin.gemeinde.buergermeisterei.name} > Gemeinde ${admin.gemeinde.name} > Flur ${admin.nr} gnt. ${admin.name}`
    }
    return ''
}

function isIncludedInFilter(adminFilter:string[], gemeinde:Gemeinde):boolean {
    if( adminFilter.includes('__all') ) {
        return true
    }
    return adminFilter.includes(gemeinde.id) || adminFilter.includes('kreis-'+gemeinde.buergermeisterei.kreis.id) || adminFilter.includes('bmstr-'+gemeinde.buergermeisterei.id);
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