import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WmsLayer, VectorLayer, StaticLayer, ALWAYS_OFF } from './mapLayer'

function makeMockMap(existingLayers: string[] = [], existingStyleLayers: Record<string, any> = {}) {
    const layerIds = new Set(existingLayers)
    return {
        addSource: vi.fn(),
        addLayer: vi.fn((def: any) => { layerIds.add(def.id) }),
        moveLayer: vi.fn(),
        removeLayer: vi.fn(),
        getLayer: vi.fn((id: string) => layerIds.has(id) ? { id } : null),
        getSource: vi.fn(() => ({ minzoom: 12, maxzoom: 24 })),
        setLayoutProperty: vi.fn(),
        style: { _layers: existingStyleLayers },
    }
}

describe('WmsLayer', () => {
    let layer: WmsLayer
    let map: ReturnType<typeof makeMockMap>

    beforeEach(() => {
        layer = new WmsLayer('uraufnahme', 'Uraufnahme', 'https://example.com/wms', 12.5, 24, 'Geobasis NRW')
        map = makeMockMap()
    })

    it('addToMap registers a raster source', () => {
        layer.addToMap(map)
        expect(map.addSource).toHaveBeenCalledOnce()
        expect(map.addSource).toHaveBeenCalledWith('wms-uraufnahme-source', expect.objectContaining({
            type: 'raster',
            tiles: ['https://example.com/wms'],
        }))
    })

    it('show adds the layer and moves it below Kataster-Kulturarten by default', () => {
        layer.show(map)
        expect(map.addLayer).toHaveBeenCalledOnce()
        expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'wms-uraufnahme-layer', type: 'raster' }))
        expect(map.moveLayer).toHaveBeenCalledWith('wms-uraufnahme-layer', 'Kataster-Kulturarten')
    })

    it('show respects a custom belowLayerId', () => {
        layer.show(map, 'some-anchor')
        expect(map.moveLayer).toHaveBeenCalledWith('wms-uraufnahme-layer', 'some-anchor')
    })

    it('show is idempotent — addLayer not called when layer already exists', () => {
        map = makeMockMap(['wms-uraufnahme-layer'])
        layer.show(map)
        expect(map.addLayer).not.toHaveBeenCalled()
        expect(map.moveLayer).not.toHaveBeenCalled()
    })

    it('hide removes the layer when it exists', () => {
        map = makeMockMap(['wms-uraufnahme-layer'])
        layer.hide(map)
        expect(map.removeLayer).toHaveBeenCalledWith('wms-uraufnahme-layer')
    })

    it('hide is a no-op when layer does not exist', () => {
        layer.hide(map)
        expect(map.removeLayer).not.toHaveBeenCalled()
    })

    it('getAnchorId returns the wms layer id', () => {
        expect(layer.getAnchorId()).toBe('wms-uraufnahme-layer')
    })

    it('reposition calls moveLayer when layer exists', () => {
        map = makeMockMap(['wms-uraufnahme-layer'])
        layer.reposition(map, 'some-anchor')
        expect(map.moveLayer).toHaveBeenCalledWith('wms-uraufnahme-layer', 'some-anchor')
    })

    it('reposition is a no-op when layer does not exist', () => {
        layer.reposition(map, 'some-anchor')
        expect(map.moveLayer).not.toHaveBeenCalled()
    })

    it('addToMap with null map is a no-op', () => {
        expect(() => layer.addToMap(null)).not.toThrow()
    })
})

