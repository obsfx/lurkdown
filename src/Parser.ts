import Element, { t_attribute }from './Element'

let parse = (buffer: string): Element[] => {
    /**
     * types 
     */

    type t_operations               = { [key: string]: Function };
    /**
     * t_ruleCheckResult             result, nextidx
     */
    //type t_ruleCheckResult          = [ boolean, number ];
    /**
     * t_matchResult                  checkResult, mathRule.type, patternStart, patternEnd, matchCount
     */
    type t_textAlign                = { align: 'left' | 'right' | 'center' };
    /**
     * t_tableMatchResult              checkResult, rowsRange, columnCount, textAligns
     */
    type t_tableMatchResult         = [ boolean, number, number, t_textAlign[] | null ];
    type t_extractFixesResult       = { source: string, left: boolean, right: boolean };
    /**
     * t_getBetweenResult             string, strstart, strend
     */
    type t_getBetweenResult         = [ string, number, number ];
    /**
     * t_operateInlineResult          Element, idx
     */
    type t_operateInlineResult      = [ Element, number ];
    type t_seqType                  = null | 'BOLD';
    type t_seqRule                  = { type: t_seqType, seq: string[] };
    type t_spottedSeq               = { idx: number, len: number };
    type t_seqResult                = { type: t_seqType, spottedSeqs: t_spottedSeq[] }
    type t_matchResult              = { pStart: number, pEnd: number };

    /**
     * variables
     */
    let elements: Element[]         = [];
    let paragraphs: string[]        = buffer.split('\n\n');
    let textBuffer: string          = '';

    let paragraphElBuffer: Element;
    //let textElBuffer: Element;

    let getLineStartIdxs = (paragraphs: string[]): number[][] => {
        let arr: number[][] = [];

        for (let i: number = 0; i < paragraphs.length; i++) {
            arr.push([]);
            arr[i].push(0);

            for (let j: number = 0; j < paragraphs[i].length; j++) {
                if (paragraphs[i][j] == '\n') {
                    arr[i].push(j + 1);
                }
            }
        }

        return arr;
    }

    let lineStartIdxs: number[][]   = getLineStartIdxs(paragraphs);
    let curLineIdx: number          = 0;

    /**
     * curParIdx: current paragraph index
     * index: index that is used at inside of paragraph
     */
    let curParIdx: number           = 0;
    let index: number               = 0;

    //let peek = (padding: number = 0): string | null => curParIdx < paragraphs.length ?
    //   index < paragraphs[curParIdx].length ? paragraphs[curParIdx][index + padding] : null :
    //   null;

    /**
     * helper functions
     */
    let ccount = (source: string, char: string): number => source.split('').filter((c: string) => c == char).length;

    let getLine = (start: number): string => {
        let str: string = '';

        let curPar: string = paragraphs[curParIdx];
        let idx: number = start;

        while (idx < curPar.length && curPar[idx] != '\n') {
            str += curPar[idx];
            idx++;
        }

        return str;
    }

    let getBetween = (opening: string, closing: string, start: number, text: string): t_getBetweenResult => {
        let idx: number = start;
        let str: string = '';
        let strstart: number = -1;
        let strend: number = -1;
        let scanning: boolean = false;

        while (idx < text.length) {
            if (opening == text.substring(idx, idx + opening.length)) {
                scanning = true;
                strstart = idx + opening.length;
                idx = idx + opening.length;
                continue;
            }

            if (closing == text.substring(idx, idx + opening.length)) {
                strend = idx - 1;
                return [ str, strstart, strend ]
            }

            if (scanning) {
                str += text[idx];
            }

            idx++;
        }

        return [ str, strstart, strend ];
    }

    let checkSeq = (seq: string[], start: number, text: string, terminators: string[] = []): t_spottedSeq[] | false => {
        if (seq.length == 0) return false;

        let idx: number = start;
        let seqIdx: number = 0;
        let spottedSeqs: t_spottedSeq[] = [];

        while (idx < text.length && seqIdx < seq.length) {
            if (terminators.indexOf(seq[seqIdx]) > -1) return false;

            if (seq[seqIdx] == text.substring(idx, idx + seq[seqIdx].length)) {
                spottedSeqs.push({ idx: idx, len: seq[seqIdx].length });
                idx = idx + seq[seqIdx].length;
                seqIdx++;
                continue;
            }

            idx++;
        }

        return spottedSeqs.length > 0 ?
            spottedSeqs :
            false;
    }

    /**
     * creates proper rule check fn by looking the firs char of rule string
     *
     * @rule: string
     *      N -> not equal
     *      , -> seperates multiple chars
     *      F -> followed by
     *      
     *       example:
     *           '[,#' true if the char is equal to [ or # char
     *           'N ,\n' true if the char is NOT equal to whitespace and newline
     *           'F**\/N ' true if the ** rule is followed by a not whitespace char rule
     */
    //let createRuleFn = (rule: string): Function => {
    //    switch(rule[0]) {
    //        case 'F': {
    //            return (source: string, idx: number): t_ruleCheckResult => {
    //                let rules: string[] = rule.slice(1).split('/');
    //                let startIdx: number = idx;
    //                let resultIdx: number = idx;

    //                for (let i: number = 0; i < rules.length; i++) {
    //                    let seq: string = rules[i];

    //                    let ruleFn = createRuleFn(seq);
    //                    let [ checkRes, nextIdx ] = ruleFn(source, startIdx);
    //                    console.log(checkRes, nextIdx);

    //                    if (!checkRes) {
    //                        return [ false, -1 ];
    //                    }

    //                    if (i < rules.length - 2) {
    //                        startIdx = nextIdx;
    //                    } 

    //                    resultIdx = nextIdx;
    //                }

    //                return [ true, resultIdx ];
    //            }
    //        }

    //        case 'N': {
    //            return (source: string, idx: number): t_ruleCheckResult => {
    //                let rules: string[] = rule.slice(1).split(',');

    //                for (let i: number = 0; i < rules.length; i++) {
    //                    let seq: string = rules[i];

    //                    if (seq == source.substring(idx, idx + seq.length)) {
    //                        return [ false, -1 ];
    //                    }
    //                }

    //                return [ true, idx + rules[0].length ];
    //            }
    //        }

    //        default: {
    //            return (source: string, idx: number): t_ruleCheckResult => {
    //                let rules: string[] = rule.split(',');

    //                for (let i: number = 0; i < rules.length; i++) {
    //                    let seq: string = rules[i];

    //                    if (seq == source.substring(idx, idx + seq.length)) {
    //                        return [ true, idx + seq.length ]
    //                    }
    //                }

    //                return [ false, -1 ]
    //            }
    //        }
    //    }
    //}

    /**
     * checks whether ruleList is matching until the end of the paragraphs or 
     * come across with terminator char
     *
     * @ruleList: string[]
     *      contains rule list defined sequentially
     *      example:
     *          ['[', '! ', ']', '(', ')']
     *
     * @start: number
     *      starting index
     *
     * @terminators: string[]
     *     contains chars that will cause an immediate false return 
     */
    //let check = (ruleList: string[], start: number, terminators: string[] = [], str: string | null = null): t_match[] => {
    //    let curPar: string = str || paragraphs[curParIdx];
    //    let idx: number = start;

    //    let ruleIdx: number = 0;
    //    let scanning: boolean = false;

    //    let matchBuffer: t_match = { pStart: -1, pEnd: -1 };
    //    let matchs: t_match[] = [];

    //    if (ruleList.length == 0) {
    //        return matchs;
    //    }

    //    let getRuleFn = (): Function => createRuleFn(ruleList[ruleIdx]);

    //    let ruleCheck: Function = getRuleFn();

    //    while (idx < curPar.length) {
    //        if (terminators.indexOf(curPar[idx]) > -1) {
    //            return matchs;
    //        }

    //        let [ checkRes, nextIdx ] = ruleCheck(curPar, idx);

    //        if (checkRes) {
    //            if (!scanning) {
    //                matchBuffer.pStart = idx;
    //                scanning = true;
    //            } 

    //            if (ruleIdx == ruleList.length - 1) {
    //                matchBuffer.pEnd = nextIdx - 1;
    //                matchs.push(matchBuffer);
    //            }

    //            ruleIdx = ++ruleIdx % ruleList.length;
    //            ruleCheck = getRuleFn();

    //            idx = nextIdx;
    //        } else {
    //            idx++;
    //        }
    //    }

    //    return matchs; 
    //}

    /**
     * remove the given char from the given source string if it exist as a prefix or suffix
     * and return modified string and whether is the char was founded as prefix or suffix
     */
    let extractFixes = (source: string, char: string): t_extractFixesResult => {
        let left: boolean = false;
        let right: boolean = false;

        if (source[0] == char) {
            source = source.substring(1);
            left = true;
        }

        if (source[source.length - 1] == char) {
            source = source.substring(0, source.length - 1);
            right = true;
        }

        return { source, left, right }
    }

    /**
     * gets a char arg and executes related match function 
     * and return result if it is available in matchTable
     */
    let match = (type: string): Function | null => {
        let resolveSeqs = (seqs: t_seqRule[], start: number, str: string, terminators: string[] = []): t_seqResult | false => {
            for (let i: number = 0; i < seqs.length; i++) {
                let checkSeqRes: t_spottedSeq[] | false = checkSeq(seqs[i].seq, start, str, terminators);

                if (checkSeqRes) {
                    return { type: seqs[i].type, spottedSeqs: checkSeqRes }
                }
            }

            return false;
        }
        /**
         * seqRules array must be ordered by precedence
         */
        let operations: t_operations = {
            'emphasis': (start: number, str: string): t_matchResult => {
                let sequences: t_seqRule[] = [
                    { type: 'BOLD', seq: ['**', '**'] }
                ];

                resolveSeqs(sequences, start, str);
            },
/*
            'link': (start: number, str: string): t_matchResult => {
                let matchRules: t_matchRule[] = [
                    { type: 'LINK_W_TITLE', rule: ['[', '! ', ']', '(', '! ', ' ', '"', '"', ')'] },
                    { type: 'LINK', rule: ['[', '! ', ']', '(', ')'] }
                ];

            },
*/
            'table': (): t_tableMatchResult => {
                /**
                 * if the current line is not following by an another new line
                 * table can not be constructed so just return false
                 */
                if (curLineIdx == paragraphs[curParIdx].length - 1) {
                    return [ false, 0, 0, null ];
                }

                /**
                 * check the given string is consist of given char
                 */
                let isConsistOf = (source: string, char: string): boolean => {
                    let charCount: number = source.split('').filter((c: string) => c == char).length;

                    return charCount > 0 && charCount == source.length ? true : false;
                }

                /**
                 * get the current line string and remove unneccassary outer pipes
                 */
                let line: string = getLine(lineStartIdxs[curParIdx][curLineIdx]);
                line = extractFixes(line, '|').source;

                /**
                 * after removed unneccassary pipes get the inner pipe count
                 * and detect how many columns must be
                 */
                let pipeCount: number = ccount(line, '|');
                let columns: number = pipeCount + 1;

                /**
                 * get the next line string and remove unneccassary outer pipes
                 */
                let nextLine: string = getLine(lineStartIdxs[curParIdx][curLineIdx + 1]);
                nextLine = extractFixes(nextLine, '|').source;

                /**
                 * split and determine the dash pattern is valid then
                 * check the dash patterns contain semicolons and then
                 * return the result
                 */
                type t_nextLineDashesResult = { 
                    semicolons: { left: boolean, right: boolean }, 
                    str: string, 
                    valid: boolean 
                };
                let nextLineDashes: t_nextLineDashesResult[] = nextLine.split('|')
                .map((str: string) => {
                    let {
                        source,
                        left,
                        right
                    } = extractFixes(str, ':');
                    let isValid: boolean = isConsistOf(source, '-');

                    return { semicolons: { left, right }, str: source, valid: isValid }
                });

                /**
                 * if splitted dashes less than column limit
                 * return false
                 */
                if (nextLineDashes.length < columns) {
                    return [ false, 0, 0, null ];
                }

                /**
                 * check the dashes that are in column limit range are valid or not
                 */
                let textAligns: t_textAlign[] = []
                for (let i: number = 0; i < columns; i++) {
                    if (!nextLineDashes[i].valid) {
                        return [ false, 0, 0, null ];
                    }

                    let align: 'left' | 'right' | 'center' = 'left';

                    if (nextLineDashes[i].semicolons.right) align = 'right';
                    if (nextLineDashes[i].semicolons.left && nextLineDashes[i].semicolons.right) align = 'center';

                    textAligns.push({ align });
                }

                /**
                 * starting to check other rows that hold 
                 * the content
                 */
                let rowIdx: number = curLineIdx + 2;
                let rowRange: number = 0;

                while (rowIdx < paragraphs[curLineIdx].length) {
                    let row: string = getLine(lineStartIdxs[curParIdx][rowIdx]);

                    if (ccount(row, '|') == 0) {
                        break;
                    }

                    rowRange++;
                    rowIdx++;
                }

                return [ true, rowRange, columns, textAligns ];
            }
        }

        return operations.hasOwnProperty(type) ? 
            operations[type] :
            null;
    }

    let extract = (elementName: string): Function | null => {
        let operations: t_operations = {
            'table': (rowRange: number, columnCount: number, textAligns: t_textAlign[]): Element | void => {
                let table: Element = new Element('table');
                let thead: Element = new Element('thead');
                let headtr: Element = new Element('tr');

                /**
                 * get the table headers
                 */
                let headstr: string = getLine(lineStartIdxs[curParIdx][curLineIdx]);
                headstr = extractFixes(headstr, '|').source;

                let headFields: string[] = headstr.split('|');
                
                for (let i: number = 0; i < columnCount; i++) {
                    let text: string = headFields[i] || '';
                    let th: Element = new Element('th', [], text);

                    headtr.appendChild(th);
                }

                thead.appendChild(headtr);
                table.appendChild(thead);

                /**
                 * if there is no additional row that is related to our table
                 * forward the index to the next line beginning
                 */
                if (rowRange == 0) {
                    if (curLineIdx + 2 < lineStartIdxs[curParIdx].length) {
                        index = lineStartIdxs[curParIdx][curLineIdx + 2];
                    } else {
                        index = paragraphs[curParIdx].length;
                    }

                    return;
                }

                /**
                 * split the row strings and extract the text to 
                 * element objects
                 */
                let tbody: Element = new Element('tbody');
                let rowIdx: number = curLineIdx + 2;

                for (let i: number = 0; i < rowRange; i++) {
                    let rowstr: string = getLine(lineStartIdxs[curParIdx][rowIdx + i]);
                    rowstr = extractFixes(rowstr, '|').source;

                    let rowFields: string[] = rowstr.split('|');

                    let tr: Element = new Element('tr');

                    for (let j: number = 0; j < columnCount; j++) {
                        let text: string = rowFields[j] || '';
                        let textAlign: t_textAlign = textAligns[j];
                        let attributes: t_attribute[] = [];

                        if (textAlign.align != 'left') {
                            attributes.push({ key: 'align', value: textAlign.align });
                        }

                        let td: Element = new Element('td', attributes, text);
                        tr.appendChild(td);
                    }

                    tbody.appendChild(tr);
                }

                table.appendChild(tbody);

                if (rowIdx + rowRange < lineStartIdxs[curParIdx].length) {
                    index = lineStartIdxs[curParIdx][rowIdx + rowRange];
                } else {
                    index = paragraphs[curParIdx].length;
                }

                return table;
            }
        }

        return operations.hasOwnProperty(elementName) ?
            operations[elementName] :
            null;
    }

    /**
     * gets the char and executes related operate fn
     */
    let operate = (char: string): Element | void => {
        switch (char) {
            case '\n': {
                curLineIdx++;
                textBuffer += '\n';
                return;
            }

            case '|': {
                let matchFn = match('table');
                if (!matchFn) return;

                let [ matchRes, rowRange, columnCount, textAligns ] = matchFn();
                if (!matchRes) return;

                let extractFn = extract('table');
                if (!extractFn) return;
                
                paragraphElBuffer.childs.pop();
                return extractFn(rowRange, columnCount, textAligns || []);
            }

            default: break;
        }
    }

    let operateInline = (char: string, idx: number, text: string): t_operateInlineResult | void => {
        switch(char) {
            case '*': {
                let matchFn = match('emphasis');
                if (!matchFn) return;

                console.log(matchFn(idx, text));
            } break;
        }
    }

    /**
     * parsing
     */
    let inline = (text: string): Element | void => {
        let idx: number = 0;
        //let start: number = 0;
        //textElBuffer = new Element('');

        while (idx < text.length) {
            let char: string = text[idx];
            let opRes: t_operateInlineResult | void = operateInline(char, idx, text);

            if (opRes) {
                //let [ el, ridx ] = opRes;
            }

            idx++;
        }
    }

    let pushTextEl = (): void => {
        inline(textBuffer);
        let textEl: Element = new Element('', [], textBuffer);
        paragraphElBuffer.appendChild(textEl);
        textBuffer = '';
    }

    while (curParIdx < paragraphs.length) {
        let curPar: string = paragraphs[curParIdx];
        getBetween("a", "b", 0);
        paragraphElBuffer = new Element('p');

        while (index < paragraphs[curParIdx].length) {
            let char: string = curPar[index];
            let el: Element | void = operate(char);

            if (el) {
                pushTextEl();
                paragraphElBuffer.appendChild(el);
            } else {
                textBuffer += char;
            }

            index++;
        }

        if (textBuffer != '') {
            pushTextEl();
        }

        elements.push(paragraphElBuffer);

        index = 0;
        curLineIdx = 0;
        curParIdx++;
    }

   // let t = check(['[', '! ', ']', '(', '! ', ' ', '"', '"', ')'], index);
   // console.log(t);
    //

    elements.forEach((e: Element) => console.log(e.emitHtml()));
    return elements;
}

export default parse;
