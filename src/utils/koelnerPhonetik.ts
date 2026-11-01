const VOWELS = 'aeijouy'

/** The word reduced to a-z: lower-cased, ß as ss, diacritics and non-letters dropped. */
export function phoneticLetters(word:string):string {
    return word
        .toLocaleLowerCase('de')
        .replace(/ß/g, 'ss')
        .normalize('NFD')
        .replace(/[^a-z]/g, '')
}

function codeFor(letter:string, prev:string, next:string, initial:boolean):string {
    if( VOWELS.includes(letter) ) {
        return '0'
    }
    switch(letter) {
        case 'h':
            return ''
        case 'b':
            return '1'
        case 'p':
            return next === 'h' ? '3' : '1'
        case 'd':
        case 't':
            return 'csz'.includes(next) && next !== '' ? '8' : '2'
        case 'f':
        case 'v':
        case 'w':
            return '3'
        case 'g':
        case 'k':
        case 'q':
            return '4'
        case 'c':
            if( initial ) {
                return next !== '' && 'ahkloqrux'.includes(next) ? '4' : '8'
            }
            if( prev === 's' || prev === 'z' ) {
                return '8'
            }
            return next !== '' && 'ahkoqux'.includes(next) ? '4' : '8'
        case 'x':
            return prev !== '' && 'ckq'.includes(prev) ? '8' : '48'
        case 'l':
            return '5'
        case 'm':
        case 'n':
            return '6'
        case 'r':
            return '7'
        case 's':
        case 'z':
            return '8'
    }
    return ''
}

function collapsedCodes(word:string):string {
    const letters = phoneticLetters(word)
    let raw = ''
    for( let i = 0; i < letters.length; i++ ) {
        raw += codeFor(letters[i], letters[i-1] ?? '', letters[i+1] ?? '', i === 0)
    }

    let collapsed = ''
    for( const digit of raw ) {
        if( digit !== collapsed[collapsed.length-1] ) {
            collapsed += digit
        }
    }
    return collapsed
}

/**
 * Kölner Phonetik: maps a word to a digit string so that names that sound alike
 * share a code (Meier / Meyer / Maier → "67"). Non-letters are ignored.
 */
export function koelnerPhonetik(word:string):string {
    const collapsed = collapsedCodes(word)
    return collapsed.charAt(0) + collapsed.substring(1).replace(/0/g, '')
}

const BACK_VOWELS = 'ou'

/**
 * Like the Kölner code, but every run of vowels stays behind as a single marker:
 * "a" for a run of front vowels (a e i y ä, ae ey ai ie ...), "o" for a run that
 * contains a back vowel (o u ö ü, ou au ue ...). Meier / Meyer / Maier → "6a7",
 * Vaerst / Fahrst → "3a782", Kurl / Courl → "4o75".
 *
 * Whatever spells a vowel — ae, ey, ai, a plus Dehnungs-h or -e — collapses into the
 * marker, so the many historical spellings of a vowel do not matter, but where a name
 * has vowels does (Maier ≠ Nro) and so does front vs. back (Kurl ≠ Karl).
 */
export function phoneticSkeleton(word:string):string {
    return skeletonWithOffsets(word).skeleton
}

/** The skeleton plus, per skeleton symbol, the index of its first letter in phoneticLetters(word). */
export function skeletonWithOffsets(word:string):{ skeleton:string, offsets:number[] } {
    const letters = phoneticLetters(word)
    const tokens:string[] = []
    const offsets:number[] = []
    for( let i = 0; i < letters.length; i++ ) {
        const code = codeFor(letters[i], letters[i-1] ?? '', letters[i+1] ?? '', i === 0)
        if( code === '' ) {
            continue
        }
        if( code === '0' ) {
            const marker = BACK_VOWELS.includes(letters[i]) ? 'o' : 'a'
            const last = tokens.length - 1
            if( last >= 0 && (tokens[last] === 'a' || tokens[last] === 'o') ) {
                tokens[last] = tokens[last] === 'o' || marker === 'o' ? 'o' : 'a'
            } else {
                tokens.push(marker)
                offsets.push(i)
            }
        } else if( code !== tokens[tokens.length-1] ) {
            tokens.push(code)
            offsets.push(i)
        }
    }
    return { skeleton:tokens.join(''), offsets }
}
