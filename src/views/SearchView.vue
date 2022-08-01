<script setup lang="ts">

</script>
<script lang="ts">
    import _debounce from 'lodash/debounce';
    import type {DebouncedFunc} from 'lodash'
    import {useFlurStore} from '../stores/flurStore'
    import {useBezeichnungStore} from '../stores/bezeichnungStore'
    import {useEigentuemerStore} from '../stores/eigentuemerStore'
    import type {BezeichnungExport} from '../stores/bezeichnungStore'
    import type {RouteLocationRaw} from 'vue-router'

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
    route:RouteLocationRaw|null
}

enum SearchResultType {
    BEZEICHNUNG=1,
    BEZEICHNUNG_LINE=2,
    GEWAESSER=3,
    FLUR=4,
    ORT=5,
    OWNER=6
}

export default {
    data() {
        return {
            bezeichnungen:[] as BezeichnungExport[],
            matches:[] as SearchResult[],
            searchtext: "",
            searchType: "lage",
            searchDebounce: null as any as DebouncedFunc<() => void>,
            maxResults: 100
        }
    },
    async mounted() {
        this.searchDebounce = _debounce(() => {
                this.matches = []
                if( !this.searchtext || this.searchtext.trim() == "") {
                    return;
                }
               
                const text = this.searchtext.trim().toLocaleLowerCase();
                this.matches = this.doSearch(text);
        }, 200)
        this.searchtext = this.$router.currentRoute.value.params.term as string
        this.searchType = this.$router.currentRoute.value.params.type as string

        this.search();
    },
    async beforeRouteUpdate(to, from) {
        const newType = to.params.type as string;
        const newTerm = to.params.term as string;
        if( newType != this.searchType || newTerm != this.searchtext) {
            this.searchType = newType;
            this.searchtext = newTerm;
            if( this.searchtext ) {
                this.searchDebounce();
            }
        }
    },
    methods: {
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

            const result = [];
            const flurStore = useFlurStore();
            
            if( this.searchType == "lage" ) { 
                const bezeichnungStore = useBezeichnungStore();

                for( const bz of bezeichnungStore.bezeichnungen ) {
                    if( bz.n.toLocaleLowerCase().includes(term) ) {
                        const flur = flurStore.getFlurById(bz.g, bz.f);
                        result.push({
                            locationDesc: flur != null ? `Kreis ${flur.kreis} > Bürgermeisterei ${flur.bmstr} > Gemeinde ${flur.gem} > Flur ${flur.nr} gnt. ${flur.name}` : "",
                            location: bz.l,
                            name: bz.n,
                            typeEnum: this.mapTypeToEnum(bz.t)
                        } as SearchResult);

                        if( result.length > this.maxResults ) {
                            break;
                        }
                    }
                }
                for( const flur of flurStore.flure ) {
                    if( flur.name.toLocaleLowerCase().includes(term) ) {
                        result.push({
                            locationDesc: `Kreis ${flur.kreis} > Bürgermeisterei ${flur.bmstr} > Gemeinde ${flur.gem}`,
                            location: flur.box,
                            name: `Flur ${flur.nr} gnt. ${flur.name}`,
                            typeEnum: SearchResultType.FLUR
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
                            route: {name: "mutterrolle", params:{gemeinde:owner.gemeindeId, artikelNr: owner.id}}
                        } as SearchResult);

                        if( result.length > this.maxResults ) {
                            break;
                        }
                    }
                }
            }

            result.sort((a,b) => b.typeEnum-a.typeEnum)

            return result;
        },
        resultSelected: function(match:SearchResult) {
            if( match.location ) {
                this.emitter.emit("map-highlight-location", match.location);
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
</style>

<template>
    <div id="contentview">
        <div id="content">
            <p><input type="text" placeholder="Suchtext" v-model="searchtext" @keyup="search()"/>
            <select v-model="searchType" @change="search()"><option value="lage">Ortsangabe</option><option value="person">Eigentümer</option></select></p>
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
    </div>
</template>