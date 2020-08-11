import Token from './Token'

export default class Parser {
    index: number;
    tokens: Token[];

    constructor(tokens: Token[]) {
        this.index = 0;
        this.tokens = tokens;
    }
}
