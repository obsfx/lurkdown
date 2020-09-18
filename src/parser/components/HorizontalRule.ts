import Utils from '../Utils'
import {
    t_spottedSeq
} from '../types'

export default abstract class HorizontalRule {
    public static match(type: '-' | '_' | '*', curLineIdx: number, lineStartIdxs: number[], str: string): t_spottedSeq[] | false {
        let line: string = Utils.getLine(lineStartIdxs[curLineIdx], str);

        let charcount: number = Utils.ccount(line, type);
        if (charcount < 3 || !Utils.isConsistOf(line.trim(), type)) return false;

        return [ { idx: lineStartIdxs[curLineIdx] + line.length, len: 0 } ]
    }
}
