import Element from '../Element'
import Utils from '../Utils'
import Inline from '../Inline'
import {
    t_spottedSeq,
    t_inlineParseResult
} from '../types'

export default abstract class Blockquote {
    public static match(start: number, str: string): t_spottedSeq[] {
        let idx: number = start + 1;

        while (idx < str.length && !Utils.isBlankLine(idx, str)) {
            idx++;
        }

        return [
            { idx: start + 1, len: 0 },
            { idx, len: 0 }
        ]
    }

    public static extract(seqs: t_spottedSeq[], context: string): t_inlineParseResult {
        let blockquote: Element = new Element('blockquote', [ { key: 'class', value: 'ld-blockquote' } ]);

        let inlineContext: string = context.substring(seqs[0].idx, seqs[seqs.length - 1].idx);

        let lines: string[] = inlineContext.split('\n');

        for (let i: number = 0; i < lines.length; i++) {
            let line: string[] = lines[i].split('');
            let anychar: boolean = false;

            for (let j: number = 0; j < line.length; j++) {
                if (line[j] == '>' && !anychar) {
                    line[j] = '';
                }

                if (line[j] != ' ') anychar = true;
            }

            lines[i] = line.join('');
        }

        inlineContext = lines.join('\n');

        let p: Element = new Element('p');
        let InlineParser: Inline = new Inline(inlineContext, p);
        let inlineParseRes: t_inlineParseResult = InlineParser.parse();

        blockquote.appendChild(inlineParseRes.el);

        return {
            el: blockquote,
            refs: inlineParseRes.refs,
            reflinks: inlineParseRes.reflinks
        }
    }
}
