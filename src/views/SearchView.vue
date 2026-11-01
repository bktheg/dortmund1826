<script setup lang="ts">
    import "vue3-treeselect/dist/vue3-treeselect.css"
    import _debounce from 'lodash/debounce';
    import type {DebouncedFunc} from 'lodash'
    import {useFlurStore} from '../stores/flurStore'
    import {useBezeichnungStore} from '../stores/bezeichnungStore'
    import {useEigentuemerStore} from '../stores/eigentuemerStore'
    import type {BezeichnungExport} from '../stores/bezeichnungStore'
    import type { SearchResult } from "@/services/searchService";
    import { searchByTerm } from "@/services/searchService";
    import { getResultCss, getResultLabel } from "@/utils/searchResultTypes";
    import type { ResultTypeCount } from "@/utils/searchResultTypes";
    import { getLayerSearchTypes, getLayerSearchType, isLayerSearchType } from "@/services/layerSearchService";
    import { useMapLayerStore } from "@/stores/mapLayerStore";
    // @ts-ignore
    import Treeselect from '@/components/treeselect/components/Treeselect.vue'
    import LoadingSpinner from '@/components/LoadingSpinner.vue'
    import { useAllParzellenStore } from "@/stores/allParzellenStore";
    import { useHaeuserbuchStore } from "@/stores/haeuserbuchStore";
    import { onMounted, ref, shallowRef, watch, computed, inject, nextTick } from 'vue'
    import { onBeforeRouteUpdate, useRouter } from 'vue-router'
    import type {Emitter} from 'mitt';


    const { fetchFlure } = useFlurStore()
    const { fetchBezeichnungen } = useBezeichnungStore()
    const { fetchEigentuemer } = useEigentuemerStore()

    fetchFlure()
    fetchBezeichnungen()
    fetchEigentuemer()

    type TreeselectValue = {
        label: string
        id: string
        children?: TreeselectValue[]
        isDisabled?: boolean
    }

    const bezeichnungen = ref([] as BezeichnungExport[])
    const matches = shallowRef([] as SearchResult[])
    const searchtext = ref("")
    const searchType = ref("lage")
    const searchDebounce = ref(null as any as DebouncedFunc<() => void>)
    const maxResults = ref(100)
    const filterValue = ref(['__all'])
    const phonetic = ref(false)
    const PHONETIC_LABEL = 'Ähnlich klingende Namen'
    const PHONETIC_TITLE = 'Findet auch abweichende Schreibweisen, z. B. Meier, Meyer und Maier.'
    const presentTypes = shallowRef([] as ResultTypeCount[])
    const hiddenTypes = ref([] as string[])
    // The search type the hidden types were chosen for; they are dropped when it changes.
    let hiddenTypesFor = ""
    const hiddenTypeSet = computed(() => new Set(hiddenTypes.value))
    const showTypeButtons = computed(() =>
        presentTypes.value.length >= 2 || presentTypes.value.some(t => hiddenTypeSet.value.has(t.key)))
    const allTypesHidden = computed(() =>
        presentTypes.value.length > 0 && matches.value.length == 0 && presentTypes.value.every(t => hiddenTypeSet.value.has(t.key)))
    const phoneticApplies = computed(() => searchType.value != 'parzelle')

    const router = useRouter();
    const emitter = inject('emitter') as Emitter<any>


    onMounted(async () => {
        searchDebounce.value = _debounce(() => {
                matches.value = []
                presentTypes.value = []
                if( !searchtext.value || searchtext.value.trim() == "") {
                    return;
                }
               
                const text = searchtext.value.trimStart().toLocaleLowerCase();
                matches.value = doSearch(text);
        }, 200)
        searchtext.value = router.currentRoute.value.params.term as string
        searchType.value = router.currentRoute.value.params.type as string
        filterValue.value = unserializeFilter(router.currentRoute.value.params.filter as string);
        phonetic.value = isPhoneticQuery(router.currentRoute.value.query.ph)
        if( !searchType.value ) {
            searchType.value = 'lage';
        }
        hiddenTypes.value = unserializeHidden(router.currentRoute.value.query.hide)
        hiddenTypesFor = searchType.value

        search();
    })


    onBeforeRouteUpdate(async (to, from) => {
        nextTick(() => {
            const newType = to.params.type as string;
            const newTerm = to.params.term as string;
            const newFilter = to.params.filter as string;
            const newPhonetic = isPhoneticQuery(to.query.ph);
            const newHidden = unserializeHidden(to.query.hide);
            if( newType != searchType.value || newTerm != searchtext.value || newFilter != serializeFilter(filterValue.value) || newPhonetic != phonetic.value || serializeHidden(newHidden) != serializeHidden(hiddenTypes.value) ) {
                searchType.value = newType;
                searchtext.value = newTerm;
                filterValue.value = unserializeFilter(newFilter);
                phonetic.value = newPhonetic;
                hiddenTypes.value = newHidden;
                hiddenTypesFor = newType;
                if( searchtext.value && searchDebounce.value ) {
                    searchDebounce.value();
                }
            }
        });
    })
   
    const layerSearchTypes = computed(() => getLayerSearchTypes())
    const activeLayerSearch = computed(() => getLayerSearchType(searchType.value))

    const calcSearchTypeOptions = computed(() => {
        return [{
            label:"nach Ortsangabe",
            id:"lage"
        },{
            label:"nach Eigentümer",
            id:"owner"
        },{
            label:"nach Parzelle",
            id:"parzelle"
        },{
            label:"in Häuserbuch",
            id:"haeuserbuch"
        },
        ...layerSearchTypes.value.map(t => ({label:t.label, id:t.id}))]
    })

    // A layer search type stays selectable only while its layer is in the layer list.
    // The list is only filled once Map.vue mounts, which can happen after this view —
    // so an empty list means "not known yet", not "layer absent", and a layer search
    // deep-linked via the route has to be re-run once its layer shows up.
    watch([layerSearchTypes, searchType], () => {
        const mapLayerStore = useMapLayerStore()
        if( mapLayerStore.layers.length == 0 || !isLayerSearchType(searchType.value) ) {
            return
        }
        if( activeLayerSearch.value ) {
            search()
        }
        else {
            searchType.value = 'lage'
        }
    })

    const calcFilterOptions = computed(() => {
        const flurStore = useFlurStore();
        const result:TreeselectValue[] = [];
        for( const g of flurStore.gemeinden ) {
            let kreis = result.find(e => e.id == `kreis-${g.buergermeisterei.kreis.id}`)
            if( !kreis ) {
                kreis = {label:`Kreis ${g.buergermeisterei.kreis.name}`, id:`kreis-${g.buergermeisterei.kreis.id}`, children:[]};
                result.push(kreis);
            }
            
            let bmstr = kreis.children?.find(e => e.id == `bmstr-${g.buergermeisterei.id}`);
            if( !bmstr ) {
                bmstr = {id:`bmstr-${g.buergermeisterei.id}`,label:`Bürgermstr. ${g.buergermeisterei.name}`, children:[]};
                kreis.children?.push(bmstr);
            }
            bmstr.children?.push({id:g.id, label:g.name, isDisabled:searchType.value == 'haeuserbuch' && !g.haeuserbuch});
        }
        for( const kreis of result ) {
            for( const bmstr of kreis.children || [] ) {
                bmstr.isDisabled = bmstr.children?.every(e => e.isDisabled)
            }
            kreis.isDisabled = kreis.children?.every(e => e.isDisabled)
        }            

        return [{id:'__all', label:'Provinz Westfalen', children:result}];
    })
    const loading = computed(() => {
        const flurStore = useFlurStore();
        const eigentuemerStore = useEigentuemerStore();
        const bezeichnungStore = useBezeichnungStore();
        const allParzellenStore = useAllParzellenStore();
        const haeuserbuchStore = useHaeuserbuchStore();

        if( activeLayerSearch.value ) {
            return activeLayerSearch.value.isLoading()
        }

        return flurStore.loading || eigentuemerStore.loading || bezeichnungStore.loading || allParzellenStore.loading || haeuserbuchStore.loading.size > 0
    })
    
    watch(filterValue, () => search())
    watch(phonetic, () => search())
    watch(hiddenTypes, () => search())
    watch(searchType, () => {
        if( searchType.value != hiddenTypesFor ) {
            hiddenTypesFor = searchType.value
            hiddenTypes.value = []
        }
        // Start loading the layer's data as soon as its search is picked, not only
        // once the first character is typed.
        activeLayerSearch.value?.prefetch()
        search()
    })
    watch(loading, (newValue) => {
        if (!newValue) {
            search()
        }
    })

    function limitText(count:number) {
        return `+${count}`
    }
    function search() {
        if( searchtext.value && searchDebounce.value ) {
            searchDebounce.value();
        }
    }
    function isPhoneticQuery(value:unknown):boolean {
        return value === '1'
    }
    // The flag is not applied to a Parzelle search, but it stays in the route so the
    // choice is still there when the user switches back to a name search.
    function buildQuery() {
        const query:Record<string, string> = {}
        if( phonetic.value ) {
            query.ph = '1'
        }
        const hide = serializeHidden(hiddenTypes.value)
        if( hide ) {
            query.hide = hide
        }
        return query
    }
    function serializeHidden(types:string[]):string {
        return [...types].sort().join(',')
    }
    function unserializeHidden(value:unknown):string[] {
        return typeof value == 'string' && value ? value.split(',').filter(t => !!t) : []
    }
    function toggleType(key:string) {
        hiddenTypes.value = hiddenTypes.value.includes(key)
            ? hiddenTypes.value.filter(t => t != key)
            : [...hiddenTypes.value, key]
    }
    function onTypeCounts(types:ResultTypeCount[]) {
        presentTypes.value = types
    }
    function serializeFilter(filters:string[]) {
        if( filters.includes('__all') ) {
            return null;
        }
        return filters.join(',');
    }
    function unserializeFilter(filterString:string):string[] {
        if( !filterString ) {
            return ['__all'];
        }
        return filterString.split(',');
    }
    function doSearch(term:string):SearchResult[] {
        const layerSearch = activeLayerSearch.value;
        if( layerSearch ) {
            layerSearch.prefetch();
            // The Gemeinde filter is meaningless for a layer search, but it must survive
            // in the route: dropping it here would make onBeforeRouteUpdate reset the
            // user's filter, and it would be gone when they switch back.
            router.replace({name:'search', params:{type:searchType.value, term:searchtext.value, filter:serializeFilter(filterValue.value)}, query:buildQuery(), hash:window.location.hash})

            return layerSearch.search(term, maxResults.value, {phonetic:phonetic.value, hiddenTypes:hiddenTypeSet.value, onTypeCounts});
        }

        // Layer search selected, but its layer is not (yet) in the layer list: searching
        // on with an unknown type would only rewrite the route with a dead search type.
        if( isLayerSearchType(searchType.value) ) {
            return [];
        }

        if( searchType.value == "parzelle" ) {
            const allParzellenStore = useAllParzellenStore();
            allParzellenStore.fetchAllParzellen();
        }
        else if( searchType.value == "haeuserbuch" ) {
            const haeuserbuchStore = useHaeuserbuchStore()
            const flurStore = useFlurStore()
            flurStore.gemeinden.filter(g => g.haeuserbuch).forEach(g => haeuserbuchStore.fetchHaeuserbuch(g.id))
        }

        router.replace({name:'search', params:{type:searchType.value, term:searchtext.value, filter:serializeFilter(filterValue.value)}, query:buildQuery(), hash:window.location.hash})
        
        return searchByTerm(term, searchType.value, filterValue.value, maxResults.value, {phonetic:phonetic.value, hiddenTypes:hiddenTypeSet.value, onTypeCounts});
    }
    function resultSelected(match:SearchResult) {
        // A layer's own hit is only legible on top of that layer, and layers start hidden.
        if( activeLayerSearch.value ) {
            emitter.emit("map-enable-layer", activeLayerSearch.value.layerId);
        }
        if( match.location ) {
            emitter.emit("map-highlight-location", {location:match.location, zoom:match.zoom});
        }
        if( match.route != null ) {
            router.push(match.route)
        }
    }
