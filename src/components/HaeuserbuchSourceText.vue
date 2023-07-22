<script setup lang="ts">
    import {useHaeuserbuchStore} from '@/stores/haeuserbuchStore'
    import {computed,ref} from 'vue'
    import { storeToRefs } from 'pinia';
  
    const props = defineProps({
        sources: { type: Array<string>, required: true },
        gemeinde: { type: String, required: true }
    })

    const haeuserbuchStore = useHaeuserbuchStore()
    const {getHaeuserbuch} = storeToRefs(haeuserbuchStore)

    haeuserbuchStore.fetchHaeuserbuch(props.gemeinde)

    const sourcesData = computed(() => {
        const sources = getHaeuserbuch.value(props.gemeinde)?.sources

        return props.sources?.map(s => sources?.get(s))
    })
</script>
<template>
    <div v-for="source of sourcesData" :key="source?.id" class="hb-text-box">
        <h2>Quelle {{ source?.signatureOld }}</h2>
        <span v-if="source?.signatureNew" class="signature">Signatur: {{  source?.archive }}, {{ source?.signatureNew }}</span>
        <p v-text="source?.name"/>
    </div>
</template>

<style scoped>
    .hb-text-box {
        max-width:768px;
    }

    .hb-text-box h2:first-child {
        margin-top:0
    }

    .hb-text-box .signature {
        color: var(--color-light-text);
        font-size: 80%;
    }
    .hb-text-box p {
        margin:5pt 0;
        white-space: pre-line;
    }
</style>