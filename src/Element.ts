export type attribute = {
    key: string,
    value: string
}

export default class Element {
    tag: string;
    attributes: attribute[];
    text: string;

    constructor(tag: string, attributes: attribute[], text: string) {
        this.tag = tag;
        this.attributes = attributes;
        this.text = text;
    }
}
