import Token from './Token'
import TokenType from './TokenType'
import Element from './Element'

export default class Parser {
    index: number;
    tokens: Token[];
    elements: Element[];
    subencapsulations: TokenType[];
    htmlKeywords: Map<TokenType, string>;

    constructor(tokens: Token[]) {
        this.index = 0;
        this.tokens = tokens;
        this.elements = [];
        this.subencapsulations = [ TokenType.DOUBLE_ASTERISKS, 
            TokenType.DOUBLE_UNDERSCORE,
            TokenType.ASTERISKS,
            TokenType.UNDERSCORE ];

        this.htmlKeywords = new Map();

        this.htmlKeywords.set(TokenType.H1, 'h1');
        this.htmlKeywords.set(TokenType.H2, 'h2');
        this.htmlKeywords.set(TokenType.H3, 'h3');
        this.htmlKeywords.set(TokenType.H4, 'h4');
        this.htmlKeywords.set(TokenType.H5, 'h5');
        this.htmlKeywords.set(TokenType.H6, 'h6');

        this.htmlKeywords.set(TokenType.EQ, 'h1');
        this.htmlKeywords.set(TokenType.MINUS, 'h2');

        this.htmlKeywords.set(TokenType.DOUBLE_ASTERISKS, 'strong');
        this.htmlKeywords.set(TokenType.DOUBLE_UNDERSCORE, 'strong');
        this.htmlKeywords.set(TokenType.ASTERISKS, 'i');
        this.htmlKeywords.set(TokenType.UNDERSCORE, 'i');
    }

    private consume(): Token {
        return this.tokens[this.index++];
    }
    
    private peek(padding: number = 0): Token {
        return this.tokens[this.index + padding];
    }

    private seekFor(tokentype: TokenType): boolean {
        let index: number = this.index;

        while (this.tokens[index].type != tokentype) {
            if (this.tokens[index].type == TokenType.NEWLINE || this.index >= this.tokens.length) {
                return false;
            }

            index++;
        }

        return true;
    }

    private look(tokentype: TokenType): boolean {
        return this.peek().type == tokentype;
    }

    private addElement(html: string): void {
        this.elements.push(new Element(html));
    }

    private encapsulate(untiltoken: Token): string {
        let isEnclosed: boolean = this.seekFor(untiltoken.type);

        if (isEnclosed) {
            let html: string = `<${this.htmlKeywords.get(untiltoken.type)}>`;

            while (!this.look(untiltoken.type)) {
                let token: Token = this.consume();

                if (this.subencapsulations.indexOf(token.type) > -1) {
                    html += this.encapsulate(token);
                } else {
                    html += token.literal;
                }
            }

            /**
             * cosume last enclosing token
             */
            this.consume();

            html += `<\\${this.htmlKeywords.get(untiltoken.type)}>`;
            return html;
        } else {
            return untiltoken.literal;
        }
    }

    private getUntil(untiltoken: TokenType): string {
        let html: string = '';

        while (!this.look(untiltoken) && this.index < this.tokens.length - 1) {
            let token: Token = this.consume();

            if (this.subencapsulations.indexOf(token.type) > -1) {
                html += this.encapsulate(token);
            } else {
                html += token.literal;
            }
        }

        return html;
    }

    private checkUntil(untiltoken: TokenType, checktoken: TokenType): boolean {
        let index: number = this.index;

        while (this.tokens[index].type != untiltoken && index < this.tokens.length - 1) {
            if (this.tokens[index].type != checktoken) {
                return false;
            }

            index++;
        }

        /**
         * preventing false positive because of adjacent newlines
         */
        return index != this.index ? true : false;
    }

    private backwardUntil(untiltoken: TokenType): void {
        while (this.tokens[this.index - 1].type != untiltoken && this.index > 0) {
            this.index--;
        }

        while (this.elements[this.elements.length - 1].html != '\n' && this.elements.length - 1 > 0) {
            this.elements.pop();
        }
    }

    private forwardUntil(untiltoken: TokenType): void {
        while (!this.look(untiltoken) && this.index < this.tokens.length - 1) {
            this.consume();
        }
    }

    /* ********************** */
    public parse(): void {
        let token: Token = this.consume();

        switch (token.type) {
            case TokenType.WHITESPACE: this.addElement(' '); break;

            case TokenType.NEWLINE: {
                if (this.checkUntil(TokenType.NEWLINE, TokenType.EQ) || this.checkUntil(TokenType.NEWLINE, TokenType.MINUS)) {
                    let token: Token = this.peek();

                    /**
                     * backward consumed newline token 
                     */
                    this.index--;
                    this.backwardUntil(TokenType.NEWLINE);

                    let tag: string = this.htmlKeywords.get(token.type) || 'h1';

                    this.addElement(`<${tag} class='ld-${tag}-bordered'>${this.getUntil(TokenType.NEWLINE)}</${tag}>`)

                    /**
                     * consume remaning newline after we bacwarded it
                     */
                    this.consume();

                    /**
                     * just skip until the next line
                     */
                    this.forwardUntil(TokenType.NEWLINE);

                    /**
                     * again consume the reaming newline but after we forwarded it
                     */
                    this.consume();
                }

                this.addElement('\n'); 
            } break;

            case TokenType.H1:
            case TokenType.H2:
            case TokenType.H3:
            case TokenType.H4:
            case TokenType.H5:
            case TokenType.H6: {
                if (this.look(TokenType.WHITESPACE)) {
                    this.consume();

                    let tag: string = this.htmlKeywords.get(token.type) || 'h5'; 
                    this.addElement(`<${tag}>${this.getUntil(TokenType.NEWLINE)}</${tag}>`);
                } else {
                    this.addElement('#'.repeat(Number(token.literal)));
                }
            } break;

            case TokenType.DOUBLE_ASTERISKS: this.addElement(this.encapsulate(token)); break;

            default: this.addElement(token.literal); break;
        }

        if (this.index < this.tokens.length - 1) {
            this.parse();
        }
    }
}
