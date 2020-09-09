/**
 * link
 */

import Element, { t_attribute } from './Element'
import util from './util'
import {
    t_spottedSeq,
    t_seqs
} from './types'

let match = (start: number, str: string): t_spottedSeq[] | false => {
    let sequences: t_seqs = {
        '[': [ [ '[', '](', ')' ] ]
    }

    let seqs: string[][] = sequences[str[start]];
    let spottedSeqs: t_spottedSeq[] | false = util.resolveSeqs(seqs, start, str);

    if (!spottedSeqs) return false;
    
    let urlParts: string = util.getBetween(spottedSeqs[1], spottedSeqs[2], str);
    let urlPieces: string[] = urlParts.trim().split(' ');
    let url: string = urlPieces[0];
    let title: string = urlPieces.slice(1).join(' ').trim();

    if (url.indexOf('\n') != -1) {
        return false;
    }

    if (!util.isThisTitle(title)) return false;

    return spottedSeqs;
}

let extract = (seq: t_spottedSeq[], context: string): Element => {
    let textPart: string = util.getBetween(seq[0], seq[1], context);

    let urlParts: string = util.getBetween(seq[1], seq[2], context);
    let urlPieces: string[] = urlParts.trim().split(' ');
    let url: string = urlPieces[0];
    let title: string = urlPieces.slice(1).join(' ').trim();
    title = title.substring(1, title.length - 1);

    let attributes: t_attribute[] = [];

    attributes.push({ key: 'href', value: url });
    
    if (title.length > 0) {
        attributes.push({ key: 'title', value: title });
    }

    let a: Element = new Element('a', attributes, textPart);

    return a;
}

export default { match, extract }
