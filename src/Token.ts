import TokenType from './TokenType'

export default class Token  {
    type: TokenType;
    value: string;

    constructor(type: TokenType, value: string) {
        this.type = type;
        this.value = value;
    }
}
