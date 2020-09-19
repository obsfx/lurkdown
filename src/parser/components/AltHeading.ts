import Utils from '../Utils'
import {
    t_spottedSeq
} from '../types'

export default abstract class AltHeading {
    public static match(type: '=' | '-', curLineIdx: number, lineStartIdxs: number[], str: string): t_spottedSeq[] | false {
        let prevLine: string = lineStartIdxs[curLineIdx - 1] != undefined ? 
            Utils.getLine(lineStartIdxs[curLineIdx - 1], str) :
            '';

        let isPrevLineExist: boolean = false;

        for (let i: number = 0; i < prevLine.length; i++) {
            if (prevLine[i] != ' ' && prevLine[i] != '\n') {
                isPrevLineExist = true;
                break;
            }
        }

        if (!isPrevLineExist) return false;

        let line: string = Utils.getLine(lineStartIdxs[curLineIdx], str);

        let isValid: boolean = Utils.isConsistOf(line.trim(), type);
        if (!isValid) return false;

        return [ { idx: lineStartIdxs[curLineIdx] + line.length, len: 0 } ];
    }
}
