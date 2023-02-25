import { defineStore } from 'pinia'
import axios from 'axios'

type MutterrolleRowExport = {
    f:number, // flurNr
    a:string, // flaeche
    k:string, // klasse
    t:string, // kulturart
    l:string, // lage
    p:string, // parzelle
    e:string, // reinertrag
    x:number[] // coords
}

type MutterrolleExport = {
    n:string,
    r:MutterrolleRowExport[]
}

export class Mutterrolle {
    constructor(public gemeindeId:string, public id:string, public name:string, public rows:MutterrolleRow[]) {}
}

export class MutterrolleRow {
    constructor(public flur:number, public flurstueck:string, public flaeche:string, public kulturart:string, public klasse:string, public lage:string, public reinertrag:string, public location:number[]) {}
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
      loading: new Set<string>(),
      error: null as unknown
    }),
    getters: {
        getMutterrolle: (state) => (gemeinde:string, artikelNr:string) => state.mutterrollen.get(gemeinde)?.get(artikelNr)
    },
    actions: {
      async fetchMutterrollen(gemeinde:string) {
        if( this.loading.has(gemeinde) || this.mutterrollen.has(gemeinde) ) {
            return;
        }
        this.loading.add(gemeinde)
        try {
            const mutterrollenExport = await axios.get(`/mutterrollen_${gemeinde}.json?v=${__APP_VERSION__}`)
                .then((response) => response.data)
            const result = new Map<string,Mutterrolle>();
            for( const artikelNr in mutterrollenExport ) {
                const mutterrolleExport = mutterrollenExport[artikelNr] as MutterrolleExport;              

                const rows = mutterrolleExport.r?.map(r => new MutterrolleRow(r.f, r.p, r.a, r.t, r.k, r.l, r.e, r.x));
                rows?.sort(sortMutterrolleRow);
                result.set(artikelNr, 
                    new Mutterrolle(gemeinde, artikelNr, mutterrolleExport.n, rows));
            }
            this.mutterrollen.set(gemeinde, result);
        } catch (error) {
          this.error = error
        } finally {
          this.loading.delete(gemeinde)
        }
      }
    }
  })