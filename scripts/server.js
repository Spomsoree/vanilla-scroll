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

const server = serve({
    port: Bun.env.PORT,
    fetch(req) {
        const url = new URL(req.url);
        let path  = url.pathname;

        if (path.endsWith('/')) {
            path += '/index.html';
        }

        const filePath = join('./dist/public', path);

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

function shutdown() {
    console.log('Shutting down server gracefully');
    server.stop();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('disconnect', shutdown);

if (process.ppid) {
    const checkParentInterval = setInterval(() => {
        try {
            process.kill(process.ppid, 0);
        } catch (error) {
            clearInterval(checkParentInterval);
            shutdown();
        }
    }, 1000);
}