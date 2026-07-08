import { describe, it, expect } from 'vitest'
import { buildDurchfahrtCrossFeatures } from './durchfahrtCross'

type Pos = [number, number]

function polygon(ring: Pos[], id?: string | number) {
    return { id, geometry: { type: 'Polygon', coordinates: [ring] } }
}

function lines(features: ReturnType<typeof buildDurchfahrtCrossFeatures>['features']) {
    return features.map(f => f.geometry.coordinates)
}

const square: Pos[] = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]

describe('buildDurchfahrtCrossFeatures', () => {
    it('emits two diagonals connecting the opposite corners of a square', () => {
        const result = buildDurchfahrtCrossFeatures([polygon(square)])
        expect(result.type).toBe('FeatureCollection')
        expect(lines(result.features)).toEqual([
            [[0, 0], [2, 2]],
            [[0, 2], [2, 0]],
        ])
    })

    it('uses the four extreme corners on polygons with more than four vertices', () => {
        // Same square corners with extra collinear midpoints on each edge.
        const ring: Pos[] = [
            [0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1], [0, 0],
        ]
        const result = buildDurchfahrtCrossFeatures([polygon(ring)])
        expect(lines(result.features)).toEqual([
            [[0, 0], [2, 2]],
            [[0, 2], [2, 0]],
        ])
    })

    it('joins opposite corners of a rotated (non-axis-aligned) rectangle', () => {
        // Parallelogram corners A(0,1) B(3,0) C(4,2) D(1,3); diagonals are A–C and B–D.
        const rotated: Pos[] = [[0, 1], [3, 0], [4, 2], [1, 3], [0, 1]]
        const result = buildDurchfahrtCrossFeatures([polygon(rotated)])
        expect(lines(result.features)).toEqual([
            [[0, 1], [4, 2]],
            [[1, 3], [3, 0]],
        ])
    })

    it('connects opposite corners of a rotated building at Dortmund latitude (~51.5°N)', () => {
        // Parallelogram near 7.46,51.51; corners A,B,C,D with diagonals A–C and B–D.
        const a: Pos = [7.460, 51.510]
        const b: Pos = [7.463, 51.509]
        const c: Pos = [7.464, 51.511]
        const d: Pos = [7.461, 51.512]
        const result = buildDurchfahrtCrossFeatures([polygon([a, b, c, d, a])])
        expect(lines(result.features)).toEqual([
            [a, c],
            [d, b],
        ])
    })

    it('drops degenerate polygons without emitting zero-length lines', () => {
        const collapsed: Pos[] = [[5, 5], [5, 5], [5, 5], [5, 5]]
        const result = buildDurchfahrtCrossFeatures([polygon(collapsed)])
        expect(result.features).toEqual([])
    })

    it('ignores rings with fewer than three vertices', () => {
        const result = buildDurchfahrtCrossFeatures([polygon([[0, 0], [1, 1]] as Pos[])])
        expect(result.features).toEqual([])
    })

    it('uses only the outer ring of a polygon with a hole', () => {
        const hole: Pos[] = [[0.5, 0.5], [1.5, 0.5], [1.5, 1.5], [0.5, 1.5], [0.5, 0.5]]
        const feature = { geometry: { type: 'Polygon', coordinates: [square, hole] } }
        const result = buildDurchfahrtCrossFeatures([feature])
        expect(lines(result.features)).toEqual([
            [[0, 0], [2, 2]],
            [[0, 2], [2, 0]],
        ])
    })

    it('emits a cross per part of a MultiPolygon', () => {
        const other: Pos[] = [[10, 10], [12, 10], [12, 12], [10, 12], [10, 10]]
        const feature = {
            geometry: { type: 'MultiPolygon', coordinates: [[square], [other]] },
        }
        const result = buildDurchfahrtCrossFeatures([feature])
        expect(result.features).toHaveLength(4)
    })

    it('deduplicates features sharing the same id', () => {
        const result = buildDurchfahrtCrossFeatures([polygon(square, 7), polygon(square, 7)])
        expect(result.features).toHaveLength(2)
    })

    it('returns an empty collection for missing or empty input', () => {
        expect(buildDurchfahrtCrossFeatures(undefined).features).toEqual([])
        expect(buildDurchfahrtCrossFeatures([]).features).toEqual([])
        expect(buildDurchfahrtCrossFeatures([{ geometry: undefined }]).features).toEqual([])
    })
})
