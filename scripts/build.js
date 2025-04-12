import copy      from 'bun-copy-plugin';
import { mkdir } from 'fs/promises';

await mkdir('./dist', { recursive: true });

// Build ESM version
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

// Build minified ESM version
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

// Build CSS
await Bun.build({
    entrypoints: [
        './src/debug.css',
    ],
    outdir:      './dist',
    minify:      true,
    sourcemap:   'external',
    plugins:     [
        copy('./src/example/', './dist'),
    ],
});

console.log('Library build completed successfully!');