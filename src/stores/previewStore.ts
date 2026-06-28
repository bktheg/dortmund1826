import { defineStore } from 'pinia'

export const usePreviewStore = defineStore({
    id: 'preview',
    state: () => ({
        preview: false
    }),
    actions: {
        init(search = window.location.search) {
            const params = new URLSearchParams(search)
            if (params.has('preview')) {
                if (params.get('preview') === '1') {
                    localStorage.setItem('preview', '1')
                    this.preview = true
                } else {
                    localStorage.removeItem('preview')
                    this.preview = false
                }
            } else {
                this.preview = localStorage.getItem('preview') === '1'
            }
        }
    }
})