describe('VectorLayer', () => {
    const layerDefs = [
        { id: 'poly', 'source-layer': 'areas', type: 'fill', paint: {} },
        { id: 'line', 'source-layer': 'areas', type: 'line', paint: {} },
    ]
    let layer: VectorLayer
    let map: ReturnType<typeof makeMockMap>

    beforeEach(() => {
        layer = new VectorLayer('do1914', 'Dortmund 1914', 'https://example.com/tiles.json', 3, 19, '', JSON.parse(JSON.stringify(layerDefs)))
        map = makeMockMap()
    })

    it('addToMap registers a vector source', () => {
        layer.addToMap(map)
        expect(map.addSource).toHaveBeenCalledWith('do1914', expect.objectContaining({ type: 'vector' }))
    })

    it('constructor prefixes sub-layer ids with the layer id', () => {
        expect(layer.layerDefinitions[0].id).toBe('do1914-poly-0')
        expect(layer.layerDefinitions[1].id).toBe('do1914-line-1')
    })

    it('constructor sets source to layer id on all definitions', () => {
        for (const def of layer.layerDefinitions) {
            expect(def.source).toBe('do1914')
        }
    })

    it('show adds and moves all sub-layers', () => {
        layer.show(map)
        expect(map.addLayer).toHaveBeenCalledTimes(2)
        expect(map.moveLayer).toHaveBeenCalledTimes(2)
        expect(map.moveLayer).toHaveBeenNthCalledWith(1, 'do1914-poly-0', 'Kataster-Kulturarten')
        expect(map.moveLayer).toHaveBeenNthCalledWith(2, 'do1914-line-1', 'do1914-poly-0')
    })

    it('show skips sub-layers that already exist', () => {
        map = makeMockMap(['do1914-poly-0'])
        layer.show(map)
        expect(map.addLayer).toHaveBeenCalledTimes(1)
        expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'do1914-line-1' }))
    })

    it('show places a newly-added sub-layer below its existing predecessor (partial re-show)', () => {
        map = makeMockMap(['do1914-poly-0'])
        layer.show(map)
        expect(map.moveLayer).toHaveBeenCalledWith('do1914-line-1', 'do1914-poly-0')
    })

    it('hide removes all sub-layers that exist', () => {
        map = makeMockMap(['do1914-poly-0', 'do1914-line-1'])
        layer.hide(map)
        expect(map.removeLayer).toHaveBeenCalledTimes(2)
        expect(map.removeLayer).toHaveBeenCalledWith('do1914-poly-0')
        expect(map.removeLayer).toHaveBeenCalledWith('do1914-line-1')
    })

    it('hide skips sub-layers that do not exist', () => {
        map = makeMockMap(['do1914-poly-0'])
        layer.hide(map)
        expect(map.removeLayer).toHaveBeenCalledTimes(1)
        expect(map.removeLayer).toHaveBeenCalledWith('do1914-poly-0')
        expect(map.removeLayer).not.toHaveBeenCalledWith('do1914-line-1')
    })

    it('getAnchorId returns the last sub-layer id', () => {
        expect(layer.getAnchorId()).toBe('do1914-line-1')
    })

    it('reposition calls moveLayer for each sub-layer in definition order', () => {
        map = makeMockMap(['do1914-poly-0', 'do1914-line-1'])
        layer.reposition(map, 'some-anchor')
        expect(map.moveLayer).toHaveBeenCalledTimes(2)
        expect(map.moveLayer).toHaveBeenNthCalledWith(1, 'do1914-poly-0', 'some-anchor')
        expect(map.moveLayer).toHaveBeenNthCalledWith(2, 'do1914-line-1', 'do1914-poly-0')
    })

    it('reposition skips sub-layers that do not exist', () => {
        map = makeMockMap(['do1914-poly-0'])
        layer.reposition(map, 'some-anchor')
        expect(map.moveLayer).toHaveBeenCalledTimes(1)
        expect(map.moveLayer).toHaveBeenCalledWith('do1914-poly-0', 'some-anchor')
    })

    it('reposition does not advance anchor past absent sub-layers', () => {
        // only sub-layer[1] exists — sub-layer[0] is absent and must not pollute the anchor
        map = makeMockMap(['do1914-line-1'])
        layer.reposition(map, 'some-anchor')
        expect(map.moveLayer).toHaveBeenCalledTimes(1)
        expect(map.moveLayer).toHaveBeenCalledWith('do1914-line-1', 'some-anchor')
    })
})

describe('StaticLayer — 1826 (kataster prefix)', () => {
    const mockStyleLayers = {
        'kataster-areas': {},
        'kataster-areas-fill': {},
        'kataster-gemeindegrenzen': {},
        'Kataster-Gebaeude': {},
        'roads': {},
    }

    let layer: StaticLayer
    let map: ReturnType<typeof makeMockMap>

    beforeEach(() => {
        layer = new StaticLayer('1826', '1826', 0, 24, (id) => id.startsWith('kataster-'))
        map = makeMockMap([], mockStyleLayers)
    })

    it('show calls setLayoutProperty visible for matching layers', () => {
        layer.show(map)
        expect(map.setLayoutProperty).toHaveBeenCalledWith('kataster-areas', 'visibility', 'visible')
        expect(map.setLayoutProperty).toHaveBeenCalledWith('kataster-areas-fill', 'visibility', 'visible')
        expect(map.setLayoutProperty).toHaveBeenCalledWith('kataster-gemeindegrenzen', 'visibility', 'visible')
    })

    it('condition is evaluated on the lowercased key — mixed-case kataster layers match', () => {
        layer.show(map)
        const calls: string[] = map.setLayoutProperty.mock.calls.map((c: any[]) => c[0])
        // 'Kataster-Gebaeude'.toLowerCase() = 'kataster-gebaeude' → starts with 'kataster-' → MATCHES
        expect(calls).toContain('Kataster-Gebaeude')
    })

    it('show does not affect non-matching layers', () => {
        layer.show(map)
        const calls: string[] = map.setLayoutProperty.mock.calls.map((c: any[]) => c[0])
        expect(calls).not.toContain('roads')
    })

    it('hide calls setLayoutProperty none for matching layers', () => {
        layer.hide(map)
        expect(map.setLayoutProperty).toHaveBeenCalledWith('kataster-areas', 'visibility', 'none')
        expect(map.setLayoutProperty).toHaveBeenCalledWith('kataster-areas-fill', 'visibility', 'none')
    })

    it('addToMap is a no-op', () => {
        expect(() => layer.addToMap(map)).not.toThrow()
        expect(map.addSource).not.toHaveBeenCalled()
        expect(map.addLayer).not.toHaveBeenCalled()
    })

    it('show with null map is a no-op', () => {
        expect(() => layer.show(null)).not.toThrow()
    })

    it('getAnchorId returns undefined', () => {
        expect(layer.getAnchorId()).toBeUndefined()
    })

    it('reposition is a no-op — does not call moveLayer', () => {
        layer.reposition(map, 'some-anchor')
        expect(map.moveLayer).not.toHaveBeenCalled()
    })
})

