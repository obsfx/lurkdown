/**
 * all inline match and extract operations are being applied recursively.
 * if there is an emphasis pattern opRes will return an Element that contains all combined
 * sub emphasises. If we have an element we append it to inlineEl and set idx to the next of the
 * pattern. If opRes returned false we just store the char at inlineTextBuffer and increate the idx.
 */

import Utils from './Utils'
import Element from './Element'
import {
    t_inlineOperateResult,
    t_inlineParseResult,
    t_spottedSeq,
    t_ref,
    t_reflink,
} from './types'

import Emphasis from './components/Emphasis'
import Link from './components/Link'
import Ref from './components/Ref'
import RefLink from './components/RefLink'
import Image from './components/Image'

export default class Inline {
    private input: string;

    private idx: number;
    private textBuffer: string;
    private conBuffer: Element;

    private refs: t_ref[];
    private reflinks: t_reflink[];

    constructor(input: string, container: Element | null) {
        this.input = input;

        this.idx = 0;
        this.textBuffer = '';
        this.conBuffer = container || new Element('');

        this.refs = [];
        this.reflinks = [];
    }

    private operate(): t_inlineOperateResult | false {
        switch(this.input[this.idx]) {
            case '\n': {
                return {
                    el: new Element('', [], '<br>'),
                    nextStartingIdx: this.idx + 1
                }
            }

            case '_':
            case '*': {
            if ((this.input[this.idx] == '*' && this.input[this.idx + 1] == '*') ||
                (this.input[this.idx] == '_' && this.input[this.idx + 1] == '_')) {
                let matchRes: t_spottedSeq[] | false = Emphasis.match('bold', this.idx, this.input);
                if (!matchRes) return false;

                let emphasisRes: t_inlineParseResult = Emphasis.extract('strong', matchRes[0], matchRes[1], this.input);

                this.refs.push(...emphasisRes.refs);
                this.reflinks.push(...emphasisRes.reflinks);

                let strong: Element = emphasisRes.el;

                let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                return {
                    el: strong,
                    nextStartingIdx: patternEnding.idx + patternEnding.len
                }
            } else {
                let matchRes: t_spottedSeq[] | false = Emphasis.match('italic', this.idx, this.input);
                if (!matchRes) return false;

                let emphasisRes: t_inlineParseResult = Emphasis.extract('em', matchRes[0], matchRes[1], this.input);

                this.refs.push(...emphasisRes.refs);
                this.reflinks.push(...emphasisRes.reflinks);

                let em: Element =  emphasisRes.el;

                let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                return {
                    el: em,
                    nextStartingIdx: patternEnding.idx + patternEnding.len
                }
            }
        }

            case '~': {
                if (this.input[this.idx + 1] == '~') {
                    let matchRes: t_spottedSeq[] | false = Emphasis.match('scratch', this.idx, this.input);
                    if (!matchRes) return false;

                    let emphasisRes: t_inlineParseResult = Emphasis.extract('del', matchRes[0], matchRes[1], this.input);

                    this.refs.push(...emphasisRes.refs);
                    this.reflinks.push(...emphasisRes.reflinks);

                    let del: Element =  emphasisRes.el;
                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return {
                        el: del,
                        nextStartingIdx: patternEnding.idx + patternEnding.len
                    }
                }
            } break;

            case '`': {
                let matchRes: t_spottedSeq[] | false = Emphasis.match('code', this.idx, this.input);
                if (!matchRes) return false;

                let code: string = Utils.getBetween(matchRes[0], matchRes[1], this.input);

                let el: Element = new Element('code', [ { key: 'class', value: 'ld-code' } ], code);
                let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                return {
                    el,
                    nextStartingIdx: patternEnding.idx + patternEnding.len
                }
            }

            case '[': {
                let matchRes: t_spottedSeq[] | false;

                matchRes = Link.match(this.idx, this.input);

                if (matchRes) {
                    let a: Element = Link.extract(matchRes, this.input);
                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return {
                        el: a,
                        nextStartingIdx: patternEnding.idx + patternEnding.len
                    }
                }

                matchRes = Ref.match(this.idx, this.input);

                if (matchRes) {
                    let refs: t_ref[] = Ref.extract(matchRes, this.input);
                    this.refs.push(...refs);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];
                    return {
                        el: null,
                        nextStartingIdx: patternEnding.idx
                    }
                }

                matchRes = RefLink.match(this.idx, this.input);

                if (matchRes) {
                    let extractRes: [ Element, t_reflink ] = RefLink.extract(matchRes, this.input);

                    this.reflinks.push(extractRes[1]);

                    let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                    return {
                        el: extractRes[0],
                        nextStartingIdx: patternEnding.idx + patternEnding.len
                    }
                }

                return false;
            }

            case '<': {
                let matchRes: t_spottedSeq[] | false = Link.angleMatch(this.idx, this.input);
                if (!matchRes) return false;

                let extractRes: Element = Link.URLExtract(matchRes, this.input);

                let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                return {
                    el: extractRes,
                    nextStartingIdx: patternEnding.idx + patternEnding.len
                }
            }

            case '!': {
                let matchRes: t_spottedSeq[] | false = Image.match(this.idx, this.input);
                if (!matchRes) return false;

                let extractRes: Element = Image.extract(matchRes, this.input);

                let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                return {
                    el: extractRes,
                    nextStartingIdx: patternEnding.idx + patternEnding.len
                }
            }

            default: {
                if (this.input[this.idx] == 'h') {
                    let matchRes: t_spottedSeq[] | false = Link.URLMatch(this.idx, this.input);
                    if (matchRes) {
                        let extractRes: Element = Link.URLExtract(matchRes, this.input);

                        let patternEnding: t_spottedSeq = matchRes[matchRes.length - 1];

                        return {
                            el: extractRes,
                            nextStartingIdx: patternEnding.idx + patternEnding.len
                        }
                    }
                }
            } break;
        }

        return false;
    }

    private pushTextBuffer(): void {
        if (this.textBuffer != '') {
            this.conBuffer.appendChild(new Element('', [], this.textBuffer));
            this.textBuffer = '';
        }
    }

    public parse(): t_inlineParseResult {
        while (this.idx < this.input.length) {
            if (this.input[this.idx] == '\\') {
                this.textBuffer += this.input[this.idx];
                this.idx++;
                this.textBuffer += this.input[this.idx];
                this.idx++;
            }

            let opRes: t_inlineOperateResult | false = this.operate();

            if (opRes) {
                this.pushTextBuffer();

                let { el, nextStartingIdx } = opRes;
                if (el) this.conBuffer.appendChild(el);

                this.idx = nextStartingIdx;
                continue;
            }

            this.textBuffer += this.input[this.idx];
            this.idx++;
        }

        this.pushTextBuffer();

        return {
            el: this.conBuffer,
            refs: this.refs,
            reflinks: this.reflinks
        }
    }
}
