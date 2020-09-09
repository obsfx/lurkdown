/**
 * emphasis
 */

import Element from './Element';
import util from './util'
import inline from './inline'
import { 
    t_spottedSeq, 
    t_seqs
} from './types'

let match = (type: string, start: number, str: string): t_spottedSeq[] | false => {
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
        }
    }

    if (!sequences.hasOwnProperty(type)) return false;

    let seqs: string[][] = sequences[type][str[start]];
    let spottedSeqs: t_spottedSeq[] | false = util.resolveSeqs(seqs, start, str);

    if (!spottedSeqs) return false;

    let inlineText: string = util.getBetween(spottedSeqs[0], spottedSeqs[1], str);

    if (inlineText[0] == ' ' || inlineText[1] == ' ') return false;

    return spottedSeqs;
}

let extract = (type: string, opening: t_spottedSeq, closing: t_spottedSeq, context: string): Element => {
    let inlineText: string = util.getBetween(opening, closing, context);
    let el: Element = new Element(type);

    /**
     * we apply inline operation recursively for the inlineText
     * in order to get sub combined emphasises 
     */
    let elInline: Element = inline(inlineText);

    el.appendChild(elInline);

    return el;
}

export default { match, extract }
