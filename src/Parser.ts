import Element, { t_attribute } from './Element'

let parse = (buffer: string): Element[] => {
    /**
     * types 
     */
    type t_operations = { [key: string]: Function };
    type t_seqs = { [key: string]: string[][] };
    type t_textAlign = { align: 'left' | 'right' | 'center' };
    /**
     * t_tableMatchResult               checkResult, rowsRange, columnCount, textAligns
     */
    type t_tableMatchResult = [ boolean, number, number, t_textAlign[] | null ];
    /**
     * t_orderedListItemMatchResult     spottedSeqs, outerindent, innerindent, head
     */
    type t_orderedListItemMatchResult = [ t_spottedSeq[], number, number, number ];
    /**
     * t_unOrderedListItemMatchResult     spottedSeqs, outerindent, innerindent
     */
    type t_unOrderedListItemMatchResult = [ t_spottedSeq[], number, number ];
    type t_extractFixesResult = { source: string, left: boolean, right: boolean };
    /**
     * t_operateInlineResult            Element, idx
     */
    type t_operateResult = [ Element | null, number ];
    type t_spottedSeq = { idx: number, len: number };

    type t_reflink = { key: string, url: string, title: string };
    type t_reflinkSpec = { elid: string, key: string, keyEl: Element, strEl: Element | null };

    /**
     * t_findOrCreateListResult         id, subExist
     */
    //type t_findOrCreateListResult = [ string, boolean ];

    /**
     * variables
     */
    let elements: Element[] = [];
    let paragraphs: string[] = buffer.split('\n\n');
    /**
     * string: refkey
     * obj: url, title
     */
    let refMap: Map<string, { url: string, title: string }> = new Map();
    let refsEl: t_reflinkSpec[] = [];

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

    let lineStartIdxs: number[][] = getLineStartIdxs(paragraphs);
    let curLineIdx: number = 0;

    /**
     * curParIdx: current paragraph index
     */
    let curParIdx: number = 0;

    /**
     * list buffering
     */
    let listParentRef: Element | null = null;
    let listBuffer: Element[] = [];

    let pushBuffer = (type: 'ul' | 'ol', start: number, outerindent: number, innerindent: number): void => {
        let list_attributes: t_attribute[] = [];
        if (type == 'ol') list_attributes.push({ key: 'start', value: start.toString() });
        listBuffer.push(new Element(type, list_attributes, '', outerindent, innerindent));
    }

    let pushLi = (
        li: Element, 
        start: number, 
        outerindent: number, 
        innerindent: number, 
        type: 'ul' | 'ol',
        parentRef: Element): void => {

        if (listBuffer.length == 0) {
            pushBuffer(type, start, outerindent, innerindent);
        }

        let lastBuffer: Element = listBuffer[listBuffer.length - 1];

        if (lastBuffer.tag != type && outerindent < lastBuffer.innerindent) {
            pushBuffer(type, start, outerindent, innerindent);
            lastBuffer = listBuffer[listBuffer.length - 1];
        }

        if (!listParentRef) listParentRef = parentRef;

        let listId: string | false = findList(lastBuffer, type, lastBuffer.id, outerindent);

        if (!listId) {
            let li_id: string | false = findListItem(lastBuffer, null, outerindent);

            if (!li_id) throw Error(`pushLi: something went wrong while creating a proper ${type} for li element`);

            let list_attributes: t_attribute[] = [];
            if (type == 'ol') list_attributes.push({ key: 'start', value: start.toString() });

            let listEl: Element = new Element(type, list_attributes, '', outerindent, innerindent);
            listId = listEl.id;

            findAndPushToChild(lastBuffer, listEl, li_id);
        }

        findAndPush(lastBuffer, li, listId);
    }

    let findList = (
        listBufferRef: Element,
        type: 'ul' | 'ol',
        id: string,
        outerindent: number,
    ): string | false => {
        if (outerindent < listBufferRef.innerindent && type == listBufferRef.tag) {
            return id;
        }

        if (outerindent == 6) debugger;

        if (type == listBufferRef.tag) {
            id = listBufferRef.id;
        }

        let lastElIdx: number = -1;
        for (let i: number = 0; i < listBufferRef.childs.length; i++) {
            let child: Element = listBufferRef.childs[i];
            if (child.tag == 'li' || child.tag == 'ul' || child.tag == 'ol') lastElIdx = i;
        }

        if (lastElIdx == -1) {
            if (type == listBufferRef.tag) return id;
            else return false;
        }

        let lastEl: Element = listBufferRef.childs[lastElIdx];

        if (type == lastEl.tag) {
            id = lastEl.id;
        } 

        return findList(lastEl, type, id, outerindent);
    }

    let findAndPush = (listBufferRef: Element, li: Element, id: string): boolean => {
        if (listBufferRef.id == id) {
            listBufferRef.appendChild(li);
            return true;
        }

        for (let i: number = 0; i < listBufferRef.childs.length; i++) {
            let child: Element = listBufferRef.childs[i];

            if (findAndPush(child, li, id)) {
                return true;
            }
        }

        return false;
    }

    let findListItem = (listBufferRef: Element, id: string | null, outerindent: number): string | false => {
        if ((listBufferRef.tag == 'ul' || listBufferRef.tag == 'ol') && outerindent >= listBufferRef.innerindent) {
            id = listBufferRef.id;
        }

        for (let i: number = 0; i < listBufferRef.childs.length; i++) {
            let child: Element = listBufferRef.childs[i];

            if (child.tag == 'li' || child.tag == 'ul' || child.tag == 'ol') {
                id = findListItem(child, id, outerindent) || id;
            }
        }

        return id == null ? false : id;
    }

    let findAndPushToChild = (listBufferRef: Element, par: Element, id: string): boolean => {
        if (id == listBufferRef.id) {
            let lastElIdx: number = 0;

            for (let i: number = 0; i < listBufferRef.childs.length; i++) {
                let child: Element = listBufferRef.childs[i];
                if (child.tag == 'li') lastElIdx = i;
            }

            listBufferRef.childs[lastElIdx].appendChild(par);
            return true;
        }

        for (let i: number = 0; i < listBufferRef.childs.length; i++) {
            let child: Element = listBufferRef.childs[i];

            if (findAndPush(child, par, id)) {
                return true;
            }
        }

        return false;
    }

    let findParentAndPush = (el: Element, targetel: Element, targetid: string): boolean => {
        if (targetel.id == targetid) {
            targetel.appendChild(el);
            return true;
        }

        for (let i: number = 0; i < targetel.childs.length; i++) {
            if (findParentAndPush(el, targetel.childs[i], targetid)) {
                return true;
            }
        }
        
        return false;
    }

    let pushList = (): void => {
        if (listBuffer.length != 0 && listParentRef) {
            listParentRef.childs.push(...listBuffer);
            listBuffer = [];
            listParentRef = null;
        }
    }

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

    let getBetween = (opening: t_spottedSeq, closing: t_spottedSeq, context: string) => (
        context.substring(opening.idx + opening.len, closing.idx)
    );

    let checkSeq = (seq: string[], start: number, context: string, terminators: string[] = []): t_spottedSeq[] | false => {
        if (seq.length == 0) return false;

        let idx: number = start;
        let seqIdx: number = 0;
        let spottedSeqs: t_spottedSeq[] = [];

        while (idx < context.length && seqIdx < seq.length) {
            if (terminators.indexOf(seq[seqIdx]) > -1) return false;

            if (seq[seqIdx] == context.substring(idx, idx + seq[seqIdx].length)) {
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
    let match = (type: string): Function => {
        let resolveSeqs = (seqs: string[][], start: number, str: string, terminators: string[] = []): t_spottedSeq[] | false => {
            for (let i: number = 0; i < seqs.length; i++) {
                let checkSeqRes: t_spottedSeq[] | false = checkSeq(seqs[i], start, str, terminators);

                if (checkSeqRes) {
                    return checkSeqRes;
                }
            }

            return false;
        }

        /**
         * check the given string whether is consist of given char
         */
        let isConsistOf = (source: string, char: string): boolean => {
            let charCount: number = source.split('').filter((c: string) => c == char).length;

            return charCount > 0 && charCount == source.length ? true : false;
        }

        let isThisTitle = (title: string): boolean => {
            if (title.length > 0 &&
                ((title[0] != '"' || title[title.length - 1] != '"')  &&
                (title[0] != '\'' || title[title.length - 1] != '\''))) {
                return false;
            }

            return true;
        }

        let isThisAnOrderedListHead = (idx: number, str: string): [ boolean, number, number ] => {
            let headScanIdx: number = idx;

            while (headScanIdx < str.length && str[headScanIdx] != '.' && str[headScanIdx] != ')') {
                headScanIdx++;
            }

            if (headScanIdx >= str.length - 1 ||
                (str[headScanIdx] != '.' && str[headScanIdx] != ')') ||
                (str[headScanIdx + 1] != ' ' && str[headScanIdx + 1] != '\n')) {
                return [ false, 0, 0 ];
            }

            let wsScanIdx: number = idx - 1;
            let outerindent: number = 0;

            while (wsScanIdx > -1 && str[wsScanIdx] != '\n') {
                let char: string = str[wsScanIdx];

                if (char != ' ') return [ false, 0, 0 ];

                outerindent++;
                wsScanIdx--;
            }

            if (!Number.isInteger(parseInt(str.substring(idx, headScanIdx)))) {
                return [ false, 0, 0 ]
            }

            return [ true, outerindent, parseInt(str.substring(idx, headScanIdx))];
        }

        let isThisAnUnOrderedListHead = (idx: number, str: string): [ boolean, number ] => {
            if (idx >= str.length - 1 || 
                (str[idx] != '*' && str[idx] != '-' && str[idx] != '+') ||
                (str[idx + 1] != ' ' && str[idx + 1] != '\n')) {
                return [ false, 0 ];
            }

            let wsScanIdx: number = idx - 1;
            let outerindent: number = 0;

            while (wsScanIdx > -1 && str[wsScanIdx] != '\n') {
                let char: string = str[wsScanIdx];

                if (char != ' ') return [ false, 0 ];

                outerindent++;
                wsScanIdx--;
            }

            return [ true, outerindent ];
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

            'reflink': (start: number, str: string): t_spottedSeq[] | false => {
                let sequences: t_seqs = {
                    '[': [ 
                        [ '[', '][', ']' ],
                        [ '[', ']' ]
                    ],
                }

                let seqs: string[][] = sequences[str[start]];
                let spottedSeqs: t_spottedSeq[] | false = resolveSeqs(seqs, start, str);

                return spottedSeqs;
            },

            'unorderedlistitem': (start: number, str: string): t_unOrderedListItemMatchResult | false => {
                let [ isHead, outerindent ] = isThisAnUnOrderedListHead(start, str);

                if (!isHead) return false;

                let spottedSeqs: t_spottedSeq[] = [];
                spottedSeqs.push({ idx: start, len: 1 });

                let scanIdx: number = start + 3;

                let firstCharIdx: number | null = null;
                let innerindent: number = 0;

                while (scanIdx < str.length) {
                    if (!firstCharIdx && str[scanIdx] != ' ' && str[scanIdx] != '\n') {
                        firstCharIdx = scanIdx;
                    }

                    if (isThisAnUnOrderedListHead(scanIdx, str)[0] || 
                        isThisAnOrderedListHead(scanIdx, str)[0] || scanIdx == str.length - 1) {
                        spottedSeqs.push({ idx: scanIdx == str.length - 1 ? scanIdx + 1 : scanIdx, len: 1 });
                        break;
                    }

                    scanIdx++;
                }

                if (firstCharIdx != null) {
                    while (firstCharIdx > -1 && str[firstCharIdx - 1] != '\n') {
                        innerindent++;
                        firstCharIdx--;
                    }
                } else {
                    innerindent = start + 3;
                }

                return [ spottedSeqs, outerindent, innerindent - 1 ];
            },

            'orderedlistitem': (start: number, str: string): t_orderedListItemMatchResult | false => {
                let [ isHead, outerindent, head ] = isThisAnOrderedListHead(start, str);

                if (!isHead) return false;

                let spottedSeqs: t_spottedSeq[] = [];
                spottedSeqs.push({ idx: start, len: 1 });

                let scanIdx: number = start + 3;

                let firstCharIdx: number | null = null;
                let innerindent: number = 0;

                while (scanIdx < str.length) {
                    if (!firstCharIdx && str[scanIdx] != ' ' && str[scanIdx] != '\n') {
                        firstCharIdx = scanIdx;
                    }

                    if (isThisAnUnOrderedListHead(scanIdx, str)[0] || 
                        isThisAnOrderedListHead(scanIdx, str)[0] || scanIdx == str.length - 1) {
                        spottedSeqs.push({ idx: scanIdx == str.length - 1 ? scanIdx + 1 : scanIdx, len: 1 });
                        break;
                    }

                    scanIdx++;
                }

                if (firstCharIdx != null) {
                    while (firstCharIdx > -1 && str[firstCharIdx - 1] != '\n') {
                        innerindent++;
                        firstCharIdx--;
                    }
                } else {
                    innerindent = start + 3;
                }

                return [ spottedSeqs, outerindent, innerindent - 1, head ];
            },


            'alternativeheader': (char: string): t_spottedSeq[] | false => {
                let line: string = getLine(lineStartIdxs[curParIdx][curLineIdx]);

                let isValid: boolean = isConsistOf(line.trim(), char); 

                if (!isValid) return false;

                if (curLineIdx < lineStartIdxs[curParIdx].length - 1) {
                    return [ { idx: lineStartIdxs[curParIdx][curLineIdx + 1], len: 1 } ];
                } else {
                    return [ { idx: paragraphs[curParIdx].length, len: 1 } ];
                }
            },

            'table': (): t_tableMatchResult => {
                /**
                 * if the current line is not following by an another new line
                 * table can not be constructed so just return false
                 */
                if (curLineIdx == lineStartIdxs[curParIdx].length - 1) {
                    return [ false, 0, 0, null ];
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
                 * check the dash patterns to determine they contain semicolons and then
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
                 * check the dashes that are in column to determine limit range are valid or not
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
                 * starting to check other rows to determine they are
                 * whether valid to be part of the table
                 */
                let rowIdx: number = curLineIdx + 2;
                let rowRange: number = 0;

                while (rowIdx < lineStartIdxs[curParIdx].length) {
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

        if (operations.hasOwnProperty(type)) {
            return operations[type];
        } else {
            throw Error(`${type} operation couldn't find in match methods`);
        }
    }

    let extract = (elementName: string): Function => {
        let operations: t_operations = {
            'emphasis': (type: string, opening: t_spottedSeq, closing: t_spottedSeq, context: string): Element => {
                let inlineText: string = getBetween(opening, closing, context);
                let el: Element = new Element(type);

                /**
                 * we apply inline operation recursively for the inlineText
                 * in order to get sub combined emphasises 
                 */
                let elInline: Element = inline(inlineText);

                el.appendChild(elInline);

                return el;
            },

            'link': (seq: t_spottedSeq[], context: string): Element => {
                let textPart: string = getBetween(seq[0], seq[1], context);

                let urlParts: string = getBetween(seq[1], seq[2], context);
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

            'ref': (seq: t_spottedSeq[], context: string): t_reflink[] => {
                let reflinks: t_reflink[] = [];

                for (let i: number = 0; i < seq.length; i += 2) {
                    let refStrPieces: string[] = context.substring(seq[i].idx, seq[i+1].idx).split(':');
                    let key: string = refStrPieces[0].substring(1, refStrPieces[0].length - 1).trim().toLowerCase();

                    let urlPieces: string[] = refStrPieces.slice(1).join(':').trim().split(' ');
                    let url: string = urlPieces[0].trim();
                    let title: string = urlPieces.slice(1).join(' ').trim();
                    title = title.substring(1, title.length - 1);

                    reflinks.push({ key, url, title });
                }

                return reflinks;
            },

            'reflink': (seq: t_spottedSeq[], context: string): [ Element, t_reflinkSpec ] => {
                let el: Element = new Element('');
                let strEl: Element | null = null;

                let str: string | null = seq.length == 3 ? '' : null;

                let keySpots: [ t_spottedSeq, t_spottedSeq ] = seq.length == 3 ? 
                    [ seq[1], seq[2] ] :
                    [ seq[0], seq[1] ];

                let key: string = context.substring(keySpots[0].idx + keySpots[0].len, keySpots[1].idx).toLowerCase();

                if (str != null) {
                    el.appendChild(new Element('', [], '['));

                    str = context.substring(seq[0].idx + seq[0].len, seq[1].idx);
                    strEl = inline(str);
                    el.appendChild(strEl);

                    el.appendChild(new Element('', [], ']'));
                }

                el.appendChild(new Element('', [], '['));

                let keyEl: Element = inline(key);
                el.appendChild(keyEl);

                el.appendChild(new Element('', [], ']'));

                return [ el, { elid: el.id, key, keyEl, strEl } ]
            },

            'listitem': (seq: t_spottedSeq[], context: string, outerindent: number, innerindent: number): Element => {
                let str: string = context.substring(seq[0].idx + 2, seq[1].idx);
                let li: Element = new Element('li', [], '', outerindent, innerindent);

                let pEl: Element | null = paragraph(str, false);
                
                if (pEl) {
                    pEl.tag = '';
                    li.appendChild(pEl)
                }

                return li;
            },

            'table': (rowRange: number, columnCount: number, textAligns: t_textAlign[]): Element => {
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
                    let context: string = headFields[i] || '';
                    let textAlign: t_textAlign = textAligns[i];
                    let attributes: t_attribute[] = [];

                    if (textAlign.align != 'left') {
                        attributes.push({ key: 'align', value: textAlign.align });
                    }

                    let th: Element = new Element('th', attributes, context);

                    headtr.appendChild(th);
                }

                thead.appendChild(headtr);
                table.appendChild(thead);

                /**
                 * split the row strings and extract the context to 
                 * create element objects
                 */
                let tbody: Element = new Element('tbody');
                let rowIdx: number = curLineIdx + 2;

                for (let i: number = 0; i < rowRange; i++) {
                    let rowstr: string = getLine(lineStartIdxs[curParIdx][rowIdx + i]);
                    rowstr = extractFixes(rowstr, '|').source;

                    let rowFields: string[] = rowstr.split('|');

                    let tr: Element = new Element('tr');

                    for (let j: number = 0; j < columnCount; j++) {
                        let context: string = rowFields[j] || '';
                        let textAlign: t_textAlign = textAligns[j];
                        let attributes: t_attribute[] = [];

                        if (textAlign.align != 'left') {
                            attributes.push({ key: 'align', value: textAlign.align });
                        }

                        let td: Element = new Element('td', attributes, context);
                        tr.appendChild(td);
                    }

                    tbody.appendChild(tr);
                }

                table.appendChild(tbody);

                return table;
            }
        }

        if (operations.hasOwnProperty(elementName)) {
            return operations[elementName];
        } else {
            throw Error(`${elementName} operation couldn't find in extract methods`);
        }
    }

    /**
     * gets the char and executes related operate fn on 
     * the current paragraphs
     */
    let operate = (char: string, idx: number, context: string, paragraphRef: Element): t_operateResult | false => {
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

                let nextStartingIdx: number = paragraphs[curParIdx].length;
                let rowStartIdx: number = curLineIdx + 2;

                if (rowRange == 0 && rowStartIdx < lineStartIdxs[curParIdx].length) {
                    nextStartingIdx = lineStartIdxs[curParIdx][rowStartIdx];
                } else if (rowStartIdx + rowRange < lineStartIdxs[curParIdx].length) {
                    nextStartingIdx = lineStartIdxs[curParIdx][rowStartIdx + rowRange];
                }

                paragraphRef.childs.pop();
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
                res = matchFn(idx, context);

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
     * looking for a pattern beginning and then if a pattern beginning can be found
     * match and extract operations will be applied
     *
     * @char: current char of context
     *
     * @idx: current idx of context
     *
     * @context: the context that match and extract operations will be applied on
     */
    let operateInline = (char: string, idx: number, context: string): t_operateResult | false => {
        switch(char) {
            case '\n': {
                return [ new Element('', [], '<br>'), idx + 1 ];
            }

            case '_':
            case '*': {
                if ((char == '*' && context[idx + 1] == '*') ||
                    (char == '_' && context[idx + 1] == '_')) {
                    let matchFn: Function = match('emphasis');

                    let matchRes: t_spottedSeq[] | false = matchFn('bold', idx, context);
                    if (!matchRes) return false;

                    let extractFn: Function = extract('emphasis');

                    let strong: Element = extractFn('strong', matchRes[0], matchRes[1], context);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ strong, patternEnding.idx + patternEnding.len ];
                } else {
                    let matchFn: Function = match('emphasis');

                    let matchRes: t_spottedSeq[] | false = matchFn('italic', idx, context);
                    if (!matchRes) return false;

                    let extractFn: Function = extract('emphasis');

                    let em: Element = extractFn('em', matchRes[0], matchRes[1], context);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ em, patternEnding.idx + patternEnding.len ];
                }
            }

            case '~': {
                if (context[idx + 1] == '~') {
                    let matchFn: Function = match('emphasis');

                    let matchRes: t_spottedSeq[] | false = matchFn('scratch', idx, context);
                    if (!matchRes) return false;

                    let extractFn: Function = extract('emphasis');

                    let del: Element = extractFn('del', matchRes[0], matchRes[1], context);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ del, patternEnding.idx + patternEnding.len ];
                }
            } break;

            case '[': {
                let matchFn: Function;
                let matchRes: t_spottedSeq[] | false;
                let extractFn: Function;

                matchFn = match('link');

                matchRes = matchFn(idx, context);

                if (matchRes) {
                    extractFn = extract('link');

                    let a: Element = extractFn(matchRes, context);
                    
                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ a, patternEnding.idx + patternEnding.len ]
                }

                matchFn = match('ref');

                matchRes = matchFn(idx, context);

                if (matchRes) {
                    extractFn = extract('ref');

                    let refs: t_reflink[] = extractFn(matchRes, context);

                    for (let i: number = 0; i < refs.length; i++) {
                        let { key, url, title } = refs[i];

                        if (!refMap.get(key)) {
                            refMap.set(key, { url, title });
                        }
                    }

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];
                    return [ null, patternEnding.idx ];
                }

                matchFn = match('reflink');

                matchRes = matchFn(idx, context);

                if (matchRes) {
                    extractFn = extract('reflink');

                    let extractRes: [ Element, t_reflinkSpec ] = extractFn(matchRes, context);

                    refsEl.push(extractRes[1]);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return [ extractRes[0], patternEnding.idx + patternEnding.len ];
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
    let inline = (context: string, tag: string = ''): Element => {
        let idx: number = 0;
        let inlineTextBuffer: string = '';
        let inlineEl: Element = new Element(tag);

        let pushInlineText = (): void => {
            if (inlineTextBuffer != '') {
                inlineEl.appendChild(new Element('', [], inlineTextBuffer));
                inlineTextBuffer = '';
            }
        }

        while (idx < context.length) {
            let opRes: t_operateResult | false = operateInline(context[idx], idx, context);

            if (opRes) {
                pushInlineText();

                let [ el, ridx ] = opRes;
                if (el) inlineEl.appendChild(el);
                idx = ridx;
                continue;
            }

            inlineTextBuffer += context[idx];
            idx++;
        }

        pushInlineText();
        return inlineEl;
    }

    let paragraph = (context: string, checkListBuffer: boolean = true): Element | null => {
        let idx: number = 0;
        let paragraphTextBuffer: string = '';

        let paragraphEl: Element = new Element('div');
        paragraphEl.attributes.push({ key: 'style', value: 'margin: 15px 0px;' });

        let outerindent: number = 0;
        let indentScanning: boolean = true;

        let pushParagraphText = (tag: string = '') => {
            if (paragraphTextBuffer != '') {
                let el: Element = inline(paragraphTextBuffer.trim(), tag);
                paragraphTextBuffer = '';

                if (el.tag != '' || el.context != '' || el.childs.length != 0) {
                    paragraphEl.appendChild(el);
                }
            }
        }

        while (idx < context.length) {
            let char: string = context[idx];

            if (indentScanning) {
                if (char != ' ' && char != '\n') indentScanning = false;
                else if (char == '\n') outerindent = 0;
                else outerindent++;
            }

            let opRes: t_operateResult | false = operate(char, idx, context, paragraphEl);

            if (opRes) {
                let [ el, ridx ] = opRes;
                let tag: string = '';

                if (el && (el.tag == 'h1' || el.tag == 'h2')) tag = el.tag;

                pushParagraphText(tag);

                if (el && el.tag != 'h1' && el.tag != 'h2') paragraphEl.appendChild(el);

                idx = ridx;
                continue;
            }

            paragraphTextBuffer += char;
            idx++;
        }

        pushParagraphText();

        if (checkListBuffer && paragraphEl.childs.length != 0 && listBuffer.length != 0) {
            let lbid: string | false = findListItem(listBuffer[listBuffer.length - 1], null, outerindent);

            if (lbid) {
                findAndPushToChild(listBuffer[listBuffer.length - 1], paragraphEl, lbid);
                return null;
            } else {
                pushList();
            }
        }

        return paragraphEl;
    }

    while (curParIdx < paragraphs.length) {
        curLineIdx = 0;
        let el: Element | null = paragraph(paragraphs[curParIdx], listBuffer.length != 0 ? true : false);
        if (el && el.childs.length != 0) elements.push(el);
        curParIdx++;
    }

    pushList();

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
