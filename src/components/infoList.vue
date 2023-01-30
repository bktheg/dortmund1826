<script setup lang="ts">
    import { WikipediaInfo, CommonInfo, type Info, HaeuserbuchInfo } from '@/services/infoService';
    import WikipediaInfoComponent from '@/components/wikipediaInfo.vue'
    import CommonInfoComponent from '@/components/commonInfo.vue'
    import HaeuserbuchInfoComponent from '@/components/haeuserbuchInfo.vue'

    const props = defineProps({
        infos: { type: Array<Info>, required: true }
    })
</script>
<template>
    <div v-for="info of props?.infos" class="infoentry">
        <WikipediaInfoComponent v-if="info instanceof WikipediaInfo" :page="(info as WikipediaInfo).page"/>
        <CommonInfoComponent v-if="(info instanceof CommonInfo)" :info="(info as CommonInfo)"/>
        <HaeuserbuchInfoComponent v-if="(info instanceof HaeuserbuchInfo)" :info="(info as HaeuserbuchInfo)"/>
    </div>
</template>

<style scoped>
    .infoentry {
        margin-top:5pt;
        margin-bottom:5pt;
    }
</style>