<script setup lang="ts">
    import "vue3-treeselect/dist/vue3-treeselect.css"
</script>
<script lang="ts">
    import _debounce from 'lodash/debounce';
    import type {DebouncedFunc} from 'lodash'
    import type {Gemeinde} from '../stores/flurStore'
    import {useFlurStore} from '../stores/flurStore'
    import {useBezeichnungStore} from '../stores/bezeichnungStore'
    import {useEigentuemerStore} from '../stores/eigentuemerStore'
    import type {BezeichnungExport} from '../stores/bezeichnungStore'
    import type {RouteLocationRaw} from 'vue-router'
    // @ts-ignore
    import Treeselect from '@/components/treeselect/components/Treeselect.vue'


    const { fetchFlure } = useFlurStore()
    const { fetchBezeichnungen } = useBezeichnungStore()
    const { fetchEigentuemer } = useEigentuemerStore()

    fetchFlure()
    fetchBezeichnungen()
    fetchEigentuemer()

type SearchResult = {
    locationDesc:string,
    name:string,
    location:number[]|null,
    typeEnum:SearchResultType,
    route:RouteLocationRaw|null,
    gemeinde:Gemeinde
}

enum SearchResultType {
    BEZEICHNUNG=1,
    BEZEICHNUNG_LINE=2,
    GEBAEUDE=3,
    GEWAESSER=4,
    FLUR=5,
    ORT=6,
    OWNER=7
}

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
        Treeselect
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
        if( !this.searchType ) {
            this.searchType = 'lage';
        }

        this.search();
    },
    async beforeRouteUpdate(to, from) {
        this.$nextTick(() => {
            const newType = to.params.type as string;
            const newTerm = to.params.term as string;
            if( newType != this.searchType || newTerm != this.searchtext) {
                this.searchType = newType;
                this.searchtext = newTerm;
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
            }]
        },
         calcFilterOptions():any[] {
            const flurStore = useFlurStore();
            const result:any[] = [];
            for( const g of flurStore.getAllGemeinden() ) {
                let kreis = result.find(e => e.id == `kreis-${g.kreis}`)
                if( !kreis ) {
                    kreis = {label:`Kreis ${g.kreis}`, id:`kreis-${g.kreis}`, children:[]};
                    result.push(kreis);
                }
                
                let bmstr = kreis.children.find((e:any) => e.id == `bmstr-${g.buergermeisterei}`);
                if( !bmstr ) {
                    bmstr = {id:`bmstr-${g.buergermeisterei}`,label:`Bürgmstr. ${g.buergermeisterei}`, children:[]};
                    kreis.children.push(bmstr);
                }
                bmstr.children.push({id:g.id, label:g.name});
            }
            return [{id:'__all', label:'Provinz Westfalen', children:result}];
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
        doSearch: function(term:string):SearchResult[] {
            this.$router.replace({name:'search', params:{type:this.searchType, term:this.searchtext}, hash:window.location.hash})
            
            if( !term ) {
                return [];
            }

            let result = [];
            const flurStore = useFlurStore();
            
            if( this.searchType == "lage" ) { 
                const bezeichnungStore = useBezeichnungStore();

                for( const bz of bezeichnungStore.bezeichnungen ) {
                    if( bz.n.toLocaleLowerCase().includes(term) ) {
                        const flur = flurStore.getFlurById(bz.g, bz.f);
                        const gemeinde = flurStore.getGemeindeById(bz.g);
                        result.push({
                            locationDesc: flur != null ? `Kreis ${flur.kreis} > Bürgermeisterei ${flur.bmstr} > Gemeinde ${flur.gem} > Flur ${flur.nr} gnt. ${flur.name}` : "",
                            location: bz.l,
                            name: bz.n,
                            typeEnum: this.mapTypeToEnum(bz.t),
                            gemeinde: gemeinde
                        } as SearchResult);

                        if( result.length > this.maxResults ) {
                            break;
                        }
                    }
                }
                for( const flur of flurStore.flure ) {
                    if( this.filterValue.includes(flur.gem) && flur.name.toLocaleLowerCase().includes(term) ) {
                        const gemeinde = flurStore.getGemeindeById(flur.gid);
                        result.push({
                            locationDesc: `Kreis ${flur.kreis} > Bürgermeisterei ${flur.bmstr} > Gemeinde ${flur.gem}`,
                            location: flur.box,
                            name: `Flur ${flur.nr} gnt. ${flur.name}`,
                            typeEnum: SearchResultType.FLUR,
                            gemeinde: gemeinde
                        } as SearchResult);

                        if( result.length > this.maxResults ) {
                            break;
                        }
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

                        if( result.length > this.maxResults ) {
                            break;
                        }
                    }
                }
            }

            if( !this.filterValue.includes('__all') ) {
                result = result.filter(r => this.filterValue.includes(r.gemeinde.id) || this.filterValue.includes('kreis-'+r.gemeinde.kreis) || this.filterValue.includes('bmstr-'+r.gemeinde.buergermeisterei));
            }
            result.sort((a,b) => b.typeEnum-a.typeEnum)

            return result;
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
        },
        mapTypeToEnum : function(type:number):SearchResultType {
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
    }
}
</script>

<style>
    
    #searchresult {
        margin:0;
        padding:0
    }
    #searchresult li {
        list-style: none;
        background-color:#eee;
        margin:5pt 0pt;
        padding:3pt 5pt;
        border-radius: 5pt;
        cursor:pointer;
    }
    #searchresult li:hover {
        background-color: #ddd
    }
    #searchresult li.type-town,
    #searchresult li.type-flur {
        background-color:#fdd
    }
    #searchresult li.type-town:hover,
    #searchresult li.type-flur:hover {
        background-color:#ecc
    }
    #searchresult li.type-gewaesser {
        background-color:#ddf
    }
    #searchresult li.type-gewaesser:hover {
        background-color:#cce
    } 
    #searchresult li.type-gebaeude {
        background-color:#fbb
    }
    #searchresult li.type-gebaeude:hover {
        background-color:#e99
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
        <div id="content">
            <section class="searchfilter">
                Suche nach <Treeselect ref="searchTypeRef" class="searchtype" :options="calcSearchTypeOptions" :multiple="false" v-model="searchType" :loadingText="'Lade...'" :noResultsText="'Kein Treffer'" :placeholder="'Bitte auswählen'" :clearable="false" v-on:search-change="search()"/>
                in <Treeselect class="filter" :options="calcFilterOptions" :multiple="true" v-model="filterValue" :limit="2" :limitText="limitText" :loadingText="'Lade...'" :noResultsText="'Kein Treffer'" :placeholder="'Bitte auswählen'"/>
            </section>
            <section class="searchinput">
                <input class="text" type="text" placeholder="Suchbegriff eingeben" v-model="searchtext" @keyup="search()"/>
                <input class="button" type="submit" value="Suchen" @click="search()"/>
            </section>
            <p>
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