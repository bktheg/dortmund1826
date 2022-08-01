<script setup lang="ts">
    import { useRoute } from 'vue-router';
    import { ref,toRefs,reactive,computed } from 'vue'

    import {useFlurStore} from '../stores/flurStore'
    import {useMutterrolleStore} from '../stores/mutterrolleStore'
    import {storeToRefs} from 'pinia'

    const { fetchFlure, getGemeindeById } = useFlurStore()
    const { fetchMutterrollen, getMutterrolle } = useMutterrolleStore()
    const { mutterrollen } = storeToRefs(useMutterrolleStore())

    fetchFlure()

    const route = useRoute();

    const gemeindeId = ref(route.params.gemeinde as string);
    const artikelNr = ref(route.params.artikelNr as string);

    fetchMutterrollen(gemeindeId.value);

    const mutterrolle = computed(() => mutterrollen.value.get(gemeindeId.value)?.get(artikelNr.value));
    const gemeinde = computed(() => getGemeindeById(gemeindeId.value))
</script>

<style>
    
</style>

<template>
    <div id="contentview">
        <div id="content">
            <div>Gemeinde {{gemeinde.name}}</div>
            <div>Artikel Nr {{mutterrolle?.id}}</div>
            <div>Name {{mutterrolle?.name}}</div>

            <table class="mutterrolle">
                <thead>
                    <td>FlurNr</td>
                    <td>Parzelle</td>
                    <td>Lage</td>
                    <td>Kulturart</td>
                    <td>Klasse</td>
                    <td>Fläche (Morgen.Ruten.Fuß)</td>
                </thead>
                <tr v-for="row in mutterrolle?.rows">
                    <td>{{row.flur}}</td>
                    <td>{{row.flurstueck}}</td>
                    <td>{{row.lage}}</td>
                    <td>{{row.kulturart}}</td>
                    <td>{{row.klasse}}</td>
                    <td>{{row.flaeche}}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<style>
    .mutterrolle {
        width:100%
    }
</style>