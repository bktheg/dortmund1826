<script setup lang="ts">
    import { HaeuserbuchInfo } from '@/services/infoService';
    import {useHaeuserbuchStore} from '@/stores/haeuserbuchStore'
    import {computed,ref} from 'vue'
    import { storeToRefs } from 'pinia';
    import HaeuserbuchSourceTooltip from '@/components/HaeuserbuchSourceTooltip.vue';
    import HaeuserbuchInfoComponent from '@/components/haeuserbuchInfo.vue';
  
    const props = defineProps({
        id: { type: String, required: true },
        gemeinde: { type: String, required: true }
    })

    const haeuserbuchStore = useHaeuserbuchStore()
    const {getHaeuserbuch} = storeToRefs(haeuserbuchStore)

    haeuserbuchStore.fetchHaeuserbuch(props.gemeinde)

    const streetEntry = computed(() => {
        const hb = getHaeuserbuch.value(props.gemeinde)
        return hb?.streets.filter(s => s.id == props.id)[0]
    })

    const source = computed(() => {
        return getHaeuserbuch.value(props.gemeinde)?.source
    })

    const sourceUrl = computed(() => {
        return getHaeuserbuch.value(props.gemeinde)?.url
    })

    const streetBuildings = computed(() => {
        if( !streetEntry.value?.name ) {
            return []
        }
        return getHaeuserbuch.value(props.gemeinde)?.buildings.filter(b => b.street == streetEntry.value?.name)
    })
</script>
<template>
    <h3>
        Eintrag im Häuserbuch für {{ streetEntry?.getAddress() }}
    </h3>
    <p class="haeuserbuch info-indent">
        <template v-if="streetEntry?.infos.length">
            <h4>Allgemein und unbestimmt</h4>
            <ul class="haeuserbuch-year-lines">
                <template v-for="info of streetEntry?.infos">
                    <li>
                        {{ info.text }}
                        <HaeuserbuchSourceTooltip v-if="info.sources.length > 0" :sources="info.sources" :gemeinde="props.gemeinde"/>
                    </li>
                </template>
            </ul>
            <h4>Gebäude an dieser Straße</h4>
            <ul class="haeuserbuch-street-entries">
                <li v-for="building of streetBuildings">
                    <HaeuserbuchInfoComponent :id="building.id" :gemeinde="props.gemeinde" :show-source="false"/>
                </li>
            </ul>
        </template>
        <div class="source" v-if="source">
            Quelle: 
            <a v-if="sourceUrl" target="_blank" :href="sourceUrl">{{ source }}</a>
            <span v-else>{{ source }}</span>
        </div>
    </p>
</template>

<style scoped>
.haeuserbuch-street-entries {
    list-style: none;
    margin:0;
    padding-left:5pt;
}

</style>