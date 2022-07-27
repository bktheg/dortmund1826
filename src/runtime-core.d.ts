import mitt from 'mitt';

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        emitter: mitt;
    }
}

export {}  // Important! See note.