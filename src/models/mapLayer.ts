import type mapboxgl from 'mapbox-gl'

export const ALWAYS_OFF = [
    'country-label',
    'state-label',
    'settlement-major-label',
    'settlement-minor-label',
    'settlement-subdivision-label',
    'poi-label',
    'admin-0-boundary-disputed',
    'admin-0-boundary',
    'admin-1-boundary',
    'admin-0-boundary-bg',
    'admin-1-boundary-bg',
]

export interface ClickRoute {
    name: string
    params: Record<string, any>
}

/**
 * Grey-ghost de-emphasis applied to every historic layer that is NOT the topmost
 * visible one. Lower layers are desaturated to a neutral grey wash so only the top
 * epoch carries colour, making the comparison between two periods legible instead of
 * red-on-red. The top layer is restored to its original ("emphasized") paint.
 */
export const GHOST_FILL_COLOR = '#b4b4b4'
export const GHOST_FILL_OPACITY = 0.2
// Buildings get a darker, more opaque grey so they stay distinct from the lighter
// area fills they sit on instead of washing out into the same flat grey.
export const GHOST_BUILDING_FILL_COLOR = '#6b6b6b'
export const GHOST_BUILDING_FILL_OPACITY = 0.5
export const GHOST_LINE_COLOR = '#8f8f8f'
export const GHOST_TEXT_OPACITY = 0.35

/** Building fills (1826 `Kataster-Gebaeude`, 1914 `gebaeude`/`gebaeude-name`) need a stronger ghost than area fills. */
export function isBuildingLayer(id: string): boolean {
    return id.toLowerCase().includes('gebaeude')
}

/**
 * Declares how a layer participates in map hover. Each hover-capable layer owns
 * one descriptor, so adding the 3rd/4th/5th hoverable layer is a single config
 * entry next to the layer definition — the hover machinery iterates descriptors
 * generically and never names a specific layer.
 */
export interface HoverDescriptor {
    hitLayerId: string
    highlightLayerId: string
    source: string
    sourceLayer: string
    highlight: HoverHighlight
    selectFeature?: (features: any[]) => any
    buildClickRoute: (feature: any) => ClickRoute | null
}

export type HoverHighlight =
    | { mechanism: 'feature-state'; layerType: 'line' | 'fill'; paint: any }
    | { mechanism: 'filter'; layerType: 'line' | 'fill'; paint: any; buildFilter: (feature: any) => any[] }

export interface Layer {
    id: string
    type: string
    visible: boolean
    disabled: boolean
    sortable: boolean
    minZoom: number
    maxZoom: number
    name: string
    parentId?: string
    hoverDescriptor?: HoverDescriptor
    addToMap(map: any | null): void
    show(map: any | null, belowLayerId?: string): void
    hide(map: any | null): void
    getAnchorId(): string | undefined
    getFloorAnchor(map: any): string | undefined
    reposition(map: any | null, belowLayerId: string | undefined): void
    /**
     * Render full colour (emphasized=true, the topmost visible historic layer) or a
     * neutral grey ghost (emphasized=false, any layer stacked below it).
     */
    setEmphasis(map: any | null, emphasized: boolean): void
    /**
     * Whether the current map viewport lies entirely outside the geographic extent
     * this layer can render. Layers with no spatial constraint (WMS, base-style
     * static layers) always return false; only region-bound vector tile layers
     * report true once panned away from their bbox.
     */
    isOutOfBounds(map: any | null): boolean
}

export class WmsLayer implements Layer {
    public type: string = 'WmsLayer'
    public visible: boolean = false
    public disabled: boolean = false
    public sortable: boolean = true
    public hoverDescriptor?: HoverDescriptor

    constructor(
        public id: string,
        public name: string,
        public url: string,
        public minZoom: number,
        public maxZoom: number,
        public attribution: string,
        public parentId?: string,
    ) {}

