import { defineStore } from 'pinia'
import axios from 'axios'

export type BezeichnungExport = {
    g:string,
    f:number,
    n:string,
    t:number,
    l:number[]
}

export const useBezeichnungStore = defineStore({
    id: 'bezeichnung',
    state: () => ({
      bezeichnungen: [] as BezeichnungExport[],
      loading: false,
      error: null as unknown
    }),
    actions: {
      async fetchBezeichnungen() {
        if( this.loading || this.bezeichnungen.length > 0 ) {
            return;
        }
        this.bezeichnungen = []
        this.loading = true
        try {
          this.bezeichnungen = await axios.get("/bezeichnungen.json")
            .then((response) => response.data) 
        } catch (error) {
          this.error = error
        } finally {
          this.loading = false
        }
      }
    }
  })