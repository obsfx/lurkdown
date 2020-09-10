import Element, { t_attribute } from './Element'

let parse = (buffer: string): Element[] => {
    /**
     * types 
     */
    type t_operations = { [key: string]: Function };
    //type t_seqs = { [key: string]: string[][] };
    //type t_textAlign = { align: 'left' | 'right' | 'center' };
    /**
     * t_tableMatchResult               checkResult, rowsRange, columnCount, textAligns
     */
    //type t_tableMatchResult = [ boolean, number, number, t_textAlign[] | null ];
    /**
     * t_orderedListItemMatchResult     spottedSeqs, outerindent, innerindent, head
     */
    type t_orderedListItemMatchResult = [ t_spottedSeq[], number, number, number ];
    /**
     * t_unOrderedListItemMatchResult     spottedSeqs, outerindent, innerindent
     */
    type t_unOrderedListItemMatchResult = [ t_spottedSeq[], number, number ];
    //type t_extractFixesResult = { source: string, left: boolean, right: boolean };
    /**
     * t_operateInlineResult            Element, idx
     */
    //type t_operateResult = [ Element | null, number ];
    //type t_spottedSeq = { idx: number, len: number };

    //type t_reflink = { key: string, url: string, title: string };
    //type t_reflinkSpec = { elid: string, key: string, keyEl: Element, strEl: Element | null };

    /**
     * variables
     */
    let elements: Element[] = [];
    let idx: number = 0;
    let textBuffer: string = '';
    let conBuffer: Element; 
    let curOuterIndent: number = 0;
    let indentScanning: boolean = true;

    /**
     * string: refkey
     * obj: url, title
     */
    let refMap: Map<string, { url: string, title: string }> = new Map();
    let refsEl: t_reflinkSpec[] = [];

    let lineStartIdxs: number[] = getLineStartIdxs(buffer);
    let curLineIdx: number = 0;

    /**
     * gets the char and executes related operate fn on 
     * the current paragraphs
     */

    let operate = (char: string, idx: number): t_operateResult | false => {
        switch (char) {
            case '\n': {
                curLineIdx++;
                return false;
            }

            case '|': {
                let matchFn: Function = match('table');

                let [ matchRes, rowRange, columnCount, textAligns ] = matchFn();
                if (!matchRes) return false;

                let extractFn: Function = extract('table');
                let table: Element = extractFn(rowRange, columnCount, textAligns || []);

                let rowStartLineIdx: number = curLineIdx + rowRange + 2;
                let nextStartingIdx: number = rowStartLineIdx < lineStartIdxs.length ?
                    lineStartIdxs[rowStartLineIdx] :
                    buffer.length;

                //if (rowRange == 0 && rowStartIdx < lineStartIdxs[curParIdx].length) {
                //    nextStartingIdx = lineStartIdxs[curParIdx][rowStartIdx];
                //} else if (rowStartIdx + rowRange < lineStartIdxs[curParIdx].length) {
                //    nextStartingIdx = lineStartIdxs[curParIdx][rowStartIdx + rowRange];
                //}

                conBuffer.childs.pop();
                return [ table, nextStartingIdx ];
            }

            case '=': {
                let matchFn: Function = match('alternativeheader');
                let res = matchFn('=');

                if (!res) return false;

                let [ nextStart ] = res;
                let h1: Element = new Element('h1');

                return [ h1, nextStart.idx ]
            };

            case '-': {
                let matchFn: Function;
                let res;

                matchFn = match('unorderedlistitem');
                res = matchFn(idx, buffer);

                if (res) {
                    let [ matchRes, outerindent, innerindent ] = res;

                    let extractFn: Function = extract('listitem');
                    let li: Element = extractFn(matchRes, context, outerindent, innerindent);

                    pushLi(li, 0, outerindent, innerindent, 'ul', paragraphRef);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ null, patternEnding.idx ];
                }

                matchFn = match('alternativeheader');
                res = matchFn('-');

                if (res) {
                    let [ nextStart ] = res;
                    let h2: Element = new Element('h2');

                    return [ h2, nextStart.idx ];
                }

            } break;

            case '*':
            case '+': {
                let matchFn: Function = match('unorderedlistitem');

                let res: t_unOrderedListItemMatchResult | false = matchFn(idx, context);
                if (!res) return false;

                let [ matchRes, outerindent, innerindent ] = res;

                let extractFn: Function = extract('listitem');
                let li: Element = extractFn(matchRes, context, outerindent, innerindent);

                pushLi(li, 0, outerindent, innerindent, 'ul', paragraphRef);

                let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                return [ null, patternEnding.idx ];
            };

            default: {
                if (Number.isInteger(parseInt(char))) {
                    let matchFn: Function = match('orderedlistitem');

                    let res = matchFn(idx, context);
                    if (!res) return false;

                    let [ matchRes, outerindent, innerindent, head ] = res;

                    let extractFn: Function = extract('listitem');
                    let li: Element = extractFn(matchRes, context, outerindent, innerindent);

                    pushLi(li, head, outerindent, innerindent, 'ol', paragraphRef);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ null, patternEnding.idx ];
                }
            } break;
        }

        return false;
    }

    /**
     * main parsing loop
     */
    let pushTextBuffer = (tag: string = ''): void => {
        if (textBuffer != '') {
            let el: Element = inline(textBuffer.trim(), tag);
            textBuffer = '';

            if (el.tag != '' || el.context != '' || el.childs.length != 0) {
                conBuffer.appendChild(el);
            }
        }
    }

    conBuffer = getConBuffer();

    while (idx < buffer.length) {
        let char: string = buffer[idx];

        if (indentScanning) {
            if (char != ' ' && char != '\n') {
                indentScanning = false;
            } else if (char == '\n') {
                curOuterIndent = 0;
                indentScanning = true;
            } else {
                curOuterIndent++;
            } 
        }

        let opRes: t_operateResult | false = operate(char, idx, buffer);

        if (opRes) {
            let [ el, ridx ] = opRes;
            let tag: string = '';

            idx = ridx;

            if (el) {
                if (el.tag == 'h1' || el.tag == 'h2') {
                    tag = el.tag;
                    pushTextBuffer(tag);
                } else {
                    conBuffer.appendChild(el);
                }
            }
        } else {
            textBuffer += char;
            idx++;
        }

        if (isBlankLine(idx, buffer) && conBuffer.childs.length != 0) {
            pushTextBuffer();
            curLineIdx += 2;
            idx = lineStartIdxs[curLineIdx];
            elements.push(conBuffer);
            conBuffer = getConBuffer();
        }
    }

    /**
     * resolve reflinks
     */
    let resolveRefLink = (el: Element, reflinkel: t_reflinkSpec): boolean => {
        let ref: { url: string, title: string } | undefined = refMap.get(reflinkel.key);

        if (el.id == reflinkel.elid && ref) {
            el.tag = 'a';
            el.childs = [ reflinkel.strEl || reflinkel.keyEl ];
            el.attributes = [ 
                { key: 'href', value: ref.url }, 
                { key: 'title', value: ref.title } 
            ];

            return true;
        }

        for (let i: number = 0; i < el.childs.length; i++) {
            let childEl: Element = el.childs[i];

            if (resolveRefLink(childEl, reflinkel)) return true;
        }

        return false;
    }

    for (let i: number = 0; i < refsEl.length; i++) {
        let refel: t_reflinkSpec = refsEl[i];

        for (let j: number = 0; j < elements.length; j++) {
            let el: Element = elements[j];
            resolveRefLink(el, refel);
        }
    }

    let temp: string = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
            <meta charset="utf-8" />
            <meta http-equiv="x-ua-compatible" content="ie=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title></title>
        </head>
        <body>
            {BODY}
        </body>
    </html>
    `

    let htmlcode: string = elements.reduce((prev: string, current: Element) => prev += current.emitHtml(), '')

    console.log(temp.replace('{BODY}', htmlcode));
    //console.log(listBuffer);
    return elements;
}

export default parse;