    addToMap(map: any | null): void {
        map?.addSource(`wms-${this.id}-source`, {
            type: 'raster',
            tiles: [this.url],
            tileSize: 256,
            attribution: this.attribution,
            minzoom: this.minZoom,
            maxzoom: this.maxZoom,
        })
    }

    show(map: any | null, belowLayerId: string = 'Kataster-Kulturarten'): void {
        if (map?.getLayer(`wms-${this.id}-layer`) == null) {
            map?.addLayer({
                id: `wms-${this.id}-layer`,
                type: 'raster',
                source: `wms-${this.id}-source`,
                paint: {},
                minzoom: map?.getSource(`wms-${this.id}-source`).minzoom,
                maxzoom: map?.getSource(`wms-${this.id}-source`).maxzoom,
            })
            map?.moveLayer(`wms-${this.id}-layer`, belowLayerId)
        }
    }

    hide(map: any | null): void {
        if (map?.getLayer(`wms-${this.id}-layer`) == null) return
        map?.removeLayer(`wms-${this.id}-layer`)
    }

    getAnchorId(): string {
        return `wms-${this.id}-layer`
    }

    getFloorAnchor(_map: any): string | undefined {
        return undefined
    }

    reposition(map: any | null, belowLayerId: string | undefined): void {
        if (map?.getLayer(`wms-${this.id}-layer`) == null) return
        map?.moveLayer(`wms-${this.id}-layer`, belowLayerId)
    }

    setEmphasis(_map: any | null, _emphasized: boolean): void {
        // Raster tile scans (Uraufnahme/Neuaufnahme) are historic maps in their own
        // right, not vector overlays being compared epoch-against-epoch. Ghosting them
        // when stacked below another layer just makes them look broken, so they always
        // render at full colour regardless of stacking position.
    }

    isOutOfBounds(_map: any | null): boolean {
        return false
    }
}

export class VectorLayer implements Layer {
    public type: string = 'VectorLayer'
    public visible: boolean = false
    public disabled: boolean = false
    public sortable: boolean = true
    public hoverDescriptor?: HoverDescriptor
    // Externally-managed line layers (e.g. the durchfahrt cross overlay) that are not
    // part of layerDefinitions but must ghost in lockstep with this layer. Maps the
    // layer id to its original (emphasized) line colour.
    private _satelliteLines = new Map<string, string>()
    private _emphasized = true

    constructor(
        public id: string,
        public name: string,
        public url: string,
        public minZoom: number,
        public maxZoom: number,
        public attribution: string,
        public layerDefinitions: any[],
        public parentId?: string,
    ) {
        for (let i = 0; i < layerDefinitions.length; i++) {
            layerDefinitions[i].id = id + '-' + layerDefinitions[i].id + '-' + i
            layerDefinitions[i].source = id
        }
    }

    addToMap(map: any | null): void {
        map?.addSource(this.id, {
            type: 'vector',
            url: this.url,
            attribution: this.attribution,
            minzoom: this.minZoom,
            maxzoom: this.maxZoom,
        })
    }

    show(map: any | null, belowLayerId: string = 'Kataster-Kulturarten'): void {
        let lastId = belowLayerId
        for (const layerDef of this.layerDefinitions) {
            if (map?.getLayer(layerDef.id) == null) {
                map?.addLayer(layerDef)
                map?.moveLayer(layerDef.id, lastId)
            }
            lastId = layerDef.id
        }
    }

    hide(map: any | null): void {
        for (const layerDef of this.layerDefinitions) {
            if (map?.getLayer(layerDef.id) != null) {
                map?.removeLayer(layerDef.id)
            }
        }
    }

    getAnchorId(): string | undefined {
        return this.layerDefinitions[this.layerDefinitions.length - 1]?.id
    }

    getFloorAnchor(_map: any): string | undefined {
        return undefined
    }

