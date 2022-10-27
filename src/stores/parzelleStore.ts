import { defineStore, storeToRefs } from 'pinia'
import axios from 'axios'

type ParzelleExport = {
    n:string, // nr
    f:string, // flaeche
    e:string, // eigentuemer
    a:string, // mutterrolle (artikel)
    k:string, // klasse
    l:string, // lage
    t:string, // typ
    p:number[]// position
}

export class Parzelle {
    constructor(public gemeindeId:string, public flur:number, public parzelle:string, public eigentuemer:string, public artikelNr:string, public flaeche:string, public typ:string, public klasse:string, public lage:string, public position:number[]) {}
}

export const useParzelleStore = defineStore({
    id: 'parzelle',
    state: () => ({
      parzellen: new Map<string,Map<number,Parzelle[]>>(),
      loading: new Set<string>(),
      error: null as unknown
    }),
    actions: {
      async fetchParzellen(gemeinde:string, flur:number) {
        const loadingId = `${gemeinde}-${flur}`;
        if( this.loading.has(loadingId) || (this.parzellen.has(gemeinde) && this.parzellen.get(gemeinde)?.has(flur)) || !gemeinde || !flur) {
            return;
        }
        this.loading.add(loadingId);
        try {
            const parzellenExport = await axios.get(`/parzellen_${gemeinde}_${flur}.json`)
                .then((response) => response.data) as ParzelleExport[]
            const result:Parzelle[] = [];
            for( const p of parzellenExport ) {
                result.push(new Parzelle(gemeinde, flur, p.n, p.e, p.a, p.f, p.t, p.k, p.l, p.p));
            }
            this.$patch((state) => {
                if( !this.parzellen.has(gemeinde) ) {
                    this.parzellen.set(gemeinde, new Map<number, Parzelle[]>());
                }
                this.parzellen.get(gemeinde)?.set(flur, result);
            });
        } catch (error) {
          this.error = error
        } finally {
          this.loading.delete(loadingId)
        }
      }
    }
  })