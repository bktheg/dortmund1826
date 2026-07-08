/**
 * Build a Mapbox filter selecting exactly the `gebaeudef` buildings whose
 * `ogc_fid` is in the given list, or `false` (match nothing) when the list is
 * empty.
 *
 * The by-gewerbe-type export already resolves every entry to its matching
 * building ids (`bi`, the same 3-tier logic the tile layer uses), and each
 * `gebaeudef` tile feature carries that `ogc_fid` as its feature id. So the
 * highlight is a single membership test on `['id']` — no per-feature address
 * cleaning or range comparator, and the filter is viewport-independent (set
 * once, never rescanned on pan/zoom).
 */
export function buildBuildingIdHighlightFilter(ids: number[]): any {
    if (ids.length === 0) {
        return false
    }
    return ['in', ['id'], ['literal', ids]]
}
