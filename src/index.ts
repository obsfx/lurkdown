import Tokenizer from './Tokenizer'
import Token from './Token'
import Parser from './Parser'
import Element from './Element'

let str: string = `
Markdown | Test
| --------- | --- | ---
*Still* | \`renders\` | **nicely**
1 |
asfsafsaf | asfasfasfsaf


| sfasf
--- 
| asfsfsf 
asfsfsf  
`;

let tokenizer: Tokenizer = new Tokenizer(str);
tokenizer.tokenize();

let tokens: Token[] = tokenizer.tokens;
let parser: Parser = new Parser(tokens);

/*
tokenizer.tokens.forEach((token: Token) => {
    process.stdout.write(token.typestr + ' ');
    if (token.typestr == 'NEWLINE') {
        process.stdout.write('\n');
    }
})
*/

console.log("---------");

//setTimeout(() => {
    parser.parse();
    parser.elements.forEach((el: Element) => {
        process.stdout.write(el.html);
    })
//}, 5000);
