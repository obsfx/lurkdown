import parse from './Parser'

let str: string = `
[1]: http://slashdot.org      "a  asfsaf  asfsaf  sfasfasfsaf"
[arbitrary case-insensitive reference text]: asfsafasfAAAAAAA 'test'
`;

//let str: string = `
//
//[I'm an inline-style link]( https://www.google.com )
//
//[I'm an inline-style link with title](https://www  's
//                                      afasfsaf')
//
//[1]: http://slashdot.org
//[arbitrary case-insensitive reference text]: asfsafasfAAAAAAA
//`;


parse(str);
