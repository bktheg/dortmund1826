import type { RouteLocationRaw } from 'vue-router'
import { Gemeinde, Buergermeisterei, Flur } from '@/stores/flurStore'
import { useFlurStore } from '@/stores/flurStore'
import { useBezeichnungStore } from '@/stores/bezeichnungStore'
import { useEigentuemerStore } from '@/stores/eigentuemerStore'
import { useAllParzellenStore } from '@/stores/allParzellenStore'
import { useHaeuserbuchStore } from '@/stores/haeuserbuchStore'
import { createPhoneticMatcher, classifyMatch, bestRank } from '@/utils/phoneticMatch'
import type { PhoneticMatcher, MatchKind } from '@/utils/phoneticMatch'
import { SearchResultType, countResultTypes, withoutHiddenTypes } from '@/utils/searchResultTypes'
import type { ResultTypeCount } from '@/utils/searchResultTypes'

export { SearchResultType }

export type SearchOptions = {
    phonetic?:boolean
    // Result types (see getResultCss) to leave out. They are dropped before the
    // maxResults cap, so the other types get the freed budget.
    hiddenTypes?:ReadonlySet<string>
    // Receives every type of the matches with its count, before hiding and before
    // the cap, so the caller can still offer a hidden type for re-enabling.
    onTypeCounts?:(types:ResultTypeCount[]) => void
}

export class SearchResult {
    public descriptions:string[] = []
    public route?:RouteLocationRaw
    public location?:number[]
    public zoom?:number
    // Set by layer search providers so they can label and colour their own
    // result types without SearchView having to know them.
    public typeLabel?:string
    public typeCss?:string
    // A hit that matched only by sound ranks behind the exact hits and is
    // highlighted word-wise, since the term itself does not occur in it.
    public phoneticOnly = false
    // 0 = exact, then 1 equal sound, 2 name at the start of a word, 3 name inside a
    // compound (see MatchKind). Phonetic hits are listed best rank first.
    public matchRank = 0
    public phoneticMatcher?:PhoneticMatcher

    constructor(
        public term:string,
        public locationDesc:string,
        public name:string,
        public typeEnum:SearchResultType,
        public gemeinde?:Gemeinde) {}

    getHighlightedName():string {
        return this.highlight(this.name)
    }

    getHighlightedDescriptions():string[] {
        return this.descriptions.map(h => this.highlight(h))
    }

    // The result is rendered with v-html, so the source text is escaped before the
    // match markers go in — a name or description is data, never markup.
    private highlight(text:string):string {
        const idx = text.toLocaleLowerCase().indexOf(this.term.toLocaleLowerCase())
        if( idx < 0 ) {
            return this.highlightRanges(text, this.phoneticMatcher?.(text)?.ranges ?? [], '<b><u class="phonetic" title="Klingt ähnlich">')
        }
        return this.highlightRanges(text, [[idx, idx + this.term.length]], '<b><u>')
    }

    private highlightRanges(text:string, ranges:[number, number][], openTag:string):string {
        const sorted = [...ranges].sort((a,b) => a[0]-b[0])
        let html = ''
        let pos = 0
        for( const [start, end] of sorted ) {
            if( start < pos ) {
                continue
            }
            html += escapeHtml(text.substring(pos,start))
                + openTag + escapeHtml(text.substring(start,end)) + '</u></b>'
            pos = end
        }
        return html + escapeHtml(text.substring(pos))
    }
}

function escapeHtml(text:string):string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