</script>

<style>
    :root {
        --search-color-result: #eee;
        --search-color-result-highlight: #ddd;
        --search-color-flurname: #fdd;
        --search-color-flurname-highlight:#ecc;
        --search-color-gewaesser:#ddf;
        --search-color-gewaesser-highlight:#cce;
        --search-color-gebaeude: #fbb;
        --search-color-gebaeude-highlight: #e99;
        --search-color-gewerbe: #dfd;
        --search-color-gewerbe-highlight: #cec;
        --search-color-behoerde: #ffd;
        --search-color-behoerde-highlight: #eec;
        --search-color-strasse: #dff;
        --search-color-strasse-highlight: #cee;
        --search-color-besitzer: #edf;
        --search-color-besitzer-highlight: #dce;
    }

    @media (prefers-color-scheme: dark) {
        :root {
            --search-color-result: #555;
            --search-color-result-highlight: #333;
            --search-color-flurname: #665;
            --search-color-flurname-highlight:#443;
            --search-color-gewaesser:#557;
            --search-color-gewaesser-highlight:#447;
            --search-color-gebaeude: #733;
            --search-color-gebaeude-highlight: #611;
            --search-color-gewerbe: #464;
            --search-color-gewerbe-highlight: #353;
            --search-color-behoerde: #663;
            --search-color-behoerde-highlight: #552;
            --search-color-strasse: #366;
            --search-color-strasse-highlight: #255;
            --search-color-besitzer: #546;
            --search-color-besitzer-highlight: #435;
        }
    }

    #searchresult {
        margin:0;
        padding:0
    }
    .type-town,
    .type-admin,
    .type-flur {
        --type-bg: var(--search-color-flurname);
        --type-bg-highlight: var(--search-color-flurname-highlight);
    }
    .type-gewaesser {
        --type-bg: var(--search-color-gewaesser);
        --type-bg-highlight: var(--search-color-gewaesser-highlight);
    }
    .type-gebaeude {
        --type-bg: var(--search-color-gebaeude);
        --type-bg-highlight: var(--search-color-gebaeude-highlight);
    }
    .type-gewerbe {
        --type-bg: var(--search-color-gewerbe);
        --type-bg-highlight: var(--search-color-gewerbe-highlight);
    }
    .type-behoerde {
        --type-bg: var(--search-color-behoerde);
        --type-bg-highlight: var(--search-color-behoerde-highlight);
    }
    .type-strasse {
        --type-bg: var(--search-color-strasse);
        --type-bg-highlight: var(--search-color-strasse-highlight);
    }
    .type-besitzer {
        --type-bg: var(--search-color-besitzer);
        --type-bg-highlight: var(--search-color-besitzer-highlight);
    }
    #searchresult > li {
        list-style: none;
        background-color:var(--type-bg, var(--search-color-result));
        margin:5pt 0pt;
        padding:3pt 5pt;
        border-radius: 5pt;
        cursor:pointer;
    }
    #searchresult > li:hover {
        background-color: var(--type-bg-highlight, var(--search-color-result-highlight))
    }
    #searchresult .position {
        font-size:80%;
    }
    #searchresult .type {
        position:absolute;
        top:0;
        right:10pt;
        font-style:italic;
        font-size:80%;
    }
    #searchresult .description {
        font-size: 80%;
        font-style: italic;
        display: grid;
        gap: 1pt;
        list-style: none;
        margin: 0;
        padding: 0;
    }
    #searchresult .description > li {
        display: grid;
        grid-template-columns: 0 1fr;
        gap: 10pt;
    }
    #searchresult .description > li::before {
        content: '➔';
        font-weight: bold;
    }
    #searchresult u.phonetic {
        text-decoration-style: dotted;
    }
    .searchinput,
    .searchfilter {
        width:100%;
    }
    .searchfilter {
        margin-bottom:5pt;
    }
    .searchoptions {
        margin:5pt 0;
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:5pt;
    }
    .searchoptions .typefilter {
        display:flex;
        flex-wrap:wrap;
        gap:5pt;
    }
    .searchoptions .typefilter button {
        font:inherit;
        color:inherit;
        background-color:var(--type-bg, var(--search-color-result));
        border:1px solid transparent;
        border-radius:5pt;
        padding:2pt 7pt;
        min-height:17pt;
        cursor:pointer;
    }
    .searchoptions .typefilter button:hover {
        background-color:var(--type-bg-highlight, var(--search-color-result-highlight));
    }
    .searchoptions .typefilter button:focus-visible {
        outline:2px solid currentColor;
        outline-offset:1px;
    }
    .searchoptions .typefilter button[aria-pressed="false"] {
        opacity:0.5;
        text-decoration:line-through;
    }
    .searchhint {
        font-style:italic;
    }
    .searchinput {
        display:flex;
        gap:5pt;
    }
    .searchinput .text {
        flex:1 1 auto;
        min-width:200pt;
        height:17pt;
        border: 1px solid #ddd;
        border-radius: 5px;
    }
    .searchinput .button {
        flex:0 0 25%;
    }
    .searchfilter .searchtype {
        width:30%;
        min-width:165pt;
    }
    .searchfilter .filter {
        width:45%;
    }
    .searchfilter .vue-treeselect {
        display:inline-block;
        vertical-align:middle;
    }
