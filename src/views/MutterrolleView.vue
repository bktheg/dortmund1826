<script setup lang="ts">
    import { useRoute, useRouter } from 'vue-router';
    import { ref,toRefs,reactive,computed,inject } from 'vue'
    import type {Emitter,Events} from 'mitt';

    import {useFlurStore} from '../stores/flurStore'
    import {useMutterrolleStore} from '../stores/mutterrolleStore'
    import {storeToRefs} from 'pinia'
    import type {MutterrolleRow} from '../stores/mutterrolleStore'

    const FACTOR_F = 100;

    function toFeet(flaeche:String):number {
        const parts = flaeche.split('.');
        return parseInt(parts[0])*180*FACTOR_F+parseInt(parts[1])*FACTOR_F+parseInt(parts[2]);
    }

    const { fetchFlure, getGemeindeById, getFlurById } = useFlurStore()
    const { fetchMutterrollen } = useMutterrolleStore()
    const { mutterrollen } = storeToRefs(useMutterrolleStore())

    fetchFlure()

    const route = useRoute();

    const gemeindeId = ref(route.params.gemeinde as string);
    const artikelNr = ref(route.params.artikelNr as string);

    fetchMutterrollen(gemeindeId.value);

    const mutterrolle = computed(() => mutterrollen.value.get(gemeindeId.value)?.get(artikelNr.value));
    const gemeinde = computed(() => getGemeindeById(gemeindeId.value))

    const emitter = inject('emitter') as Emitter<Events>
    const moveToFlur = (row:MutterrolleRow) => emitter.emit("map-highlight-location", {location:row.location, zoom:16});

    const router = useRouter();
    const lastPage = router.options.history.state.back?.toString() ?? '/'
    const back = () => router.push({path: lastPage})

    const gesamtflaeche = computed(() => {
        if( !mutterrolle.value ) {
            return '';
        }
        const sum = mutterrolle.value.rows.map(r => toFeet(r.flaeche)).reduce((a,b) => a+b, 0);
        console.log("total f", sum)
        
        const m = Math.floor(sum/(180*FACTOR_F));
        const r = Math.floor((sum-m*180*FACTOR_F)/FACTOR_F);
        const f = sum-m*180*FACTOR_F-r*FACTOR_F;
        return `${m}.${r}.${f}`
    });
</script>

<style>
    
</style>

<template>
    <div id="contentview">
        <div id="content">
            <a class="backToSearch" href="#" @click="back">Zurück zum Suchergebnis</a>
            <section class="mutterrolleHeader">
                <div class="name">Gemeinde</div><div class="value">{{gemeinde?.name}}</div>
                <div class="name">Artikel Nr</div><div class="value">{{mutterrolle?.id}}</div>
                <div class="name">Name</div><div class="value">{{mutterrolle?.name}}</div>
            </section>

            <table class="mutterrolle">
                <thead>
                    <th>Flur</th>
                    <th>Parzelle</th>
                    <th>Lage¹</th>
                    <th>Kulturart</th>
                    <th>Klasse²</th>
                    <th>Fläche³</th>
                </thead>
                <tbody>
                    <tr v-for="row in mutterrolle?.rows">
                        <td>{{row.flur}} gnt. {{getFlurById(gemeindeId, row.flur).name}}</td>
                        <td><a href="#" @click="moveToFlur(row)">{{row.flurstueck}}</a></td>
                        <td>{{row.lage}}</td>
                        <td>{{row.kulturart}}</td>
                        <td>{{row.klasse}}</td>
                        <td>{{row.flaeche}}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>{{gesamtflaeche}}</td>
                </tfoot>
            </table>
            <section class="footnotes">
                <p>
                    ¹ Lage laut Flurbuch. Die Angabe ist mit einiger Vorsicht zu betrachten. Die Lageangaben sind häufig schwer zu lesen und durchaus bereits im Flurbuch falsch geschrieben
                </p>
                <p>
                    ² Steuerklasse 1-5. Einzelne Parzellen waren teils weiter unterteilt, so dass eine Anzahl von x Morgen/Ruten/Fuß einer Steuerklasse zugeordnet wurden, der Rest aber zu einer anderen gehörte
                </p>
                <p>
                    ³ Angabe der Fläche in Morgen.Ruten.Fuß
                </p>
            </section>
        </div>
    </div>
</template>

<style scoped>
    .backToSearch {
        display:block;
        margin-bottom:10pt;
    }
    .mutterrolle {
        width:100%;
        margin-bottom:10pt;
    }
    .mutterrolle tfoot td {
        border-top:1px solid;
        font-weight:bold;
    }
    .mutterrolle th {
        font-weight:bold;
        text-align:left;
    }
    .mutterrolleHeader {
        display:flex;
        flex-wrap:wrap;
        margin-bottom:10pt;
    }
    .mutterrolleHeader .name {
        flex:1 0 60pt;
        font-weight:bold;
    }
    .mutterrolleHeader .value {
        flex:1 0 calc(100% - 60pt)
    }
    .footnotes {
        font-size:80%
    }
</style>