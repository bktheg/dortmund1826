import { koelnerPhonetik, phoneticLetters, phoneticSkeleton, skeletonWithOffsets } from '@/utils/koelnerPhonetik'

export type TextRange = [number, number]
// How a text matched a term, from the best fit to the loosest:
//  exact  — the term itself occurs
//  equal  — a word sounds the same (Meyer ~ Maier)
//  start  — a word starts with the name (Meierfeld, Meiers)
//  inside — the name is behind a head (Hochmeier)
export type PhoneticKind = 'equal' | 'start' | 'inside'
export type MatchKind = 'none' | 'exact' | PhoneticKind
export type PhoneticMatch = { ranges:TextRange[], kind:PhoneticKind }
export type PhoneticMatcher = (text:string) => PhoneticMatch | null

const KIND_RANK:Record<Exclude<MatchKind, 'none'>, number> = { exact:0, equal:1, start:2, inside:3 }

/** The rank of the best of several matches (0 = exact, 3 = loosest); `none` is ignored. */
export function bestRank(kinds:MatchKind[]):number {
    const ranks = kinds.filter(k => k !== 'none').map(k => KIND_RANK[k as Exclude<MatchKind, 'none'>])
    return ranks.length > 0 ? Math.min(...ranks) : KIND_RANK.inside
}

type CodedWord = {
    start:number, end:number, code:string, skeleton:string,
    // phoneticLetters() of the word, the letter each skeleton symbol starts at, and
    // where each of those letters sits in the word as written (undefined: unknown)
    letters:string, offsets:number[], origin?:number[]
}

// A code of one digit would match about half of all names.
const MIN_CODE_LENGTH = 2

// Words are compared by their skeleton (see phoneticSkeleton), not by the Kölner code
// alone: the code drops vowels, which pairs Maier with Nro and Mayer with Nierholz.
// Besides an equal skeleton, the query may be part of a longer word:
//  - at its start, followed by an inflection ending (Meiers, Schmidts) or by a common
//    second part of Westphalian field names (Meierfeld, Meierhof, Meierkamp);
//    anything else is another name that merely begins alike (Mehring, Mark, Maria)
//    and is still found by the literal substring search,
//  - behind a head of at least MIN_HEAD_SYMBOLS (Hochmeier, Hacheneier) — not just a
//    vowel in front (Unnaer) — optionally followed by the same endings and second
//    parts (Hochmeierfeld).
// The skeleton drops the difference between Meier and Mer, so the matched part must be
// about as long as the query (MAX_LENGTH_DIFFERENCE letters more or fewer, a doubled
// consonant counting once): Mayer finds Meier, Meer, Hochmeier, but not Mar., Krämer,
// Sommer, Wethmar. Because it also treats m and n
// alike, a name that merely starts like the query must start with the same letter
// (Mayer ≠ Nierholz).
const MAX_LENGTH_DIFFERENCE = 1
// Long names have more room for spelling variants (Mallinckrodt / Malinkrot): one more.
const LONG_NAME_LENGTH = 8
const ENDINGS = new Set(['8', '6'])
const MIN_HEAD_SYMBOLS = 2

// The most common word endings of the Flurnamen data.
const COMPOUND_TAILS = new Set([
    'hof', 'hove', 'feld', 'kamp', 'acker', 'wiese', 'wege', 'weg', 'haus', 'heide', 'berg', 'berge',
    'busch', 'holz', 'brink', 'land', 'garten', 'stück', 'bruch', 'bach', 'mühle', 'kotten'
].map(phoneticSkeleton))

// Letters that sound alike at the start of a word; m and n deliberately stay apart.
const LETTER_GROUPS:Record<string, string> = { c:'k', q:'k', v:'f', w:'f', d:'t', b:'p', z:'s', j:'i', y:'i' }
const initialKey = (letters:string, index:number) => LETTER_GROUPS[letters[index]] ?? letters[index]

const similarLength = (a:number, b:number) =>
    Math.abs(a - b) <= MAX_LENGTH_DIFFERENCE + (Math.min(a, b) >= LONG_NAME_LENGTH ? 1 : 0)
const spanLength = (letters:string, from:number, to:number) => [...letters.substring(from, to)].filter((c, i, all) => c !== all[i-1] || 'aeiouy'.includes(c)).length

