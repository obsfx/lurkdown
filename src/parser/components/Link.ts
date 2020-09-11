import Element, { t_attribute } from '../Element'
import Utils from '../Utils'
import {
    t_spottedSeq,
    t_seqs
} from '../types'

export default abstract class Link {
    public static match(start: number, str: string): t_spottedSeq[] | false {
        let sequences: t_seqs = {
            '[': [ [ '[', '](', ')' ] ]
        }

        let seqs: string[][] = sequences[str[start]];
        let spottedSeqs: t_spottedSeq[] | false = Utils.resolveSeqs(seqs, start, str);

        if (!spottedSeqs) return false;
        
        let urlParts: string = Utils.getBetween(spottedSeqs[1], spottedSeqs[2], str);
        let urlPieces: string[] = urlParts.trim().split(' ');
        let url: string = urlPieces[0];
        let title: string = urlPieces.slice(1).join(' ').trim();

        if (url.indexOf('\n') != -1) {
            return false;
        }

        if (!Utils.isThisTitle(title)) return false;

        return spottedSeqs;
    }

    public static extract(seq: t_spottedSeq[], context: string): Element {
        let textPart: string = Utils.getBetween(seq[0], seq[1], context);

        let urlParts: string = Utils.getBetween(seq[1], seq[2], context);
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
}
