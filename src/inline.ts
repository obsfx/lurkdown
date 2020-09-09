/**
 * all inline match and extract operations are being applied recursively.
 * if there is an emphasis pattern opRes will return an Element that contains all combined
 * sub emphasises. If we have an element we append it to inlineEl and set idx to the next of the
 * pattern. If opRes returned false we just store the char at inlineTextBuffer and increate the idx.
 */

import Element from './Element'
import {
    t_operateResult,
    t_spottedSeq
} from './types'

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

export default inline;
