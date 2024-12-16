<script setup lang="ts">
    import "vue3-treeselect/dist/vue3-treeselect.css"
    import _debounce from 'lodash/debounce';
    import type {DebouncedFunc} from 'lodash'
    import {useFlurStore} from '../stores/flurStore'
    import {useBezeichnungStore} from '../stores/bezeichnungStore'
    import {useEigentuemerStore} from '../stores/eigentuemerStore'
    import type {BezeichnungExport} from '../stores/bezeichnungStore'
    import type { SearchResult } from "@/services/searchService";
    import { searchByTerm, SearchResultType } from "@/services/searchService";
    // @ts-ignore
    import Treeselect from '@/components/treeselect/components/Treeselect.vue'
    import LoadingSpinner from '@/components/LoadingSpinner.vue'
    import { useAllParzellenStore } from "@/stores/allParzellenStore";
    import { useHaeuserbuchStore } from "@/stores/haeuserbuchStore";
    import { onMounted, ref, watch, computed, inject, nextTick } from 'vue'
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
    const matches = ref([] as SearchResult[])
    const searchtext = ref("")
    const searchType = ref("lage")
    const searchDebounce = ref(null as any as DebouncedFunc<() => void>)
    const maxResults = ref(100)
    const filterValue = ref(['__all'])

    const router = useRouter();
    const emitter = inject('emitter') as Emitter<any>


    onMounted(async () => {
        searchDebounce.value = _debounce(() => {
                matches.value = []
                if( !searchtext.value || searchtext.value.trim() == "") {
                    return;
                }
               
                const text = searchtext.value.trimStart().toLocaleLowerCase();
                matches.value = doSearch(text);
        }, 200)
        searchtext.value = router.currentRoute.value.params.term as string
        searchType.value = router.currentRoute.value.params.type as string
        filterValue.value = unserializeFilter(router.currentRoute.value.params.filter as string);
        if( !searchType.value ) {
            searchType.value = 'lage';
        }

        search();
    })


    onBeforeRouteUpdate(async (to, from) => {
        nextTick(() => {
            const newType = to.params.type as string;
            const newTerm = to.params.term as string;
            const newFilter = to.params.filter as string;
            if( newType != searchType.value || newTerm != searchtext.value || newFilter != serializeFilter(filterValue.value) ) {
                searchType.value = newType;
                searchtext.value = newTerm;
                filterValue.value = unserializeFilter(newFilter);
                if( searchtext.value && searchDebounce.value ) {
                    searchDebounce.value();
                }
            }
        });
    })
   
    const calcSearchTypeOptions = computed(() => {
        return [{
            label:"Ortsangabe",
            id:"lage"
        },{
            label:"Eigentümer",
            id:"owner"
        },{
            label:"Parzelle",
            id:"parzelle"
        },{
            label:"Eintrag Häuserbuch",
            id:"haeuserbuch"
        }]
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

        return flurStore.loading || eigentuemerStore.loading || bezeichnungStore.loading || allParzellenStore.loading || haeuserbuchStore.loading.size > 0
    })
    
    watch(filterValue, (oldValue, newValue) => search())
    watch(searchType, (oldValue, newValue) => search())
    watch(loading, (oldValue, newValue) => {
        if( newValue ) {
            search()
        }
    })

    function limitText(count:number) {
        return `+${count}`
    }
    function search() {
        if( searchtext.value ) {
            searchDebounce.value();
        }
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
        if( searchType.value == "parzelle" ) {
            const allParzellenStore = useAllParzellenStore();
            allParzellenStore.fetchAllParzellen();
        }
        else if( searchType.value == "haeuserbuch" ) {
            const haeuserbuchStore = useHaeuserbuchStore()
            const flurStore = useFlurStore()
            flurStore.gemeinden.filter(g => g.haeuserbuch).forEach(g => haeuserbuchStore.fetchHaeuserbuch(g.id))
        }

        router.replace({name:'search', params:{type:searchType.value, term:searchtext.value, filter:serializeFilter(filterValue.value)}, hash:window.location.hash})
        
        return searchByTerm(term, searchType.value, filterValue.value, maxResults.value);
    }
    function resultSelected(match:SearchResult) {
        if( match.location ) {
            emitter.emit("map-highlight-location", {location:match.location});
        }
        if( match.route != null ) {
            router.push(match.route)
        }
    }
    function getTypeLabel(type:SearchResultType) {
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
    function getTypeCss(type:SearchResultType) {
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
        }
    }

    #searchresult {
        margin:0;
        padding:0
    }
    #searchresult > li {
        list-style: none;
        background-color:var(--search-color-result);
        margin:5pt 0pt;
        padding:3pt 5pt;
        border-radius: 5pt;
        cursor:pointer;
    }
    #searchresult > li:hover {
        background-color: var(--search-color-result-highlight)
    }
    #searchresult > li.type-town,
    #searchresult > li.type-admin,
    #searchresult > li.type-flur {
        background-color:var(--search-color-flurname)
    }
    #searchresult > li.type-town:hover,
    #searchresult > li.type-admin:hover,
    #searchresult > li.type-flur:hover {
        background-color:var(--search-color-flurname-highlight)
    }
    #searchresult > li.type-gewaesser {
        background-color:var(--search-color-gewaesser)
    }
    #searchresult > li.type-gewaesser:hover {
        background-color:var(--search-color-gewaesser-highlight)
    } 
    #searchresult > li.type-gebaeude {
        background-color:var(--search-color-gebaeude)
    }
    #searchresult > li.type-gebaeude:hover {
        background-color:var(--search-color-gebaeude-highlight)
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
    .searchinput,
    .searchfilter {
        width:100%;
    }
    .searchfilter {
        margin-bottom:5pt;
    }
    .searchinput .text {
        width:70%;
        min-width:200pt;
        height:17pt;
        border: 1px solid #ddd;
        border-radius: 5px;
    }
    .searchinput .button {
        width:25%;
    }
    .searchfilter .searchtype {
        width:15%;
        min-width:80pt;
    }
    .searchfilter .filter {
        width:55%;
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
                Suche nach <Treeselect ref="searchTypeRef" :always-open="false" class="searchtype" :options="calcSearchTypeOptions" :multiple="false" v-model="searchType" :loadingText="'Lade...'" :noResultsText="'Kein Treffer'" :placeholder="'Bitte auswählen'" :clearable="false" v-on:search-change="search()"/>
                in <Treeselect class="filter" :options="calcFilterOptions" :multiple="true" v-model="filterValue" :limit="2" :limitText="limitText" :loadingText="'Lade...'" :noResultsText="'Kein Treffer'" :placeholder="'Bitte auswählen'"/>
            </section>
            <section class="searchinput">
                <input class="text" type="text" placeholder="Suchbegriff eingeben" v-model="searchtext" @keyup="search()"/>
                <input class="button" type="submit" value="Suchen" @click="search()"/>
            </section>
            <div>
                <LoadingSpinner v-if="loading" />
                <ul id="searchresult">
                    <li v-for="match in matches" @click="resultSelected(match)" :class="`type-${getTypeCss(match.typeEnum)}`">
                        <div class="position">{{match.locationDesc}}</div>
                        <div class="type">{{getTypeLabel(match.typeEnum)}}</div>
                        {{match.name}}
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