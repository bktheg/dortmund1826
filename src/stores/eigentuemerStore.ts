import { defineStore } from 'pinia'
import axios from 'axios'

type EigentuemerExport = {
    id:string,
    n:string
}

class Eigentuemer {
    constructor(public gemeindeId:string, public id:string, public name:string) {}
}

export const useEigentuemerStore = defineStore({
    id: 'eigentuemer',
    state: () => ({
      eigentuemer: [] as Eigentuemer[],
      loading: false,
      error: null as unknown
    }),
    actions: {
      async fetchEigentuemer() {
        if( this.loading || this.eigentuemer.length > 0 ) {
            return;
        }
        this.loading = true
        this.eigentuemer = []
        try {
            const eigentuemerExport = await axios.get("/eigentuemer.json?v="+__APP_VERSION__)
                .then((response) => response.data)
            const eigentuemerResult = []
            for( const gemeinde in eigentuemerExport ) {
                eigentuemerResult.push(...(eigentuemerExport[gemeinde] as EigentuemerExport[]).map(e => new Eigentuemer(gemeinde, e.id, e.n)))
            }
            this.eigentuemer = eigentuemerResult;
        } catch (error) {
          this.error = error
        } finally {
          this.loading = false
        }
      }
    }
  })