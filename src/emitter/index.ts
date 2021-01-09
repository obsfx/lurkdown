import config from '../config'
import { 
  Block, 
  Utils, 
  Element
} from '../parser'

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
    console.log('generating html files...');
    let basehtml: string = fs.readFileSync(config.base, 'utf8');

    if (favico != '') {
      let favicon64: string = Utils.b64(favico);
      basehtml = basehtml.replace(config.favico, `<link rel="icon" type="${favicon64.split(';')[0].split(':')[1]}" href="${favicon64}" >`);
    }

    let css: string = '';

    if (theme != '') {
        config.themes[theme].forEach((style: string) => {
            css += fs.readFileSync(style, 'utf8');
        });
    }

    if (styles.length > 0) {
        console.log('reading external style files...');
        styles.forEach((style: string) => {
            console.log(`reading '${style}' style file...`);
            css += fs.readFileSync(style, 'utf8');
        });
    }

    basehtml = basehtml.replace(config.style, `<style>${css}</style>`);

    files.forEach((p: string, i: number) => {
        console.log(`reading '${p}' file...`);
        let markdown: string = fs.readFileSync(p, 'utf8');

        let parsedpath: path.ParsedPath = path.parse(p);
        let targetdir: string = outdir == '' ?
            path.join(parsedpath.dir, `${parsedpath.name}.html`) :
            path.join(outdir, `${parsedpath.name}.html`);

        console.log(`parsing '${p}' file...`);
        let parser: Block = new Block(markdown);
        let body: Element = parser.parse();
        let html: string = body.emitHtml();

        let output: string = basehtml.replace(config.body, html);

        let title: string = titles[i] || '';

        output = output.replace(config.title, title);

        console.log(`done. exported to ${targetdir}`);
        fs.writeFileSync(targetdir, output);
    });
}

export default emitter;
