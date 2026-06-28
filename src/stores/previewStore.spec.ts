import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePreviewStore } from './previewStore'

describe('previewStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        localStorage.clear()
    })

    it('defaults preview to false', () => {
        const store = usePreviewStore()
        expect(store.preview).toBe(false)
    })

    it('enables preview and writes localStorage when ?preview=1', () => {
        const store = usePreviewStore()
        store.init('?preview=1')
        expect(store.preview).toBe(true)
        expect(localStorage.getItem('preview')).toBe('1')
    })

    it('disables preview and clears localStorage when ?preview=0', () => {
        localStorage.setItem('preview', '1')
        const store = usePreviewStore()
        store.init('?preview=0')
        expect(store.preview).toBe(false)
        expect(localStorage.getItem('preview')).toBeNull()
    })

    it('disables preview for any non-1 URL param value', () => {
        localStorage.setItem('preview', '1')
        const store = usePreviewStore()
        store.init('?preview=true')
        expect(store.preview).toBe(false)
        expect(localStorage.getItem('preview')).toBeNull()
    })

    it('reads preview true from localStorage when no URL param', () => {
        localStorage.setItem('preview', '1')
        const store = usePreviewStore()
        store.init('')
        expect(store.preview).toBe(true)
    })

    it('leaves preview false when no URL param and localStorage is empty', () => {
        const store = usePreviewStore()
        store.init('')
        expect(store.preview).toBe(false)
    })
})
