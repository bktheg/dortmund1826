import { defineStore } from 'pinia'
import axios from 'axios'

type HaeuserbuchExport = {
    b:HaeuserbuchBuildingExport[], // buildings
    t:HaeuserbuchStreetExport[], // streets
    q:string, // quelle
    u:string, // url
    s:HaeuserbuchSourceExport[] // sources
}

type HaeuserbuchSourceExport = {
    i:string, // id
    o:string, // signatureOld
    s:string, // signatureNew
    a:string, // archive
    n:string, // name
}

type HaeuserbuchInfoExport = {
    t:number,  // type
    x:string,  // text
    s:string[] // sources
}

type HaeuserbuchYearInfoExport = {
    y:string, // year
    x:string, // text
    s:string[] // sources
}

type HaeuserbuchBuildingExport = {
    i:string, // id
    n:string, // number
    o:string, // oldNumber
    s:string, // street
    f:HaeuserbuchInfoExport, // flur
    b:HaeuserbuchInfoExport[], // infos
    e:HaeuserbuchYearInfoExport[], // ownerList
    a:HaeuserbuchYearInfoExport[], // additionalInfos
    l:number[], // location
}

type HaeuserbuchStreetExport = {
    i:string, // id
    n:string, // name
    b:HaeuserbuchYearInfoExport[], // infos
}

export class Haeuserbuch {
    constructor(public gemeindeId:string, public source:string, public url:string, public buildings:HaeuserbuchBuilding[], public streets:HaeuserbuchStreet[], public sources:Map<string,HaeuserbuchSource>) {}
}

export class HaeuserbuchBuilding {
    constructor(
        public id:string, 
        public number:string, 
        public oldNumber:string, 
        public street:string, 
        public flur:HaeuserbuchInfo, 
        public infos:HaeuserbuchInfo[], 
        public ownerList:HaeuserbuchYearInfo[], 
        public additionalInfos:HaeuserbuchYearInfo[],
        public location:number[]
    ) {}

    getAddress():string|null {
        if( this.oldNumber != '' && this.oldNumber != 'ohne' && this.number != '' && this.number != 'ohne' ) {
            return `Hausnummer ${this.oldNumber} (${this.street} ${this.number})`
        }
        if( this.oldNumber != '' && this.oldNumber != 'ohne' ) {
            return `Hausnummer ${this.oldNumber}`
        }
        if( this.number != '' && this.number != 'ohne' ) {
            return `${this.street} ${this.number}`
        }
        return 'ohne'
    }
}

export class HaeuserbuchStreet {
    constructor(public id:string, public name:string, public infos:HaeuserbuchYearInfo[]) {}

    getAddress():string|null {
        return this.name
    }
}

export class HaeuserbuchInfo {
    constructor(public text:string, public sources:string[]) {}
}

export class HaeuserbuchBuildingInfo extends HaeuserbuchInfo {
    constructor(public type:number, text:string, sources:string[]) {
        super(text, sources)
    }
}

export class HaeuserbuchYearInfo extends HaeuserbuchInfo {
    constructor(public year:string, text:string, sources:string[]) {
        super(text, sources)
    }
}

export class HaeuserbuchSource {
    constructor(public id:string, public signatureOld:string, public signatureNew:string, public archive:string, public name:string) {}
}

function mapBuildingInfo(info:HaeuserbuchInfoExport):HaeuserbuchBuildingInfo {
    if( !info ) {
        return new HaeuserbuchBuildingInfo(0, '', []);
    }  
    return new HaeuserbuchBuildingInfo(info.t, info.x, info.s)
}

function mapYearInfo(info:HaeuserbuchYearInfoExport):HaeuserbuchYearInfo {
    return new HaeuserbuchYearInfo(info.y, info.x, info.s)
}


export const useHaeuserbuchStore = defineStore({
    id: 'haeuserbuch',
    state: () => ({
      haeuserbuecher: new Map<string,Haeuserbuch>(),
      loading: new Set<string>(),
      error: null as unknown
    }),
    getters: {
        getHaeuserbuch: (state) => (gemeinde:string) => state.haeuserbuecher.get(gemeinde)
    },
    actions: {
      async fetchHaeuserbuch(gemeinde:string) {
        if( this.loading.has(gemeinde) || this.haeuserbuecher.has(gemeinde) ) {
            return;
        }
        this.loading.add(gemeinde)
        try {
            const hbExport = await axios.get(`/haeuserbuch_${gemeinde}.json?v=${__APP_VERSION__}`)
                .then((response) => response.data) as HaeuserbuchExport

            const buildings = hbExport.b?.map(r => 
                new HaeuserbuchBuilding(r.i, r.n, r.o, r.s, mapBuildingInfo(r.f), r.b.map(e => mapBuildingInfo(e)), r.e.map(e => mapYearInfo(e)), r.a.map(e => mapYearInfo(e)), r.l)
            )
            
            const sources = new Map<string,HaeuserbuchSource>()
            hbExport.s?.map(s => new HaeuserbuchSource(s.i, s.o, s.s, s.a, s.n)).forEach(s => sources.set(s.id, s))

            const streets = hbExport.t?.map(s => new HaeuserbuchStreet(s.i, s.n, s.b.map(i => mapYearInfo(i))))

            const hb = new Haeuserbuch(gemeinde, hbExport.q, hbExport.u, buildings, streets, sources);
            this.haeuserbuecher.set(gemeinde, hb);
        } catch (error) {
          this.error = error
        } finally {
          this.loading.delete(gemeinde)
        }
      }
    }
  })