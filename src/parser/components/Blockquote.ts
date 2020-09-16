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
        let blockquote: Element = new Element('blockquote');

        let inlineContext: string = context.substring(seqs[0].idx, seqs[seqs.length - 1].idx);

        let InlineParser: Inline = new Inline(inlineContext, 'p');
        let inlineParseRes: t_inlineParseResult = InlineParser.parse();

        blockquote.appendChild(inlineParseRes.el);

        return {
            el: blockquote,
            refs: inlineParseRes.refs,
            reflinks: inlineParseRes.reflinks
        }
    }
}
