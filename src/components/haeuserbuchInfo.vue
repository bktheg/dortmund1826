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
    <dl class="haeuserbuch-year-lines">
        <template v-for="info of props?.info.yearInfos">
            <dd>{{ info.year }}</dd>
            <dt>{{ info.text }}</dt>
        </template>
    </dl>
</template>

<style scoped>
    .haeuserbuch-year-lines dd:before {
        display:block;
        content: ' '
    }
    .haeuserbuch-year-lines dd {
        display:inline;
        font-weight:bold;
    }

    .haeuserbuch-year-lines dd:after {
        content: ':'
    }

    .haeuserbuch-year-lines dt {
        display:inline;
        padding-left:3pt;
    }

    .haeuserbuch-lines {
        list-style:none;
        padding-left:0;
    }
</style>