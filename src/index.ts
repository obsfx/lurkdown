import Tokenizer from './Tokenizer'
import Token from './Token'

let str: string = `
# H1
## H2
### H3
#### H4
##### H5
###### H6

Alt-H1
======

Alt-H2
------

Emphasis, aka italics, with *asterisks* or _underscores_.
Strong emphasis, aka bold, with **asterisks** or __underscores__.
Combined emphasis with **asterisks and _underscores_**.
Strikethrough uses two tildes. ~~Scratch this.~~

1. First ordered list item
2. Another item

[I'm an inline-style link](https://www.google.com)

URLs and URLs in angle brackets will automatically get turned into links. 
http://www.example.com or <http://www.example.com> and sometimes 
example.com (but not on Github, for example).
`;

let tokenizer: Tokenizer = new Tokenizer(str);
tokenizer.tokenize();

tokenizer.tokens.forEach((token: Token) => {
    process.stdout.write(token.typestr + ' ');
    if (token.typestr == 'NEWLINE') {
        process.stdout.write('\n');
    }
})
