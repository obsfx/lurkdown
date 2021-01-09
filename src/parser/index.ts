import {
    t_refUrlTitlePair,
    t_ref,
    t_reflink,
    t_inlineParseResult,
    t_operateResult,
    t_spottedSeq,
    t_listMatch,
    t_listExtractRes,
    t_inlineHTMLMatchRes,
    t_headingMatchRes
} from './types'

import Inline from './Inline'
import Element from './Element'
import Utils from './Utils'

import Table from './components/Table'
import AltHeading from './components/AltHeading'
import List from './components/List'
import Blockquote from './components/Blockquote'
import CodeBlock from './components/CodeBlock'
import InlineHTML from './components/InlineHTML'
import HorizontalRule from './components/HorizontalRule'
import Heading from './components/Heading'

export default class Parser {
    private input: string;
    private textBuffer: string;
    private body: Element;
    private conBuffer: Element;

    public idx: number;
    public curLineIdx: number;
    public lineStartIdxs: number[];
    private baseindent: number;
    private containerTag: boolean;

    // donethings inside of inline
    public refMap: Map<string, t_refUrlTitlePair>;
    public reflinks: t_reflink[];

    constructor(input: string, baseindent: number = 0, containerTag: boolean = true) {
        this.input = input.split('\r\n').join('\n');
        this.textBuffer = '';
        this.body = containerTag ? new Element('div', [ { key: 'class', value: 'ld-wrapper' } ]) : new Element('');
        this.conBuffer = Utils.getSection();

        this.idx = 0;
        this.curLineIdx = 0;
        this.lineStartIdxs = Utils.getLineStartIdxs(this.input);
        this.baseindent = baseindent;
        this.containerTag = containerTag;

        this.refMap = new Map();
        this.reflinks = [];
    }

