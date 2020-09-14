import Parser from './parser'
import Element from './parser/Element'

let str: string = `Emphasis, aka italics, with *asterisks* or _underscores_.
Strong emphasis, aka bold, with **asterisks** or __underscores__.
Combined emphasis with **asterisks and _underscores_**.

Strikethrough uses two tildes. ~~Scratch this.~~
| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |
[I'm an inline-style link](https://www.google.com)

[I'm an inline-style link with title](https://www.google.com "Google's Homepage")

_[**I'm a reference-style link**][Arbitrary case-insensitive reference text]_
`;


/*
let str: string = `
test
---
`;
*/

let MDParser: Parser = new Parser(str);
let body: Element = MDParser.parse();

console.log(body.emitHtml());
