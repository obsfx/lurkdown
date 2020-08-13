import TokenType from './TokenType'
import Token from './Token'

export default class Tokenizer {
    index: number;
    tokens: Token[];
    buffer: string;

    constructor(buffer: string) {
        this.index = 0;
        this.tokens = [];
        this.buffer = buffer;
    }

    private consume(): string {
        return this.buffer[this.index++];
    }

    private peek(padding: number = 0): string {
        return this.buffer[this.index + padding];
    }

    private isEOF(char: string): boolean {
        return char == '\0' || 
            this.index >= this.buffer.length;
    }

    private isDigit(char: string): boolean {
        return char >= '0' && char <= '9';
    }

    private getUntil(terminators: string[]): string {
        let start: number = this.index - 1;

        while (terminators.indexOf(this.peek()) < 0 && this.peek() != '\n' && !this.isEOF(this.peek())) {
            this.consume();
        }

        return this.buffer.substring(start, this.index);
    }

    private addToken(type: TokenType, typestr: string, literal: string): void {
        this.tokens.push(new Token(type, typestr, literal));
    }

    public tokenize(): void {
        let char: string = this.consume();

        switch (char) {
            case ' ': this.addToken(TokenType.WHITESPACE, 'WHITESPACE',' '); break;
            case '=': this.addToken(TokenType.EQ, 'EQ', '='); break;
            case '+': this.addToken(TokenType.PLUS, 'PLUS', '+'); break;
            case ':': this.addToken(TokenType.SEMICOLON, 'SEMICOLON', ':'); break;
            case '!': this.addToken(TokenType.BANG, 'BANG', '!'); break;
            case '|': this.addToken(TokenType.PIPE, 'PIPE', '|'); break;
            case '<': this.addToken(TokenType.LT, 'LT', '<'); break;
            case '>': this.addToken(TokenType.GT, 'GT', '>'); break;
            case '[': this.addToken(TokenType.LEFT_SQ_PAR, 'LEFT_SQ_PAR', '['); break;
            case ']': this.addToken(TokenType.RIGHT_SQ_PAR, 'RIGHT_SQ_PAR', ']'); break;
            case '(': this.addToken(TokenType.LEFT_PAR, 'LEFT_PAR', '('); break;
            case ')': this.addToken(TokenType.RIGHT_PAR, 'RIGHT_PAR', ')'); break;
            case '\n': this.addToken(TokenType.NEWLINE, 'NEWLINE', '\n'); break;

            case '#': {
                let start: number = this.index - 1;

                while (this.peek() == '#') {
                    this.consume();
                }

                let headerType: number = this.index - start;
                let literal: string = headerType.toString();

                switch (headerType) {
                    case 1: this.addToken(TokenType.H1, 'H1', literal); break;
                    case 2: this.addToken(TokenType.H2, 'H2', literal); break;
                    case 3: this.addToken(TokenType.H3, 'H3', literal); break;
                    case 4: this.addToken(TokenType.H4, 'H4', literal); break;
                    case 5: this.addToken(TokenType.H5, 'H5', literal); break;
                    case 6: this.addToken(TokenType.H6, 'H6', literal); break;
                }
            } break;

            case '*': {
                if (this.peek() == '*') {
                    this.consume();
                    this.addToken(TokenType.DOUBLE_ASTERISKS, 'DOUBLE_ASTERISKS', '**');
                } else {
                    this.addToken(TokenType.ASTERISKS, 'ASTERISKS', '*');
                }
            } break;

            case '-': {
                if (this.peek() == '-' && this.peek(1) == '-') {
                    let minusLiteral: string = '--';

                    while (this.peek() == '-' && !this.isEOF(this.peek())) {
                        minusLiteral += this.consume();
                    }

                    this.addToken(TokenType.LONG_MINUS, 'LONG_MINUS', minusLiteral);
                } else {
                    this.addToken(TokenType.MINUS, 'MINUS', '-');
                }
            } break;

            case '_': {
                if (this.peek() == '_') {
                    this.consume();
                    this.addToken(TokenType.DOUBLE_UNDERSCORE, 'DOUBLE_UNDERSCORE', '__');
                } else {
                    this.addToken(TokenType.UNDERSCORE, 'UNDERSCORE', '_');
                }
            } break;

            case '~': {
                if (this.peek() == '~') {
                    this.consume();
                    this.addToken(TokenType.DOUBLE_TILDE, 'DOUBLE_TILDE', '~~');
                }
            } break;

            case '`': {
                if (this.peek() == '`' && this.peek(1) == '`') {
                    this.consume();
                    this.consume();
                    this.addToken(TokenType.TRIPLE_BACKTICK, 'TRIPLE_BACKTICK', '```');
                } else {
                    this.addToken(TokenType.BACKTICK, 'BACKTICK', '`');
                }
            } break;

            default: {
                if (this.isDigit(char) && this.peek() == '.') {
                    this.consume();
                    this.addToken(TokenType.LIST_NUMBER, 'LIST_NUMBER', `${char}.`);
                } else {
                    let str: string = this.getUntil([' ', '*', '_', ']', ')', '>', '~', '`', '|']);
                    this.addToken(TokenType.STR, 'STR', str);
                }
            } break;
        }

        if (!this.isEOF(this.peek())) {
            this.tokenize();
        }
    }
}
