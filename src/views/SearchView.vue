<script setup lang="ts">
</script>
<script lang="ts">
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


    const { fetchFlure } = useFlurStore()
    const { fetchBezeichnungen } = useBezeichnungStore()
    const { fetchEigentuemer } = useEigentuemerStore()

    fetchFlure()
    fetchBezeichnungen()
    fetchEigentuemer()

export default {
    data() {
        return {
            bezeichnungen:[] as BezeichnungExport[],
            matches:[] as SearchResult[],
            searchtext: "",
            searchType: "lage",
            searchDebounce: null as any as DebouncedFunc<() => void>,
            maxResults: 100,
            filterValue: ['__all']
        }
    },
    components: {
        Treeselect,
        LoadingSpinner
    },
    async mounted() {
        this.searchDebounce = _debounce(() => {
                this.matches = []
                if( !this.searchtext || this.searchtext.trim() == "") {
                    return;
                }
               
                const text = this.searchtext.trimStart().toLocaleLowerCase();
                this.matches = this.doSearch(text);
        }, 200)
        this.searchtext = this.$router.currentRoute.value.params.term as string
        this.searchType = this.$router.currentRoute.value.params.type as string
        this.filterValue = this.unserializeFilter(this.$router.currentRoute.value.params.filter as string);
        if( !this.searchType ) {
            this.searchType = 'lage';
        }

        this.search();
    },
    async beforeRouteUpdate(to, from) {
        this.$nextTick(() => {
            const newType = to.params.type as string;
            const newTerm = to.params.term as string;
            const newFilter = to.params.filter as string;
            if( newType != this.searchType || newTerm != this.searchtext || newFilter != this.serializeFilter(this.filterValue) ) {
                this.searchType = newType;
                this.searchtext = newTerm;
                this.filterValue = this.unserializeFilter(newFilter);
                if( this.searchtext && this.searchDebounce ) {
                    this.searchDebounce();
                }
            }
        });
    },
    watch: {
        filterValue(oldValue, newValue) {
            this.search();
        },
        searchType(oldValue, newValue) {
            this.search();
        }
    },
    computed: {
        calcSearchTypeOptions():any[] {
            return [{
                label:"Ortsangabe",
                id:"lage"
            },{
                label:"Eigentümer",
                id:"owner"
            },{
                label:"Parzelle",
                id:"parzelle"
            }]
        },
        calcFilterOptions():any[] {
            const flurStore = useFlurStore();
            const result:any[] = [];
            for( const g of flurStore.gemeinden ) {
                let kreis = result.find(e => e.id == `kreis-${g.buergermeisterei.kreis.id}`)
                if( !kreis ) {
                    kreis = {label:`Kreis ${g.buergermeisterei.kreis.name}`, id:`kreis-${g.buergermeisterei.kreis.id}`, children:[]};
                    result.push(kreis);
                }
                
                let bmstr = kreis.children.find((e:any) => e.id == `bmstr-${g.buergermeisterei.id}`);
                if( !bmstr ) {
                    bmstr = {id:`bmstr-${g.buergermeisterei.id}`,label:`Bürgermstr. ${g.buergermeisterei.name}`, children:[]};
                    kreis.children.push(bmstr);
                }
                bmstr.children.push({id:g.id, label:g.name});
            }
            return [{id:'__all', label:'Provinz Westfalen', children:result}];
        },
        loading():boolean {
            const flurStore = useFlurStore();
            const eigentuemerStore = useEigentuemerStore();
            const bezeichnungStore = useBezeichnungStore();
            const allParzellenStore = useAllParzellenStore();

            return flurStore.loading || eigentuemerStore.loading || bezeichnungStore.loading || allParzellenStore.loading;
        }
    },
    methods: {
        limitText: function(count:number) {
            return `+${count}`
        },
        search: function() {
            if( this.searchtext ) {
                this.searchDebounce();
            }
        },
        serializeFilter(filters:string[]) {
            if( filters.includes('__all') ) {
                return null;
            }
            return filters.join(',');
        },
        unserializeFilter(filterString:string):string[] {
            if( !filterString ) {
                return ['__all'];
            }
            return filterString.split(',');
        },
        doSearch: function(term:string):SearchResult[] {
            if( this.searchType == "parzelle" ) {
                const allParzellenStore = useAllParzellenStore();
                allParzellenStore.fetchAllParzellen();
            }

            this.$router.replace({name:'search', params:{type:this.searchType, term:this.searchtext, filter:this.serializeFilter(this.filterValue)}, hash:window.location.hash})
            
            return searchByTerm(term, this.searchType, this.filterValue, this.maxResults);
        },
        resultSelected: function(match:SearchResult) {
            if( match.location ) {
                this.emitter.emit("map-highlight-location", {location:match.location});
            }
            else if( match.route != null ) {
                this.$router.push(match.route)
            }
        },
        getTypeLabel: function(type:SearchResultType) {
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
        },
        getTypeCss: function(type:SearchResultType) {
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
    #searchresult li {
        list-style: none;
        background-color:var(--search-color-result);
        margin:5pt 0pt;
        padding:3pt 5pt;
        border-radius: 5pt;
        cursor:pointer;
    }
    #searchresult li:hover {
        background-color: var(--search-color-result-highlight)
    }
    #searchresult li.type-town,
    #searchresult li.type-admin,
    #searchresult li.type-flur {
        background-color:var(--search-color-flurname)
    }
    #searchresult li.type-town:hover,
    #searchresult li.type-admin:hover,
    #searchresult li.type-flur:hover {
        background-color:var(--search-color-flurname-highlight)
    }
    #searchresult li.type-gewaesser {
        background-color:var(--search-color-gewaesser)
    }
    #searchresult li.type-gewaesser:hover {
        background-color:var(--search-color-gewaesser-highlight)
    } 
    #searchresult li.type-gebaeude {
        background-color:var(--search-color-gebaeude)
    }
    #searchresult li.type-gebaeude:hover {
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
            <p>
                <LoadingSpinner v-if="loading" />
                <ul id="searchresult">
                    <li v-for="match in matches" @click="resultSelected(match)" :class="`type-${getTypeCss(match.typeEnum)}`">
                        <div class="position">{{match.locationDesc}}</div>
                        <div class="type">{{getTypeLabel(match.typeEnum)}}</div>
                        {{match.name}}
                    </li>
                </ul>
            </p>
            <p v-if="matches.length >= maxResults">
                Es werden maximal {{maxResults}} Treffer angezeigt
            </p>
        </div>
        <Transition/>
    </div>
</template>