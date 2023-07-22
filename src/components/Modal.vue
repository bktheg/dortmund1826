<script setup lang="ts">
    import { VueFinalModal } from 'vue-final-modal'

    defineProps<{
        title?: string
        closeText?: string
    }>()

    const emit = defineEmits<{
        (e: 'confirm'): void
    }>()
</script>

<template>
    <VueFinalModal
      class="confirm-modal"
      content-class="confirm-modal-content"
      overlay-transition="vfm-fade"
      content-transition="vfm-fade"
    >
        <h1 v-if="title">{{ title }}</h1>
        <slot />
        <div class="confirm-modal-footer">
                <button @click="emit('confirm')">
                    {{ closeText || 'schließen' }}
                </button>
        </div>
    </VueFinalModal>
</template>

<style>
    .confirm-modal {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .confirm-modal-content {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        background: var(--color-background);
        border-radius: 0.5rem;
    }
    .confirm-modal-content > * + *{
        margin: 0.5rem 0 0 0;
    }
    .confirm-modal-content h1 {
        font-size: 1.375rem;
    }
    .confirm-modal-content .confirm-modal-footer {
        display: flex;
    }
    .confirm-modal-content .confirm-modal-footer * {
        margin: auto;
    }

</style>