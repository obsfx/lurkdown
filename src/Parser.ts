import Token from './Token'
import TokenType from './TokenType'
import Element from './Element'

export default class Parser {
    index: number;
    currentLine: number;
    lineStartIndices: number[];
    tokens: Token[];
    elements: Element[];
    subencapsulations: TokenType[];
    htmlKeywords: Map<TokenType, string>;

    constructor(tokens: Token[]) {
        this.index = 0;
        this.currentLine = 0;
        this.lineStartIndices = [ 0 ];
        this.tokens = tokens;
        this.elements = [];
        this.subencapsulations = [ TokenType.DOUBLE_ASTERISKS, 
            TokenType.DOUBLE_UNDERSCORE,
            TokenType.ASTERISKS,
            TokenType.UNDERSCORE ];

        this.htmlKeywords = new Map();

        this.detectLineStartIndices();
        this.mapKeywords();
    }

    private mapKeywords(): void {
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

        this.htmlKeywords.set(TokenType.DOUBLE_TILDE, 'del');

        this.htmlKeywords.set(TokenType.ASTERISKS, 'i');
        this.htmlKeywords.set(TokenType.UNDERSCORE, 'i');

        this.htmlKeywords.set(TokenType.BACKTICK, 'code');
    }

    private detectLineStartIndices(): void {
        for (let i: number = 1; i < this.tokens.length; i++) {
            if (this.tokens[i - 1].type == TokenType.NEWLINE) {
                this.lineStartIndices.push(i);
            }
        }
    }

    private consume(): Token {
        return this.tokens[this.index++];
    }
    
    private peek(padding: number = 0): Token {
        return this.tokens[this.index + padding];
    }

    private seekFor(tokentype: TokenType): boolean {
        let index: number = this.index;

        while (this.index < this.tokens.length) {
            if (this.tokens[index].type == tokentype) {
                break;
            }

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

        while (index < this.tokens.length) {
            if (this.tokens[index].type == untiltoken) {
                break;
            }

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
/*
    private countUntil(lineStartIndex: number, searchedtoken: TokenType, untiltoken: TokenType): number {
        let tokencount: number = 0;

        while (lineStartIndex < this.tokens.length) {
            if (this.tokens[lineStartIndex].type == untiltoken) {
                break;
            }

            if (this.tokens[lineStartIndex].type == searchedtoken) {
                tokencount++;
            }

            lineStartIndex++;
        }

        return tokencount;
    }
*/
/*
    private stringifyLine(lineStartIndex: number): string {
        let str: string = '';

        while (lineStartIndex < this.tokens.length) {
            if (this.tokens[lineStartIndex].type == TokenType.NEWLINE) {
                break;
            }

            str += this.tokens[lineStartIndex].literal;

            lineStartIndex++;
        }

        return str;
    }
*/
    private getTokensOfLine(lineStartIndex: number): Token[] {
        let tokens: Token[] = [];

        while (lineStartIndex < this.tokens.length) {
            if (this.tokens[lineStartIndex].type == TokenType.NEWLINE) {
                break;
            }

            tokens.push(this.tokens[lineStartIndex]);

            lineStartIndex++;
        }

        return tokens;
    }
/*
    private isThereTable(): boolean {
        if (this.currentLine == this.lineStartIndices.length - 1) {
            return false;
        }

        let currentLineIndex: number = this.lineStartIndices[this.currentLine];
        let pipeCount: number = this.countUntil(currentLineIndex, TokenType.PIPE, TokenType.NEWLINE);

        let nextLineIndex = this.lineStartIndices[this.currentLine + 1];
        let dashCount: number = this.countUntil(nextLineIndex, TokenType.LONG_MINUS, TokenType.NEWLINE);

        return Math.min(pipeCount, dashCount) > 1 ? true : false;
    }
*/

    /**
     * check is there a pipe between two str and then if there is unneccessary outher tokens 
     * delete them and return modified token array.
     */
    private checkPipeBetweenStrAndFormat(lineStartIndex: number): [ boolean, Token[] ] {
        let lineTokens = this.getTokensOfLine(lineStartIndex)
        .filter((token: Token) => token.type != TokenType.WHITESPACE);

        let isThereAPipeBetweenStr: boolean = false;

        for (let i: number = 1; i < lineTokens.length - 1; i++) {
            if (lineTokens[i - 1].type != TokenType.PIPE && 
                lineTokens[i].type == TokenType.PIPE &&
                lineTokens[i + 1].type != TokenType.PIPE) {
                isThereAPipeBetweenStr = true;
            }
        }

        if (isThereAPipeBetweenStr) {
            if (lineTokens[0].type == TokenType.PIPE) {
                lineTokens.shift();
            }

            if (lineTokens[lineTokens.length - 1].type == TokenType.PIPE) {
                lineTokens.pop();
            }
        }

        return [ isThereAPipeBetweenStr, lineTokens ];
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

                let [ 
                    isThereAPipeBetweenStr, 
                    formattedLineTokens 
                ]: [ boolean, Token[] ] = this.checkPipeBetweenStrAndFormat(this.lineStartIndices[this.currentLine]);

                if (isThereAPipeBetweenStr) {

                }


                console.log(formattedLineTokens, isThereAPipeBetweenStr);
                //console.log(lineStringArr.filter((literal: string) => literal == '|'));

                this.currentLine++;
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

            case TokenType.DOUBLE_ASTERISKS: 
            case TokenType.DOUBLE_UNDERSCORE: 
            case TokenType.DOUBLE_TILDE:
            case TokenType.ASTERISKS:
            case TokenType.UNDERSCORE:
            case TokenType.BACKTICK:
                this.addElement(this.encapsulate(token));
            break;

            case TokenType.PIPE: {

            } break;

            default: this.addElement(token.literal); break;
        }

        if (this.index < this.tokens.length - 1) {
            this.parse();
        }
    }
}