</style>

<template>
    <div id="contentview">
        <div class="content">
            <section class="searchfilter">
                Suche <Treeselect ref="searchTypeRef" :always-open="false" class="searchtype" :options="calcSearchTypeOptions" :multiple="false" v-model="searchType" :loadingText="'Lade...'" :noResultsText="'Kein Treffer'" :placeholder="'Bitte auswählen'" :clearable="false" v-on:search-change="search()"/>
                <template v-if="!activeLayerSearch">
                    in <Treeselect class="filter" :options="calcFilterOptions" :multiple="true" v-model="filterValue" :limit="2" :limitText="limitText" :loadingText="'Lade...'" :noResultsText="'Kein Treffer'" :placeholder="'Bitte auswählen'"/>
                </template>
            </section>
            <section class="searchinput">
                <input class="text" type="text" placeholder="Suchbegriff eingeben" v-model="searchtext" @keyup="search()"/>
                <input class="button" type="submit" value="Suchen" @click="search()"/>
            </section>
            <section class="searchoptions">
                <label v-if="phoneticApplies" :title="PHONETIC_TITLE">
                    <input type="checkbox" v-model="phonetic"/> {{PHONETIC_LABEL}}
                </label>
                <div v-if="showTypeButtons" class="typefilter" role="group" aria-label="Ergebnistypen ein- oder ausblenden">
                    <button v-for="t in presentTypes" :key="t.key" type="button" :class="`type-${t.key}`" :aria-pressed="!hiddenTypeSet.has(t.key)" @click="toggleType(t.key)">{{t.label}} ({{t.count}})</button>
                </div>
            </section>
            <div>
                <LoadingSpinner v-if="loading" />
                <p v-if="allTypesHidden && !loading" class="searchhint" role="status">Alle Ergebnistypen sind ausgeblendet.</p>
                <ul id="searchresult">
                    <li v-for="match in matches" @click="resultSelected(match)" :class="`type-${getResultCss(match)}`">
                        <div class="position">{{match.locationDesc}}</div>
                        <div class="type">{{getResultLabel(match)}}</div>
                        <span v-html="match.getHighlightedName()" />
                        <ul v-if="match.getHighlightedDescriptions().length > 0" class="description">
                            <li v-for="desc of match.getHighlightedDescriptions()"><span v-html="desc" /></li>
                        </ul>
                    </li>
                </ul>
            </div>
            <p v-if="matches.length >= maxResults">
                Es werden maximal {{maxResults}} Treffer angezeigt
            </p>
        </div>
        <Transition/>
    </div>
</template>