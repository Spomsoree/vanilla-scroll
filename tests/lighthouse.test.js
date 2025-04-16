import {
    test,
    expect,
    describe,
}                 from 'bun:test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const thresholds = {
    'first-contentful-paint':    0.99,
    'uses-text-compression':     0,
    'render-blocking-insight':   0,
    'render-blocking-resources': 0,
};
const pages      = {
    'general': ['index.html'],
    'fadeIn':  [
        'fadeIn/index.html',
        'fadeIn/layout/index.html',
        'fadeIn/first_fade_in/index.html',
    ],
    'sticky':  [
        'sticky/index.html',
        'sticky/example1/index.html',
        'sticky/example2/index.html',
        'sticky/example3/index.html',
        'sticky/example4/index.html',
        'sticky/example5/index.html',
        'sticky/example6/index.html',
    ],
};
const chrome     = await launch({
    chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
    ],
});

for (const [page, paths] of Object.entries(pages)) {
    describe(`lighthouse: ${page}`, () => {
        for (const path of paths) {
            test(`path: ${path}`, async () => {
                const results = await lighthouse(
                    `http://localhost:${process.env.PORT}/${path}`,
                    {
                        port: chrome.port,
                        output: 'json',
                    },
                );

                for (const auditId in results.lhr.audits) {
                    const audit = results.lhr.audits[auditId];

                    if (audit.score === null) {
                        continue;
                    }

                    if (thresholds[audit.id] !== undefined) {
                        expect(audit.score, `${audit.description} (${audit.id})`).toBeGreaterThanOrEqual(thresholds[audit.id]);
                    } else {
                        expect(audit.score, `${audit.description} (${audit.id})`).toBe(1);
                    }
                }
            }, { timeout: 60000 });
        }
    });
}