    reposition(map: any | null, belowLayerId: string | undefined): void {
        let lastId = belowLayerId
        for (const layerDef of this.layerDefinitions) {
            if (map?.getLayer(layerDef.id) != null) {
                map?.moveLayer(layerDef.id, lastId)
                lastId = layerDef.id
            }
        }
    }

    get emphasized(): boolean {
        return this._emphasized
    }

    /**
     * Register an externally-created line layer so it greys out together with this
     * layer's own line definitions. Used by the durchfahrt cross overlay, whose
     * GeoJSON layer is owned by a controller rather than declared in layerDefinitions.
     */
    registerEmphasisLineLayer(id: string, originalColor: string): void {
        this._satelliteLines.set(id, originalColor)
    }

    unregisterEmphasisLineLayer(id: string): void {
        this._satelliteLines.delete(id)
    }

    setEmphasis(map: any | null, emphasized: boolean): void {
        for (const def of this.layerDefinitions) {
            if (map?.getLayer(def.id) == null) continue
            const paint = def.paint ?? {}
            const building = isBuildingLayer(def.id)
            if (def.type === 'fill') {
                map.setPaintProperty(def.id, 'fill-color', emphasized ? paint['fill-color'] : (building ? GHOST_BUILDING_FILL_COLOR : GHOST_FILL_COLOR))
                map.setPaintProperty(def.id, 'fill-opacity', emphasized ? paint['fill-opacity'] : (building ? GHOST_BUILDING_FILL_OPACITY : GHOST_FILL_OPACITY))
                if ('fill-outline-color' in paint) {
                    map.setPaintProperty(def.id, 'fill-outline-color', emphasized ? paint['fill-outline-color'] : GHOST_LINE_COLOR)
                }
            } else if (def.type === 'line') {
                map.setPaintProperty(def.id, 'line-color', emphasized ? paint['line-color'] : GHOST_LINE_COLOR)
            } else if (def.type === 'symbol') {
                map.setPaintProperty(def.id, 'text-opacity', emphasized ? 1 : GHOST_TEXT_OPACITY)
            }
        }
        for (const [id, originalColor] of this._satelliteLines) {
            if (map?.getLayer(id) == null) continue
            map.setPaintProperty(id, 'line-color', emphasized ? originalColor : GHOST_LINE_COLOR)
        }
        this._emphasized = emphasized
    }

    /**
     * A vector tile layer only covers the region declared in its tilejson `bounds`
     * (`[west, south, east, north]`), which mapbox-gl exposes on the source object
     * once the tilejson has loaded — no re-fetch needed. The layer is out of bounds
     * when the current viewport rectangle does not intersect that bbox, so it stays
     * available while any part of the region is still on screen. Until the tilejson
     * has loaded (`bounds` undefined) the layer is treated as in-bounds.
     */
    isOutOfBounds(map: any | null): boolean {
        const bounds = map?.getSource(this.id)?.bounds
        if (!bounds || typeof map?.getBounds !== 'function') return false
        const [west, south, east, north] = bounds
        const view = map.getBounds()
        // Latitude never wraps.
        if (view.getSouth() > north || view.getNorth() < south) return true
        // Longitude does: with renderWorldCopies, panning across a world seam makes
        // getBounds() report unwrapped longitudes (e.g. 360..375) even though a copy of
        // the region is on screen. If the viewport already spans the whole globe every
        // bbox is visible; otherwise wrap the viewport's west edge into the bbox frame
        // and test the band against the bbox in the primary and both adjacent copies.
        const span = view.getEast() - view.getWest()
        if (span >= 360) return false
        const w = ((view.getWest() + 180) % 360 + 360) % 360 - 180
        const overlaps = (bandWest: number) => bandWest <= east && bandWest + span >= west
        return !(overlaps(w) || overlaps(w - 360) || overlaps(w + 360))
    }
}

export class StaticLayer implements Layer {
    public type: string = 'StaticLayer'
    public visible: boolean = true
    public disabled: boolean = false
    public hoverDescriptor?: HoverDescriptor
    private _anchorId: string | undefined = undefined
    // Originals captured the first time a base-style layer is ghosted, so restoring
    // to full colour reproduces whatever the remote Mapbox style declared.
    private _origPaint = new Map<string, any>()

