<script setup lang="ts">
    import { CommonInfo } from '@/services/infoService';
  
    const props = defineProps({
        info: { type: CommonInfo, required: true }
    })
    </script>
<template>
    <div class="infoblock">
        <p>{{props?.info.info}}</p>
        <div class="source" v-if="props?.info.source">
            Quelle: 
            <a v-if="props?.info.url" target="_blank" :href="props?.info.url">{{ props?.info.source }}</a>
            <span v-else>{{ props?.info.source }}</span>
        </div>
    </div>
</template>

<style scoped>
    .source {
        text-align:right;
        color:darkgray
    }
    .source a {
        color:inherit
    }

    .infoblock p:before {
        content:'„';
        font-weight:bold;
    }

    .infoblock p:after {
        content:'”';
        margin-left:1pt;
        font-weight:bold;
    }

    .infoblock p {
        border-left: 1pt solid lightgrey;
        padding-left: 3pt;
        margin-left: 1pt;
        font-style: italic;
    }
</style>