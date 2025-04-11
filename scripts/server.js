import { serve }                  from 'bun';
import { join }                   from 'path';
import { statSync, readFileSync } from 'fs';

const MIME_TYPES = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.txt':  'text/plain',
};

console.log(`Starting server: http://localhost:${Bun.env.PORT}`);

serve({
    port: Bun.env.PORT,
    fetch(req) {
        const url = new URL(req.url);
        let path  = url.pathname;

        if (path === '/') {
            path = '/index.html';
        }

        const filePath = join('./dist', path);

        try {
            const stats = statSync(filePath);

            if (stats.isFile()) {
                const ext         = path.substring(path.lastIndexOf('.'));
                const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                const fileContent = readFileSync(filePath);

                return new Response(fileContent, {
                    headers: {
                        'Content-Type':  contentType,
                        'Cache-Control': 'no-cache',
                    },
                });
            }
        } catch (error) {
        }

        return new Response('404 Not Found', { status: 404 });
    },
});