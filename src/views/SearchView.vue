<script setup lang="ts">

</script>
<script lang="ts">
    import _debounce from 'lodash/debounce';
    import type {DebouncedFunc} from 'lodash'
    import {useFlurStore} from '../stores/flurStore'
    import {useBezeichnungStore} from '../stores/bezeichnungStore'
    import type {BezeichnungExport} from '../stores/bezeichnungStore'

    const { fetchFlure } = useFlurStore()
    const { fetchBezeichnungen } = useBezeichnungStore()

    fetchFlure()
    fetchBezeichnungen()

type SearchResult = {
    locationDesc:string,
    name:string,
    location:number[],
    typeEnum:SearchResultType
}

enum SearchResultType {
    BEZEICHNUNG=1,
    BEZEICHNUNG_LINE=2,
    GEWAESSER=3,
    FLUR=4,
    ORT=5
}

export default {
    data() {
        return {
            bezeichnungen:[] as BezeichnungExport[],
            matches:[] as SearchResult[],
            searchtext: "",
            searchDebounce: null as any as DebouncedFunc<() => void> 
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
        }, 150)
    },
    methods: {
        search: function() {
            this.searchDebounce();
        },
        doSearch: function(term:string):SearchResult[] {
            const flurStore = useFlurStore();
            const bezeichnungStore = useBezeichnungStore();

            const result = [];
            for( const bz of bezeichnungStore.bezeichnungen ) {
                if( bz.n.toLocaleLowerCase().includes(term) ) {
                    const flur = flurStore.getFlurById(bz.g, bz.f);
                    result.push({
                        locationDesc: flur != null ? `Kreis ${flur.kreis} > Bürgermeisterei ${flur.bmstr} > Gemeinde ${flur.gem} > Flur ${flur.nr} gnt. ${flur.name}` : "",
                        location: bz.l,
                        name: bz.n,
                        typeEnum: this.mapTypeToEnum(bz.t)
                    } as SearchResult);
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
                }
            }

            result.sort((a,b) => b.typeEnum-a.typeEnum)

            return result;
        },
        moveTo: function(pos:SearchResult) {
            this.emitter.emit("map-highlight-location", pos.location);
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
            <p><input type="text" placeholder="Suchtext" v-model="searchtext" @keyup="search()"/></p>
            <p>
                <ul id="searchresult">
                    <li v-for="pos in matches" @click="moveTo(pos)" :class="`type-${getTypeCss(pos.typeEnum)}`">
                        <div class="position">{{pos.locationDesc}}</div>
                        <div class="type">{{getTypeLabel(pos.typeEnum)}}</div>
                        {{pos.name}}
                    </li>
                </ul>
            </p>
        </div>
    </div>
</template>