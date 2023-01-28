export type InfoExport = {
    t:string // typ
    a:any // attributes
}

export abstract class Info {
    constructor(public type:string) {}
}

export class WikipediaInfo extends Info {
    constructor(type:string, public page:string) {
        super(type);
    }
}

export class CommonInfo extends Info {
    constructor(type:string, public info:string, public source:string, public url:string) {
        super(type);
    }
}

export enum HaeuserbuchInfoLineType {
    Flur,
    Kataster,
    Groesse,
    Name,
    Unbekannt
}

export class HaeuserbuchInfoLine {
    constructor(public type:HaeuserbuchInfoLineType, public text:string) {}
}

export class HaeuserbuchYearInfoLine {
    constructor(public year:string, public text:string) {}
}

export class HaeuserbuchInfo extends Info {
    constructor(type:string, public infos:HaeuserbuchInfoLine[], public yearInfos:HaeuserbuchYearInfoLine[], public address:string) {
        super(type);
    }
}

export function mapInfo(i:InfoExport):Info|null {
    if( !i || !i.t ) {
        return null;
    }
    if( i.t == 'wikipedia' ) {
        return new WikipediaInfo(i.t, i.a['page'] as string);
    }
    else if( i.t == 'common' ) {
        return new CommonInfo(i.t, i.a['t'] as string, i.a['s'] as string, i.a['u'] as string)
    }
    else if( i.t == 'haeuserbuch' && window.localStorage.getItem('experimental') ) {
        return new HaeuserbuchInfo(
            i.t, 
            i.a['i']?.map((i:any) => new HaeuserbuchInfoLine(i.e, i.t)), 
            i.a['y']?.map((i:any) => new HaeuserbuchYearInfoLine(i.y, i.t)),
            i.a['a']);
    }
    return null;
}


export function mapInfos(infos:InfoExport[]|null|undefined):Info[]{
    if( !infos ) {
        return [];
    }
    return infos.map(i => mapInfo(i)).filter(i => i != null) as Info[];
}