describe('StaticLayer — sortable reposition', () => {
    const mockStyleLayers = {
        'roads': {},
        'kataster-areas': {},
        'kataster-gemeindegrenzen': {},
        'Kataster-Kulturarten': {},
        'Kataster-Orte': {},
        'post-kataster-label': {},
    }

    let layer: StaticLayer
    let map: ReturnType<typeof makeMockMap>

    beforeEach(() => {
        layer = new StaticLayer('1826', '1826', 0, 24, (id) => id.startsWith('kataster-'), undefined, true)
        map = makeMockMap([], mockStyleLayers)
    })

    it('reposition does not call moveLayer — kataster layers are never moved', () => {
        layer.reposition(map, 'some-anchor')
        expect(map.moveLayer).not.toHaveBeenCalled()
    })

    it('reposition caches the floor anchor (first matching style layer)', () => {
        layer.reposition(map, 'some-anchor')
        expect(layer.getAnchorId()).toBe('kataster-areas')
    })

    it('reposition is a no-op and getAnchorId stays undefined when no style layers match', () => {
        const mapNoKataster = makeMockMap([], { 'roads': {} })
        layer.reposition(mapNoKataster, 'some-anchor')
        expect(mapNoKataster.moveLayer).not.toHaveBeenCalled()
        expect(layer.getAnchorId()).toBeUndefined()
    })

    it('sortable=false StaticLayer reposition is a no-op even when style layers match', () => {
        const nonSortable = new StaticLayer('heute', 'Heute', 0, 24, (id) => !id.startsWith('kataster-'))
        nonSortable.reposition(map, 'some-anchor')
        expect(map.moveLayer).not.toHaveBeenCalled()
    })

    it('getFloorAnchor returns the first (lowest) matching style layer', () => {
        expect(layer.getFloorAnchor(map)).toBe('kataster-areas')
    })

    it('getFloorAnchor returns undefined when no style layers match', () => {
        const mapNoKataster = makeMockMap([], { 'roads': {} })
        expect(layer.getFloorAnchor(mapNoKataster)).toBeUndefined()
    })

    it('getCeilingAnchor returns the layer immediately above the last matching style layer', () => {
        expect(layer.getCeilingAnchor(map)).toBe('post-kataster-label')
    })

    it('getCeilingAnchor returns undefined when the kataster block is at the top of the style', () => {
        const mapKatasterAtTop = makeMockMap([], {
            'roads': {},
            'kataster-areas': {},
            'Kataster-Orte': {},
        })
        expect(layer.getCeilingAnchor(mapKatasterAtTop)).toBeUndefined()
    })
})

describe('StaticLayer — alwaysOff guard', () => {
    it('show skips alwaysOff entries even when they match the condition', () => {
        // Heute condition matches anything non-kataster/non-wms, which includes ALWAYS_OFF entries
        const heuteLayer = new StaticLayer('heute', 'Heute', 0, 24,
            (id) => !id.startsWith('kataster-') && !id.startsWith('wms-'))
        const mockStyleLayers: Record<string, any> = {
            'roads': {},
            [ALWAYS_OFF[0]]: {},   // 'country-label' — matches Heute condition but is alwaysOff
        }
        const map = makeMockMap([], mockStyleLayers)
        heuteLayer.show(map)
        const calls: string[] = map.setLayoutProperty.mock.calls.map((c: any[]) => c[0])
        expect(calls).toContain('roads')
        expect(calls).not.toContain(ALWAYS_OFF[0])
    })

    it('hide skips alwaysOff entries even when they match the condition', () => {
        const heuteLayer = new StaticLayer('heute', 'Heute', 0, 24,
            (id) => !id.startsWith('kataster-') && !id.startsWith('wms-'))
        const mockStyleLayers: Record<string, any> = {
            'roads': {},
            [ALWAYS_OFF[0]]: {},
        }
        const map = makeMockMap([], mockStyleLayers)
        heuteLayer.hide(map)
        const calls: string[] = map.setLayoutProperty.mock.calls.map((c: any[]) => c[0])
        expect(calls).toContain('roads')
        expect(calls).not.toContain(ALWAYS_OFF[0])
    })
})
