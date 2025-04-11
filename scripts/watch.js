import { $ }     from 'bun';
import { watch } from 'fs';

await $`bun run build`;

watch(
    './src/',
    {
        recursive: true,
    },
    async (event) => {
        if (event === 'rename') {
            await $`bun run build`;
        }
    },
);