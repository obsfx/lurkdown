import Element, { t_attribute }from './Element'

let parse = (buffer: string): Element[] => {
    /**
     * types 
     */

    /**
     * t_checkResult                  checkResult, patternStart, patternEnd, matchCount
     */
    type t_checkResult              = [ boolean, number, number, number ];
    type t_operations               = { [key: string]: Function };

    type t_matchType                = null | 
        'LINK' | 'LINK_W_TITLE' | 
        'TABLE_HEAD';

    type t_matchRule                = { type: t_matchType, rule: string[] };
    /**
     * t_matchResult                  checkResult, mathRule.type, patternStart, patternEnd, matchCount
     */
    type t_matchResult              = [ boolean, t_matchType, number, number, number ];
    /**
     * t_pipeMatchResult              checkResult, rowsRange, columnCount
     */
    type t_textAlign                = { align: 'left' | 'right' | 'center' };
    type t_pipeMatchResult          = [ boolean, number, number, t_textAlign[] | null ];
    type t_extractFixesResult       = { source: string, left: boolean, right: boolean };

    /**
     * variables
     */
    let elements: Element[]         = [];
    let paragraphs: string[]        = buffer.split('\n\n');

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

    /**
     * creates proper rule check fn by looking the firs char of rule string
     *
     * @rule: string
     *      ! -> not equal
     *      , -> seperates multiple chars
     *      
     *       example:
     *           '[,#' true if the char is equal to [ or # char
     *           '! ,\n' true if the char is NOT equal to whitespace or newline
     */
    let createRuleFn = (rule: string): Function => {
        if (rule[0] == '!') {
            return (source: string, idx: number): boolean => (
                rule.slice(1)
                .split(',')
                .filter((c: string) => (
                    c != source.substring(idx, idx + c.length)
                )).length > 0 ? true : false
            )
        } else {
            return (source: string, idx: number): boolean => (
                rule.split(',')
                .filter((
                    (c: string) => c == source.substring(idx, idx + c.length)
                )).length > 0 ? true : false
            );
        }
    }

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
    let check = (ruleList: string[], start: number, terminators: string[] = []): t_checkResult => {
        let curPar: string = paragraphs[curParIdx];
        let idx: number = start;

        let ruleIdx: number = 0;
        let firstTimeMatched: boolean = false;
        let matchCount: number = 0;

        let patternStart: number = -1;
        let patternEnd: number = -1;

        let getRuleFn = (): Function | null => {
            let rule: string | undefined = ruleList[ruleIdx];
            if (!rule) return null;

            return createRuleFn(rule);
        } 

        let ruleCheck: Function | null = getRuleFn();
        if (!ruleCheck) return [ false, patternStart, patternEnd, matchCount ];

        while (idx < curPar.length) {
            if (terminators.indexOf(curPar[idx]) > -1) {
                return [ false, patternStart, patternStart, matchCount]
            }

            if (ruleCheck(curPar, idx)) {
                if (!firstTimeMatched) {
                    patternStart = idx;
                    firstTimeMatched = true;
                } 

                if (ruleIdx == ruleList.length - 1) {
                    patternEnd = idx;
                    matchCount++;
                }

                ruleIdx = ++ruleIdx % ruleList.length;
                ruleCheck = getRuleFn();

                if (!ruleCheck) {
                    break;
                }
            }

            idx++;
        }

        /**
         * if ruleList is empty it means all rules are matched
         */
        return matchCount > 0 ? 
            [ true, patternStart, patternEnd, matchCount ] : 
            [ false, patternStart, patternEnd, matchCount ];
    }

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
    let match = (char: string): t_matchResult | t_pipeMatchResult => {
        let resolveMatchRules = (matchRules: t_matchRule[], start: number): t_matchResult => {
            for (let i: number = 0; i < matchRules.length; i++) {
                let matchRule: t_matchRule = matchRules[i];

                let [ checkRes, patternStart, patternEnd, matchCount ] = check(matchRule.rule, start);

                if (checkRes) {
                    return [ true, matchRule.type, patternStart, patternEnd , matchCount ];
                }
            }

            return [ false, null, -1, -1, 0 ];
        }

        let matchTable: t_operations = {
            '[': (): t_matchResult => {
                /**
                 * matchRules array must be ordered by precedence
                 */
                let matchRules: t_matchRule[] = [
                    { type: 'LINK_W_TITLE', rule: ['[', '! ', ']', '(', '! ', ' ', '"', '"', ')'] },
                    { type: 'LINK', rule: ['[', '! ', ']', '(', ')'] }
                ];

                return resolveMatchRules(matchRules, index);
            },

            '|': (): t_pipeMatchResult => {
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

        return matchTable.hasOwnProperty(char) ?
            matchTable[char]() :
            [ false, null, -1, -1, 0 ];
    }

    let extract = (elementName: string): Function | null => {
        let operations: t_operations = {
                'table': (rowRange: number, columnCount: number, textAligns: t_textAlign[]) => {
                let table: Element = new Element('table');
                let headtr: Element = new Element('tr');

                let headstr: string = getLine(lineStartIdxs[curParIdx][curLineIdx]);
                headstr = extractFixes(headstr, '|').source;

                let headFields: string[] = headstr.split('|');
                
                for (let i: number = 0; i < columnCount; i++) {
                    let text: string = headFields[i] || '';
                    let th: Element = new Element('th', [], text);

                    headtr.appendChild(th);
                }

                table.appendChild(headtr);
                
                if (rowRange == 0) {
                    if (curLineIdx + 2 < lineStartIdxs[curParIdx].length) {
                        index = lineStartIdxs[curParIdx][curLineIdx + 2];
                    } else {
                        index = paragraphs[curParIdx].length;
                    }

                    return;
                }

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

                    table.appendChild(tr);
                }
                console.log(table.emitHtml());
                elements.push(table);

                if (rowIdx + rowRange < lineStartIdxs[curParIdx].length) {
                    index = lineStartIdxs[curParIdx][rowIdx + rowRange];
                } else {
                    index = paragraphs[curParIdx].length;
                }
            }
        }

        return operations.hasOwnProperty(elementName) ?
            operations[elementName] :
            null;
    }

    /**
     * gets the char and executes related operate fn
     */
    let operate = (char: string): void => {
        let operations: t_operations = {
            '\n': () => {
                curLineIdx++;
            },

            '|': () => {
                let [ matchRes, rowRange, columnCount, textAligns ] = match('|');
                if (!matchRes) return;

                let extractFn = extract('table');
                if (!extractFn) return;

                extractFn(rowRange, columnCount, textAligns || []);
            },

            '[': () => {
                match('[');
            }
        }       

        if (operations.hasOwnProperty(char)) {
            operations[char]();
        } 
    }

    /**
     * parsing
     */
    while (curParIdx < paragraphs.length) {
        let curPar: string = paragraphs[curParIdx];

        while (index < paragraphs[curParIdx].length) {
            let char: string = curPar[index];
            operate(char);
            index++;
        }

        index = 0;
        curLineIdx = 0;
        curParIdx++;
    }

   // let t = check(['[', '! ', ']', '(', '! ', ' ', '"', '"', ')'], index);
   // console.log(t);
    return elements;
}

export default parse;
