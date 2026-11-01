import { SearchResult, SearchResultType } from '@/services/searchService'
import type { SearchOptions } from '@/services/searchService'
import { countResultTypes, withoutHiddenTypes } from '@/utils/searchResultTypes'
import { createPhoneticMatcher, classifyMatch, bestRank } from '@/utils/phoneticMatch'
import type { PhoneticMatcher, MatchKind } from '@/utils/phoneticMatch'
import { useAdressbuchNameStore } from '@/stores/adressbuchNameStore'
import { useAdressdatenStore } from '@/stores/adressdatenStore'
import type { Adresse } from '@/models/adressbuch'

/**
 * Search inside the address-book data of the `vector-do1914` layer.
 *
 * This is the layer's own search feature, not a feature of the search view:
 * SearchView discovers it through the layer search registry and only renders
 * the shared SearchResult list. Everything do1914-specific — which files to
 * load, which fields to match, how a hit is labelled and coloured — lives here.
 *
 * Data source: the `by-name/` lists (gewerbe, behörden, owners) plus the
 * `by-street/_index.json` street index. Entries whose address matched no
 * building carry no `center`, so their results simply cannot move the map.
 */

const RESULT_ZOOM = 16

export function prefetchDo1914(): void {
    const nameStore = useAdressbuchNameStore()
    const adressdatenStore = useAdressdatenStore()

    nameStore.fetchGewerbe()
    nameStore.fetchBehoerden()
    nameStore.fetchBesitzer()
    adressdatenStore.fetchStrassenIndex()
}

export function isDo1914Loading(): boolean {
    const nameStore = useAdressbuchNameStore()
    const adressdatenStore = useAdressdatenStore()

    return nameStore.loadingGewerbe
        || nameStore.loadingBehoerden
        || nameStore.loadingBesitzer
        || adressdatenStore.loadingIndex
}

/**
 * `term` is expected already trimmed and lower-cased by the caller, exactly as
 * the other searches in searchService receive it.
 */
export function searchDo1914(term:string, maxResults:number, options?:SearchOptions):SearchResult[] {
    if( !term ) {
        return []
    }

    const matcher = options?.phonetic ? createPhoneticMatcher(term) : undefined

    const nameStore = useAdressbuchNameStore()
    const adressdatenStore = useAdressdatenStore()

    // Every match is collected before the budget is applied — capping a category while
    // collecting would truncate it in export-file order, so the sort below could no
    // longer surface the alphabetically first hits.
    const strassen:SearchResult[] = []
    for( const strasse of adressdatenStore.strassenIndex ) {
        const kind = classifyMatch(strasse.name, term, matcher)
        if( kind !== 'none' ) {
            strassen.push(buildResult(term, matcher, [kind], strasse.name, '', SearchResultType.STRASSE, [], strasse.center))
        }
    }

    const gewerbe:SearchResult[] = []
    for( const e of nameStore.gewerbe ) {
        const hits = collectHits(term, matcher, [e.namenszusatz, e.adresszusatz])
        const nameKind = classifyMatch(e.name, term, matcher)
        if( nameKind === 'none' && hits.length === 0 ) {
            continue
        }
        const branchen = e.branchen.filter(b => !!b).join(', ')
        const hitTexts = hits.map(h => h.text)
        const descriptions = branchen ? [branchen, ...hitTexts] : hitTexts
        gewerbe.push(buildResult(term, matcher, [nameKind, ...hits.map(h => h.kind)], e.name, adresseText(e.adresse), SearchResultType.GEWERBE, descriptions, e.center))
    }

    const behoerden:SearchResult[] = []
    for( const e of nameStore.behoerden ) {
        const hits = collectHits(term, matcher, [e.namenszusatz])
        const nameKind = classifyMatch(e.name, term, matcher)
        if( nameKind === 'none' && hits.length === 0 ) {
            continue
        }
        const kategorie = [e.kategorie, e.unterkategorie].filter(k => !!k).join(' > ')
        const hitTexts = hits.map(h => h.text)
        const descriptions = kategorie ? [kategorie, ...hitTexts] : hitTexts
        behoerden.push(buildResult(term, matcher, [nameKind, ...hits.map(h => h.kind)], e.name, adresseText(e.adresse), SearchResultType.BEHOERDE, descriptions, e.center))
    }

    const besitzer:SearchResult[] = []
    for( const e of nameStore.besitzer ) {
        const kind = classifyMatch(e.name, term, matcher)
        if( kind !== 'none' ) {
            besitzer.push(buildResult(term, matcher, [kind], e.name, adresseText(e.adresse), SearchResultType.ADRESSBUCH_BESITZER, e.beruf ? [e.beruf] : [], e.center))
        }
    }

    // Sort inside each category first, so a category that gets truncated by the budget
    // gives up its alphabetically last hits rather than whatever the export file
    // happened to list last. Phonetic hits go last, loosest match last of all, so they are dropped first.
    for( const category of [strassen, gewerbe, behoerden, besitzer] ) {
        category.sort((a, b) => a.matchRank - b.matchRank || byName(a, b))
    }

    // The budget is still handed out per category — an alphabetical cut across the whole
    // match set would let one category (e.g. every street matching "stra") crowd the
    // others out again. Only the survivors are then sorted into one flat A-Z list.
    // A hidden category is left out of the allocation, so its budget goes to the others.
    const categories = [strassen, gewerbe, behoerden, besitzer]
    options?.onTypeCounts?.(countResultTypes(categories.flat()))
    const selected = allocateFairly(categories.map(c => withoutHiddenTypes(c, options?.hiddenTypes)), maxResults)
    selected.sort(byName)

    return selected
}

