import { v4 as uuidv4 } from 'uuid';

export type t_attribute = {
    key: string,
    value: string
}

export default class Element {
    id: string;
    tag: string;
    attributes: t_attribute[];
    outerindent: number;
    innerindent: number;
    context: string;
    childs: Element[];

    constructor(tag: string, attributes: t_attribute[] = [], context: string = '', outerindent: number = 0, innerindent: number = 0) {
        this.id = uuidv4();
        this.tag = tag;
        this.attributes = attributes;
        this.outerindent = outerindent;
        this.innerindent = innerindent;
        this.context = context;
        this.childs = [];
    }

    appendChild(child: Element): void {
        this.childs.push(child);
    }

    emitHtml(level: number = 0): string {
        if (this.tag.trim() == '') {
            let ctx: string = this.context;
            this.childs.forEach((el: Element) => ctx += el.emitHtml());
            return ctx;
        }

        let tab: string = '  '.repeat(level);
        let attributes: string = this.attributes.reduce((prev: string, current: t_attribute) => {
            return `${prev} ${current.key}='${current.value}'`;
        }, '');

        let html: string = `\n${tab}<${this.tag}${attributes}>\n${tab}${this.context}`;
        this.childs.forEach((el: Element) => html += el.emitHtml(level + 1));
        html += `\n${tab}</${this.tag}>`;

        return html;
    }
}
