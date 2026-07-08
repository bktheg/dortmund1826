import { defineStore } from 'pinia'
import axios from 'axios'
import {
    GewerbeType,
    GewerbeTypeListe,
    mapGewerbeType,
    mapGewerbeTypeListe,
    type GewerbeTypeExport,
    type GewerbeTypeListeExport,
    type NameListeExport
} from '../models/adressbuch'

/**
 * Loads the `by-gewerbe-type/` address-book family:
 * - `_index.json` (load-once) drives a future type dropdown/legend.
 * - `<slug>.json` (keyed cache) holds every entry of one business type,
 *   used to highlight all matching buildings on the map.
 */
export const useGewerbeTypeStore = defineStore({
    id: 'gewerbeType',
    state: () => ({
        index: [] as GewerbeType[],
        loadingIndex: false,
        listen: new Map<string, GewerbeTypeListe>(),
        loading: new Set<string>(),
        error: null as unknown
    }),
    getters: {
        getListe: (state) => (slug: string) => state.listen.get(slug)
    },
    actions: {
        async fetchIndex() {
            if (this.loadingIndex || this.index.length > 0) {
                return;
            }
            this.loadingIndex = true
            try {
                const data = await axios.get(import.meta.env.VITE_SERVER_URL+`/adressdaten/1914/by-gewerbe-type/_index.json?v=${__APP_VERSION__}`)
                    .then((response) => response.data as NameListeExport<GewerbeTypeExport>)
                this.index = data.e?.map(mapGewerbeType) ?? []
            } catch (error) {
                this.error = error
            } finally {
                this.loadingIndex = false
            }
        },
        async fetchGewerbeType(slug: string) {
            if (!slug || this.loading.has(slug) || this.listen.has(slug)) {
                return;
            }
            this.loading.add(slug)
            try {
                const data = await axios.get(import.meta.env.VITE_SERVER_URL+`/adressdaten/1914/by-gewerbe-type/${slug}.json?v=${__APP_VERSION__}`)
                    .then((response) => response.data as GewerbeTypeListeExport)
                this.listen.set(slug, mapGewerbeTypeListe(data))
            } catch (error) {
                this.error = error
            } finally {
                this.loading.delete(slug)
            }
        }
    }
})
