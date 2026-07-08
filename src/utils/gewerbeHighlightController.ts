import { buildBuildingIdHighlightFilter } from '@/utils/gewerbeHighlight'

const HIGHLIGHT_COLOR = '#dd492b'

export interface GewerbeHighlightOptions {
    map: any
    /** Returns the vector-do1914 layer (or undefined if it isn't registered). */
    getLayer: () => any | undefined
    /** Source id of the vector tileset and its gebaeudef source-layer. */
    sourceId?: string
    sourceLayer?: string
}

/**
 * Highlights every `gebaeudef` building of the current by-gewerbe-type list.
 *
 * The export resolves each entry to its matching building ids (`bi`, `ogc_fid`)
 * and every tile feature carries that id as its feature id, so the highlight is
 * a single id-membership filter ({@link buildBuildingIdHighlightFilter}) applied
 * once to a persistent fill+line layer. There is no per-viewport tile scan or
 * address comparator, and the filter is viewport-independent — unlike the older
 * address-matching approach it is not re-run on `moveend`/`idle`. A single guarded
 * `idle` handler only exists to (re)apply the pending filter once the vector
 * source has finished registering; after that it is a no-op.
 */
export class GewerbeHighlightController {
    private readonly map: any
    private readonly getLayer: () => any | undefined
    private readonly sourceId: string
    private readonly sourceLayer: string
    private readonly fillLayerId: string
    private readonly lineLayerId: string
    private buildingIds: number[] = []
    private appliedKey: string | null = null
    private idleHandler: (() => void) | null = null

    constructor(options: GewerbeHighlightOptions) {
        this.map = options.map
        this.getLayer = options.getLayer
        this.sourceId = options.sourceId ?? 'vector-do1914'
        this.sourceLayer = options.sourceLayer ?? 'gebaeudef'
        this.fillLayerId = `${this.sourceId}-gewerbe-highlight-fill`
        this.lineLayerId = `${this.sourceId}-gewerbe-highlight`
    }

    setup(): void {
        this.idleHandler = () => this.apply()
        this.map.on('idle', this.idleHandler)
    }

    teardown(): void {
        if (this.idleHandler) {
            this.map?.off('idle', this.idleHandler)
        }
        this.idleHandler = null
        for (const id of [this.lineLayerId, this.fillLayerId]) {
            if (this.map?.getLayer(id) != null) {
                this.map.removeLayer(id)
            }
        }
    }

    setTargets(buildingIds: number[]): void {
        this.buildingIds = buildingIds
        this.appliedKey = null
        this.apply()
    }

    clear(): void {
        this.buildingIds = []
        this.appliedKey = null
        this.apply()
    }

    private apply(): void {
        if (this.map.getSource(this.sourceId) == null) {
            return
        }
        const key = this.buildingIds.join(',')
        if (key === this.appliedKey) {
            return
        }
        this.ensureLayer()
        this.applyFilter(buildBuildingIdHighlightFilter(this.buildingIds))
        this.appliedKey = key
    }

    private applyFilter(filter: any): void {
        for (const id of [this.fillLayerId, this.lineLayerId]) {
            if (this.map?.getLayer(id) != null) {
                this.map.setFilter(id, filter)
            }
        }
    }

    private ensureLayer(): void {
        if (this.map.getLayer(this.fillLayerId) == null) {
            this.map.addLayer({
                id: this.fillLayerId,
                type: 'fill',
                source: this.sourceId,
                'source-layer': this.sourceLayer,
                layout: {},
                paint: {
                    'fill-color': HIGHLIGHT_COLOR,
                    'fill-opacity': 0.3,
                },
                filter: false,
            })
        }
        if (this.map.getLayer(this.lineLayerId) == null) {
            this.map.addLayer({
                id: this.lineLayerId,
                type: 'line',
                source: this.sourceId,
                'source-layer': this.sourceLayer,
                layout: {},
                paint: {
                    'line-color': HIGHLIGHT_COLOR,
                    'line-width': 3,
                },
                filter: false,
            })
        }
    }
}