/** The letters of `word` that match `query` as [from, to) into word.letters, and how, or null. */
function matchSpan(word:CodedWord, query:CodedWord):{ span:TextRange, kind:PhoneticKind } | null {
    const w = word.skeleton
    const q = query.skeleton
    const queryLength = spanLength(query.letters, 0, query.letters.length)
    if( w === q ) {
        return similarLength(spanLength(word.letters, 0, word.letters.length), queryLength) ? { span:[0, word.letters.length], kind:'equal' } : null
    }
    for( let at = w.indexOf(q); at >= 0; at = w.indexOf(q, at + 1) ) {
        const end = at + q.length
        const rest = w.substring(end)
        const from = at === 0 ? 0 : word.offsets[at]
        let to = word.offsets[end] ?? word.letters.length
        if( (rest !== '' && !ENDINGS.has(rest) && !COMPOUND_TAILS.has(rest))
            || !similarLength(spanLength(word.letters, from, to), queryLength) ) {
            continue
        }
        if( at === 0 ? initialKey(word.letters, 0) !== initialKey(query.letters, 0) : at < MIN_HEAD_SYMBOLS ) {
            continue
        }
        // A silent h in front of the next part (Meier|hof) is not part of the name,
        // while ch, sch, ph, th, dh are.
        if( word.letters[to-1] === 'h' && !'cspt'.includes(word.letters[to-2]) ) {
            to--
        }
        return { span:[from, to], kind:at === 0 ? 'start' : 'inside' }
    }
    return null
}

function lettersOf(word:string):{ letters:string, origin?:number[] } {
    const letters = phoneticLetters(word)
    const origin:number[] = []
    for( let i = 0; i < word.length; i++ ) {
        for( let k = phoneticLetters(word[i]).length; k > 0; k-- ) {
            origin.push(i)
        }
    }
    return origin.length === letters.length ? { letters, origin } : { letters }
}

const MAX_CACHE_ENTRIES = 50000

const wordCache = new Map<string, CodedWord[]>()

function codedWords(text:string):CodedWord[] {
    let words = wordCache.get(text)
    if( words ) {
        return words
    }
    words = []
    for( const m of text.matchAll(/\p{L}+/gu) ) {
        const code = koelnerPhonetik(m[0])
        if( code ) {
            words.push({ start:m.index!, end:m.index! + m[0].length, code, ...skeletonWithOffsets(m[0]), ...lettersOf(m[0]) })
        }
    }
    if( wordCache.size >= MAX_CACHE_ENTRIES ) {
        wordCache.clear()
    }
    wordCache.set(text, words)
    return words
}

const NEVER:PhoneticMatcher = () => null

/**
 * The returned matcher yields, per query word, the range of the characters that
 * matched (the whole word, or just the name inside a compound: Hochmeier|feld), or
 * null when the text does not match: every query word must match some word of the
 * text by its vowel-agnostic skeleton (see matchSpan).
 */
export function createPhoneticMatcher(term:string):PhoneticMatcher {
    const queryWords = codedWords(term)
    if( queryWords.length === 0 || queryWords.some(w => w.code.length < MIN_CODE_LENGTH) ) {
        return NEVER
    }

    return text => {
        const words = codedWords(text)
        const ranges:TextRange[] = []
        let rank = 0
        let kind:PhoneticKind = 'equal'
        for( const query of queryWords ) {
            let range:TextRange | undefined
            for( const word of words ) {
                const match = matchSpan(word, query)
                if( match ) {
                    const { span } = match
                    range = word.origin
                        ? [word.start + word.origin[span[0]], word.start + word.origin[span[1]-1] + 1]
                        : [word.start, word.end]
                    // A text with several query words is only as good as its loosest word.
                    if( KIND_RANK[match.kind] > rank ) {
                        rank = KIND_RANK[match.kind]
                        kind = match.kind
                    }
                    break
                }
            }
            if( !range ) {
                return null
            }
            ranges.push(range)
        }
        return { ranges, kind }
    }
}

export function classifyMatch(text:string | undefined, term:string, matcher?:PhoneticMatcher):MatchKind {
    if( !text ) {
        return 'none'
    }
    if( text.toLocaleLowerCase().includes(term) ) {
        return 'exact'
    }
    return matcher?.(text)?.kind ?? 'none'
}
