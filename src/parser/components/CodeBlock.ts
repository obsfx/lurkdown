import Element from '../Element'
import Utils from '../Utils'
import {
    t_spottedSeq
} from '../types'

export default abstract class CodeBlock {
    private static indenthresold: number = 4;

    public static indentMatch(str: string, curLineIdx: number, lineStartIdxs: number[], baseindent: number): t_spottedSeq[] | false {
        let seqs: t_spottedSeq[] = [];
        let headindent: number = -1;

        while (curLineIdx < lineStartIdxs.length) {
            let indent: number = 0;
            let idx: number = lineStartIdxs[curLineIdx];

            while (idx < str.length && str[idx] != ' ' && str[idx] != '\n') {
                indent++;
                idx++;
            }

            if (headindent == -1) headindent = indent - baseindent;

            if (headindent < this.indenthresold) break;

            seqs.push(...Utils.getLineBounds(str, curLineIdx, lineStartIdxs));

            curLineIdx++;
        }

        return seqs.length == 0 ?
            false :
            seqs
    }

    public static extract(seqs: t_spottedSeq[], context: string): Element {
        let str: string = Utils.getBetween(seqs[0], seqs[seqs.length - 1], context); 

        let pre: Element = new Element('pre');
        let code: Element = new Element('code', [], str);

        pre.appendChild(code);

        return pre;
    }
}
