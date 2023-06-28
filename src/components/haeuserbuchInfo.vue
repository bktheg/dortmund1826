<script setup lang="ts">
    import { HaeuserbuchInfo,HaeuserbuchInfoLineType } from '@/services/infoService';
  
    const props = defineProps({
        info: { type: HaeuserbuchInfo, required: true }
    })
</script>
<template>
    <h3>Eintrag im Häuserbuch für {{ info.address }}</h3>
    <ul class="haeuserbuch-lines">
        <li v-for="info of props?.info.infos.filter(i => i.type != HaeuserbuchInfoLineType.Unbekannt)">{{ info.text }}</li>
    </ul>
    <h4>Eigentümer</h4>
    <table class="haeuserbuch-year-lines">
        <tbody>
            <tr v-for="info of props?.info.ownerList">
                <td class="year">{{ info.year }}</td>
                <td class="text">{{ info.text }}</td>
            </tr>
        </tbody>
    </table>
    <template v-if="props?.info.additionalInfos?.length">
        <h4>Anmerkungen</h4>
        <ul class="haeuserbuch-year-lines">
            <template v-for="info of props?.info.additionalInfos">
                <li>{{ info.text }}</li>
            </template>
        </ul>
    </template>
</template>

<style scoped>
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