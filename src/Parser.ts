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
        this.subencapsulations = [ 
            TokenType.DOUBLE_ASTERISKS, 
            TokenType.DOUBLE_UNDERSCORE,
            TokenType.ASTERISKS,
            TokenType.UNDERSCORE,
            TokenType.BACKTICK
        ];

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
         * prevent false positive because of adjacent newlines
         */
        return index != this.index ? true : false;
    }

    private backwardUntil(untiltoken: TokenType): void {
        while (this.index > 0) {
            if (this.tokens[this.index - 1].type == untiltoken) {
                break;
            }

            this.index--;
        }

        while (this.elements.length - 1 > 0) {
            if (this.elements[this.elements.length - 1].html == '\n') {
                break;
            }

            this.elements.pop();
        }
    }

    private forwardUntil(untiltoken: TokenType): void {
        while (this.index < this.tokens.length - 1) {
            if (this.look(untiltoken)) {
                break;
            }

            this.consume();
        }
    }

    private getTokensOfLine(lineIndex: number): Token[] {
        let lineStartIndex: number = this.lineStartIndices[lineIndex];
        let tokens: Token[] = [];

        if (lineIndex != undefined) {
            while (lineStartIndex < this.tokens.length) {
                if (this.tokens[lineStartIndex].type == TokenType.NEWLINE) {
                    break;
                }

                tokens.push(this.tokens[lineStartIndex]);

                lineStartIndex++;
            }
        }

        return tokens;
    }

    private checkPipeBetweenStr(lineTokens: Token[]): boolean {
        let isThereAPipeBetweenStr: boolean = false;

        for (let i: number = 1; i < lineTokens.length - 1; i++) {
            if (lineTokens[i - 1].type != TokenType.PIPE && 
                lineTokens[i].type == TokenType.PIPE &&
                lineTokens[i + 1].type != TokenType.PIPE) {
                isThereAPipeBetweenStr = true;
            }
        }

        return isThereAPipeBetweenStr;
    }

    private deleteOuterPipes(lineTokens: Token[]): Token[] {
        if (lineTokens[0].type == TokenType.PIPE) {
            lineTokens.shift();
        }

        if (lineTokens[lineTokens.length - 1].type == TokenType.PIPE) {
            lineTokens.pop();
        }

        return lineTokens;
    }

    private checkPipePattern(condition: Function, pipeAdjacent: TokenType, matchThreshold: number, tokens: Token[]): boolean {
        let matchedPatterns: number = 0;

        for (let i: number = 0; i < tokens.length; i++) {
            if (condition(tokens[i], pipeAdjacent)) {
                if (i < tokens.length - 1) {
                    if (tokens[i + 1].type == TokenType.PIPE) {
                        matchedPatterns++;
                    }
                } else if (tokens.length > 1) {
                    matchedPatterns++;
                }
            }
        }

        return matchedPatterns < matchThreshold ? false : true;
    }

    private constructTableIfThereIs(): boolean {
        if (this.currentLine == this.lineStartIndices.length - 1) {
            return false;
        }

        let currentLine: Token[] = this.getTokensOfLine(this.currentLine)
        .filter((token: Token) => token.type != TokenType.WHITESPACE);

        /**
         * check is there any pipe that separates at least 2 non pipe thing
         */
        let isThereAPipeBetweenStr: boolean = this.checkPipeBetweenStr(currentLine);

        if (isThereAPipeBetweenStr) {
            /**
             * delete outer pipes we dont need them
             */
            currentLine = this.deleteOuterPipes(currentLine);

            /**
             * get the pipe count
             */
            let pipeCount: number = currentLine
            .filter((token: Token) => token.type == TokenType.PIPE).length;

            /**
             * we have to find innerpipecount + 1 dash in the next line to construct
             * a table
             */
            let seekingDashCount: number = pipeCount + 1;

            let nextLine: Token[] = this.getTokensOfLine(this.currentLine + 1)
            .filter((token: Token) => token.type != TokenType.WHITESPACE);

            let isThereDashPattern: boolean = this.checkPipePattern(
                (token: Token, pipeAdjacent: TokenType): boolean => {
                    return token.type == pipeAdjacent
                }, TokenType.LONG_MINUS, seekingDashCount, nextLine);

            /**
             * if we cant find the pattern to construct the table
             * just return false
             */
            if (!isThereDashPattern) {
                return false;
            }

            let html: string = '<table>\n';

            /**
             * get back to the beginning of the line and 
             * stringify all the things.
             */
            this.backwardUntil(TokenType.NEWLINE);

            let head: string[] = this.getUntil(TokenType.NEWLINE).split('|');

            /**
             * consume remaining newline
             */
            this.consume();
            this.currentLine++;

            html += '<tr>\n';
            for (let i: number = 0; i < seekingDashCount; i++) {
                html += `<th>${head[i] ? head[i].trim() : ''}</th>\n`;
            }
            html += '</tr>\n';

            /**
             * forward header dashes
             */
            this.forwardUntil(TokenType.NEWLINE);
            this.consume();
            this.currentLine++;

            /**
             * after the header part we will look for
             * forward rows that contains the content
             */
            while (this.currentLine < this.lineStartIndices.length) {
                /**
                 * nearly same thing like the header part but we will
                 * look for non pipe tokens that has a pipe at the right side of them
                 */
                let forwardLine: Token[] = this.getTokensOfLine(this.currentLine)
                .filter((token: Token) => token.type != TokenType.WHITESPACE);

                let isThereRowPattern: boolean = this.checkPipePattern(
                    (token: Token, exceptThis: TokenType) => {
                        return token.type != exceptThis
                    }, TokenType.PIPE, 1, forwardLine);

                if (!isThereRowPattern) {
                    break;
                }

                let row: string[] = this.getUntil(TokenType.NEWLINE).split('|');

                /**
                 * consume the remaining newline
                 */
                this.consume();
                this.currentLine++;

                html += '<tr>\n';
                for (let i: number = 0; i < seekingDashCount; i++) {
                    html += `<td>${row[i] ? row[i].trim() : ''}</td>\n`
                }
                html += '</tr>\n';
            }

            html += '</table>';
            this.addElement(html);
        } else {
            let nextLineDashCount: number = this.getTokensOfLine(this.currentLine + 1)
            .filter((token: Token) => token.type == TokenType.LONG_MINUS)
            .length;

            if ((nextLineDashCount < 1) || 
                currentLine[0].type != TokenType.PIPE && 
                currentLine[currentLine.length - 1].type != TokenType.PIPE) {
                return false;
            }

            /**
             * get back to the beginning of the line and 
             * stringify all the things.
             */
            this.backwardUntil(TokenType.NEWLINE);

            let head: string = this.getUntil(TokenType.NEWLINE)
            .split('|')
            .join('');

            /**
             * consume remaining newline
             */
            this.consume();
            this.currentLine++;

            let html: string = `<table>\n<tr><th>${head.trim()}</th></tr>\n`;

            /**
             * forward header dashes
             */
            this.forwardUntil(TokenType.NEWLINE);
            this.consume();
            this.currentLine++;

            while (this.currentLine < this.lineStartIndices.length) {
                let forwardLinePipeCount: number = this.getTokensOfLine(this.currentLine)
                .filter((token: Token) => token.type == TokenType.PIPE)
                .length;

                if (forwardLinePipeCount == 0) {
                    break;
                }

                let row: string = this.getUntil(TokenType.NEWLINE)
                .split('|')
                .join('');

                html += `<tr><td>${row.trim()}</td></tr>\n`;

                /**
                 * consume the remaining newline
                 */
                this.consume();
                this.currentLine++;
            }

            html += '</table>';
            this.addElement(html);
        }

        return true;
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
                     * consume remaining newline after we bacwarded it
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
                if (!this.constructTableIfThereIs()) {
                    this.addElement(token.literal);
                }
            } break;

            default: this.addElement(token.literal); break;
        }

        if (this.index < this.tokens.length - 1) {
            this.parse();
        }
    }
}
