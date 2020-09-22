import Element from './Element'
import { 
    t_spottedSeq,
    t_extractFixesResult
} from './types'

export default abstract class Utils {
    public static getLineStartIdxs(buffer: string): number[] {
        let arr: number[] = [ 0 ];

        for (let i: number = 0; i < buffer.length; i++) {
            if (buffer[i] == '\n') {
                arr.push(i + 1);
                continue;
            }
        }

        return arr;
    }

    public static getSection(): Element {
        return new Element('div', [{ key: 'class', value: 'ld-div' }])
    }

    public static ccount(source: string, char: string): number {
        return source.split('').filter((c: string) => c == char).length;
    }

    public static isBlankLine(start: number, str: string): boolean {
        //console.log('---->', JSON.stringify(str.substring(start, start + 2)));

        //debugger;

        if (str.substring(start, start + 2) == '\n\n') {
            return true;
        }

        return false;
    }

    public static getLine(start: number, str: string): string {
        let line: string = '';

        let idx: number = start;

        while (idx < str.length && str[idx] != '\n') {
            line += str[idx];
            idx++;
        }

        return line;
    }

    public static getLineBounds(str: string, lineIdx: number, lineStartIdxs: number[]): t_spottedSeq[] {
        let bounds: t_spottedSeq[] = [];

        bounds.push({ idx: lineStartIdxs[lineIdx], len: 0 });

        if (lineIdx + 1 < lineStartIdxs.length) bounds.push({ idx: lineStartIdxs[lineIdx + 1], len: 0 });
        else bounds.push({ idx: str.length, len: 0 });

        return bounds;
    }

    public static getBetween(opening: t_spottedSeq, closing: t_spottedSeq, context: string): string {
        return context.substring(opening.idx + opening.len, closing.idx)
    }

    public static checkSeq(seq: string[], start: number, 
        context: string, nlTerminator: boolean = true, passCon: string[] = []): t_spottedSeq[] | false {
        if (seq.length == 0) return false;

        debugger;

        let idx: number = start;
        let seqIdx: number = 0;
        let spottedSeqs: t_spottedSeq[] = [];

        let passQueue: string[] = [];

        while (idx < context.length && (!nlTerminator || !this.isBlankLine(idx, context)) && seqIdx < seq.length) {
            if (passCon.length > 0 && seqIdx > 0) {
                for (let i: number = 0; i < passCon.length; i++) {
                    let con: string = passCon[i];

                    if (con == context.substring(idx, idx + con.length)) {
                        passQueue.push(...seq.slice(1));
                        idx = idx + con.length;
                        break;
                    }
                }
            }

            if (seqIdx > 0 && passQueue.length > 0 && passQueue[0] == context.substring(idx, idx + passQueue[0].length)) {
                idx = idx + passQueue[0].length;
                passQueue.shift();
                continue;
            } else if (seq[seqIdx] == context.substring(idx, idx + seq[seqIdx].length)) {
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

    public static extractFixes(source: string, char: string): t_extractFixesResult {
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

    public static resolveSeqs(seqs: string[][], start: number, 
        str: string, nlTerminator: boolean = true, passCon: string[] = []): t_spottedSeq[] | false {
        for (let i: number = 0; i < seqs.length; i++) {
            let checkSeqRes: t_spottedSeq[] | false = this.checkSeq(seqs[i], start, str, nlTerminator, passCon);

            if (checkSeqRes) {
                return checkSeqRes;
            }
        }

        return false;
    }

    public static isConsistOf(source: string, char: string): boolean {
        let charCount: number = source.split('').filter((c: string) => c == char).length;

        return charCount > 0 && charCount == source.length ? true : false;
    }

    public static isThisTitle(title: string): boolean {
        if (title.length > 0 &&
            ((title[0] != '"' || title[title.length - 1] != '"')  &&
            (title[0] != '\'' || title[title.length - 1] != '\''))) {
            return false;
        }

        return true;
    }
}
