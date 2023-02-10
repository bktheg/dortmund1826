<script setup lang="ts">
    import { useRoute, useRouter } from 'vue-router';
    import { ref,toRefs,reactive,computed,inject,watch,onBeforeUnmount } from 'vue'
    import type {Emitter} from 'mitt';

    import {useFlurStore} from '../stores/flurStore'
    import {useMutterrolleStore} from '../stores/mutterrolleStore'
    import {storeToRefs} from 'pinia'
    import type {MutterrolleRow} from '../stores/mutterrolleStore'
    import type {HighlightEvent} from '../components/Map.vue'

    const FACTOR_F = 100;

    const FACTOR_TALER = 30;
    const FACTOR_GROSCHEN = 12;

    function toFeet(flaeche:String):number {
        const parts = flaeche.split('.');
        return parseInt(parts[0])*180*FACTOR_F+parseInt(parts[1])*FACTOR_F+parseFloat(parts[2]?.replace(',','.'));
    }

    function toPfennig(money:String):number {
        const parts = money.split('.');
        return parseInt(parts[0])*FACTOR_TALER*FACTOR_GROSCHEN+parseInt(parts[1])*FACTOR_GROSCHEN+parseInt(parts[2]);
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

    const emitter = inject('emitter') as Emitter<any>
    const moveToFlur = (row:MutterrolleRow) => emitter.emit("map-highlight-location", {location:row.location, zoom:16});

    const router = useRouter();
    const lastPage = router.options.history.state.back?.toString();
    const back = () => {
        if( lastPage ) {
            router.push({path: lastPage})
        }
    }

    const showReinertrag = computed(() => {
        if( !mutterrolle.value ) {
            return false;
        }
        return mutterrolle.value.rows.some(r => r.reinertrag);
    });

    const gesamtflaeche = computed(() => {
        if( !mutterrolle.value ) {
            return '';
        }
        const sum = mutterrolle.value.rows.map(r => toFeet(r.flaeche)).reduce((a,b) => a+b, 0);
        
        const m = Math.floor(sum/(180*FACTOR_F));
        const r = Math.floor((sum-m*180*FACTOR_F)/FACTOR_F);
        const f = sum-m*180*FACTOR_F-r*FACTOR_F;

        const nf = new Intl.NumberFormat('de-DE', {useGrouping:false})
        return `${nf.format(m)}.${nf.format(r)}.${nf.format(f)}`
    });

    const gesamtErtrag = computed(() => {
        if( !mutterrolle.value ) {
            return '';
        }
        const sum = mutterrolle.value.rows.map(r => toPfennig(r.reinertrag)).reduce((a,b) => a+b, 0);
        
        const t = Math.floor(sum/(FACTOR_TALER*FACTOR_GROSCHEN));
        const g = Math.floor((sum-t*FACTOR_TALER*FACTOR_GROSCHEN)/FACTOR_GROSCHEN);
        const p = sum-t*FACTOR_TALER*FACTOR_GROSCHEN-g*FACTOR_GROSCHEN;
        const nf = new Intl.NumberFormat('de-DE', {useGrouping:false})
        return `${nf.format(t)}.${nf.format(g)}.${nf.format(p)}`
    });

    watch(() => mutterrolle.value, (value) => {
        if( value != null ) {
            emitter.emit('map-highlight-areas', {artikel:value.id, gemeindeId:value.gemeindeId} as HighlightEvent);
            const min = [value.rows[0].location[0],value.rows[0].location[1]];
            const max = [value.rows[0].location[0],value.rows[0].location[1]];
            for( const row of value.rows ) {
                min[0] = Math.min(min[0], row.location[0]);
                min[1] = Math.min(min[1], row.location[1]);
                max[0] = Math.max(max[0], row.location[0]);
                max[1] = Math.max(max[1], row.location[1]);
            }
            const bufferX = Math.max((max[0]-min[0])*0.1,0.001);
            const bufferY = Math.max((max[1]-min[1])*0.1,0.001);
            min[0] -= bufferX;
            min[1] -= bufferY;
            max[0] += bufferX;
            max[1] += bufferY;
            emitter.emit("map-highlight-location", {location:[min,max]});
        }
    }, {immediate:true});

    onBeforeUnmount(() => {
        emitter.emit('map-highlight-areas', null);
    })
</script>

<style>
    
</style>

<template>
    <div id="contentview">
        <div id="content">
            <a v-if="lastPage" class="backToSearch" href="#" @click="back">Zurück</a>
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
                    <th v-if="showReinertrag">Reinertrag⁴</th>
                </thead>
                <tbody>
                    <tr v-for="row in mutterrolle?.rows">
                        <td>{{row.flur}} gnt. {{getFlurById(gemeindeId, row.flur)?.name}}</td>
                        <td><a href="#" @click="moveToFlur(row)">{{row.flurstueck}}</a></td>
                        <td>{{row.lage}}</td>
                        <td>{{row.kulturart}}</td>
                        <td>{{row.klasse}}</td>
                        <td>{{row.flaeche}}</td>
                        <td v-if="showReinertrag">{{row.reinertrag}}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>{{gesamtflaeche}}</td>
                    <td v-if="showReinertrag">{{gesamtErtrag}}</td>
                </tfoot>
            </table>
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
                <p v-if="showReinertrag">
                    ⁴ Angabe des Reinertrags in Taler.Groschen.Pfennig. 30 Groschen = 1 Taler, 12 Pfennig = 1 Groschen.
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