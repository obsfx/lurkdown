import parse from './Parser'
/*
let str: string = `
Emphasis, aka italics, with *asterisks* or _underscores_.

Strong emphasis, aka bold, with **asterisks** or __underscores__.

Combined emphasis with **asterisks and _underscores_**.

Strikethrough uses two tildes. ~~Scratch this.~~

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |
`;
*/
//let str: string = `
//
//[I'm an inline-style link]( https://www.google.com )
//
//[I'm an inline-style link with title](https://www  's
//                                      afasfsaf')
//
//`;
//

let str: string = `
[1]: http://slashdot.org 
[arbitrary case-insensitive reference text]: asfsafasf
`;
parse(str);