function byName(a:SearchResult, b:SearchResult):number {
    return a.name.localeCompare(b.name, 'de')
}

/**
 * Hands out the result budget category by category in rounds, then returns the
 * hits still grouped by category. A term like "stra" matches nearly every street:
 * filling the budget in one pass would make Gewerbe, Behörden and Eigentümer
 * unreachable for such a term. Budget a category does not use is redistributed.
 */
function allocateFairly(categories:SearchResult[][], maxResults:number):SearchResult[] {
    const counts = categories.map(() => 0)
    let total = 0
    let assigned = true

    while( total < maxResults && assigned ) {
        assigned = false
        for( let i = 0; i < categories.length && total < maxResults; i++ ) {
            if( counts[i] >= categories[i].length ) {
                continue
            }
            counts[i]++
            total++
            assigned = true
        }
    }

    return categories.flatMap((category, i) => category.slice(0, counts[i]))
}

// The matched name is already the result's title, so only the secondary fields
// become descriptions — otherwise a name hit renders its own name twice.
function collectHits(term:string, matcher:PhoneticMatcher | undefined, values:string[]):{text:string, kind:MatchKind}[] {
    return values
        .map(text => ({ text, kind: classifyMatch(text, term, matcher) }))
        .filter(hit => hit.kind !== 'none')
}

function adresseText(adresse:Adresse):string {
    return `${adresse.strasse} ${adresse.hnr}`.trim()
}

function buildResult(
    term:string,
    matcher:PhoneticMatcher | undefined,
    kinds:MatchKind[],
    name:string,
    locationDesc:string,
    type:SearchResultType,
    descriptions:string[],
    center?:[number, number]):SearchResult {

    const searchResult = new SearchResult(term, locationDesc, name, type)
    searchResult.phoneticOnly = !kinds.includes('exact')
    searchResult.matchRank = bestRank(kinds)
    searchResult.phoneticMatcher = matcher
    searchResult.descriptions = descriptions
    searchResult.typeLabel = getTypeLabel(type)
    searchResult.typeCss = getTypeCss(type)
    if( type === SearchResultType.STRASSE ) {
        searchResult.route = { name: 'layer-street', params: { layername: 'vector-do1914', streetname: name } }
    }
    if( center ) {
        searchResult.location = center
        searchResult.zoom = RESULT_ZOOM
    }
    return searchResult
}

function getTypeLabel(type:SearchResultType):string {
    switch(type) {
        case SearchResultType.GEWERBE:
            return 'Gewerbe'
        case SearchResultType.BEHOERDE:
            return 'Behörde'
        case SearchResultType.STRASSE:
            return 'Straße'
        case SearchResultType.ADRESSBUCH_BESITZER:
            return 'Eigentümer'
    }
    return ''
}

function getTypeCss(type:SearchResultType):string {
    switch(type) {
        case SearchResultType.GEWERBE:
            return 'gewerbe'
        case SearchResultType.BEHOERDE:
            return 'behoerde'
        case SearchResultType.STRASSE:
            return 'strasse'
        case SearchResultType.ADRESSBUCH_BESITZER:
            return 'besitzer'
    }
    return ''
}