export function searchByTerm(term:string, searchType:string, adminFilter:string[], maxResults:number, options?:SearchOptions):SearchResult[] {
    if( !term ) {
        return [];
    }

    const matcher = options?.phonetic && searchType != "parzelle" ? createPhoneticMatcher(term) : undefined
    // Collecting stops early at maxResults — with phonetic hits in play that would cut
    // off exact hits that only come later in the data, so it must not stop.
    // The same goes for type counts and hidden types: both need every match.
    const stopAt = matcher || options?.onTypeCounts || options?.hiddenTypes?.size ? Infinity : maxResults
    const kindOf = (text:string|undefined):MatchKind => classifyMatch(text, term, matcher)
    const mark = (searchResult:SearchResult, ...kinds:MatchKind[]):SearchResult => {
        searchResult.phoneticOnly = !kinds.includes('exact')
        searchResult.matchRank = bestRank(kinds)
        searchResult.phoneticMatcher = matcher
        return searchResult
    }

    let result = [];
    const flurStore = useFlurStore();
    
    if( searchType == "lage" ) { 
        const bezeichnungStore = useBezeichnungStore();

        for( const bz of bezeichnungStore.bezeichnungen ) {
            const kind = kindOf(bz.n)
            if( kind != 'none' ) {
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
                result.push(mark(searchResult, kind))
            }
        }
        for( const gemeinde of flurStore.gemeinden ) {
            const kind = kindOf(gemeinde.name)
            if( kind != 'none' ) {
                const searchResult = new SearchResult(
                    term,
                    buildPath(gemeinde.buergermeisterei),
                    `Gemeinde ${gemeinde.name}`,
                    SearchResultType.ADMIN,
                    gemeinde
                )
                searchResult.location = gemeinde.bbox
                result.push(mark(searchResult, kind))
            }
        }
        for( const flur of flurStore.flure ) {
            const gemeinde = flur.gemeinde;
            const kind = kindOf(flur.name)
            if( kind != 'none' ) {
                const searchResult = new SearchResult(
                    term,
                    buildPath(gemeinde),
                    `Flur ${flur.nr} gnt. ${flur.name}`,
                    SearchResultType.FLUR,
                    gemeinde
                )
                searchResult.location = flur.bbox
                result.push(mark(searchResult, kind))
            }
        }

        result.sort((a,b) => a.matchRank-b.matchRank || b.typeEnum-a.typeEnum)
    }
    else if( searchType == "owner" ) {
        const eigentuemerStore = useEigentuemerStore();
        for( const owner of eigentuemerStore.eigentuemer ) {
            const kind = kindOf(owner.name)
            if( kind != 'none' ) {
                const gemeinde = flurStore.getGemeindeById(owner.gemeindeId);
                const searchResult = new SearchResult(
                    term,
                    buildPath(gemeinde),
                    owner.name,
                    SearchResultType.OWNER,
                    gemeinde
                )
                searchResult.route = {name: "mutterrolle", params:{gemeinde:owner.gemeindeId, artikelNr: owner.id}}
                result.push(mark(searchResult, kind));
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
                const kinds:MatchKind[] = []
                const collect = (text:string, hit:string = text) => {
                    const kind = kindOf(text)
                    if( kind != 'none' ) {
                        hits.push(hit)
                        kinds.push(kind)
                    }
                }
                collect(street.name)
                for( const info of street.infos ) {
                    collect(info.text)
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
                    result.push(mark(searchResult, ...kinds));

                    if( result.length > stopAt ) {
                        break;
                    }
                }
            }

            for( const building of hb.buildings ) {
                const hits:string[] = []
                const kinds:MatchKind[] = []
                const collect = (text:string, hit:string = text) => {
                    const kind = kindOf(text)
                    if( kind != 'none' ) {
                        hits.push(hit)
                        kinds.push(kind)
                    }
                }
                for( const info of building.infos ) {
                    collect(info.text)
                }
                for( const info of building.ownerList ) {
                    collect(info.text, (info.year ? info.year+' ' : '') + info.text)
                }
                for( const info of building.additionalInfos ) {
                    collect(info.text)
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
                    result.push(mark(searchResult, ...kinds));

                    if( result.length > stopAt ) {
                        break;
                    }
                }
            }
        }
    }

    if( matcher ) {
        result.sort((a,b) => a.matchRank-b.matchRank)
    }

    if( !adminFilter.includes('__all') ) {
        result = result.filter(r => isIncludedInFilter(adminFilter, r.gemeinde));
    }

    options?.onTypeCounts?.(countResultTypes(result))

    return withoutHiddenTypes(result, options?.hiddenTypes).slice(0,maxResults);
}

function buildPath(admin:Gemeinde|Buergermeisterei|Flur):string {
    if( admin instanceof Gemeinde ) {
        return `Kreis ${admin.buergermeisterei.kreis.name} > Bürgermeisterei ${admin.buergermeisterei.name} > Gemeinde ${admin.name}`
    }
    else if( admin instanceof Buergermeisterei ) {
        return `Kreis ${admin.kreis.name} > Bürgermeisterei ${admin.name}`
    }
    else if( admin instanceof Flur ) {
        return `Kreis ${admin.gemeinde.buergermeisterei.kreis.name} > Bürgermeisterei ${admin.gemeinde.buergermeisterei.name} > Gemeinde ${admin.gemeinde.name} > Flur ${admin.nr} gnt. ${admin.name}`
    }
    return ''
}

function isIncludedInFilter(adminFilter:string[], gemeinde?:Gemeinde):boolean {
    if( adminFilter.includes('__all') ) {
        return true
    }
    // A result without a Gemeinde (layer search) cannot be excluded by a Gemeinde filter
    if( !gemeinde ) {
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