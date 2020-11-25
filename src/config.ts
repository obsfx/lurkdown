const config: { [ key: string ]: any } = {
    title: '<!--@title-->',
    favico: '<!--@favico-->',
    style: '<!--@style-->',
    body: '<!--@body-->',

    base: `${__dirname}/../lib/base.html`,

    themes: {
        light: [
            `${__dirname}/../lib/themes/light/ld-light.css`,
            `${__dirname}/../lib/themes/light/hljs-github.css`
        ],

        dark: [
            `${__dirname}/../lib/themes/dark/ld-dark.css`,
            `${__dirname}/../lib/themes/dark/hljs-monokai-sublime.css`
        ]
    }
}

export default config;
