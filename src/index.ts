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

[I'm a relative reference to a repository file](../blob/master/LICENSE)

[You can use numbers for reference-style link definitions][1]

Or leave it empty and use the __[link text itself]__.

[arbitrary case-insensitive reference text]: https://www.mozilla.org
[1]: http://slashdot.org
[link text itself]: http://www.reddit.com//
1. First ordered list item
2. Another item
  * Unordered sub-list. 
1. Actual numbers don't matter, just that it's a number
  1. Ordered sub-list
4. And another item.
   You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we'll use three here to also align the raw Markdown).

   To have a line break without a paragraph, you will need to use two trailing spaces.
   Note that this line is separate, but within the same paragraph.
   (This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)
* Unordered list can use asterisks
- Or minuses
+ Or pluses
1. Ordered sub-list
1. First ordered list item
2. Another item
   * Unorderedk
4. And another item.
   1. test
   1. test 2
      1. Ordered sub-list
      1. First ordered list item
      2. Another item
         * Unorderedk
      4. And another item.
         1. test
         1. test 2

Alt-H1
======
Alt-H2
------
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
