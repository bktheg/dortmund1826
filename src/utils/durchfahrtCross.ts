type Position = [number, number]

interface QueriedGeometry {
    type?: string
    coordinates?: any
}

interface QueriedFeature {
    id?: string | number
    geometry?: QueriedGeometry
}

interface CrossLineFeature {
    type: 'Feature'
    geometry: { type: 'LineString'; coordinates: Position[] }
    properties: Record<string, never>
}

export interface CrossFeatureCollection {
    type: 'FeatureCollection'
    features: CrossLineFeature[]
}

function outerRings(geometry: QueriedGeometry | undefined): Position[][] {
    if (!geometry || !geometry.coordinates) return []
    if (geometry.type === 'Polygon') {
        return [geometry.coordinates[0] as Position[]]
    }
    if (geometry.type === 'MultiPolygon') {
        return (geometry.coordinates as Position[][][]).map(poly => poly[0])
    }
    return []
}

function samePoint(a: Position, b: Position): boolean {
    return a[0] === b[0] && a[1] === b[1]
}

/**
 * Builds the two crossing diagonals of one polygon ring from its extreme vertices.
 * The four corners are the vertices extreme along the two diagonal axes — min/max of
 * (kx·lng + lat) and min/max of (kx·lng − lat) — and the cross connects the opposite
 * pairs. Longitude is scaled by kx = cos(latitude) so "extreme" is measured in roughly
 * isotropic on-screen space; at Dortmund's ~51.5°N a raw lng/lat metric stretches the
 * axes and skews (or degenerates) the X for rotated buildings. The line endpoints are
 * the original, unscaled coordinates. Degenerate lines (coincident endpoints) are
 * dropped so collapsed polygons never emit zero-length geometry.
 */
function crossLines(ring: Position[] | undefined): Position[][] {
    if (!ring || ring.length < 3) return []

    let latTotal = 0
    for (const p of ring) latTotal += p[1]
    const kx = Math.cos((latTotal / ring.length) * Math.PI / 180)

    let minSum = ring[0], maxSum = ring[0], minDif = ring[0], maxDif = ring[0]
    for (const p of ring) {
        const sum = kx * p[0] + p[1]
        const dif = kx * p[0] - p[1]
        if (sum < kx * minSum[0] + minSum[1]) minSum = p
        if (sum > kx * maxSum[0] + maxSum[1]) maxSum = p
        if (dif < kx * minDif[0] - minDif[1]) minDif = p
        if (dif > kx * maxDif[0] - maxDif[1]) maxDif = p
    }

    const lines: Position[][] = []
    if (!samePoint(minSum, maxSum)) lines.push([minSum, maxSum])
    if (!samePoint(minDif, maxDif)) lines.push([minDif, maxDif])
    return lines
}

function lineFeature(coordinates: Position[]): CrossLineFeature {
    return { type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: {} }
}

/**
 * Turns queried `gebaeudef` (durchfahrt) features into a GeoJSON FeatureCollection
 * of dashed-cross line segments. Features are deduplicated by `id` when the tileset
 * provides one (tile clipping can return the same building from several tiles); only
 * each polygon's outer ring is used, so holes are ignored.
 */
export function buildDurchfahrtCrossFeatures(features: QueriedFeature[] | undefined): CrossFeatureCollection {
    const out: CrossLineFeature[] = []
    const seen = new Set<string | number>()
    for (const f of features ?? []) {
        if (f?.id != null) {
            if (seen.has(f.id)) continue
            seen.add(f.id)
        }
        for (const ring of outerRings(f?.geometry)) {
            for (const line of crossLines(ring)) out.push(lineFeature(line))
        }
    }
    return { type: 'FeatureCollection', features: out }
}
