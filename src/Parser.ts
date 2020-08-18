import Element from './Element'

let parse = (buffer: string): Element[] => {
    let elements: Element[]     = [];
    let paragraphs: string[]    = buffer.split('\n\n');
    /**
     * curParIdx: current paragraph index
     * index: index that is used at inside of paragraph
     */
    let curParIdx: number       = 0;
    let index: number           = 0;

    /**
     * chars that should be handled
     */
   // const DOUBLE_QUOTE: string  = '"';
   // const LEFT_PAR: string      = '(';
   // const RIGHT_PAR: string     = ')';
   // const LEFT_SQ_PAR: string   = '[';
   // const RIGHT_SQ_PAR: string  = ']';

    type t_operators            = { match: Function };
    type t_operations           = { [key: string]: t_operators };
    type t_matchType            = null | 'LINK' | 'LINK_W_TITLE';
    type t_matchRule            = { type: t_matchType, rule: string[] };
    /**
     * rules:
     *  not whitespace '! '
     *  **,' '
     */

    /**
     * helper functions
     */
   // let peek = (padding: number = 0): string | null => curParIdx < paragraphs.length ?
   //     index < paragraphs[curParIdx].length ? paragraphs[curParIdx][index + padding] : null :
   //     null;

   // let isSpaceChar = (char: string): boolean => char == ' ' || char === '\n' || char == '\t';

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

    let check = (checkList: string[], start: number): [ boolean, number, number ] => {
        let curPar: string = paragraphs[curParIdx];
        let idx: number = start;
        let checkListSize: number = checkList.length;
        
        let patternStart: number = -1;
        let patternEnd: number = -1;

        let getRuleFn = (): Function | null => {
            let rule: string | undefined = checkList[0];
            if (!rule) return null;

            return createRuleFn(rule);
        } 

        let ruleCheck: Function | null = getRuleFn();
        if (!ruleCheck) return [ false, patternStart, patternEnd ];

        while (idx < curPar.length) {
            if (ruleCheck(curPar, idx)) {
                if (checkList.length == checkListSize) patternStart = idx;

                checkList.shift();
                ruleCheck = getRuleFn();

                if (!ruleCheck) {
                    patternEnd = idx;
                    break;
                }
            }

            idx++;
        }

        return checkList.length == 0 ? [ true, patternStart, patternEnd ] : 
            [ false, patternStart, patternEnd ];
    }

    let getOperators = (chars: string): t_operators | null => {
        let operations: t_operations = {
            '[': {
                match: (): [ boolean, t_matchType ] => {
                    /**
                     * matchRules array must be ordered by precedence
                     */
                    let matchRules: t_matchRule[] = [
                        { type: 'LINK_W_TITLE', rule: ['[', '! ', ']', '(', '! ', ' ', '"', '"', ')'] },
                        { type: 'LINK', rule: ['[', '! ', ']', '(', ')'] }
                    ];

                    for (let i: number = 0; i < matchRules.length; i++) {
                        let matchRule: t_matchRule = matchRules[i];

                        if (check(matchRule.rule, index)) {
                            return [ true, matchRule.type ]
                        }
                    }

                    return [ false, null ];
                }
            }
        }

        return operations[chars] || null;
    }

    /**
     * parsing
     */
    while (curParIdx < paragraphs.length) {
        let curPar: string = paragraphs[curParIdx];

        while (index < paragraphs[curParIdx].length) {
            let char: string = curPar[index];
            let charOperators: t_operators | null = getOperators(char);

            if (charOperators) {
               console.log(charOperators.match()); 
            }

            index++;
        }

        curParIdx++;
    }

   // let t = check(['[', '! ', ']', '(', '! ', ' ', '"', '"', ')'], index);
   // console.log(t);

    return elements;
}

export default parse;
