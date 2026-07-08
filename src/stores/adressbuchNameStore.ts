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
        errorGewerbe: null as unknown,
        errorBehoerden: null as unknown,
        errorBesitzer: null as unknown
    }),
    actions: {
        async fetchGewerbe() {
            if (this.loadingGewerbe || this.gewerbe.length > 0) {
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
                this.loadingGewerbe = false
            }
        },
        async fetchBehoerden() {
            if (this.loadingBehoerden || this.behoerden.length > 0) {
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
                this.loadingBehoerden = false
            }
        },
        async fetchBesitzer() {
            if (this.loadingBesitzer || this.besitzer.length > 0) {
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
                this.loadingBesitzer = false
            }
        }
    }
})
