const HATCH_COLOR = '#d55555'

// Mapbox patterns are fixed in screen pixels, so to make the hatching scale with the map
// one image per half zoom level is registered, each drawn at the matching world scale
// (spacing doubles per zoom level, HATCH_REFERENCE_SIZE px at HATCH_REFERENCE_ZOOM).
const HATCH_REFERENCE_ZOOM = 17
const HATCH_REFERENCE_SIZE = 10
const HATCH_MIN_ZOOM = 14
const HATCH_MAX_ZOOM = 22
const HATCH_ZOOM_STEP = 0.5
const HATCH_MIN_SIZE = 2

const OUTLINE_WIDTH = ['interpolate', ['linear'], ['zoom'], 13, 0.02, 17, 0.8, 22, 8]

const CATEGORY = ['coalesce', ['get', 'category'], '']
const HATCHED = ['==', CATEGORY, '4']

function categoryFill(id: string, category: string, color: string, opacity: number): any {
    return {
        id,
        'source-layer': 'do1610',
        type: 'fill',
        filter: ['==', CATEGORY, category],
        paint: {
            'fill-color': color,
            'fill-opacity': opacity,
        },
    }
}

function hatchZoomStops(): number[] {
    const stops: number[] = []
    for (let z = HATCH_MIN_ZOOM; z <= HATCH_MAX_ZOOM; z += HATCH_ZOOM_STEP) stops.push(z)
    return stops
}

function hatchImageName(zoom: number): string {
    return `do1610-hatch-${zoom}`
}

function createHatchImage(zoom: number): ImageData {
    const scale = Math.pow(2, zoom - HATCH_REFERENCE_ZOOM)
    const size = Math.max(HATCH_MIN_SIZE, Math.round(HATCH_REFERENCE_SIZE * scale))
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = HATCH_COLOR
    ctx.lineWidth = Math.max(1, size * 0.2)
    ctx.beginPath()
    // The lines x + y = k * size also run through the tile corners; drawing all three keeps
    // the pattern seamless when tiles repeat.
    for (let k = 0; k <= 2; k++) {
        ctx.moveTo(-size, (k + 1) * size)
        ctx.lineTo((k + 1) * size, -size)
    }
    ctx.stroke()
    return ctx.getImageData(0, 0, size, size)
}

export function getDo1610HatchImages(): Record<string, () => ImageData> {
    const images: Record<string, () => ImageData> = {}
    for (const zoom of hatchZoomStops()) {
        images[hatchImageName(zoom)] = () => createHatchImage(zoom)
    }
    return images
}

function hatchPattern(): any {
    const [first, ...rest] = hatchZoomStops()
    return ['step', ['zoom'], hatchImageName(first), ...rest.flatMap(z => [z, hatchImageName(z)])]
}

export function getDo1610LayerDefinitions(): any[] {
    return [
        {
            id: 'gebaeude-name-text',
            // One point per building in exactly one tile, so labels are neither repeated nor jumping.
            'source-layer': 'do1610_labels',
            type: 'symbol',
            minzoom: 15,
            filter: ['all', ['!=', ['get', 'name'], null], ['!=', ['get', 'name'], '']],
            layout: {
                'text-field': ['get', 'name'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 15, 9, 22, 36],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Regular'],
            },
            paint: {
                'text-color': '#000000',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1,
            },
        },
        {
            id: 'gebaeude-line',
            'source-layer': 'do1610',
            type: 'line',
            filter: ['!', HATCHED],
            paint: {
                'line-color': '#525252',
                'line-width': OUTLINE_WIDTH,
            },
        },
        {
            id: 'gebaeude-schraffiert-line',
            'source-layer': 'do1610',
            type: 'line',
            filter: HATCHED,
            paint: {
                'line-color': HATCH_COLOR,
                'line-width': OUTLINE_WIDTH,
            },
        },
        {
            id: 'gebaeude-schraffiert',
            'source-layer': 'do1610',
            type: 'fill',
            filter: HATCHED,
            paint: {
                'fill-color': HATCH_COLOR,
                'fill-opacity': 1,
                'fill-pattern': hatchPattern(),
            },
        },
        categoryFill('gebaeude-kategorie-5', '5', '#dedede', 0.125),
        categoryFill('gebaeude-kategorie-3', '3', '#de7451', 0.59),
        categoryFill('gebaeude-kategorie-2', '2', '#5ade67', 0.59),
        categoryFill('gebaeude-kategorie-1', '1', '#5dd4de', 0.59),
        {
            id: 'gebaeude',
            'source-layer': 'do1610',
            type: 'fill',
            filter: ['!', ['in', CATEGORY, ['literal', ['1', '2', '3', '4', '5']]]],
            paint: {
                'fill-color': '#5851de',
                'fill-opacity': 0.59,
            },
        },
    ]
}
