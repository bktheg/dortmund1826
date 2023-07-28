<script setup lang="ts">
    import { useRoute, useRouter } from 'vue-router';
    import { ref,toRefs,reactive,computed,inject,watch,onBeforeUnmount } from 'vue'

    import {useFlurStore} from '../stores/flurStore'
    import {useHaeuserbuchStore} from '../stores/haeuserbuchStore'
    import {storeToRefs} from 'pinia'
    import {HaeuserbuchInfo} from '../services/infoService'
    import haeuserbuchInfo from '@/components/haeuserbuchInfo.vue'
    import HaeuserbuchStreet from '@/components/HaeuserbuchStreet.vue'
    import LoadingSpinner from '@/components/LoadingSpinner.vue'
    import type {Emitter} from 'mitt';

    const emitter = inject('emitter') as Emitter<any>

    const { fetchFlure, getGemeindeById, getFlurById } = useFlurStore()
    const haeuserbuchStore = useHaeuserbuchStore()
    const { getHaeuserbuch } = storeToRefs(haeuserbuchStore)

    fetchFlure()
    
    const route = useRoute();
    
    const gemeindeId = computed(() => route.params.gemeinde as string);
    const id = computed(() => route.params.id as string);
    
    haeuserbuchStore.fetchHaeuserbuch(gemeindeId.value)

    const hbEntry = computed(() => getHaeuserbuch.value(gemeindeId.value)?.buildings.filter(b => b.id == id.value)[0]);

    const router = useRouter();
    const lastPage = router.options.history.state.back?.toString();
    const back = () => {
        if( lastPage ) {
            router.push({path: lastPage})
        }
    }

    const loading = computed(() => {
        return haeuserbuchStore.loading.size > 0
    })

    watch(hbEntry, () => {
        if( hbEntry.value?.location ) {
            emitter.emit("map-highlight-location", {location:hbEntry.value?.location, zoom:17.5});
        }
    }, {immediate: true})
</script>
<template>
    <div id="contentview">
        <div class="content">
            <a v-if="lastPage" class="backToSearch" href="#" @click="back">Zurück</a>
            <LoadingSpinner v-if="loading"/>
            <template v-else>
                <haeuserbuchInfo v-if="hbEntry" :gemeinde="gemeindeId" :id="id" :expanded="true" :expandable="false" />
                <HaeuserbuchStreet v-else :gemeinde="gemeindeId" :id="id" />
            </template>
        </div>
    </div>
</template>
