import Element from './Element'
import { 
    t_spottedSeq,
    t_extractFixesResult
} from './types'

let getLineStartIdxs = (buffer: string): number[] => {
    let arr: number[] = [ 0 ];

    for (let i: number = 0; i < buffer.length; i++) {
        if (buffer[i] == '\n') {
            arr.push(i + 1);
        }
    }

    return arr;
}

let getSection = (): Element => (
    new Element('div', [{ key: 'style', value: 'margin: 15px 0px;' }])
)

let ccount = (source: string, char: string): number => (
    source.split('').filter((c: string) => c == char).length
)

let isBlankLine = (start: number, str: string): boolean => (
    start < str.length - 1 && str[start] == '\n' && str[start + 1] == '\n'
)

let getLine = (start: number, str: string): string => {
    let line: string = '';

    let idx: number = start;

    while (idx < str.length && str[idx] != '\n') {
        line += str[idx];
        idx++;
    }

    return line;
}

let getBetween = (opening: t_spottedSeq, closing: t_spottedSeq, context: string) => (
    context.substring(opening.idx + opening.len, closing.idx)
)

let checkSeq = (seq: string[], start: number, context: string, terminators: string[] = []): t_spottedSeq[] | false => {
    if (seq.length == 0) return false;

    let idx: number = start;
    let seqIdx: number = 0;
    let spottedSeqs: t_spottedSeq[] = [];

    while (idx < context.length && seqIdx < seq.length) {
        if (terminators.indexOf(seq[seqIdx]) > -1) return false;

        if (seq[seqIdx] == context.substring(idx, idx + seq[seqIdx].length)) {
            spottedSeqs.push({ idx: idx, len: seq[seqIdx].length });
            idx = idx + seq[seqIdx].length;
            seqIdx++;
            continue;
        }

        idx++;
    }

    return spottedSeqs.length == seq.length ?
        spottedSeqs :
        false;
}

let extractFixes = (source: string, char: string): t_extractFixesResult => {
    let left: boolean = false;
    let right: boolean = false;

    if (source[0] == char) {
        source = source.substring(1);
        left = true;
    }

    if (source[source.length - 1] == char) {
        source = source.substring(0, source.length - 1);
        right = true;
    }

    return { source, left, right }
}

let resolveSeqs = (seqs: string[][], start: number, str: string, terminators: string[] = []): t_spottedSeq[] | false => {
    for (let i: number = 0; i < seqs.length; i++) {
        let checkSeqRes: t_spottedSeq[] | false = checkSeq(seqs[i], start, str, terminators);

        if (checkSeqRes) {
            return checkSeqRes;
        }
    }

    return false;
}

let isConsistOf = (source: string, char: string): boolean => {
    let charCount: number = source.split('').filter((c: string) => c == char).length;

    return charCount > 0 && charCount == source.length ? true : false;
}

let isThisTitle = (title: string): boolean => {
    if (title.length > 0 &&
        ((title[0] != '"' || title[title.length - 1] != '"')  &&
        (title[0] != '\'' || title[title.length - 1] != '\''))) {
        return false;
    }

    return true;
}

let isThisAnOrderedListHead = (idx: number, str: string): [ boolean, number, number ] => {
    let headScanIdx: number = idx;

    while (headScanIdx < str.length && str[headScanIdx] != '.' && str[headScanIdx] != ')') {
        headScanIdx++;
    }

    if (headScanIdx >= str.length - 1 ||
        (str[headScanIdx] != '.' && str[headScanIdx] != ')') ||
        (str[headScanIdx + 1] != ' ' && str[headScanIdx + 1] != '\n')) {
        return [ false, 0, 0 ];
    }

    let wsScanIdx: number = idx - 1;
    let outerindent: number = 0;

    while (wsScanIdx > -1 && str[wsScanIdx] != '\n') {
        let char: string = str[wsScanIdx];

        if (char != ' ') return [ false, 0, 0 ];

        outerindent++;
        wsScanIdx--;
    }

    if (!Number.isInteger(parseInt(str.substring(idx, headScanIdx)))) {
        return [ false, 0, 0 ]
    }

    return [ true, outerindent, parseInt(str.substring(idx, headScanIdx))];
}

let isThisAnUnOrderedListHead = (idx: number, str: string): [ boolean, number ] => {
    if (idx >= str.length - 1 || 
        (str[idx] != '*' && str[idx] != '-' && str[idx] != '+') ||
        (str[idx + 1] != ' ' && str[idx + 1] != '\n')) {
        return [ false, 0 ];
    }

    let wsScanIdx: number = idx - 1;
    let outerindent: number = 0;

    while (wsScanIdx > -1 && str[wsScanIdx] != '\n') {
        let char: string = str[wsScanIdx];

        if (char != ' ') return [ false, 0 ];

        outerindent++;
        wsScanIdx--;
    }

    return [ true, outerindent ];
}

export default {
    getLineStartIdxs,
    getSection,
    ccount,
    isBlankLine,
    getLine,
    getBetween,
    checkSeq,
    extractFixes,
    resolveSeqs,
    isConsistOf,
    isThisTitle,
    isThisAnOrderedListHead,
    isThisAnUnOrderedListHead
}
