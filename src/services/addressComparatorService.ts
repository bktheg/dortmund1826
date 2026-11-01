// House-number comparator ported from the doserv project's addressComparator.ts.
// Street equality is guaranteed by the caller (the per-street address-book JSON is
// fetched by cleaned street name), so only the house-number logic is kept here.
// Inputs are expected to be already cleaned via cleanHnr (e.g. "15a", "13-17", "15a,17", "17 1/2").

export function matchesHnr(hnr1: string | null, hnr2: string | null): boolean {
    if (!hnr1 || !hnr2) {
        return false;
    }
    if (hnr1 == hnr2) {
        return true;
    }

    try {
        // cleanHnr's fast path keeps a leading '#'; hnrPartToInt has no pattern for it
        const hnrParts1 = splitHnr(hnr1.replace(/#/g, ''))
        const hnrParts2 = splitHnr(hnr2.replace(/#/g, ''))
        if (isEven(hnrParts1[0]) != isEven(hnrParts2[0])) {
            return false
        }

        for (let i = 0; i < hnrParts1.length; i++) {
            const current1 = hnrParts1[i]
            const next1 = hnrParts1.length > i + 1 ? hnrParts1[i + 1] : current1

            for (let j = 0; j < hnrParts2.length; j++) {
                const current2 = hnrParts2[j]
                const next2 = hnrParts2.length > j + 1 ? hnrParts2[j + 1] : current2

                if (current1 >= current2 && next1 <= next2) {
                    return true;
                }
                if (current2 >= current1 && next2 <= next1) {
                    return true;
                }
            }
        }
    }
    catch (exception) {
        console.log("Comparing hnr " + hnr1 + " to " + hnr2 + " failed", exception);
    }
    return false;
}

function isEven(hnr: number): boolean {
    return Math.trunc(hnr) % 2 == 0
}

function splitHnr(hnr: string): number[] {
    const hnrParts1 = hnr.indexOf('-') > -1 ? hnr.split('-') : (hnr.indexOf(',') > -1 ? hnr.split(',') : [hnr, hnr]);
    if (/^[a-z]{1,2}$/.test(hnrParts1[1])) {
        // special case: 18a-c -> convert to 18a-18c
        const number = /^([0-9]+)/.exec(hnrParts1[0]);
        if (!number) {
            throw "Unknown hnr: " + hnr;
        }
        hnrParts1[1] = number[1] + hnrParts1[1];
    }
    else if (/^([0-9]\/[0-9]|[½⅓⅔¼¾])$/.test(hnrParts1[1])) {
        // special case: 18 1/2-2/2 -> convert to 18 1/2-18 2/2
        const number = /^([0-9]+)/.exec(hnrParts1[0]);
        if (!number) {
            throw "Unknown hnr: " + hnr;
        }
        hnrParts1[1] = number[1] + " " + hnrParts1[1];
    }

    const intParts = hnrParts1.map(part => hnrPartToInt(part))
    const even = isEven(intParts[0])
    for (let i = 1; i < intParts.length; i++) {
        if (isEven(intParts[i]) != even) {
            throw "Mixed even and odd hnrs: " + hnr
        }
    }
    return intParts
}

// Sort key of a house number within its base number: the plain number comes first,
// then the letters a..z (base + 0.01*index), then the fractions (base + 0.5 + a value
// below 0.5), then the next base number. So 17 < 17a < 17z < 17 1/2 < 17 2/2 < 17 3/2 < 18.
function hnrPartToInt(hnrPart: string): number {
    if (hnrPart.match(/^[0-9]+[a-z]{1,2}$/)) {
        return parseInt(hnrPart.substring(0, hnrPart.length - 1)) + letterKey(hnrPart.charAt(hnrPart.length - 1));
    }
    else if (hnrPart.match(/^[0-9]+$/)) {
        return parseInt(hnrPart)
    }
    else if (hnrPart.includes(' ')) {
        const parts = hnrPart.split(" ");
        return parseInt(parts[0]) + parseHnrFractionPart(parts[1]);
    }
    else {
        throw "Unknown hnr: " + hnrPart;
    }
}

function letterKey(letter: string): number {
    return (letter.charCodeAt(0) - 96) / 100;
}

// Precomposed Unicode vulgar fractions -> their decimal value, so raw hnr strings that
// did not go through cleanHnr are handled with the same semantics as ASCII "n/m".
const UNICODE_FRACTIONS: { [key: string]: number } = {
    '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4,
}

function parseHnrFractionPart(hnrPart: string): number {
    if (hnrPart in UNICODE_FRACTIONS) {
        return fractionKey(UNICODE_FRACTIONS[hnrPart]);
    }
    if (hnrPart.match(/^[0-9]{1}\/[0-9]{1}$/)) {
        const rest = hnrPart.split("/");
        return fractionKey(parseInt(rest[0]) / parseInt(rest[1]));
    }
    else if (hnrPart.match(/^[a-z]{1}$/)) {
        return letterKey(hnrPart);
    }
    else if (hnrPart == "i") {
        return 0.01;
    }
    else if (hnrPart == "ii") {
        return 0.02;
    }
    else if (hnrPart == "iii") {
        return 0.03;
    }
    else {
        throw "Unknown hnr part: " + hnrPart;
    }
}

// Maps a fraction value monotonically into (0.5, 1) so that it sorts after all letters
// and before the next base number, even for improper fractions like 3/2.
function fractionKey(value: number): number {
    return 0.5 + 0.5 * value / (1 + value);
}

// --- Letter <-> fraction synonym fallback ---------------------------------------------
// Sources often use "a" and "1/2" synonymously, but some streets have both 17a and 17 1/2
// as different buildings. matchesHnr() is therefore strict; lookups into a known set of
// house numbers use findHnrCandidates(), which only falls back to the synonym when nothing
// matches exactly.

// "17 1/2" -> "17a", "40 1/2-2/2" -> "40a-b"; strings without fractions are returned as is.
function toLetterForm(hnr: string): string {
    return hnr.replace(/(^|[-, ])([0-9]+ )?([0-9])\/[0-9](?![0-9])/g, (_match, sep: string, number: string | undefined, numerator: string) => {
        const letter = String.fromCharCode(96 + Math.min(parseInt(numerator), 26));
        return sep + (number ? number.trim() : '') + letter;
    })
}

function hasFraction(hnr: string): boolean {
    return toLetterForm(hnr) != hnr;
}

// Like findHnrCandidates, but for entries that carry a house number: returns the entries
// whose number matches exactly, or else the single entry matching via the synonym fallback.
export function findMatchingEntries<T>(hnr: string | null, entries: T[], getHnr: (entry: T) => string | null): T[] {
    const candidates = findHnrCandidates(hnr, entries.map(getHnr));
    return entries.filter(entry => candidates.includes(getHnr(entry)));
}

export function findHnrCandidates(hnr: string | null, knownHnrs: (string | null)[]): (string | null)[] {
    if (!hnr) {
        return [];
    }
    const exact = knownHnrs.filter(known => matchesHnr(hnr, known));
    if (exact.length > 0) {
        return exact;
    }

    const letterHnr = toLetterForm(hnr);
    const alternates = knownHnrs.filter(known =>
        known && hasFraction(known) != hasFraction(hnr) && matchesHnr(letterHnr, toLetterForm(known)));
    // more than one candidate: we can't tell which building was meant
    return alternates.length == 1 ? alternates : [];
}
