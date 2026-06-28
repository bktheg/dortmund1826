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
}

export class VectorLayer implements Layer {
    public type: string = 'VectorLayer'
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
}

export class StaticLayer implements Layer {
    public type: string = 'StaticLayer'
    public visible: boolean = true
    public disabled: boolean = false
    public hoverDescriptor?: HoverDescriptor
    private _anchorId: string | undefined = undefined

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

    private _applyVisibility(map: any | null, visible: boolean): void {
        for (const elem in map?.style?._layers) {
            if (!elem || ALWAYS_OFF.includes(elem)) continue
            if (this.condition(elem.toLowerCase())) {
                map?.setLayoutProperty(elem, 'visibility', visible ? 'visible' : 'none')
            }
        }
    }
}
