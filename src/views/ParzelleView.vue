<script setup lang="ts">
    import { useRoute, useRouter,RouterLink } from 'vue-router';
    import { ref,toRefs,reactive,computed,inject,watch } from 'vue'
    import { storeToRefs } from 'pinia'
    import type {Emitter} from 'mitt';
    import {expandSourceToDetailedSource,expandSourceToText} from '@/services/quellenService'
    import InfoListComponent from '@/components/infoList.vue'
    import LoadingSpinner from '@/components/LoadingSpinner.vue'
    import HaeuserbuchAbsenceNotice from '@/components/HaeuserbuchAbsenceNotice.vue'

    import {useFlurStore} from '@/stores/flurStore'
    import {useParzelleStore} from '@/stores/parzelleStore'
    import {CommonInfo, WikipediaInfo} from '@/services/infoService'

    const flurStore = useFlurStore()
    const parzelleStore = useParzelleStore()
    const {parzellen} = storeToRefs(parzelleStore);
    
    flurStore.fetchFlure()

    const route = useRoute();

    const location = ref({gemeindeId:'', flurId:0, parzelleNr:''});
    watch(() => route.params, (params) => {
        location.value.gemeindeId = params.gemeinde as string; 
        location.value.flurId = parseInt(params.flur as string);
        location.value.parzelleNr = params.nr as string

        parzelleStore.fetchParzellen(params.gemeinde as string, parseInt(params.flur as string));
    }, {immediate:true});

    const gemeinde = computed(() => flurStore.getGemeindeById(location.value.gemeindeId) || null)
    const flur = computed(() => flurStore.getFlurById(location.value.gemeindeId, location.value.flurId))

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

    const loading = computed(() => {
        return flurStore.loading || parzelleStore.loading.size > 0
    })

    const subareaColumns = computed(() => {
        const subareas = parzelle.value?.subareas || [];
        return {
            typ: subareas.some(s => !!s.typ),
            klasse: subareas.some(s => !!s.klasse),
            flaeche: subareas.some(s => !!s.flaeche),
            reinertrag: subareas.some(s => !!s.reinertrag),
        };
    });
</script>

<style>
    
</style>

<template>
    <div id="contentview">
        <div class="content">
            <section class="location">Kreis {{gemeinde?.buergermeisterei.kreis.name}} > Bürgermeisterei {{gemeinde?.buergermeisterei.name}} > Gemeinde {{gemeinde?.name}} > Flur {{flur?.nr}} gnt. {{flur?.name}} > Parzelle {{location.parzelleNr}}</section>
            <template v-if="gemeinde?.buergermeisterei.kreis.infos.length>0">
                <h2>Kreis {{gemeinde?.buergermeisterei.kreis.name }}</h2>
                <InfoListComponent :infos="gemeinde?.buergermeisterei.kreis.infos" :gemeinde="gemeinde?.id"/>
            </template>
            <template v-if="gemeinde?.buergermeisterei.infos.length>0">
                <h2>Bürgermeisterei {{gemeinde?.buergermeisterei.name }}</h2>
                <InfoListComponent :infos="gemeinde?.buergermeisterei.infos" :gemeinde="gemeinde?.id"/>
            </template>
            <template v-if="gemeinde?.infos.length>0">
                <h2>Gemeinde {{gemeinde?.name }}</h2>
                <InfoListComponent :infos="gemeinde?.infos" :gemeinde="gemeinde?.id"/>
            </template>
            <h2>Parzelle Nr. {{location.parzelleNr}}</h2>
            <LoadingSpinner v-if="loading"/>
            <template v-else>
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
                <template v-if="parzelle?.subareas?.length">
                    <h3>Teilflächen (andere Eigentümer)</h3>
                    <table class="subareas">
                        <thead>
                            <tr>
                                <th>Eigentümer</th>
                                <th v-if="subareaColumns.typ">Kulturart</th>
                                <th v-if="subareaColumns.klasse">Klasse</th>
                                <th v-if="subareaColumns.flaeche">Größe</th>
                                <th v-if="subareaColumns.reinertrag">Reinertrag</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(subarea, index) in parzelle?.subareas" :key="index">
                                <td>
                                    <RouterLink :to="{name:'mutterrolle', params: {gemeinde: gemeinde?.id, artikelNr:subarea.artikelNr}}">{{subarea.eigentuemer}} ({{subarea.artikelNr}})</RouterLink>
                                </td>
                                <td v-if="subareaColumns.typ">{{subarea.typ}}</td>
                                <td v-if="subareaColumns.klasse">{{subarea.klasse}}</td>
                                <td v-if="subareaColumns.flaeche">{{subarea.flaeche}}</td>
                                <td v-if="subareaColumns.reinertrag">{{subarea.reinertrag}}</td>
                            </tr>
                        </tbody>
                    </table>
                </template>
                <template v-if="parzelle?.info">
                    <InfoListComponent :infos="parzelle?.info" :gemeinde="parzelle?.gemeindeId"/>
                </template>
                <HaeuserbuchAbsenceNotice v-if="gemeinde" :gemeinde="gemeinde"/>
            </template>
            <h2>Urkatasterunterlagen</h2>
            <dl class="properties">
                <dd>Vermessung</dd>
                <dt><abbr :title="expandSourceToText(gemeinde?.quelleVermessung)">{{expandSourceToDetailedSource(gemeinde?.quelleVermessung)}}</abbr></dt>
                <dd>Urkarte</dd>
                <dt><abbr :title="expandSourceToText(flur?.quelleUrkarten)">{{expandSourceToDetailedSource(flur?.quelleUrkarten)}}</abbr></dt>
                <dd>Flurbuch</dd>
                <dt><abbr :title="expandSourceToText(gemeinde?.quelleFlurbuch)">{{expandSourceToDetailedSource(gemeinde?.quelleFlurbuch)}}</abbr></dt>
                <template v-if="gemeinde?.quelleMutterrollen">
                    <dd>Mutterrolle</dd>
                    <dt><abbr :title="expandSourceToText(gemeinde?.quelleMutterrollen)">{{expandSourceToDetailedSource(gemeinde?.quelleMutterrollen)}}</abbr></dt>
                </template>
                <template v-if="gemeinde?.quelleGueterverzeichnis">
                    <dd>Güterverzeichnis</dd>
                    <dt><abbr :title="expandSourceToText(gemeinde?.quelleGueterverzeichnis)">{{expandSourceToDetailedSource(gemeinde?.quelleGueterverzeichnis)}}</abbr></dt>
                </template>
            </dl>
            <template v-if="flur?.legalText">
                <h2>Weitere Quellenhinweise</h2>
                <p v-html="flur?.legalText"></p>
            </template>
            <section class="footnotes">
                <p>
                    ¹ Lage laut Flurbuch. Die Angabe ist mit einiger Vorsicht zu betrachten. Die Lageangaben sind häufig schwer zu lesen. Im Zweifel sind mehrere Originalquellen zu konsultieren und zu vergleichen.
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
        border-color: var(--color-light-text);
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

    table.subareas {
        border-collapse: collapse;
        margin-bottom:10pt;
    }

    table.subareas th,
    table.subareas td {
        text-align:left;
        padding: 2pt 8pt 2pt 0;
    }

    table.subareas th {
        border-bottom: 1pt solid var(--color-light-text);
    }
</style>