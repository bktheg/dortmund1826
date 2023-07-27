export type InfoExport = {
    t:string // typ
    a:any // attributes
}

export abstract class Info {
    constructor(public type:string) {}
}

export class WikipediaInfo extends Info {
    constructor(public page:string) {
        super('wikipedia');
    }
}

export class CommonInfo extends Info {
    constructor(public info:string, public source:string, public url:string) {
        super('common');
    }
}

export class HaeuserbuchInfo extends Info {
    constructor(public gemeinde:string, public id:string) {
        super('haeuserbuch');
    }
}

export function mapInfo(i:InfoExport):Info|null {
    if( !i || !i.t ) {
        return null;
    }
    if( i.t == 'wikipedia' ) {
        return new WikipediaInfo(i.a['page'] as string);
    }
    else if( i.t == 'common' ) {
        return new CommonInfo(i.a['t'] as string, i.a['s'] as string, i.a['u'] as string)
    }
    else if( i.t == 'haeuserbuch' ) {
        return new HaeuserbuchInfo(
            i.a['g'], 
            i.a['x']
        )
    }
    return null;
}


export function mapInfos(infos:InfoExport[]|null|undefined):Info[]{
    if( !infos ) {
        return [];
    }
    return infos.map(i => mapInfo(i)).filter(i => i != null) as Info[];
}