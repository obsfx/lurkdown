import Utils from '../Utils'
import {
    t_spottedSeq
} from '../types'

export default abstract class AltHeading {
    public static match(type: '=' | '-', curLineIdx: number, lineStartIdxs: number[], str: string): t_spottedSeq[] | false {
        let line: string = Utils.getLine(lineStartIdxs[curLineIdx], str);

        let isValid: boolean = Utils.isConsistOf(line.trim(), type);
        if (!isValid) return false;

        return curLineIdx < lineStartIdxs.length - 1 ?
            [ { idx: lineStartIdxs[curLineIdx + 1], len: 0 } ] :
            [ { idx: str.length, len: 0 } ];
    }
}
