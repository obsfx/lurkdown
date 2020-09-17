import Parser from '../';
import Element from '../Element'
import Utils from '../Utils'
import {
    t_listMatch,
    t_listExtractRes,
    t_refUrlTitlePair,
    t_reflink
} from '../types'

type t_listHeadRes = { type: 'ordered' | 'unordered', outerindent: number, fullindent: number };
type t_lookRes = { type: 'li' | 'par', idx: number };
type t_extractListItemRes = { head: string, context: string, checked: 'checked' | 'unchecked' | false };

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

        } else if ((str[start] == '*' || str[start] == '-' || str[start] == '+') &&
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

    private static findEndOfLiContext(start: number, str: string, parent: t_listHeadRes): number {
        let idx: number = start;

        while (idx < str.length) {
            let anotherhead: t_listHeadRes | false = this.isListHead(idx, str);

            if (anotherhead && anotherhead.outerindent < parent.fullindent - 1) {
                return idx;
            }

            if (Utils.isBlankLine(idx, str)) {
                let isThereAnyItem: t_lookRes | false = this.lookForParOrListItem(idx, str, parent);

                if (!isThereAnyItem) return idx;
                else if (isThereAnyItem.type == 'li')  return isThereAnyItem.idx;

                idx = isThereAnyItem.idx;
                continue;
            }

            idx++;
        }

        return idx;
    }

    private static lookForParOrListItem(start: number, str: string, parent: t_listHeadRes): t_lookRes | false {
        let idx: number = start;
        let indent: number = 0;

        while (idx < str.length) {
            if (str[idx] == '\n') indent = 0;

            if (str[idx] != '\n' && str[idx] != ' ') {
                let anotherhead: t_listHeadRes | false = this.isListHead(idx, str);

                if (anotherhead) {
                    if (anotherhead.outerindent != parent.outerindent && 
                        anotherhead.outerindent >= parent.fullindent - 1) {
                        return { type: 'par', idx }
                    } else {
                        return { type: 'li', idx }
                    }
                } else if (indent >= parent.fullindent - 1) {
                    return { type: 'par', idx }
                } else {
                    return false;
                }
            }

            indent++;
            idx++;
        }

        return false;
    }

    public static match(start: number, str: string): t_listMatch[] | false {
        let listMatches: t_listMatch[] = [];

        let idx: number = start;
        let headType: string | null = null;

        while(idx < str.length) {
            let head: t_listHeadRes | false = this.isListHead(idx, str);
            if (!head) break;

            if (!headType) headType = head.type;
            else if (headType != head.type) break;

            let start: number = idx;

            idx = head.type == 'ordered' ? idx + 2 : idx + 1;

            let end: number = this.findEndOfLiContext(idx, str, head);

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

    private static extractListItem(seq: t_listMatch, context: string): t_extractListItemRes {
        let str: string = context.substring(seq.start, seq.end);
        let head: string = '';
        let headEnding: number = 0;

        for (let i: number = 0; i < str.length; i++) {
            let char: string = str[i];

            if (seq.type == 'ordered' && 
                (char == ')' || char == '.')) {
                head = str.substring(0, i);
                headEnding = i + 1;
                break;
            } else if (seq.type == 'unordered' &&
                       (char == '*' || char == '-' || char == '+')) {
                head = char;
                headEnding = i + 1;
                break;
            }
        }

        let listItemContext: string = str.substring(headEnding);
        let checked: 'checked' | 'unchecked' | false = false;
        let checkEnding: number = headEnding;

        for (let i: number = 0; i < listItemContext.length; i++) {
            if (listItemContext[i] != ' ' && listItemContext[i] != '\n') {
                if ((listItemContext[i - 1] && listItemContext[i - 1] != ' ') || 
                    (listItemContext[i + 3] && listItemContext[i + 3] != ' ')) {
                    break;
                }

                if (listItemContext[i] == '[' && listItemContext[i + 1] == ' ' && listItemContext[i + 2] == ']') {
                    checked = 'unchecked';
                    checkEnding = i + 3;
                }

                if (listItemContext[i] == '[' && listItemContext[i + 1] == 'x' && listItemContext[i + 2] == ']') {
                    checked = 'checked';
                    checkEnding = i + 3;
                }

                break;
            }
        }

        let ctx: string = checked ? listItemContext.substring(checkEnding) : listItemContext;

        return { head, context: `${' '.repeat(seq.fullindent)}${ctx}`, checked }
    }

    public static extract(seqs: t_listMatch[], context: string): t_listExtractRes {
        let refMap: Map<string, t_refUrlTitlePair> = new Map();
        let reflinks: t_reflink[] = [];

        let start: string | null = null;
        let type: 'ol' | 'ul' = seqs[0].type == 'ordered' ? 'ol' : 'ul';

        let list: Element = new Element(type);

        for (let i: number = 0; i < seqs.length; i++) {
            let listPieces: t_extractListItemRes = this.extractListItem(seqs[i], context);

            if (type == 'ol' && !start) {
                start = listPieces.head;
                list.attributes = [ { key: 'start', value: start } ];
            }

            let listContextParser: Parser = new Parser(listPieces.context, seqs[i].fullindent);
            let listContext: Element = listContextParser.parse(false, false);

            let listRefMap: Map<string, t_refUrlTitlePair> = listContextParser.getRefMap();
            listRefMap.forEach((value: t_refUrlTitlePair, key: string ) => {
                if (!refMap.get(key)) refMap.set(key, value);
            });

            reflinks.push(...listContextParser.getReflinks());

            let li: Element = new Element('li');

            if (listPieces.checked) {
                let checked: string = listPieces.checked == 'checked' ? `checked='true'` : '';
                let checkbox: Element = new Element('', [], `<input disabled type='checkbox' ${checked}>`);
                li.appendChild(checkbox);
            }

            li.appendChild(listContext);

            list.appendChild(li);
        }

        return { el: list, refMap, reflinks }
    }
}
