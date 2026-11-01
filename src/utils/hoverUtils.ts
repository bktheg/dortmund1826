/**
 * Highlights every gebaeudef feature sharing the hovered feature's `gebaeude_id`.
 * Returns `false` (match nothing) when the feature carries no id, e.g. tiles
 * exported before the column existed.
 */
export function buildGebaeudefHighlightFilter(gebaeudeId: number | null | undefined): any[] | false {
    if (gebaeudeId == null) return false
    return ['==', ['get', 'gebaeude_id'], gebaeudeId]
}

export interface HoverCandidate {
    storeIndex: number
    features: any[]
}

/**
 * Resolves which hover-capable layer wins for the current cursor position.
 *
 * A lower store index means the layer is rendered visually higher (closer to
 * the ceiling in `_repositionVisibleLayers`), so it takes precedence. Candidates
 * without features are ignored. Returns the winning candidate by reference, or
 * null when no candidate has features. Generic over N layers.
 */
export function resolveTopHover<T extends HoverCandidate>(candidates: T[]): T | null {
    let winner: T | null = null
    for (const candidate of candidates) {
        if (candidate.features.length === 0) continue
        if (winner === null || candidate.storeIndex < winner.storeIndex) {
            winner = candidate
        }
    }
    return winner
}
