<script setup lang="ts">
    import { HaeuserbuchInfo } from '@/services/infoService';
    import {useHaeuserbuchStore} from '@/stores/haeuserbuchStore'
    import {computed,ref} from 'vue'
    import { storeToRefs } from 'pinia';
  
    const props = defineProps({
        info: { type: HaeuserbuchInfo, required: true }
    })

    const haeuserbuchStore = useHaeuserbuchStore()
    const {getHaeuserbuch} = storeToRefs(haeuserbuchStore)

    haeuserbuchStore.fetchHaeuserbuch(props.info.gemeinde)

    const entry = computed(() => {
        return getHaeuserbuch.value(props.info.gemeinde)?.buildings.filter(b => b.id == props.info.id)[0]
    })

    const source = computed(() => {
        return getHaeuserbuch.value(props.info.gemeinde)?.source
    })

    const sourceUrl = computed(() => {
        return getHaeuserbuch.value(props.info.gemeinde)?.url
    })

    const address = computed(() => {
        if( entry.value?.oldNumber != 'ohne' && entry.value?.number != 'ohne' ) {
            return `Hausnummer ${entry.value?.oldNumber} (${entry.value?.street} ${entry.value?.number})`
        }
        if( entry.value?.oldNumber != 'ohne' ) {
            return `Hausnummer ${entry.value?.oldNumber}`
        }
        if( entry.value?.number != 'ohne' ) {
            return `${entry.value?.street} ${entry.value?.number}`
        }
        return null
    })

    const expanded = ref(false)
</script>
<template>
    <h3 @click="expanded=!expanded">
        <span class="expand" v-if="expanded">&#9660;</span>
        <span class="expand" v-else>&#9658;</span>
        Eintrag im Häuserbuch <template v-if="address">für {{ address }}</template>
    </h3>
    <p class="info-indent" v-if="expanded">
        <ul class="haeuserbuch-lines">
            <li v-for="info of entry?.infos">{{ info.text }}</li>
        </ul>
        <template v-if="entry?.ownerList?.length">
            <h4>Eigentümer</h4>
            <table class="haeuserbuch-year-lines">
                <tbody>
                    <tr v-for="info of entry?.ownerList">
                        <td class="year">{{ info.year }}</td>
                        <td class="text">{{ info.text }}</td>
                    </tr>
                </tbody>
            </table>
        </template>
        <template v-if="entry?.additionalInfos?.length">
            <h4>Anmerkungen</h4>
            <ul class="haeuserbuch-year-lines">
                <template v-for="info of entry?.additionalInfos">
                    <li>{{ info.text }}</li>
                </template>
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
</style>