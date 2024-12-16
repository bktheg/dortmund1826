<script setup lang="ts">
    import {useHaeuserbuchStore} from '@/stores/haeuserbuchStore'
    import {computed,ref} from 'vue'
    import { storeToRefs } from 'pinia';
    import HaeuserbuchSourceTooltip from '@/components/HaeuserbuchSourceTooltip.vue';
  
    const props = defineProps({
        id: { type: String, required: true },
        gemeinde: { type: String, required: true },
        expanded: { type: Boolean, required: false, default: false },
        expandable: { type: Boolean, required: false, default: true },
        showSource: { type: Boolean, required: false, default: true }
    })

    const haeuserbuchStore = useHaeuserbuchStore()
    const {getHaeuserbuch} = storeToRefs(haeuserbuchStore)

    haeuserbuchStore.fetchHaeuserbuch(props.gemeinde)

    const entry = computed(() => {
        const hb = getHaeuserbuch.value(props.gemeinde)
        return hb?.buildings.filter(b => b.id == props.id)[0]
    })

    const streetEntry = computed(() => {
        const hb = getHaeuserbuch.value(props.gemeinde)
        return hb?.streets.filter(s => s.id == props.id)[0]
    })

    const address = computed(() => {
        return entry.value?.getAddress() || streetEntry.value?.getAddress()
    })

    const source = computed(() => {
        return getHaeuserbuch.value(props.gemeinde)?.source
    })

    const sourceUrl = computed(() => {
        return getHaeuserbuch.value(props.gemeinde)?.url
    })

    const expanded = ref(props.expanded)
</script>
<template>
    <h3 @click="expanded=!expanded">
        <span class="expand" v-if="props.expandable && expanded">&#9660;</span>
        <span class="expand" v-if="props.expandable && !expanded">&#9658;</span>
        Eintrag im Häuserbuch <template v-if="address">für {{ address }}</template>
    </h3>
    <div v-if="expanded" class="haeuserbuch info-indent">
        <div v-if="!entry?.location">Achtung: Der Eintrag konnte keiner Parzelle in der Zeit um 1826 zugeordnet werden!</div>
        <ul class="haeuserbuch-lines">
            <li v-if="entry?.flur">{{ entry?.flur.text }}</li>
            <li v-for="info of entry?.infos">
                {{ info.text }}
                <HaeuserbuchSourceTooltip v-if="info.sources.length > 0" :sources="info.sources" :gemeinde="props.gemeinde"/>
            </li>
        </ul>
        <template v-if="entry?.ownerList?.length">
            <h4>Eigentümer</h4>
            <table class="haeuserbuch-year-lines">
                <tbody>
                    <tr v-for="info of entry?.ownerList">
                        <td class="year">{{ info.year }}</td>
                        <td class="text">
                            {{ info.text }}
                            <HaeuserbuchSourceTooltip v-if="info.sources.length > 0" :sources="info.sources" :gemeinde="props.gemeinde"/>
                        </td>
                    </tr>
                </tbody>
            </table>
        </template>
        <template v-if="entry?.additionalInfos?.length">
            <h4>Anmerkungen</h4>
            <ul class="haeuserbuch-year-lines">
                <template v-for="info of entry?.additionalInfos">
                    <li>
                        {{ info.text }}
                        <HaeuserbuchSourceTooltip v-if="info.sources.length > 0" :sources="info.sources" :gemeinde="props.gemeinde"/>
                    </li>
                </template>
            </ul>
        </template>
        <div class="source" v-if="source && showSource">
            Quelle: 
            <a v-if="sourceUrl" target="_blank" :href="sourceUrl">{{ source }}</a>
        <span v-else>{{ source }}</span>
    </div>
</div>
</template>

<style scoped>
    h3 {
        cursor:pointer;
    }

    .expand {
        font-family:Arial, Helvetica, sans-serif;
    }

</style>