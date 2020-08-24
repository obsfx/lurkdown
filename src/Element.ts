export type t_attribute = {
    key: string,
    value: string
}

export default class Element {
    tag: string;
    attributes: t_attribute[];
    text: string;
    childs: Element[];

    constructor(tag: string, attributes: t_attribute[] = [], text: string = '') {
        this.tag = tag;
        this.attributes = attributes;
        this.text = text;
        this.childs = [];
    }

    appendChild(child: Element): void {
        this.childs.push(child);
    }

    emitHtml(level: number = 0): string {
        if (this.tag.trim() == '') {
            this.childs.forEach((el: Element) => this.text += el.emitHtml());
            return this.text;
        }

        let tab: string = '  '.repeat(level);
        let attributes: string = this.attributes.reduce((prev: string, current: t_attribute) => {
            return `${prev} ${current.key}='${current.value}'`;
        }, '');

        let html: string = `\n${tab}<${this.tag}${attributes}>\n${tab}${this.text}`;
        this.childs.forEach((el: Element) => html += el.emitHtml(level + 1));
        html += `\n${tab}</${this.tag}>`;

        return html;
    }
}
