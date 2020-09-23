const config: { [ key: string ]: any } = {
    title: '<!--@title-->',
    favico: '<!--@favico-->',
    style: '<!--@style-->',
    body: '<!--@body-->',

    base: `${__dirname}/templates/base.html`,

    themes: {
        light: [
            `${__dirname}/templates/themes/light/hljs-github.css`,
            `${__dirname}/templates/themes/light/ld-light.css`
        ],

        dark: [
            `${__dirname}/templates/themes/dark/hljs-monokai-sublime.css`,
            `${__dirname}/templates/themes/dark/ld-dark.css`
        ]
    }
}

export default config;
