# lurkdown 

[![npm version](https://badge.fury.io/js/lurkdown.svg)](https://badge.fury.io/js/lurkdown)

[View the source code on GitHub](https://github.com/obsfx/lurkdown) 



![lurkdown](https://raw.githubusercontent.com/obsfx/lurkdown/gh-pages/demo.gif)



`lurkdown` is a command-line markdown transpiler tool that was built on `NodeJS` with `TypeScript` to create standalone, markdown-generated HTML files. `lurkdown` converts all locally hosted image files to `base64` to avoid dealing with images when we want to host that HTML files at somewhere. *It is not perfect but works in most cases.*



## installation

You can directly install via npm



```
npm i -g lurkdown
```



Or you can download the standalone executable version.

[Standalone Executables](https://github.com/obsfx/lurkdown/releases)



## disclaimer

some core features are not implemented:

1.  Combined blockquotes.
2.  Reference style images.

restrictions:

1. `lurkdown` doesn't deal with font files. You have to host them at somewhere and `@import` the `CSS` file of font definitions.



## how to use

You can directly use with command-line parameters.

- `--files` / **_mandatory_** -> Specify file paths by enclosing with quotes and then separating with commas.
  `e.g. --files='./path/to/file.md, ./path/to/file2.md, ./path/to/file3.md'`
- `--theme` / __*optional*__ -> Available themes: dark, light. If you don't specify a theme, output files will be exported without any styling.
- `--titles` / __*optional*__ -> Specify the titles that will be used in `title` tag in output files. They should be specified in the same order as files and they should be enclosed with quotes and then separated with commas.
  `e.g --titles='file title, file2 title, file3 title'`
- `--outdir` / __*optional*__ -> If you don't specify an output directory, files will be exported in same directory as like input files.
- `--styles` / __*optional*__ -> Specify the custom `CSS` file paths If you want to customize the output files. They should be specified like files and titles. Enclose with quotes and then separate with commas.
  `e.g. --styles='./path/to/cssfile.css, ./path/to/cssfile2.css'`
- `--favico` / __*optional*__ -> Specify the path of favico file.



Example usage



```
lurkdown --theme=dark --files='./src/test/http_notes.md, ./src/test/post.md' --titles='HTTP Notes, My First Blog Post' --outdir=./export --favico=./src/icon.ico
```



Or you can just pass a single `config.json` file with the `--config` parameter.

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

You can customize the elements by using this `CSS` class names.



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

---

`lurkdown` uses [highlight.js](https://github.com/highlightjs/highlight.js) to deal with syntax highlighting so if you want to customize the syntax highlighting, you can pass the [customized css files](https://highlightjs.org/static/demo/) with the `--styles` parameter.