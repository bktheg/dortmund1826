<script setup lang="ts">
    import { useRoute, useRouter } from 'vue-router';
    import { ref,toRefs,reactive,computed,inject,watch } from 'vue'
    import { storeToRefs } from 'pinia'
    import type {Emitter} from 'mitt';
    import {expandSourceToDetailedSource} from '../services/quellenService'

    import {useFlurStore} from '../stores/flurStore'
    import {useParzelleStore} from '../stores/parzelleStore'

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
</script>

<style>
    
</style>

<template>
    <div id="contentview">
        <div id="content">
            <section class="location">Kreis {{gemeinde?.kreis}} > Bürgermeisterei {{gemeinde?.buergermeisterei}} > Gemeinde {{gemeinde?.name}} > Flur {{flur?.nr}} gnt. {{flur?.name}} > Parzelle {{location.parzelleNr}}</section>
            <h1>Parzelle</h1>
            <dl class="properties">
                <dd>Eigentümer</dd>
                <dt>{{parzelle?.eigentuemer}} ({{parzelle?.artikelNr}})</dt>

                <dd>Kulturart</dd>
                <dt>{{parzelle?.typ}}</dt>

                <dd>Lage¹</dd>
                <dt>{{parzelle?.lage}}</dt>

                <dd>Klasse²</dd>
                <dt>{{parzelle?.klasse}}</dt>

                <dd>Größe³</dd>
                <dt>{{parzelle?.flaeche}}</dt>
            </dl>
            <h1>Quellen</h1>
            <dl class="properties">
                <dd>Vermessung</dd>
                <dt>{{expandSourceToDetailedSource(gemeinde?.quelleVermessung)}}</dt>
                <dd>Urkarte</dd>
                <dt>{{expandSourceToDetailedSource(flur.quelleUrkarten)}}</dt>
                <dd>Flurbuch</dd>
                <dt>{{expandSourceToDetailedSource(gemeinde?.quelleFlurbuch)}}</dt>
                <dd>Mutterrollen</dd>
                <dt>{{expandSourceToDetailedSource(gemeinde?.quelleMutterrollen)}}</dt>
            </dl>
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

    h1 {
        margin-top:5pt;
        font-size:14pt;
    }
</style>