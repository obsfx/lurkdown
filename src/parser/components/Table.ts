import Element, { t_attribute } from '../Element'
import Utils from '../Utils'
import Inline from '../Inline'
import {
    t_tableMatchResult,
    t_textAlign,
    t_inlineParseResult
} from '../types'

export default abstract class Table {
    public static match(curLineIdx: number, lineStartIdxs: number[], context: string): t_tableMatchResult {
        /**
         * if the current line is not following by an another new line
         * table can not be constructed so just return false
         */
        if (curLineIdx == lineStartIdxs.length - 1) {
            return [ false, 0, 0, null ];
        }

        /**
         * get the current line string and remove unneccassary outer pipes
         */
        let line: string = Utils.getLine(lineStartIdxs[curLineIdx], context).trim();
        line = Utils.extractFixes(line, '|').source;

        /**
         * after removed unneccassary pipes get the inner pipe count
         * and detect how many columns must be
         */
        let pipeCount: number = Utils.ccount(line, '|');
        let columns: number = pipeCount + 1;

        /**
         * get the next line string and remove unneccassary outer pipes
         */
        let nextLine: string = Utils.getLine(lineStartIdxs[curLineIdx + 1], context).trim();
        nextLine = Utils.extractFixes(nextLine, '|').source;

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
            } = Utils.extractFixes(str.trim(), ':');
            let isValid: boolean = Utils.isConsistOf(source.trim(), '-');

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

        while (rowIdx < lineStartIdxs.length) {
            let row: string = Utils.getLine(lineStartIdxs[rowIdx], context);

            if (Utils.ccount(row, '|') == 0) {
                break;
            }

            rowRange++;
            rowIdx++;
        }

        return [ true, rowRange, columns, textAligns ];
    }

    public static extract(curLineIdx: number, lineStartIdxs: number[], context: string,
    rowRange: number, columnCount: number, textAligns: t_textAlign[]): Element {
        let table: Element = new Element('table');
        let thead: Element = new Element('thead');
        let headtr: Element = new Element('tr');

        /**
         * get the table headers
         */
        let headstr: string = Utils.getLine(lineStartIdxs[curLineIdx], context).trim();
        headstr = Utils.extractFixes(headstr, '|').source;

        let headFields: string[] = headstr.split('|');
        
        for (let i: number = 0; i < columnCount; i++) {
            let context: string = headFields[i] || '';
            let textAlign: t_textAlign = textAligns[i];
            let attributes: t_attribute[] = [];

            if (textAlign.align != 'left') {
                attributes.push({ key: 'align', value: textAlign.align });
            }

            let contextParser: Inline = new Inline(context, '');
            let parsedContext: t_inlineParseResult = contextParser.parse();

            let th: Element = new Element('th', attributes);
            th.appendChild(parsedContext.el);

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
            let rowstr: string = Utils.getLine(lineStartIdxs[rowIdx + i], context).trim();
            rowstr = Utils.extractFixes(rowstr, '|').source;

            let rowFields: string[] = rowstr.split('|');

            let tr: Element = new Element('tr');

            for (let j: number = 0; j < columnCount; j++) {
                let context: string = rowFields[j] || '';
                let textAlign: t_textAlign = textAligns[j];
                let attributes: t_attribute[] = [];

                if (textAlign.align != 'left') {
                    attributes.push({ key: 'align', value: textAlign.align });
                }

                let contextParser: Inline = new Inline(context, '');
                let parsedContext: t_inlineParseResult = contextParser.parse();

                let td: Element = new Element('td', attributes);
                td.appendChild(parsedContext.el);

                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        }

        table.appendChild(tbody);

        return table;
    }
}
