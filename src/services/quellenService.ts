function extractArchivPart(source:string|null):string {
    if( source == null || source.trim() == '' ) {
        return 'stado';
    }
    if( source.indexOf(':') > -1 ) {
        return source.substring(0, source.indexOf(':')).toLocaleLowerCase();
    }
    return source.toLocaleLowerCase();
}

export function expandSourceToAbbr(source:string|null|undefined) {
    if( typeof source === 'undefined' ) {
        return '';
    }
    source = extractArchivPart(source);
    switch( source ) {
    case 'stado':
        return '<a href="#quelle-sta-dortmund">StADo</a>';
    
    case 'lav':
        return '<a href="#quelle-lav-nrw-w">LAV NRW W</a>'
    
    case 'ka recklinghausen':
        return '<a href="#quelle-ka-recklinghausen">Recklinghausen</a>'
    
    case 'ka ennepe-ruhr':
        return '<a href="#quelle-ka-ennepe-ruhr">Ennepe-Ruhr</a>'

    case '?':
        return 'unbekannt';
    }
    return source;
}

export function expandSourceToDetailedSource(source:string|null|undefined) {
    if( typeof source === 'undefined' ) {
        return '';
    }
    let archiv = "";
    switch( extractArchivPart(source) ) {
    case 'stado':
        archiv = 'Stadtarchiv Dortmund';
        break;

    case 'lav':
        archiv = 'Landesarchiv NRW Abteilung Westfalen'
        break;

    case 'ka recklinghausen':
        archiv = 'Katasteramt Recklinghausen'
        break;

    case 'ka ennepe-ruhr':
        archiv = 'Katasteramt Ennepe-Ruhr'
        break;

    case '?':
        archiv = 'Unbekannt';
        break;
    }

    if( source != null && source.indexOf(':') > -1 ) {
        const bestaende = source.substring(source.indexOf(':')+1).split(',').map(s => "Best. "+s.trim()).join(", ");
        return archiv+" "+bestaende;
    }

    return archiv;
}

export function expandSourceToText(source:string|null|undefined) {
    if( typeof source === 'undefined' ) {
        return '';
    }
    source = extractArchivPart(source);
    switch( source ) {
    case 'stado':
        return "Stadtarchiv Dortmund. Bestände 162/001 (Karten), 162/002 (Vermessung) und 162/003 (Flurbücher)";
    case 'lav':
        return "Landesarchiv NRW Abteilung Westfalen. Bestände K551 (Vermessung und Flurbücher) und W052/Karten K (Karten)"
    case 'ka recklinghausen':
        return "Katasteramt des Kreises Recklinghausen. Grundlage: Urkarten und Geobasisdaten © Kreis Recklinghausen. Veröffentlicht mit freundlicher Genehmigung des Katasteramtes des Kreises Recklinghausen."
    case 'ka ennepe-ruhr':
        return "Katasteramt des Kreises Ennepe-Ruhr"
    case '?':
        return 'Der Verbleib der Unterlagen ist unbekannt, möglicherweise sind sie nicht mehr erhalten';
    }
    return source;
}