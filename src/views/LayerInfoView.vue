<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getLayerInfo } from '@/services/layerInfoService'

const route = useRoute()
const info = computed(() => getLayerInfo(route.params.layername as string))
</script>

<template>
    <div id="contentview">
        <div class="content">
            <template v-if="info">
                <p class="eyebrow">Kartenlayer</p>
                <h1>{{ info.title }}</h1>
                <p v-for="(paragraph, i) in info.paragraphs" :key="i" v-html="paragraph"></p>
            </template>
            <template v-else>
                <h2>Nicht gefunden</h2>
            </template>
        </div>
    </div>
</template>

<style scoped>
    .content p {
        margin: 5pt 0pt;
        text-align: justify;
    }

    .eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.8em;
        color: darkgray;
    }

    .eyebrow + h1 {
        margin-top: 2pt;
    }
</style>
