import config from '../config'
import Parser from '../parser'
import Utils from '../parser/Utils'
import Element from '../parser/Element'

import fs from 'fs'
import path from 'path'

const emitter = (
    theme: string,
    files: string[],
    titles: string[],
    outdir: string,
    styles: string[],
    favico: string
) => {
    console.log(theme, titles, outdir);
    let basehtml: string = fs.readFileSync(config.base, 'utf8');
    let favicon64: string = Utils.b64(favico);

    basehtml = basehtml.replace(config.favico, `<link rel="icon" href="${favicon64}" >`);

    let css: string = '';

    if (theme != '') {
        config.themes[theme].forEach((style: string) => {
            css += fs.readFileSync(style, 'utf8');
        });
    }

    styles.forEach((style: string) => {
        css += fs.readFileSync(style, 'utf8');
    });

    basehtml = basehtml.replace(config.style, `<style>${css}</style>`);

    files.forEach((p: string, i: number) => {
        let markdown: string = fs.readFileSync(p, 'utf8');

        let parsedpath: path.ParsedPath = path.parse(p);
        let targetdir: string = outdir == '' ?
            path.join(parsedpath.dir, `${parsedpath.name}.html`) :
            path.join(outdir, `${parsedpath.name}.html`);

        let parser: Parser = new Parser(markdown);
        let body: Element = parser.parse();
        let html: string = body.emitHtml();

        let output: string = basehtml.replace(config.body, html);

        let title: string = titles[i] || '';

        output = output.replace(config.title, title);

        fs.writeFileSync(targetdir, output);
    });
}

export default emitter;
