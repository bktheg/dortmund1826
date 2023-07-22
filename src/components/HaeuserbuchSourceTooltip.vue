<script setup lang="ts">
    import {useHaeuserbuchStore} from '@/stores/haeuserbuchStore'
    import {computed,ref} from 'vue'
    import { storeToRefs } from 'pinia';
    import { useModal } from 'vue-final-modal'
    import Modal from '@/components/Modal.vue'
    import HaeuserbuchSourceText from '@/components/HaeuserbuchSourceText.vue'
  
    const props = defineProps({
        sources: { type: Array<string>, required: true },
        gemeinde: { type: String, required: true }
    })

    const { open, close } = useModal({
        component: Modal,
        attrs: {
            onConfirm() {
                close()
            },
        },
        slots: {
            default: {
                component: HaeuserbuchSourceText,
                attrs: {
                    sources: props.sources,
                    gemeinde: props.gemeinde,
                },
            }
        },
    })
</script>
<template>
    <div class="hb-tooltip" @click="open">
        ⓘ
    </div>
</template>

<style scoped>
    .hb-tooltip {
        position: relative;
        display: inline-block;
        cursor: pointer;
        font-weight: bold;
    }

    .hb-tooltip .hb-tooltip-text {
        visibility: hidden;
        width: 200pt;
        background-color: var(--color-background) black;
        color: var(--color-text);
        text-align: center;
        padding: 5px 0;
        border-radius: 6px;
        
        /* Position the tooltip text - see examples below! */
        position: absolute;
        z-index: 1;
    }
    .hb-tooltip .hb-tooltip-text.hb-tooltip-visible {
        visibility: visible;
    }
</style>