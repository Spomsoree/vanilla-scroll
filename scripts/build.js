import { mkdir } from 'fs/promises';

await mkdir('./dist', { recursive: true });

const minifyOptions = {
    whitespace:  true,
    identifiers: true,
    syntax:      true,
};

await Bun.build({
    entrypoints: ['./src/vanilla-scroll.js'],
    outdir:      './dist',
    format:      'esm',
    minify:      false,
    sourcemap:   'external',
    naming:      { entry: 'vanilla-scroll.esm.js' },
    target:      'browser',
});

await Bun.build({
    entrypoints: ['./src/vanilla-scroll.js'],
    outdir:      './dist',
    format:      'esm',
    minify:      minifyOptions,
    sourcemap:   'external',
    naming:      { entry: 'vanilla-scroll.esm.min.js' },
    target:      'browser',
});

await Bun.build({
    entrypoints: ['./src/vanilla-scroll.js'],
    outdir:      './dist',
    format:      'cjs',
    minify:      false,
    sourcemap:   'external',
    naming:      { entry: 'vanilla-scroll.cjs' },
    target:      'browser',
});

await Bun.build({
    entrypoints: ['./src/vanilla-scroll.js'],
    outdir:      './dist',
    format:      'cjs',
    minify:      minifyOptions,
    sourcemap:   'external',
    naming:      { entry: 'vanilla-scroll.cjs.min.js' },
    target:      'browser',
});

await Bun.build({
    entrypoints: ['./src/debug.css'],
    outdir:      './dist',
    minify:      true,
    sourcemap:   'external',
});

console.log('Library build completed successfully!');
