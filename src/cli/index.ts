import config from '../config'

import emitter from '../emitter'

import fs from 'fs'
import minimist from 'minimist'

let warn = (txt: string) => console.log(`\u001b[33m${txt}\u001b[0m`);
let error = (txt: string) => console.log(`\u001b[31m${txt}\u001b[0m`);

const cli = (argv: minimist.ParsedArgs): void => {
    console.log(argv);
    if (typeof argv.config == 'string') {

    } else {
        if (typeof argv.files != 'string') {
            error('please specify input file');
            return;
        }

        // files
        let files: string[] = argv.files.split(',').map((path: string) => path.trim());

        let err: boolean = false;
        for (let i: number = 0; i < files.length; i++) {
            if (!fs.existsSync(files[i])) {
                error(`${files[i]} input file couldn't found. please be sure about whether input file paths are correct.`)
                err = true;
            }
        }

        if (err) return;

        // theme
        let theme: string = '';
        if (typeof argv.theme == 'string') {
            if (config.themes[argv.theme]) theme = argv.theme;
            else warn(`'${argv.theme}' theme couldn\'t found.`);
        }

        // titles
        let titles: string[] = [];
        if (typeof argv.titles == 'string') {
            titles = argv.titles.split(',').map((title: string) => title.trim());
        }

        // outdir
        let outdir: string = '';
        if (typeof argv.outdir == 'string') {
            outdir = argv.outdir;
            if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
        }

        // styles
        let styles: string[] = [];
        if (typeof argv.styles == 'string') {
            styles = argv.styles.split(',').map((path: string) => path.trim());

            for (let i: number = 0; i < styles.length; i++) {
                if (!fs.existsSync(styles[i])) {
                    error(`'${styles[i]}' style file couldn\'t found. please check the file paths.`);
                    return;
                }
            }
        }

        // favico
        let favico: string = '';
        if (typeof argv.favico == 'string') {
            if (fs.existsSync(argv.favico)) favico = argv.favico;
            else warn(`${argv.favico} file couldn\'t found`);
        }

        emitter(theme, files, titles, outdir, styles, favico);
    }
}

export default cli;