    private operate(): t_operateResult | false {
        switch (this.input[this.idx]) {
            case '\n': {
                if (Utils.isBlankLine(this.idx, this.input)) {
                    this.pushTextBuffer(null);
                    this.curLineIdx += 2;

                    if (!this.containerTag) this.conBuffer.tag = '';

                    if (this.conBuffer.childs.length == 0) {
                        this.body.appendChild(new Element('', [], '<br>'));
                    } else {
                        this.body.appendChild(this.conBuffer);
                    }

                    this.conBuffer = Utils.getSection();
                } else {
                    this.textBuffer += this.input[this.idx];
                    this.curLineIdx++;
                }

                return {
                    type: 'element',
                    el: null,
                    nextStartingIdx: this.lineStartIdxs[this.curLineIdx] != undefined ? 
                        this.lineStartIdxs[this.curLineIdx] : 
                        this.input.length
                }
            }

            case '#': {
                let matchRes: t_headingMatchRes | false = Heading.match(this.idx, this.input);
                if (!matchRes) return false;

                let extractRes: Element = Heading.extract(matchRes, this.input);

                let patternEnding: t_spottedSeq = matchRes.seqs[1];
                let nextStartingIdx: number = patternEnding.idx;

                if (!Utils.isBlankLine(patternEnding.idx, this.input)) {
                    nextStartingIdx = patternEnding.idx + patternEnding.len;
                    this.curLineIdx++;
                }

                return {
                    type: 'element',
                    el: extractRes,
                    nextStartingIdx
                }
            }

            case '|': {
                let [ 
                    matchRes, 
                    rowRange, 
                    columnCount, 
                    textAligns 
                ] = Table.match(this.curLineIdx, this.lineStartIdxs, this.input);
                if (!matchRes) return false;

                let table: Element = Table.extract(this.curLineIdx, 
                this.lineStartIdxs, this.input, rowRange, columnCount, textAligns || []);

                this.curLineIdx += rowRange + 2;
                let nextStartingIdx: number = this.curLineIdx < this.lineStartIdxs.length ?
                    this.lineStartIdxs[this.curLineIdx] :
                    this.input.length;

                for (let i: number = this.textBuffer.length - 1; i > -1; i--) {
                    if (this.textBuffer[i] == '\n' || i == 0) {
                        this.textBuffer = this.textBuffer.substring(0, i);
                        break;
                    }
                }

                return {
                    type: 'element',
                    el: table,
                    nextStartingIdx
                }
            }

            case '=': {
                let matchRes: t_spottedSeq[] | false = AltHeading.match('=', this.curLineIdx, this.lineStartIdxs, this.input);
                if (!matchRes) return false;

                let [ nextStart ] = matchRes;
                let h1: Element = new Element('h1', [ { key: 'class', value: 'ld-h1' } ]);

                return {
                    type: 'inlinecontainer',
                    el: h1,
                    nextStartingIdx: nextStart.idx
                }
            }

            case '<': {
                let matchRes: t_inlineHTMLMatchRes | false = InlineHTML.match(this.idx, this.input);
                if (!matchRes) return false;

                let extractRes: Element = InlineHTML.extract(matchRes, this.input);

                let sectionStr: string = Utils.getBetween(matchRes.seqs[1], matchRes.seqs[2], this.input);

                let newLineCount: number = sectionStr
                .split('')
                .filter((char: string) => char == '\n').length;

                this.curLineIdx += newLineCount;

                return {
                    type: 'element',
                    el: extractRes,
                    nextStartingIdx: matchRes.seqs[2].idx + matchRes.seqs[2].len
                }
            }

            case '>': {
                if (this.idx > 0 && (this.input[this.idx - 1] != '\n' && this.input[this.idx - 1] != ' ')) return false;

                let matchRes: t_spottedSeq[] = Blockquote.match(this.idx, this.input);
                let extractRes: t_inlineParseResult = Blockquote.extract(matchRes, this.input);

                extractRes.refs.forEach((ref: t_ref) => {
                    if (!this.refMap.get(ref.key)) this.refMap.set(ref.key, { url: ref.url, title: ref.title });
                });

                this.reflinks.push(...extractRes.reflinks);

                let start: number = matchRes[0].idx;
                let end: number = matchRes[1].idx;

                let sectionStr: string = this.input.substring(start, end);

                let newLineCount: number = sectionStr
                .split('')
                .filter((char: string) => char == '\n').length;

                this.curLineIdx += newLineCount;

                return {
                    type: 'element',
                    el: extractRes.el,
                    nextStartingIdx: end
                }
            }

            case ' ': {
                if (this.idx > 0 && this.input[this.idx - 1] != '\n') return false;

                let matchRes: t_spottedSeq[] | false = CodeBlock.indentMatch(this.input, this.curLineIdx, this.lineStartIdxs, this.baseindent);
                if (!matchRes) return false;

                let extractRes: Element = CodeBlock.indentExtract(matchRes, this.input, this.baseindent);

                let start: number = matchRes[0].idx;
                let end: number = matchRes[matchRes.length - 1].idx;

                let sectionStr: string = this.input.substring(start, end);

                let newLineCount: number = sectionStr
                .split('')
                .filter((char: string) => char == '\n').length;

                this.curLineIdx += newLineCount;

                return {
                    type: 'element',
                    el: extractRes,
                    nextStartingIdx: end
                }
            }

            case '-': {
                let listMatchRes: t_listMatch[] | false = List.match(this.idx, this.input);

                if (listMatchRes) {
                    let listExtractRes: t_listExtractRes = List.extract(listMatchRes, this.input);

                    listExtractRes.refMap.forEach((value: t_refUrlTitlePair, key: string) => {
                        if (!this.refMap.get(key)) this.refMap.set(key, value);
                    });

                    this.reflinks.push(...listExtractRes.reflinks);

                    let start: number = listMatchRes[0].start;
                    let end: number = listMatchRes[listMatchRes.length - 1].end;

                    let sectionStr: string = this.input.substring(start, end);

                    let newLineCount: number = sectionStr
                    .split('')
                    .filter((char: string) => char == '\n').length;

                    this.curLineIdx += newLineCount;

                    return {
                        type: 'element',
                        el: listExtractRes.el,
                        nextStartingIdx: end
                    }
                }

                let altHeadingMathRes: t_spottedSeq[] | false = AltHeading.match('-', this.curLineIdx, this.lineStartIdxs, this.input);

                if (altHeadingMathRes) {
                    let [ nextStart ] = altHeadingMathRes;
                    let h2: Element = new Element('h2', [ { key: 'class', value: 'ld-h2' } ]);

                    return {
                        type: 'inlinecontainer',
                        el: h2,
                        nextStartingIdx: nextStart.idx
                    }
                }

                let hrule: t_spottedSeq[] | false = HorizontalRule.match('-', this.curLineIdx, this.lineStartIdxs, this.input);

                if (hrule) {
                    let [ nextStart ] = hrule;
                    let hr: Element = new Element('', [], '<hr>');

                    return {
                        type: 'element',
                        el: hr,
                        nextStartingIdx: nextStart.idx
                    }
                }

                return false;
            }

            case '*':
            case '+': {
                let listMatchRes: t_listMatch[] | false = List.match(this.idx, this.input);

                if (listMatchRes) {
                    let listExtractRes: t_listExtractRes = List.extract(listMatchRes, this.input);

                    listExtractRes.refMap.forEach((value: t_refUrlTitlePair, key: string) => {
                        if (!this.refMap.get(key)) this.refMap.set(key, value);
                    });

                    this.reflinks.push(...listExtractRes.reflinks);

                    let start: number = listMatchRes[0].start;
                    let end: number = listMatchRes[listMatchRes.length - 1].end;

                    let sectionStr: string = this.input.substring(start, end);

                    let newLineCount: number = sectionStr
                    .split('')
                    .filter((char: string) => char == '\n').length;

                    this.curLineIdx += newLineCount;

                    return {
                        type: 'element',
                        el: listExtractRes.el,
                        nextStartingIdx: end
                    }
                }

                if (this.input[this.idx] == '*') {
                    let hrule: t_spottedSeq[] | false = HorizontalRule.match('*', this.curLineIdx, this.lineStartIdxs, this.input);

                    if (hrule) {
                        let [ nextStart ] = hrule;
                        let hr: Element = new Element('', [], '<hr>');

                        return {
                            type: 'element',
                            el: hr,
                            nextStartingIdx: nextStart.idx
                        }
                    }
                }

                return false;
            }

            case '_': {
                let hrule: t_spottedSeq[] | false = HorizontalRule.match('_', this.curLineIdx, this.lineStartIdxs, this.input);

                if (hrule) {
                    let [ nextStart ] = hrule;
                    let hr: Element = new Element('', [], '<hr>');

                    return {
                        type: 'element',
                        el: hr,
                        nextStartingIdx: nextStart.idx
                    }
                }

                return false;
            }

            case '`': {
                if (this.input.substring(this.idx, this.idx + 3) == '```') {
                    let matchRes: t_spottedSeq[] | false = CodeBlock.match(this.idx, this.input);
                    if (!matchRes) return false;

                    let extractRes: Element = CodeBlock.extract(matchRes[0], matchRes[1], this.input, this.baseindent);

                    let sectionStr: string = Utils.getBetween(matchRes[0], matchRes[1], this.input);

                    let newLineCount: number = sectionStr
                    .split('')
                    .filter((char: string) => char == '\n').length;

                    this.curLineIdx += newLineCount;

                    return {
                        type: 'element',
                        el: extractRes,
                        nextStartingIdx: matchRes[1].idx + matchRes[1].len
                    }
                }

                return false;
            }

            default: {
                if (Number.isInteger(parseInt(this.input[this.idx]))) {
                    let listMatchRes: t_listMatch[] | false = List.match(this.idx, this.input);

                    if (listMatchRes) {
                        let listExtractRes: t_listExtractRes = List.extract(listMatchRes, this.input);

                        listExtractRes.refMap.forEach((value: t_refUrlTitlePair, key: string) => {
                            if (!this.refMap.get(key)) this.refMap.set(key, value);
                        });

                        this.reflinks.push(...listExtractRes.reflinks);

                        let start: number = listMatchRes[0].start;
                        let end: number = listMatchRes[listMatchRes.length - 1].end;

                        let sectionStr: string = this.input.substring(start, end);

                        let newLineCount: number = sectionStr
                        .split('')
                        .filter((char: string) => char == '\n').length;

                        this.curLineIdx += newLineCount;

                        return {
                            type: 'element',
                            el: listExtractRes.el,
                            nextStartingIdx: end
                        }
                    }
                }
            } break;
        }

        return false;
    }

