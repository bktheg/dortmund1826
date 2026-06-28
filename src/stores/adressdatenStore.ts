import { defineStore } from 'pinia'
import axios from 'axios'

type GewerbeExport = {
    b:string[], // Branchen
    n:string,   // Name der Firma/des Inhabers
    z:string,   // Namenszusatz
    a:string,   // Adresszusatz
    f:string    // Fernsprecher
}

type BehoerdeExport = {
    c:string, // Kategorie
    u:string, // Unterkategorie
    n:string, // Name der Behoerde
    z:string, // Namenszusatz/Untereinheit
    f:string  // Fernsprecher
}

type GebaeudeExport = {
    c:string, // cleaned hausnummer
    h:string, // hausnummer
    o:string, // Besitzer
    j:string, // Beruf des Besitzers
    t:string, // Art des Besitzers: E oder E*
    g:GewerbeExport[],
    b:BehoerdeExport[]
}

type AdressbuchExport = {
    g:GebaeudeExport[], // Gebaeude an der Strasse
    q:string,           // Quelle
    s:string            // Straße
}

export class Gewerbe {
    constructor(
        public branchen:string[],
        public name:string,
        public namenszusatz:string,
        public adresszusatz:string,
        public fernsprecher:string
    ) {}
}

export class Behoerde {
    constructor(
        public kategorie:string,
        public unterkategorie:string,
        public name:string,
        public namenszusatz:string,
        public fernsprecher:string
    ) {}
}

export class Gebaeude {
    constructor(
        public cleanedHnr:string,
        public hnr:string,
        public besitzer:string,
        public beruf:string,
        public typ:string,
        public gewerbe:Gewerbe[],
        public behoerden:Behoerde[]
    ) {}
}

export class Adressbuch {
    constructor(
        public gebaeude:Gebaeude[],
        public quelle:string,
        public strasse:string
    ) {}
}

function replaceAll(str:string, find:string, replace:string):string {
    return str.split(find).join(replace);
}

export function cleanStreet(street:string):string | null {
    if( street == null ) {
        return null;
    }
    if( street == '' ) {
        return '';
    }
    street = street.toString();
    street = street.toLowerCase().trim();
    street = street.replace(/(c)([a-gijl-zäöü]{1})/g, 'k$2');
    street = replaceAll(street, 'th', 't');
    street = replaceAll(street, 'ph', 'f');
    street = replaceAll(street, 'ä', 'ae');
    street = replaceAll(street, 'ö', 'oe');
    street = replaceAll(street, 'ü', 'ue');
    street = replaceAll(street, 'ß', 'ss');
    street = replaceAll(street, 'strasse', 'str.');
    street = replaceAll(street, 'straße', 'str.');
    street = replaceAll(street, 'sgasse', 'gasse');
    street = street.replace(/([a-z])( )([a-z])/g, '$1$3');
    street = street.replace(/([a-z])(\-)([a-z])/g, '$1$3');

    street = street.trim();

    if( street == "kampstr." ) {
        street = "1. kampstr.";
    }
    else if( street == "hinterekampstr." ) {
        street = "2. kampstr."
    }

    return street;
}

export function cleanHnr(hnr:string):string | null {
    if( !hnr ) {
        return null;
    }
    let lower = hnr.toString().toLowerCase().trim();
    while( lower.indexOf('  ') > -1 ) {
        lower = lower.replace('  ', ' ');
    }

    // Check if format looks good already -> shortcut
    if( lower.match(/^[#]?[0-9]+$/) ) {
        return lower;
    }

    // Insert a space before unicode fractions, e.g. 17⅓ => 17 ⅓
    lower = lower.replace(/([0-9]+)([¹⅓½¼⅔]{1})/g, "$1 $2")

    lower = replaceAll(lower, ' bis ', '-')
    lower = replaceAll(lower, ' u. ', ',')
    lower = replaceAll(lower, ' und ', ',')
    lower = replaceAll(lower, '—', '-')
    lower = replaceAll(lower, '–', '-')
    lower = replaceAll(lower, '.', '')
    lower = replaceAll(lower, '¹', '1')
    lower = replaceAll(lower, '₂', '2')
    lower = replaceAll(lower, '⅓', '1/3')
    lower = replaceAll(lower, '½', '1/2')
    lower = replaceAll(lower, '¼', '1/4')
    lower = replaceAll(lower, '⅔', '2/3')

    lower = lower.replace(/([- ]{1}[0-9]{1}\/[0-9]{1})/g, (a, b:string) => {
        const firstPart = b.charAt(1);
        const prefix = b.charAt(0) == ' ' ? '' : b.charAt(0);
        switch( firstPart ) {
            case "1": return prefix+"a";
            case "2": return prefix+"b";
            case "3": return prefix+"c";
            case "4": return prefix+"d";
            case "5": return prefix+"e";
            default: return prefix+"f";
        }
    });

    // remove space between number and alpha, e.g. "15 a" => "15a"
    lower = lower.replace(/([0-9]+)[ ]+([a-z]{1})/g, "$1$2")
    // reformat number ranges, e.g. 15/17 => 15-17
    lower = lower.replace(/([0-9]+)[/]{1}([0-9]+)/g, "$1-$2")

    // remove spaces before commas
    while( lower.indexOf(', ') > -1 ) {
        lower = lower.replace(', ', ',');
    }

    if( lower.indexOf(' ') > -1 ) {
        const parts = lower.split(' ');
        return parts[0].replace('/', '-')+' '+parts[1];
    }
    else {
        return lower.replace('/', '-');
    }
}

function mapGewerbe(g:GewerbeExport[]):Gewerbe[] {
    return g?.map(e => new Gewerbe(e.b ?? [], e.n, e.z, e.a, e.f)) ?? [];
}

function mapBehoerden(b:BehoerdeExport[]):Behoerde[] {
    return b?.map(e => new Behoerde(e.c, e.u, e.n, e.z, e.f)) ?? [];
}

export const useAdressdatenStore = defineStore({
    id: 'adressdaten',
    state: () => ({
      adressbuecher: new Map<string,Adressbuch>(),
      loading: new Set<string>(),
      error: null as unknown
    }),
    getters: {
        getAdressbuch: (state) => (cleanedStreet:string) => state.adressbuecher.get(cleanedStreet)
    },
    actions: {
      async fetchAdressbuch(cleanedStreet:string) {
        if( !cleanedStreet || this.loading.has(cleanedStreet) || this.adressbuecher.has(cleanedStreet) ) {
            return;
        }
        this.loading.add(cleanedStreet)
        try {
            const fileName = cleanedStreet.endsWith('.') ? cleanedStreet+'json' : cleanedStreet+'.json'
            const adressbuchExport = await axios.get(import.meta.env.VITE_SERVER_URL+`/adressdaten/1914/${fileName}?v=${__APP_VERSION__}`)
                .then((response) => response.data as AdressbuchExport)
            const gebaeude = adressbuchExport.g?.map(g =>
                new Gebaeude(g.c, g.h, g.o, g.j, g.t, mapGewerbe(g.g), mapBehoerden(g.b))) ?? [];
            this.adressbuecher.set(cleanedStreet, new Adressbuch(gebaeude, adressbuchExport.q, adressbuchExport.s));
        } catch (error) {
          this.error = error
        } finally {
          this.loading.delete(cleanedStreet)
        }
      }
    }
  })
