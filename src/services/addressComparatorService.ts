// House-number comparator ported from the doserv project's addressComparator.ts.
// Street equality is guaranteed by the caller (the per-street address-book JSON is
// fetched by cleaned street name), so only the house-number logic is kept here.
// Inputs are expected to be already cleaned via cleanHnr (e.g. "15a", "13-17", "15a,17").

export function matchesHnr(hnr1: string | null, hnr2: string | null): boolean {
    if (!hnr1 || !hnr2) {
        return false;
    }
    if (hnr1 == hnr2) {
        return true;
    }

    try {
        const hnrParts1 = splitHnr(hnr1)
        const hnrParts2 = splitHnr(hnr2)
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

    const intParts = hnrParts1.map(part => hnrPartToInt(part))
    const even = isEven(intParts[0])
    for (let i = 1; i < intParts.length; i++) {
        if (isEven(intParts[i]) != even) {
            throw "Mixed even and odd hnrs: " + hnr
        }
    }
    return intParts
}

function hnrPartToInt(hnrPart: string): number {
    if (hnrPart.match(/^[0-9]+[a-z]{1,2}$/)) {
        return parseInt(hnrPart.substring(0, hnrPart.length - 1)) + (hnrPart.charCodeAt(hnrPart.length - 1) - 96) / 10;
    }
    else if (hnrPart.match(/^[0-9]+$/)) {
        return parseInt(hnrPart)
    }
    else if (hnrPart.includes(' ')) {
        const parts = hnrPart.split(" ");
        let value = parseInt(parts[0])
        for (let i = 1; i < hnrPart.length; i++) {
            value += parseHnrFractionPart(parts[1]) / Math.max(Math.pow(10, i - 1), 1)
        }
        return value
    }
    else {
        throw "Unknown hnr: " + hnrPart;
    }
}

function parseHnrFractionPart(hnrPart: string): number {
    if (hnrPart.match(/^[0-9]{1}\/[0-9]{1}$/)) {
        const rest = hnrPart.split("/");
        return (parseInt(rest[0]) / parseInt(rest[1]));
    }
    else if (hnrPart.match(/^[a-z]{1}$/)) {
        return (hnrPart.charCodeAt(0) - 96) / 10
    }
    else if (hnrPart == "i") {
        return 0.1;
    }
    else if (hnrPart == "ii") {
        return 0.2;
    }
    else if (hnrPart == "iii") {
        return 0.3;
    }
    else {
        throw "Unknown hnr part: " + hnrPart;
    }
}
