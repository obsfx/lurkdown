import Element from '../Element'
import Utils from '../Utils'
import Inline from '../Inline'
import { 
    t_spottedSeq, 
    t_seqs,
    t_inlineParseResult
} from '../types'

export default abstract class Emphasis {
    public static match(type: string, start: number, str: string): t_spottedSeq[] | false {
        let sequences: { [key: string]: t_seqs } = {
            'bold': {
                '_': [ ['__', '__'] ],
                '*': [ ['**', '**'] ] 
            },

            'italic': {
                '_': [ ['_', '_'] ],
                '*': [ ['*', '*'] ]
            },

            'scratch': {
                '~': [ ['~~', '~~'] ]
            },

            'code': {
                '`': [ [ '`', '`' ] ]
            }
        }

        if (!sequences.hasOwnProperty(type)) return false;

        let seqs: string[][] = sequences[type][str[start]];
        let spottedSeqs: t_spottedSeq[] | false = Utils.resolveSeqs(seqs, start, str);

        if (!spottedSeqs) return false;

        let inlineText: string = Utils.getBetween(spottedSeqs[0], spottedSeqs[1], str);

        if (inlineText[0] == ' ' || inlineText[inlineText.length - 1] == ' ') return false;

        return spottedSeqs;
    }

    public static extract(type: string, opening: t_spottedSeq, closing: t_spottedSeq, context: string): t_inlineParseResult {
        let inlineText: string = Utils.getBetween(opening, closing, context);
        let el: Element = new Element(type, [ { key: 'class', value: `ld-${type}` } ]);

        /**
         * we apply inline operation recursively for the inlineText
         * in order to get sub combined emphasises 
         */
        let InlineParser: Inline = new Inline(inlineText, null);
        let inlineParseRes: t_inlineParseResult = InlineParser.parse();

        el.appendChild(inlineParseRes.el);

        return {
            el,
            refs: inlineParseRes.refs,
            reflinks: inlineParseRes.reflinks
        }
    }
}
