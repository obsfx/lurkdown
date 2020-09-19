import Element from '../Element'
import Utils from '../Utils'
import {
    t_spottedSeq
} from '../types'

import hljs from 'highlight.js'

export default abstract class CodeBlock {
    private static indenthresold: number = 4;

    public static match(start: number, str: string): t_spottedSeq[] | false {
        let sequence: string[][] = [ ['```', '```'] ];

        let spottedSeqs: t_spottedSeq[] | false = Utils.resolveSeqs(sequence, start, str, false);
        if (!spottedSeqs) return false;

        return spottedSeqs;
    }

    public static extract(opening: t_spottedSeq, closing: t_spottedSeq, context: string): Element {
        let str: string = Utils.getBetween(opening, closing, context);
        let strArr: string[] = str.split('\n');
        let lang: Language | undefined = hljs.getLanguage(strArr[0]);
        strArr.shift();

        let code: string = strArr.join('\n');

        let hlcode: string = lang ? hljs.highlight(lang.name || '', code).value :
            hljs.highlightAuto(code).value;

        let div: Element = new Element('div', [], hlcode);

        return div;
    }

    public static indentMatch(str: string, curLineIdx: number, lineStartIdxs: number[], baseindent: number): t_spottedSeq[] | false {
        let seqs: t_spottedSeq[] = [];
        let headindent: number = -1;

        while (curLineIdx < lineStartIdxs.length) {
            let indent: number = 0;
            let idx: number = lineStartIdxs[curLineIdx];

            while (idx < str.length && str[idx] == ' ') {
                indent++;
                idx++;
            }

            if (headindent == -1) {
                headindent = indent - baseindent;
                if (headindent < this.indenthresold) return false;
            }

            if (indent - baseindent < headindent) {
                if (str[idx] != '\n') break;
                else {
                    curLineIdx++;
                    continue;
                };
            }

            seqs.push(...Utils.getLineBounds(str, curLineIdx, lineStartIdxs));

            curLineIdx++;
        }

        return seqs.length == 0 ?
            false :
            seqs
    }

    public static indentExtract(seqs: t_spottedSeq[], context: string, baseindent: number): Element {
        let str: string = Utils.getBetween(seqs[0], seqs[seqs.length - 1], context)
        .split('\n')
        .map(t => t.substring(baseindent + this.indenthresold))
        .join('\n');

        //console.log('<br>');
        //console.log('---------------------');
        //console.log('<br>');
        //Utils.getBetween(seqs[0], seqs[seqs.length - 1], context)
        //.split('\n').map(t => t.substring(baseindent + this.indenthresold))
        //.forEach(p => console.log(`<span>${p}</span><br>`))
        //console.log('<br>');
        //console.log('---------------------');
        //console.log('<br>');

        let pre: Element = new Element('pre');
        let code: Element = new Element('code', [], str);

        pre.appendChild(code);

        return pre;
    }
}
