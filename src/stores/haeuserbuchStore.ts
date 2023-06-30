import { defineStore } from 'pinia'
import axios from 'axios'

type HaeuserbuchExport = {
    b:HaeuserbuchBuildingExport[], // buildings
    q:string, // quelle
    u:string // url
}

type HaeuserbuchInfoExport = {
    t:number,
    x:string
}

type HaeuserbuchYearInfoExport = {
    y:string,
    x:string
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
}

export class Haeuserbuch {
    constructor(public gemeindeId:string, public source:string, public url:string, public buildings:HaeuserbuchBuilding[]) {}
}

export class HaeuserbuchBuilding {
    constructor(public id:string, public number:string, public oldNumber:string, public street:string, public flur:HaeuserbuchInfo, public infos:HaeuserbuchInfo[], public ownerList:HaeuserbuchYearInfo[], public additionalInfos:HaeuserbuchYearInfo[]) {}
}

export class HaeuserbuchInfo {
    constructor(public type:number, public text:string) {}
}

export class HaeuserbuchYearInfo {
    constructor(public year:string, public text:string) {}
}

function mapInfo(info:HaeuserbuchInfoExport):HaeuserbuchInfo {
    if( !info ) {
        return new HaeuserbuchInfo(0, '');
    }  
    return new HaeuserbuchInfo(info.t, info.x)
}

function mapYearInfo(info:HaeuserbuchYearInfoExport):HaeuserbuchYearInfo {
    return new HaeuserbuchYearInfo(info.y, info.x)
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

            const buildings = hbExport.b?.map(r => new HaeuserbuchBuilding(r.i, r.n, r.o, r.s, mapInfo(r.f), r.b.map(e => mapInfo(e)), r.e.map(e => mapYearInfo(e)), r.a.map(e => mapYearInfo(e))));
            const hb = new Haeuserbuch(gemeinde, hbExport.q, hbExport.u, buildings);
            this.haeuserbuecher.set(gemeinde, hb);
        } catch (error) {
          this.error = error
        } finally {
          this.loading.delete(gemeinde)
        }
      }
    }
  })