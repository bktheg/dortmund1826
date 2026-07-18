import { defineStore } from 'pinia'
import axios from 'axios'
import {
    GewerbeEintrag,
    BehoerdeEintrag,
    BesitzerEintrag,
    mapGewerbeEintrag,
    mapBehoerdeEintrag,
    mapBesitzerEintrag,
    type GewerbeNameEintragExport,
    type BehoerdeNameEintragExport,
    type BesitzerNameEintragExport,
    type NameListeExport
} from '../models/adressbuch'

/**
 * Loads the `by-name/` address-book family: three flat, searchable lists
 * (businesses, authorities, property owners). Each list loads at most once and
 * is cached for client-side name search. The lists are independent — a
 * consumer can load only the one it needs.
 *
 * The `loaded*` flags latch on the first completed attempt, successful or not.
 * Guarding on the list length instead would re-fetch forever whenever a list
 * legitimately comes back empty or the request fails, since callers may retry
 * on every keystroke.
 */
export const useAdressbuchNameStore = defineStore({
    id: 'adressbuchName',
    state: () => ({
        gewerbe: [] as GewerbeEintrag[],
        behoerden: [] as BehoerdeEintrag[],
        besitzer: [] as BesitzerEintrag[],
        loadingGewerbe: false,
        loadingBehoerden: false,
        loadingBesitzer: false,
        loadedGewerbe: false,
        loadedBehoerden: false,
        loadedBesitzer: false,
        errorGewerbe: null as unknown,
        errorBehoerden: null as unknown,
        errorBesitzer: null as unknown
    }),
    actions: {
        async fetchGewerbe() {
            if (this.loadingGewerbe || this.loadedGewerbe) {
                return;
            }
            this.loadingGewerbe = true
            try {
                const data = await axios.get(import.meta.env.VITE_SERVER_URL+`/adressdaten/1914/by-name/gewerbe.json?v=${__APP_VERSION__}`)
                    .then((response) => response.data as NameListeExport<GewerbeNameEintragExport>)
                this.gewerbe = data.e?.map(mapGewerbeEintrag) ?? []
            } catch (error) {
                this.errorGewerbe = error
            } finally {
                this.loadedGewerbe = true
                this.loadingGewerbe = false
            }
        },
        async fetchBehoerden() {
            if (this.loadingBehoerden || this.loadedBehoerden) {
                return;
            }
            this.loadingBehoerden = true
            try {
                const data = await axios.get(import.meta.env.VITE_SERVER_URL+`/adressdaten/1914/by-name/behoerden.json?v=${__APP_VERSION__}`)
                    .then((response) => response.data as NameListeExport<BehoerdeNameEintragExport>)
                this.behoerden = data.e?.map(mapBehoerdeEintrag) ?? []
            } catch (error) {
                this.errorBehoerden = error
            } finally {
                this.loadedBehoerden = true
                this.loadingBehoerden = false
            }
        },
        async fetchBesitzer() {
            if (this.loadingBesitzer || this.loadedBesitzer) {
                return;
            }
            this.loadingBesitzer = true
            try {
                const data = await axios.get(import.meta.env.VITE_SERVER_URL+`/adressdaten/1914/by-name/owners.json?v=${__APP_VERSION__}`)
                    .then((response) => response.data as NameListeExport<BesitzerNameEintragExport>)
                this.besitzer = data.e?.map(mapBesitzerEintrag) ?? []
            } catch (error) {
                this.errorBesitzer = error
            } finally {
                this.loadedBesitzer = true
                this.loadingBesitzer = false
            }
        }
    }
})
