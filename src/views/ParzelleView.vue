<script setup lang="ts">
    import { useRoute, useRouter,RouterLink } from 'vue-router';
    import { ref,toRefs,reactive,computed,inject,watch } from 'vue'
    import { storeToRefs } from 'pinia'
    import type {Emitter} from 'mitt';
    import {expandSourceToDetailedSource} from '../services/quellenService'
    import WikipediaInfoComponent from '@/components/wikipediaInfo.vue'

    import {useFlurStore} from '../stores/flurStore'
    import {useParzelleStore,WikipediaInfo} from '../stores/parzelleStore'

    const { fetchFlure, getGemeindeById, getFlurById } = useFlurStore()
    const parzelleStore = useParzelleStore()
    const {parzellen} = storeToRefs(parzelleStore);
    
    fetchFlure()

    const route = useRoute();

    const location = ref({gemeindeId:'', flurId:0, parzelleNr:''});
    watch(() => route.params, (params) => {
        location.value.gemeindeId = params.gemeinde as string; 
        location.value.flurId = parseInt(params.flur as string);
        location.value.parzelleNr = params.nr as string

        parzelleStore.fetchParzellen(params.gemeinde as string, parseInt(params.flur as string));
    }, {immediate:true});

    const gemeinde = computed(() => getGemeindeById(location.value.gemeindeId) || null)
    const flur = computed(() => getFlurById(location.value.gemeindeId, location.value.flurId))

    const parzelle = computed(() => parzellen.value.get(location.value.gemeindeId)?.get(location.value.flurId)?.find(e => e.parzelle == location.value.parzelleNr))

    const gebaeudeText = computed(() => {
        if( !parzelle.value ) {
            return "";
        }
        let importantBuildings = [];
        let normalBuildingCount = 0;
        for( const building of parzelle.value?.buildings ) {
            if( building.bezeichnung && building.hnr ) {
                importantBuildings.push(building.bezeichnung+` (Hausnummer ${building.hnr})`);
            }
            else if( building.bezeichnung ) {
                importantBuildings.push(building.bezeichnung);
            }
            else if( building.hnr ) {
                importantBuildings.push(`Gebäude (Hausnummer ${building.hnr})`)
            }
            else {
                normalBuildingCount++;
            }
        }

        if( importantBuildings.length == 0 ) {
            return normalBuildingCount == 0 ? '' : `${normalBuildingCount} Gebäude`;
        }

        return importantBuildings.join(', ') + (normalBuildingCount > 1 ? ` sowie ${normalBuildingCount} weitere Gebäude` : (normalBuildingCount > 0 ? ` sowie ein weiteres Gebäude` : ''))
    });

    const wikipediaInfos = computed(() => {
        if( !parzelle.value ) {
            return null;
        }
        return parzelle.value.info.filter(i => i instanceof WikipediaInfo) as WikipediaInfo[];
    })
</script>

<style>
    
</style>

<template>
    <div id="contentview">
        <div id="content">
            <section class="location">Kreis {{gemeinde?.kreis}} > Bürgermeisterei {{gemeinde?.buergermeisterei}} > Gemeinde {{gemeinde?.name}} > Flur {{flur?.nr}} gnt. {{flur?.name}} > Parzelle {{location.parzelleNr}}</section>
            <h2>Parzelle</h2>
            <dl class="properties">
                <dd>Eigentümer</dd>
                <dt>
                    <template v-if="parzelle?.artikelNr">
                        <RouterLink :to="{name:'mutterrolle', params: {gemeinde: gemeinde?.id, artikelNr:parzelle?.artikelNr}}">{{parzelle?.eigentuemer}} ({{parzelle?.artikelNr}})</RouterLink>
                    </template>
                </dt>

                <dd>Kulturart</dd>
                <dt>{{parzelle?.typ}}</dt>

                <dd>Lage¹</dd>
                <dt>{{parzelle?.lage}}</dt>

                <dd>Klasse²</dd>
                <dt>{{parzelle?.klasse}}</dt>

                <dd>Größe³</dd>
                <dt>{{parzelle?.flaeche}}</dt>

                <template v-if="parzelle?.reinertrag">
                    <dd>Reinertrag⁴</dd>
                    <dt>{{parzelle?.reinertrag}}</dt>
                </template>

                <template v-if="gebaeudeText">
                    <dd>Gebäude</dd>
                    <dt>{{gebaeudeText}}</dt>
                </template>
            </dl>
            <template v-if="wikipediaInfos?.length">
                <h2>Wikipedia</h2>
                <WikipediaInfoComponent v-for="info of wikipediaInfos" :page="info.page"/>
            </template>
            <h2>Quellen</h2>
            <dl class="properties">
                <dd>Vermessung</dd>
                <dt>{{expandSourceToDetailedSource(gemeinde?.quelleVermessung)}}</dt>
                <dd>Urkarte</dd>
                <dt>{{expandSourceToDetailedSource(flur?.quelleUrkarten)}}</dt>
                <dd>Flurbuch</dd>
                <dt>{{expandSourceToDetailedSource(gemeinde?.quelleFlurbuch)}}</dt>
                <template v-if="gemeinde?.quelleMutterrollen && gemeinde?.quelleMutterrollen != '?'">
                    <dd>Mutterrolle</dd>
                    <dt>{{expandSourceToDetailedSource(gemeinde?.quelleMutterrollen)}}</dt>
                </template>
                <template v-if="gemeinde?.quelleGueterverzeichnis && gemeinde?.quelleGueterverzeichnis != '?'">
                    <dd>Güterverzeichnis</dd>
                    <dt>{{expandSourceToDetailedSource(gemeinde?.quelleGueterverzeichnis)}}</dt>
                </template>
            </dl>
            <template v-if="flur?.legalText">
                <h2>Weitere Quellenhinweise</h2>
                <p v-html="flur?.legalText"></p>
            </template>
            <section class="footnotes">
                <p>
                    ¹ Lage laut Flurbuch. Die Angabe ist mit einiger Vorsicht zu betrachten. Die Lageangaben sind häufig schwer zu lesen und durchaus bereits im Flurbuch falsch geschrieben
                </p>
                <p>
                    ² Steuerklasse 1-5. Einzelne Parzellen waren weiter unterteilt, so dass eine Anzahl von x Morgen/Ruten/Fuß einer Steuerklasse zugeordnet wurden, der Rest aber zu einer anderen gehörte
                </p>
                <p>
                    ³ Angabe der Fläche in Morgen.Ruten.Fuß
                </p>
                <p v-if="parzelle?.reinertrag">
                    ⁴ Angabe des Reinertrags in Taler.Groschen.Pfennig. 30 Groschen = 1 Taler, 12 Pfennig = 1 Groschen.
                </p>
            </section>
        </div>
    </div>
</template>

<style scoped>
    .location {
        font-weight:bold;
    }
    
    .footnotes {
        font-size:80%
    }

    hr {
        margin-top:10pt;
        margin-bottom:10pt;
        border-width: 1pt 0 0 0;
        border-color: lightgray;
    }

    .properties dd:before {
        display:block;
        content: ' '
    }
    .properties dd {
        display:inline;
        font-weight:bold;
    }

    .properties dd:after {
        content: ':'
    }

    .properties dt {
        display:inline;
        padding-left:3pt;
    }

    .properties {
        margin-bottom:5pt;
    }

    .footnotes {
        margin-top:10pt;
    }
</style>