    constructor(
        public id: string,
        public name: string,
        public minZoom: number,
        public maxZoom: number,
        public condition: (layerId: string) => boolean,
        public parentId?: string,
        public sortable: boolean = false,
    ) {}

    addToMap(_map: any | null): void {
        // Static layers already exist in the mapbox style — no registration needed
    }

    show(map: any | null): void {
        this._applyVisibility(map, true)
    }

    hide(map: any | null): void {
        this._applyVisibility(map, false)
    }

    getAnchorId(): string | undefined {
        return this._anchorId
    }

    getFloorAnchor(map: any): string | undefined {
        if (!map?.style?._layers) return undefined
        const styleKeys = Object.keys(map.style._layers)
        return styleKeys.find(id => !ALWAYS_OFF.includes(id) && this.condition(id.toLowerCase()))
    }

    getCeilingAnchor(map: any): string | undefined {
        if (!map?.style?._layers) return undefined
        const styleKeys = Object.keys(map.style._layers)
        let lastMatchIdx = -1
        for (let i = 0; i < styleKeys.length; i++) {
            if (!ALWAYS_OFF.includes(styleKeys[i]) && this.condition(styleKeys[i].toLowerCase())) {
                lastMatchIdx = i
            }
        }
        if (lastMatchIdx === -1 || lastMatchIdx >= styleKeys.length - 1) return undefined
        return styleKeys[lastMatchIdx + 1]
    }

    reposition(map: any | null, _belowLayerId: string | undefined): void {
        if (!this.sortable || !map?.style?._layers) return
        this._anchorId = this.getFloorAnchor(map)
    }

    setEmphasis(map: any | null, emphasized: boolean): void {
        if (!map?.style?._layers) return
        for (const id in map.style._layers) {
            if (!id || ALWAYS_OFF.includes(id)) continue
            if (!this.condition(id.toLowerCase())) continue
            const type = map.style._layers[id]?.type
            const building = isBuildingLayer(id)
            if (type === 'fill') {
                this._ghostProp(map, id, 'fill-color', emphasized, building ? GHOST_BUILDING_FILL_COLOR : GHOST_FILL_COLOR)
                this._ghostProp(map, id, 'fill-opacity', emphasized, building ? GHOST_BUILDING_FILL_OPACITY : GHOST_FILL_OPACITY)
                this._ghostProp(map, id, 'fill-outline-color', emphasized, GHOST_LINE_COLOR)
            } else if (type === 'line') {
                this._ghostProp(map, id, 'line-color', emphasized, GHOST_LINE_COLOR)
            } else if (type === 'symbol') {
                this._ghostProp(map, id, 'text-opacity', emphasized, GHOST_TEXT_OPACITY)
            }
        }
    }

    isOutOfBounds(_map: any | null): boolean {
        return false
    }

    private _ghostProp(map: any, layerId: string, prop: string, emphasized: boolean, ghostValue: any): void {
        const key = `${layerId}::${prop}`
        if (emphasized) {
            // Nothing to restore if we never ghosted this layer.
            if (!this._origPaint.has(key)) return
            map.setPaintProperty(layerId, prop, this._origPaint.get(key))
        } else {
            if (!this._origPaint.has(key)) {
                this._origPaint.set(key, map.getPaintProperty(layerId, prop))
            }
            map.setPaintProperty(layerId, prop, ghostValue)
        }
    }

    private _applyVisibility(map: any | null, visible: boolean): void {
        for (const elem in map?.style?._layers) {
            if (!elem || ALWAYS_OFF.includes(elem)) continue
            if (this.condition(elem.toLowerCase())) {
                map?.setLayoutProperty(elem, 'visibility', visible ? 'visible' : 'none')
            }
        }
    }
}
