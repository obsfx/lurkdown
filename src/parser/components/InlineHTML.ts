import Element from '../Element'
import Utils from '../Utils'
import {
    t_spottedSeq,
    t_inlineHTMLMatchRes
} from '../types'

export default abstract class InlineHTML {
    public static match(start: number, str: string): t_inlineHTMLMatchRes | false {
        let sequence: string[][] = [ ['<', '>'] ];
        let spottedSeqs: t_spottedSeq[] | false = Utils.resolveSeqs(sequence, start, str);
        if (!spottedSeqs) return false;

        let tag: string = Utils.getBetween(spottedSeqs[0], spottedSeqs[1], str);

        let tagsequence: string[][] = [ [`<${tag}`, '>', `</${tag}>`] ]
        let tagspottedSeqs: t_spottedSeq[] | false = Utils.resolveSeqs(tagsequence, start, str, false);
        if (!tagspottedSeqs) return false;

        return { seqs: tagspottedSeqs, contanerTag: tag };
    }

    public static extract(matchRes: t_inlineHTMLMatchRes, context: string): Element {
        let str: string = Utils.getBetween(matchRes.seqs[1], matchRes.seqs[2], context);
        let el: Element = new Element(matchRes.contanerTag, [], str);

        return el;
    }
}
