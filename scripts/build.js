import { mkdir } from 'fs/promises';

await mkdir('./dist', { recursive: true });

await Bun.build({
    entrypoints: [
        './src/vanilla-scroll.js',
    ],
    outdir:      './dist',
    format:      'esm',
    minify:      false,
    sourcemap:   'external',
    naming:      {
        entry: 'vanilla-scroll.js',
    },
});

await Bun.build({
    entrypoints: [
        './src/vanilla-scroll.js',
    ],
    outdir:      './dist',
    format:      'esm',
    minify:      true,
    sourcemap:   'external',
    naming:      {
        entry: 'vanilla-scroll.min.js',
    },
});

await Bun.build({
    entrypoints: [
        './src/debug.css',
    ],
    outdir:      './dist',
    minify:      true,
    sourcemap:   'external',
});

console.log('Library build completed successfully!');