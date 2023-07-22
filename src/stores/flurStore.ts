import { defineStore } from 'pinia'
import axios from 'axios'
import type { InfoExport } from '@/services/infoService'
import { mapInfos,Info } from '@/services/infoService'

type AdminExport = {
    f:FlurExport[], // Fluren
    g:GemeindeExport[], // Gemeinden
    b:BuergermeistereiExport[], // Buergermeistereien
    k:KreisExport[] // Kreise
}

type BuergermeistereiExport = {
    i:string, // id
    n:string // name
    k:string, // kreis
    a:InfoExport[] // infos
}

type KreisExport = {
    i:string, // id
    n:string, // name
    a:InfoExport[] // infos
}

type GemeindeExport = {
    b:string, // Buergermeisterei
    n:string, // name
    i:string, // id
    qv:string, // quelle vermessung
    qb:string, // quelle flurbuch
    qm:string, // quelle mutterrollen
    qg:string, // quelle gueterverzeichnis
    bb:number[], // bbox
    a:InfoExport[] // infos
    hb:boolean // haeuserbuch
}

type FlurExport = {
    g:string, // Gemeinde
    n:number, // Nr
    name:string,
    qmap:string,
    box:number[],
    lt:string
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
        public buergermeisterei:Buergermeisterei, 
        public quelleVermessung:string, 
        public quelleFlurbuch:string, 
        public quelleMutterrollen:string,
        public quelleGueterverzeichnis:string,
        public bbox:number[],
        public infos:Info[],
        public haeuserbuch:boolean) {}
}

export class Buergermeisterei {
    constructor(
        public id:string, 
        public name:string,
        public kreis:Kreis,
        public infos:Info[]) {}
}

export class Kreis {
    constructor(
        public id:string, 
        public name:string,
        public infos:Info[]) {}
}

const NULL_KREIS = new Kreis('', '', [])
const NULL_BMSTR = new Buergermeisterei('', '', NULL_KREIS, [])

export const useFlurStore = defineStore({
    id: 'flur',
    state: () => ({
        flure: [] as Flur[],
        gemeinden: [] as Gemeinde[],
        buergermeistereien: [] as Buergermeisterei[],
        kreise: [] as Kreis[],
        loading: false,
        error: null as unknown,
    }),
    getters: {
        getFlure: (state) => {
            return () => state.flure
        },
        getFlurById: (state) => (gemeindeId:string, flurId:number) => (state.flure.filter((f) => f.gemeindeId == gemeindeId && f.nr == flurId)[0]),
        getGemeindeById: (state) => (gemeindeId:string):Gemeinde => {
                if( state.loading ) {
                    return new Gemeinde('','',NULL_BMSTR,'','','','',[],[], false)
                }
                const gemeinde = state.gemeinden.find(g => g.id == gemeindeId)
                if( !gemeinde ) {
                    throw new Error("Unknown: Gemeinde "+gemeinde);
                }
                return gemeinde;
        },
        getBuergermeistereiById: (state) => (bmstrId:string):Kreis => {
                if( state.loading ) {
                    return NULL_BMSTR
                }
                const bmstr = state.buergermeistereien.find(b => b.id == bmstrId)
                if( !bmstr ) {
                    throw new Error("Unknown: Buergermeisterei "+bmstr);
                }
                return bmstr;
        },
        getKreisById: (state) => (kreisId:string):Kreis => {
                if( state.loading ) {
                    return NULL_KREIS
                }
                const kreis = state.kreise.find(k => k.id == kreisId)
                if( !kreis ) {
                    throw new Error("Unknown: Kreis "+kreis);
                }
                return kreis;
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
                await axios.get("/admin.json?v="+__APP_VERSION__)
                    .then((response) => response.data as AdminExport)
                    .then((data) => {
                        this.kreise = data.k.map(k => new Kreis(k.i, k.n, mapInfos(k.a)))
                        for( const b of data.b ) {
                            const kreis = this.kreise.find(k => k.id == b.k)
                            if( !kreis ) {
                                console.log("Unbekannter Kreis", b.k);
                                continue;
                            }
                            this.buergermeistereien.push(new Buergermeisterei(b.i, b.n, kreis, mapInfos(b.a)))
                        }

                        for( const g of data.g ) {
                            const buergermeisterei = this.buergermeistereien.find(b => b.id == g.b)
                            if( !buergermeisterei ) {
                                console.log("Unbekannte Buergermeisterei", g.b);
                                continue;
                            }
                            this.gemeinden.push(new Gemeinde(g.i,g.n,buergermeisterei,g.qv,g.qb,g.qm,g.qg,g.bb, mapInfos(g.a),g.hb))
                        }

                        for( const f of data.f ) {
                            const gemeinde = this.gemeinden.find(g => g.id == f.g)
                            if( !gemeinde ) {
                                console.log("Unbekannte Gemeinde", f.g);
                                continue;
                            }
                            this.flure.push(new Flur(f.n,f.name,f.g,f.qmap,f.box,gemeinde,f.lt))
                        }
                    });
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        }
    }
  })