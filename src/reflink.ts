/**
 * reflink
 */

import Element from './Element'
import util from './util'
import inline from './inline'
import {
    t_spottedSeq,
    t_seqs,
    t_reflinkSpec
} from './types'

let match = (start: number, str: string): t_spottedSeq[] | false => {
    let sequences: t_seqs = {
        '[': [ 
            [ '[', '][', ']' ],
            [ '[', ']' ]
        ],
    }

    let seqs: string[][] = sequences[str[start]];
    let spottedSeqs: t_spottedSeq[] | false = util.resolveSeqs(seqs, start, str);

    return spottedSeqs;
}

let extract = (seq: t_spottedSeq[], context: string): [ Element, t_reflinkSpec ] => {
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
        strEl = inline(str);
        el.appendChild(strEl);

        el.appendChild(new Element('', [], ']'));
    }

    el.appendChild(new Element('', [], '['));

    let keyEl: Element = inline(key);
    el.appendChild(keyEl);

    el.appendChild(new Element('', [], ']'));

    return [ el, { elid: el.id, key, keyEl, strEl } ]
}

export default { match, extract }
