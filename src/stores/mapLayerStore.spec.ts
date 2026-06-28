import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMapLayerStore } from './mapLayerStore'
import { WmsLayer, VectorLayer, StaticLayer } from '@/models/mapLayer'
import { decodeAddressParam } from '@/utils/buildingAddresses'

function makeMockMap() {
    return {
        addSource: vi.fn(),
        addLayer: vi.fn(),
        moveLayer: vi.fn(),
        removeLayer: vi.fn(),
        getLayer: vi.fn(() => null),
        getSource: vi.fn(() => ({ minzoom: 12, maxzoom: 24 })),
        setLayoutProperty: vi.fn(),
        style: { _layers: {} },
    }
}

describe('mapLayerStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    describe('initLayers', () => {
        it('populates layers in display order without preview', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const ids = store.layers.map(l => l.id)
            expect(ids).toEqual(['1826', '1826-grenzen', 'uraufnahme', 'neuaufnahme', 'heute'])
        })

        it('includes vector-do1914 when preview=true and serverUrl is non-empty', () => {
            const store = useMapLayerStore()
            store.initLayers(true, 'http://localhost:8080')
            const ids = store.layers.map(l => l.id)
            expect(ids).toContain('vector-do1914')
            expect(ids.indexOf('vector-do1914')).toBeLessThan(ids.indexOf('heute'))
        })

        it('includes vector-do1914 when preview=true but serverUrl is empty', () => {
            const store = useMapLayerStore()
            store.initLayers(true, '')
            expect(store.layers.map(l => l.id)).toContain('vector-do1914')
        })

        it('omits vector-do1914 when preview=false', () => {
            const store = useMapLayerStore()
            store.initLayers(false, 'http://localhost:8080')
            expect(store.layers.map(l => l.id)).not.toContain('vector-do1914')
        })

        it('1826 is a StaticLayer', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            expect(store.layers.find(l => l.id === '1826')).toBeInstanceOf(StaticLayer)
        })

        it('uraufnahme is a WmsLayer', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            expect(store.layers.find(l => l.id === 'uraufnahme')).toBeInstanceOf(WmsLayer)
        })

        it('vector-do1914 is a VectorLayer', () => {
            const store = useMapLayerStore()
            store.initLayers(true, 'http://localhost:8080')
            expect(store.layers.find(l => l.id === 'vector-do1914')).toBeInstanceOf(VectorLayer)
        })

        it('1826-grenzen has parentId of 1826', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            expect(store.layers.find(l => l.id === '1826-grenzen')?.parentId).toBe('1826')
        })

        it('static layers start with visible=true', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            expect(store.layers.find(l => l.id === '1826')?.visible).toBe(true)
            expect(store.layers.find(l => l.id === 'heute')?.visible).toBe(true)
        })

        it('WMS layers start with visible=false', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            expect(store.layers.find(l => l.id === 'uraufnahme')?.visible).toBe(false)
        })
    })

    describe('vector-do1914 buildClickRoute', () => {
        function buildRoute(properties: Record<string, unknown>) {
            const store = useMapLayerStore()
            store.initLayers(true, 'http://localhost:8080')
            const layer = store.layers.find(l => l.id === 'vector-do1914')
            return layer!.hoverDescriptor!.buildClickRoute!({ properties })
        }

        it('encodes all addresses from the feature addr property into the route param', () => {
            // base64 of [{"s":"Rheinischestraße","h":"60 2/2"},{"s":"Südwall","h":"7"}]
            const addr = Buffer.from(
                JSON.stringify([{ s: 'Rheinischestraße', h: '60 2/2' }, { s: 'Südwall', h: '7' }]),
            ).toString('base64')

            const route = buildRoute({ addr })

            expect(route?.name).toBe('layer-building')
            expect(route?.params?.layername).toBe('vector-do1914')
            expect(decodeAddressParam(route?.params?.addr as string)).toEqual([
                { strasse: 'Rheinischestraße', hnr: '60 2/2' },
                { strasse: 'Südwall', hnr: '7' },
            ])
        })

        it('falls back to legacy street/hnr when the feature has no addr property', () => {
            const route = buildRoute({ street: 'Südwall', hnr: '7' })

            expect(decodeAddressParam(route?.params?.addr as string)).toEqual([
                { strasse: 'Südwall', hnr: '7' },
            ])
        })
    })

    describe('addAllToMap', () => {
        it('calls addToMap on every layer', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            store.addAllToMap(map)
            // StaticLayer.addToMap is a no-op; WmsLayer.addToMap calls addSource
            expect(map.addSource).toHaveBeenCalledTimes(2) // uraufnahme + neuaufnahme
        })
    })

    describe('toggleLayer', () => {
        it('calls show when layer.visible is true', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            const layer = store.layers.find(l => l.id === 'uraufnahme')!
            layer.visible = true
            const showSpy = vi.spyOn(layer, 'show')
            store.toggleLayer('uraufnahme', map)
            expect(showSpy).toHaveBeenCalledOnce()
        })

        it('calls hide when layer.visible is false', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            const layer = store.layers.find(l => l.id === 'uraufnahme')!
            layer.visible = false
            const hideSpy = vi.spyOn(layer, 'hide')
            store.toggleLayer('uraufnahme', map)
            expect(hideSpy).toHaveBeenCalledOnce()
        })

        it('toggling 1826 off also re-applies the 1826-grenzen state', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            const grenzen = store.layers.find(l => l.id === '1826-grenzen')!
            grenzen.visible = true
            const grenzenShowSpy = vi.spyOn(grenzen, 'show')
            const layer1826 = store.layers.find(l => l.id === '1826')!
            layer1826.visible = false
            store.toggleLayer('1826', map)
            // grenzen.visible=true → grenzen.show() must be called
            expect(grenzenShowSpy).toHaveBeenCalledOnce()
        })

        it('toggling 1826 on re-applies grenzen as hidden when grenzen.visible=false', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            const grenzen = store.layers.find(l => l.id === '1826-grenzen')!
            grenzen.visible = false
            const grenzenHideSpy = vi.spyOn(grenzen, 'hide')
            const layer1826 = store.layers.find(l => l.id === '1826')!
            layer1826.visible = true
            store.toggleLayer('1826', map)
            expect(grenzenHideSpy).toHaveBeenCalledOnce()
        })

        it('toggleLayer for unknown id is a no-op', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            expect(() => store.toggleLayer('nonexistent', map)).not.toThrow()
        })

        it('show is called with Kataster-Kulturarten when no visible WmsLayer is above', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            const layer = store.layers.find(l => l.id === 'uraufnahme')!
            layer.visible = true
            const showSpy = vi.spyOn(layer, 'show')
            store.toggleLayer('uraufnahme', map)
            expect(showSpy).toHaveBeenCalledWith(map, 'Kataster-Kulturarten')
        })

        it('show is called with the anchor of the visible WmsLayer above it', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            // Move neuaufnahme before uraufnahme so it is above uraufnahme in the array
            store.reorderLayer('neuaufnahme', 'uraufnahme', map)
            // Make neuaufnahme visible so it qualifies as the anchor
            store.layers.find(l => l.id === 'neuaufnahme')!.visible = true
            const uraufnahme = store.layers.find(l => l.id === 'uraufnahme')!
            uraufnahme.visible = true
            const showSpy = vi.spyOn(uraufnahme, 'show')
            store.toggleLayer('uraufnahme', map)
            expect(showSpy).toHaveBeenCalledWith(map, 'wms-neuaufnahme-layer')
        })
    })

    describe('reorderLayer', () => {
        it('moves a WmsLayer before its target', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            store.reorderLayer('neuaufnahme', 'uraufnahme', map)
            expect(store.layers.map(l => l.id)).toEqual(['1826', '1826-grenzen', 'neuaufnahme', 'uraufnahme', 'heute'])
        })

        it('moves a top-level layer to the front when target is the first entry', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            store.reorderLayer('uraufnahme', '1826', map)
            const ids = store.layers.map(l => l.id)
            expect(ids[0]).toBe('uraufnahme')
        })

        it('moves the 1826+1826-grenzen group atomically', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            store.reorderLayer('1826', 'neuaufnahme', map)
            expect(store.layers.map(l => l.id)).toEqual(['uraufnahme', '1826', '1826-grenzen', 'neuaufnahme', 'heute'])
        })

        it('is a no-op when fromId equals targetId', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            const before = store.layers.map(l => l.id)
            store.reorderLayer('uraufnahme', 'uraufnahme', map)
            expect(store.layers.map(l => l.id)).toEqual(before)
        })

        it('calls reposition on each visible WmsLayer in top-down order after reorder', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            const map = makeMockMap()
            const neu = store.layers.find(l => l.id === 'neuaufnahme')!
            const ura = store.layers.find(l => l.id === 'uraufnahme')!
            neu.visible = true
            ura.visible = true
            const neuReposition = vi.spyOn(neu, 'reposition')
            const uraReposition = vi.spyOn(ura, 'reposition')
            // drag neuaufnahme before uraufnahme → new order: [1826,1826-grenzen,neuaufnahme,uraufnahme,heute]
            store.reorderLayer('neuaufnahme', 'uraufnahme', map)
            expect(neuReposition).toHaveBeenCalledWith(map, 'Kataster-Kulturarten')
            expect(uraReposition).toHaveBeenCalledWith(map, 'wms-neuaufnahme-layer')
        })
    })

    describe('updateDisabledStatus', () => {
        it('sets disabled=true for layers whose minZoom exceeds current zoom', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            store.updateDisabledStatus(10)
            // uraufnahme minZoom=12.5, neuaufnahme minZoom=12 → both disabled at zoom 10
            expect(store.layers.find(l => l.id === 'uraufnahme')?.disabled).toBe(true)
            expect(store.layers.find(l => l.id === 'neuaufnahme')?.disabled).toBe(true)
        })

        it('sets disabled=false for layers whose minZoom is at or below current zoom', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            store.updateDisabledStatus(13)
            expect(store.layers.find(l => l.id === 'uraufnahme')?.disabled).toBe(false)
            expect(store.layers.find(l => l.id === 'neuaufnahme')?.disabled).toBe(false)
        })

        it('static layers with minZoom=0 are never disabled', () => {
            const store = useMapLayerStore()
            store.initLayers(false, '')
            store.updateDisabledStatus(0)
            expect(store.layers.find(l => l.id === '1826')?.disabled).toBe(false)
            expect(store.layers.find(l => l.id === 'heute')?.disabled).toBe(false)
        })
    })
})