    public getRefMap(): Map<string, t_refUrlTitlePair> {
        return this.refMap;
    }

    public getReflinks(): t_reflink[] {
        return this.reflinks;
    }

    private resolveReflink(el: Element, reflink: t_reflink, ref: t_refUrlTitlePair): boolean {
        if (el.id == reflink.elid && ref) {
            el.tag = 'a';
            el.childs = [ reflink.strEl || reflink.keyEl ];
            el.attributes = [
                { key: 'class', value: 'ld-a' },
                { key: 'href', value: ref.url }, 
                { key: 'title', value: ref.title } 
            ];

            return true;
        }

        for (let i: number = 0; i < el.childs.length; i++) {
            let childEl: Element = el.childs[i];
            if (this.resolveReflink(childEl, reflink, ref)) return true;
        }

        return false;
    }

    private pushTextBuffer(containerEl: Element | null): void {
        if (this.textBuffer != '') {
            let InlineParser: Inline = new Inline(this.textBuffer, containerEl);
            this.textBuffer = '';

            let inlineParseRes: t_inlineParseResult = InlineParser.parse();
            let { el, refs, reflinks } = inlineParseRes;

            refs.forEach((ref: t_ref) => {
                if (!this.refMap.get(ref.key)) {
                    this.refMap.set(ref.key, { url: ref.url, title: ref.title });
                }
            });

            this.reflinks.push(...reflinks);

            this.conBuffer.appendChild(el);
            //if (el.tag != '' || el.context != '' || el.childs.length != 0) {
            //}
        }
    }

