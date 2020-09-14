//import Element from '../Element'
import Utils from '../Utils'
import {
    t_listMatch
} from '../types'

type t_listHeadRes = { type: 'ordered' | 'unordered', outerindent: number, fullindent: number };
type t_lookRes = { type: 'li' | 'par', idx: number };

export default class List {
    private static isListHead(start: number, str: string): t_listHeadRes | false {
        if (Number.isInteger(parseInt(str[start])) &&
            (str[start + 1] == '.' || str[start + 1] == ')') &&
            (str[start + 2] == ' ' || str[start + 2] == '\n')) {

            let oidx: number = start - 1;
            let outerindent: number = 0;

            while (str[oidx] != '\n') {
                if (str[oidx] != ' ') return false;
                outerindent++;
                oidx--;
            }

            let iidx: number = start + 2;
            let innerindent: number = 0;

            while (str[iidx] == ' ') {
                innerindent++;
                iidx++;
            }

            return { type: 'ordered', outerindent, fullindent: outerindent + innerindent + 2 }

        } else if ((str[start] == '*' || str[start] == '-' || str[start] == '*') &&
                    (str[start + 1] == ' ' || str[start + 1] == '\n')) {

            let oidx: number = start - 1;
            let outerindent: number = 0;

            while (str[oidx] != '\n') {
                if (str[oidx] != ' ') return false;
                outerindent++;
                oidx--;
            }

            let iidx: number = start + 1;
            let innerindent: number = 0;

            while (str[iidx] == ' ') {
                innerindent++;
                iidx++;
            }

            return { type: 'unordered', outerindent, fullindent: outerindent + innerindent + 1 }
        }

        return false;
    }

    private static findEndOfLiContext(start: number, str: string, parentIndent: number): number {
        let idx: number = start;

        while (idx < str.length) {
            if (this.isListHead(idx, str)) {
                return idx;
            }

            if (Utils.isBlankLine(idx, str)) {
                let isThereAnyItem: t_lookRes | false = this.lookForParOrListItem(idx, str, parentIndent);

                if (!isThereAnyItem) return idx;
                else if (isThereAnyItem.type == 'li')  return isThereAnyItem.idx;

                idx = isThereAnyItem.idx;
                continue;
            }

            idx++;
        }

        return idx;
    }

    private static lookForParOrListItem(start: number, str: string, parentIndent: number): t_lookRes | false {
        let idx: number = start;
        let indent: number = 0;

        while (idx < str.length) {
            if (str[idx] == '\n') indent = 0;

            if (str[idx] == '\n' && str[idx] == ' ') {
                if (this.isListHead(idx, str)) return { type: 'li', idx }
                else if (indent >= parentIndent) return { type: 'par', idx }
                else return false;
            }

            idx++;
        }

        return false;
    }

    public static match(start: number, str: string): t_listMatch[] | false {
        let listMatches: t_listMatch[] = [];

        let idx: number = start;

        while(idx < str.length) {
            let head: t_listHeadRes | false = this.isListHead(idx, str);
            if (!head) break;

            let start: number = idx;

            idx = head.type == 'ordered' ? idx + 2 : idx + 1;

            let end: number = this.findEndOfLiContext(idx, str, head.fullindent);

            listMatches.push({ 
                type: head.type, 
                start, 
                end, 
                outerindent: head.outerindent, 
                fullindent: head.fullindent
            });

            idx = end;
        }

        return listMatches.length == 0 ?
            false :
            listMatches
    }

    /*
    public static extract(seqs: t_listMatch[], context): Element {

    }
    */
}
