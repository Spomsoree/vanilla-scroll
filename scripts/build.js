import copy from 'bun-copy-plugin';

await Bun.build({
    entrypoints: [
        './src/index.js',
        './src/debug.css',
    ],
    outdir:      './dist',
    minify:      true,
    sourcemap:   'linked',
    plugins:     [
        copy('./src/example/', './dist'),
    ],
});