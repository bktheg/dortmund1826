<script setup lang="ts">
    import { HaeuserbuchInfo } from '@/services/infoService';
    import {useHaeuserbuchStore} from '@/stores/haeuserbuchStore'
    import {computed,ref} from 'vue'
    import { storeToRefs } from 'pinia';
    import HaeuserbuchSourceTooltip from '@/components/HaeuserbuchSourceTooltip.vue';
  
    const props = defineProps({
        info: { type: HaeuserbuchInfo, required: true },
        expanded: { type: Boolean, required: false, default: false },
        expandable: { type: Boolean, required: false, default: true }
    })

    const haeuserbuchStore = useHaeuserbuchStore()
    const {getHaeuserbuch} = storeToRefs(haeuserbuchStore)

    haeuserbuchStore.fetchHaeuserbuch(props.info.gemeinde)

    const entry = computed(() => {
        const hb = getHaeuserbuch.value(props.info.gemeinde)
        return hb?.buildings.filter(b => b.id == props.info.id)[0]
    })

    const streetEntry = computed(() => {
        const hb = getHaeuserbuch.value(props.info.gemeinde)
        return hb?.streets.filter(s => s.id == props.info.id)[0]
    })

    const address = computed(() => {
        return entry.value?.getAddress() || streetEntry.value?.getAddress()
    })

    const source = computed(() => {
        return getHaeuserbuch.value(props.info.gemeinde)?.source
    })

    const sourceUrl = computed(() => {
        return getHaeuserbuch.value(props.info.gemeinde)?.url
    })

    const expanded = ref(props.expanded)
</script>
<template>
    <h3 @click="expanded=!expanded">
        <span class="expand" v-if="props.expandable && expanded">&#9660;</span>
        <span class="expand" v-if="props.expandable && !expanded">&#9658;</span>
        Eintrag im Häuserbuch <template v-if="address">für {{ address }}</template>
    </h3>
    <p class="info-indent" v-if="expanded">
        <template v-if="entry">
            <div v-if="!entry?.location">Achtung: Der Eintrag konnte keiner Parzelle 1826 zugeordnet werden!</div>
            <ul class="haeuserbuch-lines">
                <li v-if="entry?.flur">{{ entry?.flur.text }}</li>
                <li v-for="info of entry?.infos">
                    {{ info.text }}
                    <HaeuserbuchSourceTooltip v-if="info.sources.length > 0" :sources="info.sources" :gemeinde="props.info.gemeinde"/>
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
                                <HaeuserbuchSourceTooltip v-if="info.sources.length > 0" :sources="info.sources" :gemeinde="props.info.gemeinde"/>
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
                            <HaeuserbuchSourceTooltip v-if="info.sources.length > 0" :sources="info.sources" :gemeinde="props.info.gemeinde"/>
                        </li>
                    </template>
                </ul>
            </template>
        </template>
        <template v-if="streetEntry">
            <template v-if="streetEntry?.infos.length">
                <h4>Allgemei und unbestimmt</h4>
                <ul class="haeuserbuch-year-lines">
                    <template v-for="info of streetEntry?.infos">
                        <li>
                            {{ info.text }}
                            <HaeuserbuchSourceTooltip v-if="info.sources.length > 0" :sources="info.sources" :gemeinde="props.info.gemeinde"/>
                        </li>
                    </template>
                </ul>
            </template>
        </template>
        <div class="source" v-if="source">
            Quelle: 
            <a v-if="sourceUrl" target="_blank" :href="sourceUrl">{{ source }}</a>
        <span v-else>{{ source }}</span>
    </div>
    </p>
</template>

<style scoped>
    h3 {
        cursor:pointer;
    }

    .expand {
        font-family:Arial, Helvetica, sans-serif;
    }

    .haeuserbuch-year-lines td {
        padding:0
    }
    .haeuserbuch-year-lines .year {
        padding-right:5pt;
        text-align:right;
        width:38pt;
        white-space: nowrap;
        vertical-align: top;
    }
    ul.haeuserbuch-year-lines {
        padding-left:16pt;
    }

    .haeuserbuch-lines {
        list-style:none;
        padding-left:0;
    }

    .haeuserbuch-lines li {
        line-height:normal;
        padding: 2pt 0pt;
    }
</style>