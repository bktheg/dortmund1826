import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HoverController } from './hoverController'
import type { Layer, HoverDescriptor } from '@/models/mapLayer'

function fsDescriptor(): HoverDescriptor {
    return {
        hitLayerId: 'a-hit',
        highlightLayerId: 'a-hl',
        source: 'composite',
        sourceLayer: 'src-a',
        highlight: { mechanism: 'feature-state', layerType: 'line', paint: {} },
        selectFeature: (features) => features.find((f: any) => f.properties?.typ === 0) || features[0],
        buildClickRoute: (feature) => ({ name: 'route-a', params: { id: feature.id } }),
    }
}

function filterDescriptor(): HoverDescriptor {
    return {
        hitLayerId: 'b-hit',
        highlightLayerId: 'b-hl',
        source: 'vector-b',
        sourceLayer: 'src-b',
        highlight: {
            mechanism: 'filter',
            layerType: 'fill',
            paint: {},
            buildFilter: (feature) => ['==', ['get', 'k'], feature.properties.k],
        },
        buildClickRoute: (feature) => ({ name: 'route-b', params: { k: feature.properties.k } }),
    }
}

function makeLayer(id: string, descriptor?: HoverDescriptor, visible = true): Layer {
    return {
        id, type: 'X', visible, disabled: false, sortable: true, minZoom: 0, maxZoom: 24, name: id,
        hoverDescriptor: descriptor,
        addToMap() {}, show() {}, hide() {},
        getAnchorId() { return undefined }, getFloorAnchor() { return undefined }, reposition() {},
    }
}

function makeMockMap(featuresByLayer: Record<string, any[]>) {
    const added = new Set<string>()
    const canvasListeners: Record<string, any> = {}
    return {
        handlers: {} as Record<string, any>,
        added,
        featuresByLayer,
        addLayer: vi.fn((l: any) => { added.add(l.id) }),
        getLayer: vi.fn((id: string) => (added.has(id) ? { id } : null)),
        queryRenderedFeatures: vi.fn((_point: any, opts: any) => featuresByLayer[opts.layers[0]] ?? []),
        setFeatureState: vi.fn(),
        setFilter: vi.fn(),
        on: vi.fn(function (this: any, ev: string, h: any) { this.handlers[ev] = h }),
        off: vi.fn(),
        getCanvas: () => ({
            addEventListener: (ev: string, h: any) => { canvasListeners[ev] = h },
            removeEventListener: vi.fn(),
        }),
        _canvasListeners: canvasListeners,
    }
}

