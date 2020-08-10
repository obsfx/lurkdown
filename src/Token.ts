import TokenType from './TokenType'

export default class Token {
    type: TokenType;
    typestr: string;
    literal: string;

    constructor(type: TokenType, typestr: string, literal: string) {
        this.type = type;
        this.typestr = typestr;
        this.literal = literal;
    }
}
