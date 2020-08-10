import TokenType from './TokenType'
import Token from './Token'

export default class Tokenizer {
    index: number;
    line: number;
    buffer: string;

    tokens: Token[]; 
    errors: string[];

    constructor(input: string) {
        this.index = 0;
        this.line = 0;
        this.buffer = input;
        this.tokens = [];
    }

    private consume(): string {
        return this.buffer[this.index++];
    }

    private peek(): string {
        return this.buffer[this.index + 1];
    }

    private isEOF(char: string): boolean {
        return char == '\0';
    }

    private isDigit(char: string): boolean {
        return char >= '0' && char <= '9';
    }

    private error(msg: string, line: number) {
        this.errors.push(`Line: ${line}: ${msg}`);
    }

    tokenize(): void {
        let char: string = this.consume();

        switch (char) {
            case '\n': {
                this.line++;
                this.tokens.push(new Token(TokenType.NEW_LINE, ''));
            } break;

            case '[': {

            } break;

            case '[': this.tokens.push(new Token(TokenType.LEFT_SQUARE_BRACKET, '')); break;
            case ']': this.tokens.push(new Token(TokenType.RIGHT_SQUARE_BRACKET, '')); break;
            case '(': this.tokens.push(new Token(TokenType.LEFT_PAREN, '')); break;
            case ')': this.tokens.push(new Token(TokenType.RIGHT_PAREN, '')); break;
            case '<': this.tokens.push(new Token(TokenType.LEFT_ANGLE_BRACKET, '')); break;
            case '>': this.tokens.push(new Token(TokenType.RIGHT_ANGLE_BRACKET, '')); break;
            case '-': this.tokens.push(new Token(TokenType.DASH, '')); break;
            case '+': this.tokens.push(new Token(TokenType.PLUS, '')); break;
            case '"': this.tokens.push(new Token(TokenType.QUOTE, '')); break;
            case '!': this.tokens.push(new Token(TokenType.BANG, '')); break;
            case '`': this.tokens.push(new Token(TokenType.BACK_TICK, '')); break;

            case '*': {
                if (this.peek() == '*') {
                    this.consume();

                    while (this.buffer.substr(this.index + 1, this.index + 3) != '**') {
                        let start: number = this.index;


                    }
                }
            } break;

            case '_': {
                if (this.peek() == '_') {
                    this.consume();
                    this.tokens.push(new Token(TokenType.DOUBLE_UNDERSCORE, ''))
                } else {
                    this.tokens.push(new Token(TokenType.UNDERSCORE, ''));
                }
            } break;

            case '~': {
                if (this.peek() == '~') {
                    this.consume();
                    this.tokens.push(new Token(TokenType.DOUBLE_TILDE, ''));
                }
            } break;

            case '#': {
                let hashCount: number = 1;

                while (this.peek() == '#' && !this.isEOF(this.peek()) && hashCount + 1 < 7) {
                    this.consume();
                    hashCount++;
                }

                this.tokens.push(new Token(TokenType.HEADER, `h${hashCount}`));
            } break;

            default: {

            } break;
        }
    }

    private getuntil(char: string): string {
        let start: number = this.index;

        while (this.peek() != char) {
            this.consume();
        }

        return this.buffer.substring(start, this.index);
    }
}
