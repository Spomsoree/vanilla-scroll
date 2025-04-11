import {
    test,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
}                from 'bun:test';
import puppeteer from 'puppeteer';

let browser;
let page;

beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page    = await browser.newPage();
});

afterAll(async () => {
    await browser.close();
});

beforeEach(async () => {
    await page.goto(`http://localhost:${Bun.env.PORT}`);
    await page.waitForSelector('#intro-container');
});

test('should render intro-container', async () => {
    const headerText = await page.$eval('#intro-container h1', el => el.textContent);
    expect(headerText).toContain('Intro');
});

test('should transform value on scroll', async () => {
    const initialTransform = await page.$eval('#intro-container h1', el => el.style.transform);
    expect(initialTransform).toContain('scale(1)');

    await page.evaluate(() => {
        window.scrollTo(0, 300);
    });

    await waitForTransformChange(page, '#intro-container h1', 'scale(20)');

    const afterScrollTransform = await page.$eval('#intro-container h1', el => el.style.transform);
    expect(afterScrollTransform).toContain('scale(20)');
});