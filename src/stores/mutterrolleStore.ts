import { defineStore } from 'pinia'
import axios from 'axios'

type MutterrolleRowExport = {
    f:number,
    a:string,
    k:string,
    t:string,
    l:string,
    p:string
}

type MutterrolleExport = {
    n:string,
    r:MutterrolleRowExport[]
}

class Mutterrolle {
    constructor(public gemeindeId:string, public id:string, public name:string, public rows:MutterrolleRow[]) {}
}

class MutterrolleRow {
    constructor(public flur:number, public flurstueck:string, public flaeche:string, public kulturart:string, public klasse:string, public lage:string) {}
}

function sortMutterrolleRow(a:MutterrolleRow, b:MutterrolleRow):number {
    let diff = a.flur-b.flur;
    if( diff != 0 ) {
        return diff;
    }
    diff = parseInt(a.flurstueck)-parseInt(b.flurstueck);
    if( diff != 0 ) {
        return diff;
    }
    return a.flurstueck.localeCompare(b.flurstueck);
}

export const useMutterrolleStore = defineStore({
    id: 'mutterrolle',
    state: () => ({
      mutterrollen: new Map<string,Map<string,Mutterrolle>>(),
      loading: false,
      error: null as unknown
    }),
    getters: {
        getMutterrolle: (state) => (gemeinde:string, artikelNr:string) => state.mutterrollen.get(gemeinde)?.get(artikelNr)
    },
    actions: {
      async fetchMutterrollen(gemeinde:string) {
        if( this.loading || this.mutterrollen.has(gemeinde) ) {
            return;
        }
        this.loading = true
        try {
            const mutterrollenExport = await axios.get(`/mutterrollen_${gemeinde}.json`)
                .then((response) => response.data)
            const result = new Map<string,Mutterrolle>();
            for( const artikelNr in mutterrollenExport ) {
                const mutterrolleExport = mutterrollenExport[artikelNr] as MutterrolleExport;              

                const rows = mutterrolleExport.r?.map(r => new MutterrolleRow(r.f, r.p, r.a, r.t, r.k, r.l));
                rows?.sort(sortMutterrolleRow);
                result.set(artikelNr, 
                    new Mutterrolle(gemeinde, artikelNr, mutterrolleExport.n, rows));
            }
            this.mutterrollen.set(gemeinde, result);
        } catch (error) {
          this.error = error
        } finally {
          this.loading = false
        }
      }
    }
  })