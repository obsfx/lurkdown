import parse from './Parser'

let str: string = `
deneme yazısı denem deneme deneme yazısı [I'm an inline-style link with title](asfsaf "")

a|b|c
:---:|:---|---
`;
console.log(str, str.length);
parse(str);
