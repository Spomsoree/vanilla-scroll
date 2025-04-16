import { $ }     from 'bun';
import { watch } from 'fs';

const build = async (filename) => {
    if (filename) {
        console.log(`Rebuilding ${filename}`);
    }

    await $`bun run build &>/dev/null`;
};

const watcher = async (event, filename) => {
    if (event === 'rename') {
        await build(filename);
    }
};

await build();

watch(
    './src/',
    {
        recursive: true,
    },
    watcher,
);

watch(
    './examples/',
    {
        recursive: true,
    },
    watcher,
);