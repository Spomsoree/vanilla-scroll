import {
    test,
    expect,
    describe,
}                 from 'bun:test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const thresholds = {
    'speed-index':               0.95, // TODO: Improve the example group index pages to be able to get rid of this
    'interactive':               0.95, // TODO: Improve the example group index pages to be able to get rid of this
    'largest-contentful-paint':  0.95, // TODO: Improve the example group index pages to be able to get rid of this
    'first-contentful-paint':    0.85, // TODO: Improve the example group index pages to be able to get rid of this
    'document-latency-insight':  0.49, // TODO: Improve the example group index pages to be able to get rid of this
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

async function assertCategoryScores(categories) {
    Object.values(categories).forEach(category => {
        if (category.score < 1) {
            expect(category.score, `${category.title} Score: ${category.score}`).toBe(.98);
        }
    });
}

async function assertAuditScores(audits, thresholds) {
    for (const auditId in audits) {
        const audit = audits[auditId];

        if (audit.score === null) {
            continue;
        }

        const expectedScore = thresholds[audit.id] !== undefined ? thresholds[audit.id] : 1;
        expect(audit.score, `${audit.description} (${audit.id}) - Expected: ${expectedScore}, Actual: ${audit.score}`).toBeGreaterThanOrEqual(expectedScore);
    }
}

describe.each(Object.entries(pages))('lighthouse: %s', (page, paths) => {
    test.each(paths)('path: %s', async (path) => {
        const results = await lighthouse(
            `http://localhost:${process.env.PORT}/${path}`,
            {
                port:   chrome.port,
                output: 'json',
            },
        );

        await assertCategoryScores(results.lhr.categories);
        await assertAuditScores(results.lhr.audits, thresholds);

    }, { timeout: 60000 });
});
