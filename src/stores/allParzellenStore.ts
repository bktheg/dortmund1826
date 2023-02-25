import { defineStore } from 'pinia'
import axios from 'axios'

type AllParzellenExport = {
    n:string, // nr
    a:string, // mutterrolle (artikel)
    p:number[]// position
}

class Parzelle {
    constructor(public gemeindeId:string, public flur:number, public parzelle:string, public artikel:string, public location:number[]) {}
}

export const useAllParzellenStore = defineStore({
    id: 'allParzellen',
    state: () => ({
      parzellen: [] as Parzelle[],
      loading: false,
      error: null as unknown
    }),
    actions: {
      async fetchAllParzellen() {
        if( this.loading || this.parzellen.length > 0 ) {
            return;
        }
        this.loading = true
        this.parzellen = []
        try {
            const parzellenExport = await axios.get("/allparzellen.json?v="+__APP_VERSION__)
                .then((response) => response.data)
            const parzellenResult = []
            for( const gemeinde in parzellenExport ) {
                for( const flur in parzellenExport[gemeinde] ) {
                    for( const p of (parzellenExport[gemeinde][flur] as AllParzellenExport[]) ) {
                        parzellenResult.push(new Parzelle(gemeinde, parseInt(flur), p.n, p.a, p.p))
                    }
                }
            }
            this.parzellen = parzellenResult;
        } catch (error) {
          this.error = error
        } finally {
          this.loading = false
        }
      }
    }
  })