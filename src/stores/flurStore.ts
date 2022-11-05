import { defineStore } from 'pinia'
import axios from 'axios'

type FlurExport = {
    gid:string,
    nr:number,
    name:string,
    qmap:string,
    box:number[],
    lt:string
}

type GemeindeExport = {
    k:string, // Kreis
    b:string, // Buergermeisterei
    n:string, // name
    i:string, // id
    qv:string, // quelle vermessung
    qb:string, // quelle flurbuch
    qm:string, // quelle mutterrollen
    bb:number[] // bbox
}

export class Flur {
    constructor(
        public nr:number, 
        public name:string, 
        public gemeindeId:string, 
        public quelleUrkarten:string, 
        public bbox:number[],
        public gemeinde:Gemeinde,
        public legalText:string) {}
}

export class Gemeinde {
    constructor(
        public id:string, 
        public name:string, 
        public kreis:string, 
        public buergermeisterei:string, 
        public quelleVermessung:string, 
        public quelleFlurbuch:string, 
        public quelleMutterrollen:string, 
        public bbox:number[]) {}
}

export const useFlurStore = defineStore({
    id: 'flur',
    state: () => ({
      flure: [] as Flur[],
      gemeinden: [] as Gemeinde[],
      loading: false,
      error: null as unknown
    }),
    getters: {
      getFlure: (state) => {
        return () => state.flure
      },
      getFlurById: (state) => (gemeindeId:string, flurId:number) => (state.flure.filter((f) => f.gemeindeId == gemeindeId && f.nr == flurId)[0]),
      getGemeindeById: (state) => (gemeindeId:string):Gemeinde => {
            if( state.loading ) {
                return new Gemeinde('','','','','','','',[])
            }
            const gemeinde = state.gemeinden.find(f => f.id == gemeindeId)
            if( !gemeinde ) {
                throw new Error("Unknown: Gemeinde "+gemeinde);
            }
            return gemeinde;
      }
    }, 
    actions: {
        async fetchFlure() {
            if( this.loading || this.flure.length > 0 ) {
                return;
            }
            this.flure = []
            this.gemeinden = []
            this.loading = true
            try {              
                const gemeindePromise = axios.get("/gemeinden.json")
                    .then((response) => response.data as GemeindeExport[])
                    .then((data) => this.gemeinden = data.map(g => new Gemeinde(g.i,g.n,g.k,g.b,g.qv,g.qb,g.qm,g.bb)));
                
                const flurePromise = axios.get("/flure.json")
                    .then((response) => response.data as FlurExport[])
                await Promise.all([flurePromise, gemeindePromise]);

                for( const f of await flurePromise ) {
                    this.flure.push(new Flur(f.nr,f.name,f.gid,f.qmap,f.box,this.getGemeindeById(f.gid),f.lt))
                }
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        }
    }
  })