export function buildGebaeudefHighlightFilter(street: string, hnr: string): any[] {
    return ['all', ['==', ['get', 'street'], street], ['==', ['get', 'hnr'], hnr]]
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
