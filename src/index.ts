import Tokenizer from './Tokenizer'
import Token from './Token'
import Parser from './Parser'
import Element from './Element'

let str: string = `
# H1
## H2
### H3 **asterisks and _underscores_ and _test_**
####H4
#####H5
###### H6

Alt-H1 **asterisks and _underscores_ and _test_**
=

Alt-H2 **asterisks and _underscores_ and _test_**
-

with **asterisks and _underscores_ and _test_**.
`;

let tokenizer: Tokenizer = new Tokenizer(str);
tokenizer.tokenize();

let tokens: Token[] = tokenizer.tokens;
let parser: Parser = new Parser(tokens);



tokenizer.tokens.forEach((token: Token) => {
    process.stdout.write(token.typestr + ' ');
    if (token.typestr == 'NEWLINE') {
        process.stdout.write('\n');
    }
})

console.log("---------");

//setTimeout(() => {
    parser.parse();
    parser.elements.forEach((el: Element) => {
        process.stdout.write(el.html);
    })
//}, 5000);
