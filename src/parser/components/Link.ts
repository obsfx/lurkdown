import Element, { t_attribute } from '../Element'
import Utils from '../Utils'
import Inline from '../Inline'
import {
    t_spottedSeq,
    t_seqs,
    t_inlineParseResult
} from '../types'

export default abstract class Link {
    public static match(start: number, str: string): t_spottedSeq[] | false {
        /**
         * pieces
         * link  [  ]( ) -> link, image
         * image ![ ]( )
         * ref   [  ][ ] -> ref
         *       [  ]
         */
        let sequences: t_seqs = {
            '[': [ [ '[', '](', ')' ] ]
        }

        let passCon: string[] = [ '![', '[' ];

        let seqs: string[][] = sequences[str[start]];
        let spottedSeqs: t_spottedSeq[] | false = Utils.resolveSeqs(seqs, start, str, true, passCon);
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

        attributes.push({ key: 'class', value: 'ld-a' })
        attributes.push({ key: 'href', value: url });

        if (title.length > 0) {
            attributes.push({ key: 'title', value: title });
        }

        let InlineParser: Inline = new Inline(textPart, null);
        let parsedText: t_inlineParseResult = InlineParser.parse();

        let a: Element = new Element('a', attributes);
        a.appendChild(parsedText.el);

        return a;
    }

    public static URLMatch(start: number, str: string): t_spottedSeq[] | false {
        if (str.substring(start, start + 7) != 'http://' &&
            str.substring(start, start + 8) != 'https://') return false;

        let idx: number = start;

        while (str[idx] && str[idx] != ' ' && str[idx] != '\n') {
            idx++;
        }

        return [ { idx: start, len: 0 }, { idx, len: 0 } ];
    }

    public static URLExtract(seqs: t_spottedSeq[], context: string): Element {
        let url: string = Utils.getBetween(seqs[0], seqs[1], context);
        let a: Element = new Element('a', [ { key: 'class', value: 'ld-a' }, { key: 'href', value: url } ], url);
        return a;
    }

    public static angleMatch(start: number, str: string): t_spottedSeq[] | false {
        let sequence: string[][] = [ ['<', '>'] ];
        let spottedSeqs: t_spottedSeq[] | false = Utils.resolveSeqs(sequence, start, str);
        if (!spottedSeqs) return false;
        let inside: string = Utils.getBetween(spottedSeqs[0], spottedSeqs[1], str);
        console.log(inside, inside.substring(0, 7) != 'http://', inside.substring(0, 7))

        if (inside.substring(0, 7) != 'http://' &&
            inside.substring(0, 8) != 'https://') return false;

        return spottedSeqs;
    }
}
