import {
    t_refUrlTitlePair,
    t_ref,
    t_reflink,
    t_inlineParseResult,
    t_operateResult,
    t_spottedSeq,
    t_listMatch,
    t_listExtractRes
} from './types'

import Inline from './Inline'
import Element from './Element'
import Utils from './Utils'

import Table from './components/Table'
import AltHeading from './components/AltHeading'
import List from './components/List'

export default class Parser {
    private input: string;
    private textBuffer: string;
    private body: Element;
    private conBuffer: Element;

    public idx: number;
    public curLineIdx: number;
    public lineStartIdxs: number[];
    private baseindent: number;

    // donethings inside of inline
    public refMap: Map<string, t_refUrlTitlePair>;
    public reflinks: t_reflink[];

    constructor(input: string, baseindent: number = 0) {
        this.input = input;
        this.textBuffer = '';
        this.body = new Element('');
        this.conBuffer = Utils.getSection();

        this.idx = 0;
        this.curLineIdx = 0;
        this.lineStartIdxs = Utils.getLineStartIdxs(this.input);
        this.baseindent = baseindent;

        this.refMap = new Map();
        this.reflinks = [];
    }

    private operate(): t_operateResult | false {
        switch (this.input[this.idx]) {
            case '\n': {
                this.curLineIdx++;
                return false;
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

                this.conBuffer.childs.pop();

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
                let h1: Element = new Element('h1');

                this.curLineIdx++;

                return {
                    type: 'inlinecontainer',
                    el: h1,
                    nextStartingIdx: nextStart.idx
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

                    let wholeListStr: string = this.input.substr(start, end);

                    let newLineCount: number = wholeListStr
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
                    let h2: Element = new Element('h2');

                    this.curLineIdx++;

                    return {
                        type: 'inlinecontainer',
                        el: h2,
                        nextStartingIdx: nextStart.idx
                    }
                }

                return false;
            }

            case '*':
            case '+': {
                let listMatchRes: t_listMatch[] | false = List.match(this.idx, this.input);
                if (!listMatchRes) return false;

                let listExtractRes: t_listExtractRes = List.extract(listMatchRes, this.input);

                listExtractRes.refMap.forEach((value: t_refUrlTitlePair, key: string) => {
                    if (!this.refMap.get(key)) this.refMap.set(key, value);
                });

                this.reflinks.push(...listExtractRes.reflinks);

                let start: number = listMatchRes[0].start;
                let end: number = listMatchRes[listMatchRes.length - 1].end;

                let wholeListStr: string = this.input.substr(start, end);

                let newLineCount: number = wholeListStr
                .split('')
                .filter((char: string) => char == '\n').length;

                this.curLineIdx += newLineCount;

                return {
                    type: 'element',
                    el: listExtractRes.el,
                    nextStartingIdx: end
                }
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

                        let wholeListStr: string = this.input.substr(start, end);

                        let newLineCount: number = wholeListStr
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

    private pushTextBuffer(containerTag: string = ''): void {
        if (this.textBuffer != '') {
            let InlineParser: Inline = new Inline(this.textBuffer, containerTag, this.baseindent);
            this.textBuffer = '';

            let inlineParseRes: t_inlineParseResult = InlineParser.parse();
            let { el, refs, reflinks } = inlineParseRes;

            refs.forEach((ref: t_ref) => {
                if (!this.refMap.get(ref.key)) {
                    this.refMap.set(ref.key, { url: ref.url, title: ref.title });
                }
            });

            this.reflinks.push(...reflinks);

            if (el.tag != '' || el.context != '' || el.childs.length != 0) {
                this.conBuffer.appendChild(el);
            }
        }
    }

    public parse(resolveReflinks: boolean = true, containerTag: boolean = true): Element {
        while (this.idx < this.input.length) {
            let opRes: t_operateResult | false = this.operate();

            if (opRes) {
                let { type, el, nextStartingIdx } = opRes;

                if (el) {
                    if (type == 'inlinecontainer') {
                        this.pushTextBuffer(el.tag);
                    } else {
                        this.pushTextBuffer();
                        this.conBuffer.appendChild(el);
                    }
                }

                this.idx = nextStartingIdx;
            } else {
                this.textBuffer += this.input[this.idx];
                this.idx++;
            }

            if (Utils.isBlankLine(this.idx, this.input)) {
                this.pushTextBuffer();
                this.curLineIdx += 1;
                this.idx = this.lineStartIdxs[this.curLineIdx];
                if (!containerTag) this.conBuffer.tag = '';
                this.body.appendChild(this.conBuffer);
                this.conBuffer = Utils.getSection();
            }
        }

        this.pushTextBuffer();

        if (this.conBuffer.childs.length != 0) {
            if (!containerTag) this.conBuffer.tag = '';
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
