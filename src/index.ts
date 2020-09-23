//import Parser from './parser'
//import Element from './parser/Element'
import cli from './cli'
//
//import fs from 'fs'

import minimist from 'minimist';

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2));

cli(argv);


/*
let data = fs.readFileSync(`${__dirname}/../test.md`, 'utf8');
let template = fs.readFileSync(`${__dirname}/templates/base.html`, 'utf8');

console.log('*********************************')
console.log(JSON.stringify(data.split('\r\n').join('\n')));
console.log('*********************************')

//setTimeout(() => {
    let MDParser: Parser = new Parser(data || '');
    let body: Element = MDParser.parse();
    //debugger;
    let k = body.emitHtml();
    template = template.replace('<!--@body-->', k);
    //debugger;
    fs.writeFileSync(`${__dirname}/../index.html`, template);
    //debugger;
//}, 3000);
*/
