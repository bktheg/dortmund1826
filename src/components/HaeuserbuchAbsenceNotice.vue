<script setup lang="ts">
    import { ref } from 'vue'
    import type { Gemeinde } from '@/stores/flurStore'

    const props = defineProps({
        gemeinde: { type: Object as () => Gemeinde, required: true },
        expanded: { type: Boolean, required: false, default: false },
        expandable: { type: Boolean, required: false, default: true }
    })

    const expanded = ref(props.expanded)
</script>

<template>
    <div v-if="!props.gemeinde.haeuserbuch" class="haeuserbuch-absence">
        <h3 @click="expanded=!expanded">
            <span class="expand" v-if="props.expandable && expanded">&#9660;</span>
            <span class="expand" v-if="props.expandable && !expanded">&#9658;</span>
            Kein Häuserbuch
        </h3>
        <p v-if="expanded" class="info-indent">Für {{props.gemeinde.name}} ist bisher kein Häuserbuch hinterlegt. Häuserbücher sind moderne wissenschaftliche Zusammenstellungen und liegen grundsätzlich nur für wenige Gemeinden vor.</p>
    </div>
</template>

<style scoped>
    h3 {
        cursor:pointer;
    }

    .expand {
        font-family:Arial, Helvetica, sans-serif;
    }

    .haeuserbuch-absence p {
        margin-top:4pt;
        margin-bottom:0;
    }
</style>
