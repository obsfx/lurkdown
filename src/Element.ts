import { v4 as uuidv4 } from 'uuid';

export type t_attribute = {
    key: string,
    value: string
}

export default class Element {
    id: string;
    tag: string;
    attributes: t_attribute[];
    context: string;
    childs: Element[];

    constructor(tag: string, attributes: t_attribute[] = [], context: string = '') {
        this.id = uuidv4();
        this.tag = tag;
        this.attributes = attributes;
        this.context = context;
        this.childs = [];
    }

    appendChild(child: Element): void {
        this.childs.push(child);
    }

    emitHtml(level: number = 0): string {
        if (this.tag.trim() == '') {
            this.childs.forEach((el: Element) => this.context += el.emitHtml());
            return this.context;
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