    public parse(resolveReflinks: boolean = true): Element {
        while (this.idx < this.input.length) {
            if (this.input[this.idx] == '\\') {
                this.textBuffer += this.input[this.idx];
                this.idx++;
                this.textBuffer += this.input[this.idx];
                this.idx++;
            }

            let opRes: t_operateResult | false = this.operate();

            if (opRes) {
                let { type, el, nextStartingIdx } = opRes;

                if (el) {
                    if (type == 'inlinecontainer') {
                        this.pushTextBuffer(el);
                    } else {
                        this.pushTextBuffer(null);
                        this.conBuffer.appendChild(el);
                    }
                }

                this.idx = nextStartingIdx;
            } else {
                this.textBuffer += this.input[this.idx];
                this.idx++;
            }
        }

        this.pushTextBuffer(null);

        if (this.conBuffer.childs.length != 0) {
            if (!this.containerTag) this.conBuffer.tag = '';
            this.body.appendChild(this.conBuffer);
        }

        if (resolveReflinks) {
            for (let i: number = 0; i < this.reflinks.length; i++) {
                let ref: t_refUrlTitlePair | undefined = this.refMap.get(this.reflinks[i].key);
                if (ref) this.resolveReflink(this.body, this.reflinks[i], ref);
            }
        }

        return this.body;
    }
}
