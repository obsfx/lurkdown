import Element from '../Element'
import Utils from '../Utils'
import Inline from '../Inline'
import {
    t_spottedSeq,
    t_headingMatchRes,
    t_inlineParseResult
} from '../types'

export default abstract class Heading {
    public static match(start: number, str: string): t_headingMatchRes | false {
        let idx: number = start;
        let hx: number = 0;

        while (idx < str.length && str[idx] == '#') {
            hx++;
            idx++;
        }

        if (hx > 6) return false;

        if (str[idx] && str[idx] != ' ' && str[idx] != '\n') {
            return false;
        }

        let seqs: t_spottedSeq[] = [ { idx, len: 1 } ];

        while (str[idx] && str[idx] != '\n') {
            idx++;
        }

        seqs.push({ idx, len: 1 });

        return { seqs, hx };
    }

    public static extract(headingMatch: t_headingMatchRes, context: string): Element {
        let str: string = Utils.getBetween(headingMatch.seqs[0], headingMatch.seqs[1], context);

        let InlineParser: Inline = new Inline(str, null);
        let parsedContext: t_inlineParseResult = InlineParser.parse();

        let h: Element = new Element(`h${headingMatch.hx}`, [ { key: 'class', value: `ld-h${headingMatch.hx}` } ]);
        h.appendChild(parsedContext.el);

        return h;
    }
}