describe('HoverController', () => {
    let layers: Layer[]
    beforeEach(() => {
        layers = [makeLayer('1826', fsDescriptor()), makeLayer('do1914', filterDescriptor())]
    })

    function build(map: any) {
        return new HoverController({
            map,
            getLayers: () => layers,
            isEnabled: () => true,
            navigate: vi.fn(),
        })
    }

    it('adds hit + highlight layers for every hover-capable layer on setup', () => {
        const map = makeMockMap({})
        build(map).setup()
        expect(map.added.has('a-hit')).toBe(true)
        expect(map.added.has('a-hl')).toBe(true)
        expect(map.added.has('b-hit')).toBe(true)
        expect(map.added.has('b-hl')).toBe(true)
    })

    it('only sets filter:false on filter-mechanism highlight layers', () => {
        const map = makeMockMap({})
        build(map).setup()
        const fsLayer = map.addLayer.mock.calls.map(c => c[0]).find(l => l.id === 'a-hl')
        const filterLayer = map.addLayer.mock.calls.map(c => c[0]).find(l => l.id === 'b-hl')
        expect('filter' in fsLayer).toBe(false)
        expect(filterLayer.filter).toBe(false)
    })

    it('applies feature-state hover when the cursor is over a feature-state layer', () => {
        const map = makeMockMap({ 'a-hit': [{ id: 7, properties: { typ: 0 } }], 'b-hit': [] })
        const c = build(map); c.setup()
        map.handlers['mousemove']({ point: [0, 0] })
        expect(map.setFeatureState).toHaveBeenCalledWith(
            { source: 'composite', sourceLayer: 'src-a', id: 7 }, { hover: true })
    })

    it('applies filter highlight when the cursor is over a filter layer', () => {
        const map = makeMockMap({ 'a-hit': [], 'b-hit': [{ id: 1, properties: { k: 'x' } }] })
        const c = build(map); c.setup()
        map.handlers['mousemove']({ point: [0, 0] })
        expect(map.setFilter).toHaveBeenCalledWith('b-hl', ['==', ['get', 'k'], 'x'])
    })

    it('lets the lower store index win when multiple layers are hit, clearing the loser', () => {
        // 1826 at index 0 wins over do1914 at index 1
        const map = makeMockMap({
            'a-hit': [{ id: 7, properties: { typ: 0 } }],
            'b-hit': [{ id: 1, properties: { k: 'x' } }],
        })
        const c = build(map); c.setup()
        map.handlers['mousemove']({ point: [0, 0] })
        expect(map.setFeatureState).toHaveBeenCalledWith(
            { source: 'composite', sourceLayer: 'src-a', id: 7 }, { hover: true })
        // do1914 (loser) had no active feature yet, so no setFilter highlight applied
        expect(map.setFilter).not.toHaveBeenCalledWith('b-hl', expect.anything())
    })

    it('reflects live store order so the dragged-up layer wins', () => {
        const map = makeMockMap({
            'a-hit': [{ id: 7, properties: { typ: 0 } }],
            'b-hit': [{ id: 1, properties: { k: 'x' } }],
        })
        const c = build(map); c.setup()
        // drag do1914 above 1826
        layers = [makeLayer('do1914', filterDescriptor()), makeLayer('1826', fsDescriptor())]
        map.handlers['mousemove']({ point: [0, 0] })
        expect(map.setFilter).toHaveBeenCalledWith('b-hl', ['==', ['get', 'k'], 'x'])
    })

    it('honours selectFeature (prefers typ===0) for the click route', () => {
        const map = makeMockMap({ 'a-hit': [{ id: 9, properties: { typ: 1 } }, { id: 5, properties: { typ: 0 } }], 'b-hit': [] })
        const navigate = vi.fn()
        const c = new HoverController({ map, getLayers: () => layers, isEnabled: () => true, navigate })
        c.setup()
        map.handlers['click']({ point: [0, 0] })
        expect(navigate).toHaveBeenCalledWith({ name: 'route-a', params: { id: 5 } })
    })

    it('does not query or apply when disabled, and clears instead', () => {
        const map = makeMockMap({ 'a-hit': [{ id: 7, properties: { typ: 0 } }], 'b-hit': [] })
        const c = new HoverController({ map, getLayers: () => layers, isEnabled: () => false, navigate: vi.fn() })
        c.setup()
        map.handlers['mousemove']({ point: [0, 0] })
        expect(map.setFeatureState).not.toHaveBeenCalled()
    })

    it('does not throw on feature-state layers whose features lack an id (data-preview tiles)', () => {
        const map = makeMockMap({ 'a-hit': [{ properties: { typ: 0 } }], 'b-hit': [] })
        const c = build(map); c.setup()
        expect(() => map.handlers['mousemove']({ point: [0, 0] })).not.toThrow()
        // canvas mouseleave -> clearAll must also stay safe
        expect(() => map._canvasListeners['mouseleave']()).not.toThrow()
        expect(map.setFeatureState).not.toHaveBeenCalled()
    })

    it('skips layers that are toggled off', () => {
        layers = [makeLayer('1826', fsDescriptor(), false), makeLayer('do1914', filterDescriptor(), true)]
        const map = makeMockMap({
            'a-hit': [{ id: 7, properties: { typ: 0 } }],
            'b-hit': [{ id: 1, properties: { k: 'x' } }],
        })
        const c = build(map); c.setup()
        map.handlers['mousemove']({ point: [0, 0] })
        // 1826 hidden → do1914 wins even though it has a higher index
        expect(map.setFilter).toHaveBeenCalledWith('b-hl', ['==', ['get', 'k'], 'x'])
        expect(map.setFeatureState).not.toHaveBeenCalled()
    })
})
