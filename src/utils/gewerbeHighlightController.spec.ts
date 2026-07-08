import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GewerbeHighlightController } from './gewerbeHighlightController'

function makeFakeMap(hasSource = true) {
    const layers = new Set<string>()
    return {
        layers,
        handlers: new Map<string, Set<() => void>>(),
        addLayer: vi.fn((def: any) => layers.add(def.id)),
        removeLayer: vi.fn((id: string) => layers.delete(id)),
        getLayer: vi.fn((id: string) => (layers.has(id) ? { id } : undefined)),
        getSource: vi.fn(() => (hasSource ? {} : undefined)),
        setFilter: vi.fn(),
        querySourceFeatures: vi.fn(() => []),
        on(event: string, cb: () => void) {
            if (!this.handlers.has(event)) this.handlers.set(event, new Set())
            this.handlers.get(event)!.add(cb)
        },
        off(event: string, cb: () => void) {
            this.handlers.get(event)?.delete(cb)
        },
        fire(event: string) {
            for (const cb of this.handlers.get(event) ?? []) cb()
        },
    }
}

function makeController(map: any) {
    return new GewerbeHighlightController({ map, getLayer: () => ({ id: 'vector-do1914' }) })
}

describe('GewerbeHighlightController', () => {
    let map: ReturnType<typeof makeFakeMap>

    beforeEach(() => {
        map = makeFakeMap()
    })

    it('adds fill+line highlight layers and sets an id-membership filter once', () => {
        const c = makeController(map)
        c.setup()
        c.setTargets([8, 7855])

        expect(map.addLayer).toHaveBeenCalledTimes(2)
        expect(map.setFilter).toHaveBeenCalledWith(
            'vector-do1914-gewerbe-highlight-fill', ['in', ['id'], ['literal', [8, 7855]]])
        expect(map.setFilter).toHaveBeenCalledWith(
            'vector-do1914-gewerbe-highlight', ['in', ['id'], ['literal', [8, 7855]]])
    })

    it('never scans tile features (no querySourceFeatures)', () => {
        const c = makeController(map)
        c.setup()
        c.setTargets([8])
        map.fire('idle')

        expect(map.querySourceFeatures).not.toHaveBeenCalled()
    })

    it('does not re-apply the filter on idle once the targets are applied', () => {
        const c = makeController(map)
        c.setup()
        c.setTargets([8])
        const callsAfterApply = map.setFilter.mock.calls.length

        map.fire('idle')
        map.fire('idle')

        expect(map.setFilter.mock.calls.length).toBe(callsAfterApply)
    })

    it('applies the pending filter on idle when the source was not ready yet', () => {
        const lateMap = makeFakeMap(false)
        const c = makeController(lateMap)
        c.setup()
        c.setTargets([8])
        expect(lateMap.setFilter).not.toHaveBeenCalled()

        lateMap.getSource.mockReturnValue({})
        lateMap.fire('idle')

        expect(lateMap.setFilter).toHaveBeenCalledWith(
            'vector-do1914-gewerbe-highlight-fill', ['in', ['id'], ['literal', [8]]])
    })

    it('clears the highlight to a false filter', () => {
        const c = makeController(map)
        c.setup()
        c.setTargets([8])
        map.setFilter.mockClear()

        c.clear()

        expect(map.setFilter).toHaveBeenCalledWith('vector-do1914-gewerbe-highlight-fill', false)
    })

    it('removes its layers and idle handler on teardown', () => {
        const c = makeController(map)
        c.setup()
        c.setTargets([8])
        c.teardown()

        expect(map.getLayer('vector-do1914-gewerbe-highlight-fill')).toBeUndefined()
        expect(map.getLayer('vector-do1914-gewerbe-highlight')).toBeUndefined()
        expect(map.handlers.get('idle')?.size ?? 0).toBe(0)
    })
})
