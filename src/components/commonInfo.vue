<script setup lang="ts">
    import { CommonInfo } from '@/services/infoService';
  
    const props = defineProps({
        info: { type: CommonInfo, required: true }
    })
    </script>
<template>
    <p>{{props?.info.info}}</p>
    <div class="source" v-if="props?.info.source">
        Quelle: 
        <a v-if="props?.info.url" target="_blank" :href="props?.info.url">{{ props?.info.source }}</a>
        <span v-else>{{ props?.info.source }}</span>
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
</style>