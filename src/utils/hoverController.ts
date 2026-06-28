import type { Layer, HoverDescriptor, ClickRoute } from '@/models/mapLayer'
import { resolveTopHover } from '@/utils/hoverUtils'

export interface HoverControllerOptions {
    map: any
    getLayers: () => Layer[]
    isEnabled: () => boolean
    navigate: (route: ClickRoute) => void
}

interface RegisteredHover {
    layerId: string
    descriptor: HoverDescriptor
    activeFeature: any | null
}

interface HoverCandidate {
    reg: RegisteredHover
    storeIndex: number
    features: any[]
}

/**
 * Drives map hover generically for any number of hover-capable layers.
 *
 * Each layer declares a {@link HoverDescriptor}; the controller adds its hit and
 * highlight layers, then resolves the winning layer on every cursor move with a
 * fresh `queryRenderedFeatures` per layer (never relying on stale state) and
 * picks the topmost via `resolveTopHover` using live store order. This replaces
 * the previous per-layer handlers that were coupled to "1826" and "1914".
 */
export class HoverController {
    private readonly map: any
    private readonly getLayers: () => Layer[]
    private readonly isEnabled: () => boolean
    private readonly navigate: (route: ClickRoute) => void
    private readonly registered: RegisteredHover[] = []
    private mouseMoveHandler: ((e: any) => void) | null = null
    private clickHandler: ((e: any) => void) | null = null
    private canvasLeaveHandler: (() => void) | null = null

    constructor(options: HoverControllerOptions) {
        this.map = options.map
        this.getLayers = options.getLayers
        this.isEnabled = options.isEnabled
        this.navigate = options.navigate
    }

    setup(): void {
        for (const layer of this.getLayers()) {
            if (!layer.hoverDescriptor) continue
            this.addHoverLayers(layer.hoverDescriptor)
            this.registered.push({ layerId: layer.id, descriptor: layer.hoverDescriptor, activeFeature: null })
        }

        this.mouseMoveHandler = (e: any) => this.onMouseMove(e)
        this.clickHandler = (e: any) => this.onClick(e)
        this.map.on('mousemove', this.mouseMoveHandler)
        this.map.on('click', this.clickHandler)

        this.canvasLeaveHandler = () => this.clearAll()
        this.map.getCanvas().addEventListener('mouseleave', this.canvasLeaveHandler)
    }

    teardown(): void {
        if (this.mouseMoveHandler) this.map?.off('mousemove', this.mouseMoveHandler)
        if (this.clickHandler) this.map?.off('click', this.clickHandler)
        if (this.canvasLeaveHandler) {
            this.map?.getCanvas().removeEventListener('mouseleave', this.canvasLeaveHandler)
        }
        this.mouseMoveHandler = null
        this.clickHandler = null
        this.canvasLeaveHandler = null
    }

    clearAll(): void {
        for (const reg of this.registered) this.clear(reg)
    }

    private addHoverLayers(descriptor: HoverDescriptor): void {
        if (this.map.getLayer(descriptor.highlightLayerId) == null) {
            const highlightLayer: any = {
                id: descriptor.highlightLayerId,
                type: descriptor.highlight.layerType,
                source: descriptor.source,
                'source-layer': descriptor.sourceLayer,
                layout: {},
                paint: descriptor.highlight.paint,
            }
            if (descriptor.highlight.mechanism === 'filter') highlightLayer.filter = false
            this.map.addLayer(highlightLayer)
        }
        if (this.map.getLayer(descriptor.hitLayerId) == null) {
            this.map.addLayer({
                id: descriptor.hitLayerId,
                type: 'fill',
                source: descriptor.source,
                'source-layer': descriptor.sourceLayer,
                layout: {},
                paint: { 'fill-opacity': 0 },
            })
        }
    }

    private buildCandidates(point: any): HoverCandidate[] {
        const layers = this.getLayers()
        const candidates: HoverCandidate[] = []
        for (const reg of this.registered) {
            const storeIndex = layers.findIndex(l => l.id === reg.layerId)
            const layer = storeIndex >= 0 ? layers[storeIndex] : null
            if (!layer || !layer.visible) continue
            if (this.map.getLayer(reg.descriptor.hitLayerId) == null) continue
            const features = this.map.queryRenderedFeatures(point, { layers: [reg.descriptor.hitLayerId] })
            candidates.push({ reg, storeIndex, features })
        }
        return candidates
    }

    private onMouseMove(e: any): void {
        if (!this.isEnabled()) {
            this.clearAll()
            return
        }
        const candidates = this.buildCandidates(e.point)
        const winner = resolveTopHover(candidates)
        for (const reg of this.registered) {
            if (!winner || reg !== winner.reg) this.clear(reg)
        }
        if (winner) this.apply(winner.reg, winner.features)
    }

    private onClick(e: any): void {
        if (!this.isEnabled()) return
        const winner = resolveTopHover(this.buildCandidates(e.point))
        if (!winner) return
        const feature = this.selectFeature(winner.reg.descriptor, winner.features)
        const route = winner.reg.descriptor.buildClickRoute(feature)
        if (route) this.navigate(route)
    }

    private selectFeature(descriptor: HoverDescriptor, features: any[]): any {
        return descriptor.selectFeature ? descriptor.selectFeature(features) : features[0]
    }

    private apply(reg: RegisteredHover, features: any[]): void {
        const descriptor = reg.descriptor
        const feature = this.selectFeature(descriptor, features)
        if (descriptor.highlight.mechanism === 'feature-state') {
            if (reg.activeFeature && reg.activeFeature.id !== feature.id) {
                this.setFeatureHover(descriptor, reg.activeFeature.id, false)
            }
            reg.activeFeature = feature
            this.setFeatureHover(descriptor, feature.id, true)
        } else {
            reg.activeFeature = feature
            this.map.setFilter(descriptor.highlightLayerId, descriptor.highlight.buildFilter(feature))
        }
    }

    private clear(reg: RegisteredHover): void {
        if (reg.activeFeature == null) return
        const descriptor = reg.descriptor
        if (descriptor.highlight.mechanism === 'feature-state') {
            this.setFeatureHover(descriptor, reg.activeFeature.id, false)
        } else if (this.map.getLayer(descriptor.highlightLayerId) != null) {
            this.map.setFilter(descriptor.highlightLayerId, false)
        }
        reg.activeFeature = null
    }

    private setFeatureHover(descriptor: HoverDescriptor, id: any, hover: boolean): void {
        // Feature-state highlighting requires a feature id. Tiles served without
        // ids (e.g. the local data-preview tileset) would make setFeatureState
        // throw "The feature id parameter must be provided." — skip instead.
        if (id == null) return
        this.map.setFeatureState(
            { source: descriptor.source, sourceLayer: descriptor.sourceLayer, id },
            { hover },
        )
    }
}
