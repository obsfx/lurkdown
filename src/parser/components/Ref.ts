import Utils from '../Utils'
import {
    t_spottedSeq,
    t_seqs,
    t_ref
} from '../types'

export default abstract class Ref {
    public static match(start: number, str: string): t_spottedSeq[] | false {
        /**
         * check we are at the beginning of the paragraph
         */
        let backwardScanIdx: number = start - 1;

        while (backwardScanIdx > 0) {
            if (str[backwardScanIdx] != ' ' && str[backwardScanIdx] != '\n' && str[backwardScanIdx] == '\r') {
                return false;
            } 

            backwardScanIdx--;
        }

        /**
         * check the first non space char is a left square bracket if it is not
         * it cant be a ref link. Then check the right squarebracket and semicolon
         */
        let patternCheck = (start: number, str: string): t_spottedSeq[] | false => {
            let scanIdx: number = start;

            while (scanIdx < str.length) {
                let char: string = str[scanIdx];

                if (char != ' ' && char != '\n') {
                    if (char == '[') break;
                    else return false;
                }

                scanIdx++;
            }

            /**
             * if we exceed the limit and cant find a left square bracket just return false
             */
            if (scanIdx == str.length) return false;

            let sequences: t_seqs = {
                '[': [ [ '[', ']:' ] ]
            }

            let seqs: string[][] = sequences[str[scanIdx]];
            let spottedSeqs: t_spottedSeq[] | false = Utils.resolveSeqs(seqs, scanIdx, str);

            if (!spottedSeqs) return false;

            return spottedSeqs;
        }

        /**
         * scan the url part to determine it is whether correctly defined
         */
        let scanUrl = (start: number, str: string): number | false => {
            let urlScanIdx: number = start;
            let urlStart: number = -1;
            let urlEnd: number = -1;

            while (urlScanIdx < str.length) {
                let char: string = str[urlScanIdx];

                /**
                 * scan until come across with a non space char
                 */
                if (urlStart == -1 && char != ' ' && char != '\n') {
                    urlStart = urlScanIdx;
                    urlScanIdx++;
                    continue;
                }

                /**
                 * then get the whole piece until the end of the line
                 */
                if (urlStart != -1 && (char == '\n' || urlScanIdx == str.length - 1)) {
                    urlEnd = urlScanIdx + 1;
                    break;
                }

                urlScanIdx++;
            }

            if (urlStart == -1 && urlEnd == -1) return false;

            let urlPieces: string[] = str.substring(urlStart, urlEnd).split(' ');
            let title: string = urlPieces.slice(1).join(' ').trim();

            if (!Utils.isThisTitle(title)) return false;

            return urlEnd;
        }

        let piecePoints: t_spottedSeq[] = [];
        let refStart: number = -1;
        let refEnd: number = 0;

        /**
         * figure out all contiguous ref link patterns
         */
        for(;;) {
            let patternRes: t_spottedSeq[] | false = patternCheck(refEnd, str);
            if (!patternRes) break;

            refStart = patternRes[0].idx;

            let scanRes: number | false = scanUrl(patternRes[1].idx + patternRes[1].len, str);
            if (!scanRes) break;

            /**
             * check pattern and url part and then start over again from the end of the detected
             * ref link pattern to determine other patterns
             */
            refEnd = scanRes;

            piecePoints.push({ idx: refStart, len: 1 });
            piecePoints.push({ idx: refEnd, len: 1 });
        }

        if (refStart == -1 || refEnd == -1) return false;

        return piecePoints;
    }

    public static extract(seq: t_spottedSeq[], context: string): t_ref[] {
        let refs: t_ref[] = [];

        for (let i: number = 0; i < seq.length; i += 2) {
            let refStrPieces: string[] = context.substring(seq[i].idx, seq[i+1].idx).split(':');
            let key: string = refStrPieces[0].substring(1, refStrPieces[0].length - 1).trim().toLowerCase();

            let urlPieces: string[] = refStrPieces.slice(1).join(':').trim().split(' ');
            let url: string = urlPieces[0].trim();
            let title: string = urlPieces.slice(1).join(' ').trim();
            title = title.substring(1, title.length - 1);

            refs.push({ key, url, title });
        }

        return refs;
    }
}
