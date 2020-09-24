# lurkdown [![npm version](https://badge.fury.io/js/lurkdown.svg)](https://badge.fury.io/js/lurkdown)

lurkdown is a markdown transpiler to create standalone html files that was built on nodejs with typescript. lurkdown converts all locally hosted image files to base64 to avoid dealing with images when we want to host that html files somewhere. I mainly developed this to convert my markdown formatted notes to html and then use them like static blog posts. lurkdown is a command line tool. I will make a *library* version that will be usable in web and nodejs projects later.

![](https://raw.githubusercontent.com/obsfx/lurkdown/master/demo.gif)



## installation

You can directly install via npm

```
npm i -g lurkdown
```

Or you can download the standalone executable version.

[Standalone Executables](https://github.com/obsfx/lurkdown/releases)

## disclaimer

some core features are not implemented:

1.  Combined blockquotes. *because it's sucks.*
2.  Reference style images. *I don't need it*

restrictions:

1. lurkdown doesn't deal with font files. You have to host them at somewhere and @import the css file of font definitions.



## how to use

You can directly use with command line arguments.

```
--theme // optional. available themes: darkand light. if you dont specify a theme, html file will be exported without any default styling.

--files // mandatory. specify file paths by enclosing with quotes and seperating with commas. 
e.g. --files='./path/to/file.md, ./path/to/file2.md, ./path/to/file3.md'

--titles // optional. specify the titles that will be used in <title></title> tag in html files. they should be specified in the same order as files and as like files they should be enclosed with quotes and sepeated with commas.
e.g --titles='file title, file2 title, file3 title'

--outdir // optional. if you don't specify a output directory, files will be exported in same directory as like input files.

--styles // optional. specify the custom css file paths if you want to customize the outputed html files. they are specified like files and titles. enclose with quotes and seperate with commas.
e.g. --styles='./path/to/cssfile.css, ./path/to/cssfile2.css'

--favico // optional. specify the path of favicon file.

npx ts-node ./src/index.ts --theme=dark --files='./src/test/http_notes.md, ./src/test/test.md' --titles='deneme deneme, deneme2 deneme2' --outdir=./src/export/test  --favico=./src/icon.ico
```

example

```
lurkdown --theme=light --files='./src/test/http_notes.md' --titles='http notes' --outdir=./src/export --styles=./src/templates/themes/light/customizations.css --favico=./src/icon.ico

```



Or you can just pass a sing config.json file with the `--config`.

Example usage:

```json
{
    "favico": "./favicon.ico",
    "outdir": "./ld-output",
    "theme": "dark",
    "styles": [
        "./src/custom.css",
        "./src/custom2.css"
    ],
    "files": [
        { "path": "./src/test/test.md", "title": "Test File" },
        { "path": "./src/test/event_loop.md", "title": "Event Loops" },
        { "path": "./src/test/http_notes.md", "title": "HTTP Notes" }
    ]
}
```

```
lurkdown --config=./config.json
```



## customization

You can customize the elements by using this css class names.

```css
.ld-wrapper { }

.ld-div { }

.ld-blockquote { }

.ld-pre { }
.ld-code { }

.ld-em { }
.ld-strong { }
.ld-del { }

.ld-h1 { }
.ld-h2 { }
.ld-h3 { }
.ld-h4 { }
.ld-h5 { }
.ld-h6 { }

.ld-img { }

.ld-a { }

.ld-ol { }
.ld-ul { }
.ld-li { }

.ld-checkbox { }

.ld-table { }
.ld-thead { }
.ld-tbody { }
.ld-tr { }
.ld-th { } 
.ld-td { }
```

lurkdown uses [highlight.js](https://github.com/highlightjs/highlight.js) to deal with syntax highlighting so if you want to customize the syntax highlighting, you can pass the [customized css files](https://highlightjs.org/static/demo/) with the `--styles` parameter.

