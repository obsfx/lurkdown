import Token from './Token'
import TokenType from './TokenType'

export default class Parser {
    index: number;
    tokens: Token[];
    output: string;

    constructor(tokens: Token[]) {
        this.index = 0;
        this.tokens = tokens;
        this.output = '';
    }

    private consume(): Token {
        return this.tokens[this.index++];
    }
    
    private peek(): Token {
        return this.tokens[this.index];
    }

    private look(tokentype: TokenType): boolean {
        return this.peek().type == tokentype;
    }

    public parse(): void {
        let token: Token = this.consume();

        switch (token.type) {
            case TokenType.DOUBLE_ASTERISK: {
                let start: number = this.index - 1;
                let str: string = '';

                while (!this.look(TokenType.DOUBLE_ASTERISK) && this.index < this.tokens.length) {
                    if (this.look(TokenType.NEWLINE)) {
                        //
                        return;
                    }
                }
            } break;
        }
    }
}
