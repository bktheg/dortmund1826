import mitt from 'mitt';

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        emitter: mitt;
    }
}

declare module 'vue3-treeselect' {
    import Vue from "vue";

    export default class Treeselect extends Vue {}
}

export {}  // Important! See note.