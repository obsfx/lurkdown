import Element from './Element'
import { v4 as uuidv4 } from 'uuid'

export default class ListBuffer {
    id: string;
    type: 'ol' | 'ul';
    start: number;
    outerindent: number;
    innerindent: number;
    childs: (Element | ListBuffer)[];

    constructor(type: 'ol' | 'ul', start: number, outerindent: number, innerindent: number) {
        this.id = uuidv4();
        this.type = type;
        this.start = start;
        this.outerindent = outerindent;
        this.innerindent = innerindent;

        this.childs = [];
    }

    setChilds(childs: (Element | ListBuffer)[]): void {
        this.childs = childs;
    }

    appendChild(child: Element | ListBuffer): void {
        this.childs.push(child);
    }
}
