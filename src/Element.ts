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
        this.childs =[];
    }

    appendChild(child: Element): void {
        this.childs.push(child);
    }

    emitHtml(level: number = 0): string {
        let tab: string = '    '.repeat(level);
        let attributes: string = this.attributes.reduce((prev: string, current: t_attribute) => {
            return `${prev} ${current.key}='${current.value}'`;
        }, '');

        let html: string = `${tab}<${this.tag}${attributes}>\n${tab}${this.text}\n`;
        this.childs.forEach((el: Element) => html += el.emitHtml(level + 1));
        html += `${tab}</${this.tag}>\n`;

        return html;
    }
}
