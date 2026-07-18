import { useMapLayerStore } from '@/stores/mapLayerStore'
import type { SearchResult } from '@/services/searchService'
import { prefetchDo1914, isDo1914Loading, searchDo1914 } from '@/services/do1914SearchService'

/**
 * Registry of layer-owned searches.
 *
 * A layer may bring its own search: its data, its matched fields, its result
 * types. Such a search is offered on the search page only while the layer is
 * actually present in the layer list (vector-do1914, for instance, only exists
 * in preview mode). SearchView reads this registry and stays generic — adding
 * a searchable layer means registering a provider here, not touching the view.
 */

const SEARCH_TYPE_PREFIX = 'layer-'

type LayerSearchProvider = {
    layerId:string
    prefetch():void
    isLoading():boolean
    search(term:string, maxResults:number):SearchResult[]
}

export type LayerSearchType = LayerSearchProvider & {
    id:string       // search type id, as used in the dropdown and the route
    label:string    // German dropdown label, built from the layer's own name
}

const providers:LayerSearchProvider[] = [{
    layerId: 'vector-do1914',
    prefetch: prefetchDo1914,
    isLoading: isDo1914Loading,
    search: searchDo1914
}]

export function getLayerSearchTypes():LayerSearchType[] {
    const mapLayerStore = useMapLayerStore()
    const result:LayerSearchType[] = []

    for( const provider of providers ) {
        const layer = mapLayerStore.layers.find(l => l.id === provider.layerId)
        if( !layer ) {
            continue
        }
        result.push({
            ...provider,
            id: SEARCH_TYPE_PREFIX + provider.layerId,
            label: `in Ebene "${layer.name}"`
        })
    }

    return result
}

export function isLayerSearchType(searchType:string):boolean {
    return !!searchType && searchType.startsWith(SEARCH_TYPE_PREFIX)
}

export function getLayerSearchType(searchType:string):LayerSearchType | undefined {
    if( !isLayerSearchType(searchType) ) {
        return undefined
    }
    return getLayerSearchTypes().find(t => t.id === searchType)
}
