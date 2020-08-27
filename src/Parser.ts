import Element, { t_attribute } from './Element'

let parse = (buffer: string): Element[] => {
    /**
     * types 
     */
    type t_operations               = { [key: string]: Function };
    type t_seqs                     = { [key: string]: string[][] };
    type t_textAlign                = { align: 'left' | 'right' | 'center' };
    /**
     * t_tableMatchResult              checkResult, rowsRange, columnCount, textAligns
     */
    type t_tableMatchResult         = [ boolean, number, number, t_textAlign[] | null ];
    type t_extractFixesResult       = { source: string, left: boolean, right: boolean };
    /**
     * t_operateInlineResult          Element, idx
     */
    type t_operateInlineResult      = [ Element | null, number ];
    type t_spottedSeq               = { idx: number, len: number };

    type t_reflink                  = { key: string, url: string, title: string };
    //type t_reflinkel                = { key: string, elIdx: number };

    /**
     * variables
     */
    let elements: Element[]         = [];
    let paragraphs: string[]        = buffer.split('\n\n');
    let textBuffer: string          = '';
    /**
     * string: refkey
     * obj: url, title
     */
    let refMap: Map<string, { url: string, title: string }> = new Map();
    //let refsEl: t_reflinkel[]         = [];

    let paragraphElBuffer: Element;

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

    let getBetween = (opening: t_spottedSeq, closing: t_spottedSeq, text: string) => (
        text.substring(opening.idx + opening.len, closing.idx)
    );

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

        return spottedSeqs.length == seq.length ?
            spottedSeqs :
            false;
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
     * get a type arg and execute related match function 
     * and return result if it is available in matchTable
     */
    let match = (type: string): Function | null => {
        let resolveSeqs = (seqs: string[][], start: number, str: string, terminators: string[] = []): t_spottedSeq[] | false => {
            for (let i: number = 0; i < seqs.length; i++) {
                let checkSeqRes: t_spottedSeq[] | false = checkSeq(seqs[i], start, str, terminators);

                if (checkSeqRes) {
                    return checkSeqRes;
                }
            }

            return false;
        }

        let isThisTitle = (title: string): boolean => {
            if (title.length > 0 &&
                ((title[0] != '"' || title[title.length - 1] != '"')  &&
                (title[0] != '\'' || title[title.length - 1] != '\''))) {
                return false;
            }

            return true;
        }

        let operations: t_operations = {
            'emphasis': (type: string, start: number, str: string): t_spottedSeq[] | false => {
                let sequences: { [key: string]: t_seqs } = {
                    'bold': {
                        '_': [ ['__', '__'] ],
                        '*': [ ['**', '**'] ] 
                    },

                    'italic': {
                        '_': [ ['_', '_'] ],
                        '*': [ ['*', '*'] ]
                    },

                    'scratch': {
                        '~': [ ['~~', '~~'] ]
                    }
                }

                if (!sequences.hasOwnProperty(type)) return false;

                let seqs: string[][] = sequences[type][str[start]];
                let spottedSeqs: t_spottedSeq[] | false = resolveSeqs(seqs, start, str);

                if (!spottedSeqs) return false;

                let inlineText: string = getBetween(spottedSeqs[0], spottedSeqs[1], str);

                if (inlineText[0] == ' ' || inlineText[1] == ' ') return false;

                return spottedSeqs;
            },

            'link': (start: number, str: string): t_spottedSeq[] | false => {
                let sequences: t_seqs = {
                    '[': [ [ '[', '](', ')' ] ]
                }

                let seqs: string[][] = sequences[str[start]];
                let spottedSeqs: t_spottedSeq[] | false = resolveSeqs(seqs, start, str);

                if (!spottedSeqs) return false;
                
                let urlParts: string = getBetween(spottedSeqs[1], spottedSeqs[2], str);
                let urlPieces: string[] = urlParts.trim().split(' ');
                let url: string = urlPieces[0];
                let title: string = urlPieces.slice(1).join(' ').trim();

                if (url.indexOf('\n') != -1) {
                    return false;
                }

                if (!isThisTitle(title)) return false;

                return spottedSeqs;
            },

            'ref': (start: number, str: string): t_spottedSeq[] | false => {
                /**
                 * check we are at the beginning of the paragraph
                 */
                let backwardScanIdx: number = start - 1;

                while (backwardScanIdx > 0) {
                    if (str[backwardScanIdx] != ' ' && str[backwardScanIdx] != '\n' ) {
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
                    let spottedSeqs: t_spottedSeq[] | false = resolveSeqs(seqs, scanIdx, str);

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

                    if (!isThisTitle(title)) return false;

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
            },

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
                    } = extractFixes(str.trim(), ':');
                    let isValid: boolean = isConsistOf(source.trim(), '-');

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
            'emphasis': (type: string, opening: t_spottedSeq, closing: t_spottedSeq, text: string): Element => {
                let inlineText: string = getBetween(opening, closing, text);
                let el: Element = new Element(type);

                /**
                 * we apply inline operation recursively for the inlineText of the pattern 
                 * in order to get sub combined emphasises 
                 */
                let elInline: Element = inline(inlineText);

                el.appendChild(elInline);

                return el;
            },

            'link': (seq: t_spottedSeq[], text: string): Element => {
                let textPart: string = getBetween(seq[0], seq[1], text);

                let urlParts: string = getBetween(seq[1], seq[2], text);
                let urlPieces: string[] = urlParts.trim().split(' ');
                let url: string = urlPieces[0];
                let title: string = urlPieces.slice(1).join(' ').trim();
                title = title.substring(1, title.length - 1);

                let attributes: t_attribute[] = [];

                attributes.push({ key: 'href', value: url });
                
                if (title.length > 0) {
                    attributes.push({ key: 'title', value: title });
                }

                let a: Element = new Element('a', attributes, textPart);

                return a;
            },

            'ref': (seq: t_spottedSeq[], text: string): t_reflink[] => {
                let reflinks: t_reflink[] = [];

                for (let i: number = 0; i < seq.length; i += 2) {
                    let refStrPieces: string[] = text.substring(seq[i].idx, seq[i+1].idx).split(':');
                    let key: string = refStrPieces[0].substring(1, refStrPieces[0].length - 1).trim();

                    let urlPieces: string[] = refStrPieces.slice(1).join(':').trim().split(' ');
                    let url: string = urlPieces[0].trim();
                    let title: string = urlPieces.slice(1).join(' ').trim();
                    title = title.substring(1, title.length - 1);

                    reflinks.push({ key, url, title });
                }

                return reflinks;
            },

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
                    let textAlign: t_textAlign = textAligns[i];
                    let attributes: t_attribute[] = [];

                    if (textAlign.align != 'left') {
                        attributes.push({ key: 'align', value: textAlign.align });
                    }

                    let th: Element = new Element('th', attributes, text);

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

    /**
     * looking for a pattern beginning and then if a pattern beginning can be found
     * match and extract operations will be applied
     *
     * @char: current char of text
     *
     * @idx: current idx of text
     *
     * @text: the text that match and extract operations will be applied on
     */
    let operateInline = (char: string, idx: number, text: string): t_operateInlineResult | false => {
        switch(char) {
            case '_':
            case '*': {
                if ((char == '*' && text[idx + 1] == '*') ||
                    (char == '_' && text[idx + 1] == '_')) {
                    let matchFn = match('emphasis');
                    if (!matchFn) return false;

                    let matchRes: t_spottedSeq[] | false = matchFn('bold', idx, text);
                    if (!matchRes) return false;

                    let extractFn = extract('emphasis');
                    if (!extractFn) return false;

                    let strong: Element = extractFn('strong', matchRes[0], matchRes[1], text);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ strong, patternEnding.idx + patternEnding.len ];
                } else {
                    let matchFn = match('emphasis');
                    if (!matchFn) return false;

                    let matchRes: t_spottedSeq[] | false = matchFn('italic', idx, text);
                    if (!matchRes) return false;

                    let extractFn = extract('emphasis');
                    if (!extractFn) return false;

                    let em: Element = extractFn('em', matchRes[0], matchRes[1], text);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ em, patternEnding.idx + patternEnding.len ];
                }
            }

            case '~': {
                if (text[idx + 1] == '~') {
                    let matchFn = match('emphasis');
                    if (!matchFn) return false;

                    let matchRes: t_spottedSeq[] | false = matchFn('scratch', idx, text);
                    if (!matchRes) return false;

                    let extractFn = extract('emphasis');
                    if (!extractFn) return false;

                    let del: Element = extractFn('del', matchRes[0], matchRes[1], text);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ del, patternEnding.idx + patternEnding.len ];
                }
            } break;

            case '[': {
                let matchFn;
                let matchRes: t_spottedSeq[] | false;
                let extractFn;

                matchFn = match('link');
                if (!matchFn) return false;

                matchRes = matchFn(idx, text);

                if (matchRes) {
                    extractFn = extract('link');
                    if (!extractFn) return false;

                    let a: Element = extractFn(matchRes, text);
                    
                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ a, patternEnding.idx + patternEnding.len ]
                }

                matchFn = match('ref');
                if (!matchFn) return false;

                matchRes = matchFn(idx, text);

                if (matchRes) {
                    extractFn = extract('ref');
                    if (!extractFn) return false;

                    let refs: t_reflink[] = extractFn(matchRes, text);

                    for (let i: number = 0; i < refs.length; i++) {
                        let { key, url, title } = refs[i];

                        if (!refMap.get(key)) {
                            refMap.set(key, { url, title });
                        }
                    }

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];
                    console.log(refMap);
                    return [ null, patternEnding.idx ];
                }

                return false;
            }
        }

        return false;
    }

    /**
     * parsing
     */

    /**
     * all inline match and extract operations are being applied recursively.
     * if there is an emphasis pattern opRes will return an Element that contains all combined
     * sub emphasises. If we have an element we append it to inlineEl and set idx to the next of the
     * pattern. If opRes returned false we just store the char at inlineTextBuffer and increate the idx.
     */
    let inline = (text: string): Element => {
        let idx: number = 0;
        let inlineTextBuffer: string = '';
        let inlineEl: Element = new Element('');

        while (idx < text.length) {
            let opRes: t_operateInlineResult | false = operateInline(text[idx], idx, text);
            if (opRes) {
                inlineEl.appendChild(new Element('', [], inlineTextBuffer));
                inlineTextBuffer = '';

                let [ el, ridx ] = opRes;
                if (el) inlineEl.appendChild(el);
                idx = ridx;
                continue;
            }

            inlineTextBuffer += text[idx];
            idx++;
        }

        inlineEl.appendChild(new Element('', [], inlineTextBuffer));
        return inlineEl;
    }

    let pushTextEl = (): void => {
        paragraphElBuffer.appendChild(inline(textBuffer));
        textBuffer = '';
    }

    while (curParIdx < paragraphs.length) {
        let curPar: string = paragraphs[curParIdx];
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
