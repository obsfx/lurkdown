import Element from '../Element'
import Utils from '../Utils'
import {
    t_spottedSeq
} from '../types'

export default abstract class Image {
    public static match(start: number, str: string): t_spottedSeq[] | false {
        let sequence: string[][] = [ [ '![', '](', ')' ] ];

        let spottedSeqs: t_spottedSeq[] | false = Utils.resolveSeqs(sequence, start, str);
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

        let attributes: string = `src='${url}' alt='${textPart}'`;
        
        if (title.length > 0) {
            attributes += ` title='${title}'`
        }

        let a: Element = new Element('', [], `<img ${attributes}>`);

        return a;
    }
}
