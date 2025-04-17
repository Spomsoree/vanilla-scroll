import { $ }     from 'bun';
import { watch } from 'node:fs';

const build = async (filename) => {
    if (filename) {
        console.log(`Rebuilding due to change in: ${filename}`);
    }

    try {
        await $`bun run build &>/dev/null`;
    } catch (error) {
        console.error('Build failed:', error);
    }
};

const debounce = (callback, delay) => {
    let timeoutId;
    let lastFilename;
    let firstCall = true;

    return (event, filename) => {
        if (event === 'rename' && filename) {
            lastFilename = filename;

            if (firstCall) {
                callback(lastFilename);
                firstCall = false;
            }

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(async () => {
                timeoutId = null;
                await callback(lastFilename);
                lastFilename = undefined;
                firstCall    = true;
            }, delay);
        }
    };
};

const debouncedBuild = debounce(build, 300);

await build();

watch(
    './src/',
    {
        recursive: true,
    },
    debouncedBuild,
);

watch(
    './examples/',
    {
        recursive: true,
    },
    debouncedBuild,
);
