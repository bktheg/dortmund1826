import { buildDurchfahrtCrossFeatures } from '@/utils/durchfahrtCross'
import { GHOST_LINE_COLOR } from '@/models/mapLayer'

const CROSS_LINE_COLOR = '#525252'

export interface DurchfahrtCrossOptions {
    map: any
    /** Returns the vector-do1914 layer (or undefined if it isn't registered). */
    getLayer: () => any | undefined
    /** Source id of the vector tileset and its gebaeudef source-layer. */
    sourceId?: string
    sourceLayer?: string
    /** Buildings only render the cross at or above this zoom. */
    minZoom?: number
}

/**
 * Draws the dashed "durchfahrt" cross over vector-do1914 buildings.
 *
 * Mapbox GL can't fit a single non-repeating diagonal cross to each polygon, so this
 * controller queries the gebaeudef features on every map idle, computes the two crossing
 * diagonals in JS (see {@link buildDurchfahrtCrossFeatures}), and feeds them into a derived
 * GeoJSON line layer — the same query→derived-layer shape as the HoverController.
 *
 * The cross reads as part of the layer: on creation it registers itself as an emphasis
 * satellite on the vector-do1914 VectorLayer, so it greys out in lockstep with the building
 * lines whenever that layer is ghosted (driven through the store's _applyEmphasis path).
 */
export class DurchfahrtCrossController {
    private readonly map: any
    private readonly getLayer: () => any | undefined
    private readonly sourceId: string
    private readonly sourceLayer: string
    private readonly minZoom: number
    private readonly crossSourceId: string
    private readonly crossLayerId: string
    private lastDataJson: string | null = null
    private idleHandler: (() => void) | null = null

    constructor(options: DurchfahrtCrossOptions) {
        this.map = options.map
        this.getLayer = options.getLayer
        this.sourceId = options.sourceId ?? 'vector-do1914'
        this.sourceLayer = options.sourceLayer ?? 'gebaeudef'
        this.minZoom = options.minZoom ?? 16
        this.crossSourceId = `${this.sourceId}-durchfahrt-source`
        this.crossLayerId = `${this.sourceId}-durchfahrt-cross`
    }

    setup(): void {
        this.idleHandler = () => this.refresh()
        this.map.on('idle', this.idleHandler)
        this.map.on('moveend', this.idleHandler)
        this.refresh()
    }

    teardown(): void {
        if (this.idleHandler) {
            this.map?.off('idle', this.idleHandler)
            this.map?.off('moveend', this.idleHandler)
        }
        this.idleHandler = null
        this.getLayer()?.unregisterEmphasisLineLayer?.(this.crossLayerId)
        if (this.map?.getLayer(this.crossLayerId) != null) this.map.removeLayer(this.crossLayerId)
        if (this.map?.getSource(this.crossSourceId) != null) this.map.removeSource(this.crossSourceId)
        this.lastDataJson = null
    }

    private refresh(): void {
        const layer = this.getLayer()
        const active = layer != null && layer.visible && this.map.getZoom() >= this.minZoom

        if (!active) {
            this.setData(this.emptyCollection())
            return
        }
        if (this.map.getSource(this.sourceId) == null) return

        this.ensureLayer(layer)

        const features = this.map.querySourceFeatures(this.sourceId, {
            sourceLayer: this.sourceLayer,
            filter: ['==', ['get', 'durchfahrt'], 1],
        })
        this.setData(buildDurchfahrtCrossFeatures(features))
    }

    private ensureLayer(layer: any): void {
        if (this.map.getSource(this.crossSourceId) == null) {
            this.map.addSource(this.crossSourceId, { type: 'geojson', data: this.emptyCollection() })
        }
        if (this.map.getLayer(this.crossLayerId) != null) return

        // Insert directly beneath the building name labels (above the building fill/outline)
        // so the cross sits inside the do1914 group and never floats over another epoch.
        // Passing the anchor as beforeId here avoids a one-frame flash on top of the map.
        const anchor = layer.layerDefinitions?.find((d: any) => /gebaeude-name-text/.test(d.id))?.id
        const beforeId = anchor && this.map.getLayer(anchor) != null ? anchor : undefined
        this.map.addLayer({
            id: this.crossLayerId,
            type: 'line',
            source: this.crossSourceId,
            layout: { 'line-cap': 'round' },
            paint: {
                'line-color': layer.emphasized ? CROSS_LINE_COLOR : GHOST_LINE_COLOR,
                'line-width': ['interpolate', ['linear'], ['zoom'], 16, 0.6, 22, 5],
                'line-dasharray': [2, 2],
            },
        }, beforeId)
        layer.registerEmphasisLineLayer(this.crossLayerId, CROSS_LINE_COLOR)
    }

    private setData(data: any): void {
        const source = this.map.getSource(this.crossSourceId)
        if (source == null) return
        // Skip no-op updates: setData always forces a repaint, and because refresh runs on
        // 'idle', an unconditional setData would retrigger 'idle' in an endless render loop.
        const json = JSON.stringify(data)
        if (json === this.lastDataJson) return
        this.lastDataJson = json
        source.setData(data)
    }

    private emptyCollection(): any {
        return { type: 'FeatureCollection', features: [] }
    }
}
