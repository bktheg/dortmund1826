import { defineStore } from 'pinia'
import axios from 'axios'

type FlurExport = {
    kreis:string,
    bmstr:string,
    gem:string,
    gid:string,
    nr:number,
    name:string,
    qverm:string,
    qbuch:string,
    qmap:string,
    box:number[]
}

export const useFlurStore = defineStore({
    id: 'flur',
    state: () => ({
      flure: [] as FlurExport[],
      loading: false,
      error: null as unknown
    }),
    getters: {
      getFlure: (state) => {
        return () => state.flure
      },
      getFlurById: (state) => (gemeindeId:string, flurId:number) => (state.flure.filter((f) => f.gid == gemeindeId && f.nr == flurId)[0])
    }, 
    actions: {
      async fetchFlure() {
        if( this.loading || this.flure.length > 0 ) {
            return;
        }
        this.flure = []
        this.loading = true
        try {
          this.flure = await axios.get("/flure.json")
            .then((response) => response.data) 
        } catch (error) {
          this.error = error
        } finally {
          this.loading = false
        }
      }
    }
  })