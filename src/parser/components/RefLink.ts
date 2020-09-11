import Element from '../Element'
import Utils from '../Utils'
import Inline from '../Inline'
import {
    t_spottedSeq,
    t_seqs,
    t_reflink,
    t_inlineParseResult
} from '../types'

export default abstract class RefLink {
    public static match(start: number, str: string): t_spottedSeq[] | false {
        let sequences: t_seqs = {
            '[': [ 
                [ '[', '][', ']' ],
                [ '[', ']' ]
            ],
        }

        let seqs: string[][] = sequences[str[start]];
        let spottedSeqs: t_spottedSeq[] | false = Utils.resolveSeqs(seqs, start, str);

        return spottedSeqs;
    }

    public static extract(seq: t_spottedSeq[], context: string): [ Element, t_reflink ] {
        let el: Element = new Element('');
        let strEl: Element | null = null;

        let str: string | null = seq.length == 3 ? '' : null;

        let keySpots: [ t_spottedSeq, t_spottedSeq ] = seq.length == 3 ? 
            [ seq[1], seq[2] ] :
            [ seq[0], seq[1] ];

        let key: string = context.substring(keySpots[0].idx + keySpots[0].len, keySpots[1].idx).toLowerCase();

        if (str != null) {
            el.appendChild(new Element('', [], '['));

            str = context.substring(seq[0].idx + seq[0].len, seq[1].idx);

            let InlineParser: Inline = new Inline(str, '');
            let inlineParseRes: t_inlineParseResult = InlineParser.parse();

            strEl = inlineParseRes.el;
            el.appendChild(strEl);

            el.appendChild(new Element('', [], ']'));
        }

        el.appendChild(new Element('', [], '['));

        let InlineParser: Inline = new Inline(str || '', '');
        let inlineParseRes: t_inlineParseResult = InlineParser.parse();
        let keyEl: Element = inlineParseRes.el;
        el.appendChild(keyEl);

        el.appendChild(new Element('', [], ']'));

        return [ el, { elid: el.id, key, keyEl, strEl } ]
    }
}
