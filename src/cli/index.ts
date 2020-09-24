import config from '../config'

import emitter from '../emitter'

import fs from 'fs'
import minimist from 'minimist'

let warn = (txt: string) => console.log(`\u001b[33m${txt}\u001b[0m`);
let error = (txt: string) => console.log(`\u001b[31m${txt}\u001b[0m`);

const cli = (argv: minimist.ParsedArgs): void => {

    if (argv.help) {
        console.log('--theme // optional. available themes: darkand light. if you dont specify a theme, html file will be exported without any default styling.');
        console.log('');
        console.log(`--files // mandatory. specify file paths by enclosing with quotes and seperating with commas. e.g. --files='./path/to/file.md, ./path/to/file2.md, ./path/to/file3.md'`);
        console.log('');
        console.log(`--titles // optional. specify the titles that will be used in <title></title> tag in html files. they should be specified in the same order as files and as like files they should be enclosed with quotes and sepeated with commas. e.g --titles='file title, file2 title, file3 title'`);
        console.log('');
        console.log(`--outdir // optional. if you don't specify a output directory, files will be exported in same directory as like input files.`);
        console.log('');
        console.log(`--styles // optional. specify the custom css file paths if you want to customize the outputed html files. they are specified like files and titles. enclose with quotes and seperate with commas. e.g. --styles='./path/to/cssfile.css, ./path/to/cssfile2.css'`);
        console.log('');
        console.log(`--favico // optional. specify the path of favicon file.`);
        
        return;
    }
    console.log('reading arguments...');

    let err: boolean = false;
    if (typeof argv.config == 'string') {
        if (!fs.existsSync(argv.config)) {
            error(`'${argv.config}' config file couldn\'t found. please check the file path`);
            return;
        }

        let configdata: string = fs.readFileSync(argv.config, 'utf8');
        let configjson = JSON.parse(configdata);

        if (!Array.isArray(configjson.files)) {
            error('please specify files as a path title object array. -> [ { path: "/path/top/file", title: "title" } ]');
            return;
        }

        for (let i: number = 0; i < configjson.files.length; i++) {
            if (!fs.existsSync(configjson.files[i].path)) {
                error(`'${configjson.files[i].path}' input file couldn't found. please be sure about whether input file paths are correct.`);
                err = true;
            }
        }

        if (err) return;

        // styles
        let styles: string[] = [];
        if (configjson.styles && !Array.isArray(configjson.styles)) {
            error('please specify style files as a string array. -> [ "/path/to/css", "/path/to/css2" ]');
            return;
        }

        if (Array.isArray(configjson.styles)) {
            for (let i: number = 0; i < configjson.styles.length; i++) {
                if (!fs.existsSync(configjson.styles[i])) {
                    error(`'${configjson.styles[i]}' style file couldn\'t found. please check the file paths.`);
                    err = true;
                }
            }

            if (err) return;

            styles = configjson.styles;
        }

        //files
        let files: string[] = [];
        // titles
        let titles: string[] = [];
        configjson.files.forEach((file: any) => {
            files.push(file.path || '');
            titles.push(file.title || '');
        });

        // theme
        let theme: string = '';
        if (typeof configjson.theme == 'string') {
            if (config.themes[configjson.theme]) theme = configjson.theme;
            else warn(`'${configjson.theme}' theme couldn\'t found.`);
        }

        // outdir
        let outdir: string = '';
        if (typeof configjson.outdir == 'string') {
            outdir = configjson.outdir;
            if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
        }

        // favico
        let favico: string = '';
        if (typeof configjson.favico == 'string') {
            if (fs.existsSync(configjson.favico)) favico = configjson.favico;
            else warn(`'${configjson.favico}' file couldn\'t found`);
        }

        emitter(theme, files, titles, outdir, styles, favico);
    } else {
        if (typeof argv.files != 'string') {
            error('please specify input file');
            return;
        }

        // files
        let files: string[] = argv.files.split(',').map((path: string) => path.trim());

        for (let i: number = 0; i < files.length; i++) {
            if (!fs.existsSync(files[i])) {
                error(`'${files[i]}' input file couldn't found. please be sure about whether input file paths are correct.`);
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

        // styles
        let styles: string[] = [];
        if (typeof argv.styles == 'string') {
            styles = argv.styles.split(',').map((path: string) => path.trim());

            for (let i: number = 0; i < styles.length; i++) {
                if (!fs.existsSync(styles[i])) {
                    error(`'${styles[i]}' style file couldn\'t found. please check the file paths.`);
                    err = true;
                }
            }
        }

        if (err) return;

        // outdir
        let outdir: string = '';
        if (typeof argv.outdir == 'string') {
            outdir = argv.outdir;
            if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
        }

        // favico
        let favico: string = '';
        if (typeof argv.favico == 'string') {
            if (fs.existsSync(argv.favico)) favico = argv.favico;
            else warn(`'${argv.favico}' file couldn\'t found`);
        }

        emitter(theme, files, titles, outdir, styles, favico);
    }
}

export default cli;
