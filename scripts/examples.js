import { glob }                                from 'glob';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync }                          from 'node:fs';
import { join }                                from 'path';
import Handlebars                              from 'handlebars';
import * as diff                               from 'diff';

const ensureDirectoryExists = async directory => !existsSync(directory) && await mkdir(directory, { recursive: true });
const readTextFile          = path => readFile(path, 'utf8');
const encodeHtmlEntities    = html => html.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#039;',
}[match]));

const createDiffBetweenExamples = (previous, current, field) => {
    if (previous) {
        let htmlOutput = '';
        const lineDiff = diff.diffLines(previous[field], current[field]);

        lineDiff.forEach(part => {
            if (part.added) {
                htmlOutput += `<ins>${part.value}</ins>`;
            } else if (part.removed) {
                htmlOutput += `<del>${part.value}</del>`;
            } else {
                htmlOutput += part.value;
            }
        });

        return htmlOutput;
    }

    return current[field];
};

const readAllExampleFiles = async (examplesDirectory, exampleDirectory) => {
    const filePaths = {
        main:   join(examplesDirectory, exampleDirectory, 'index.hbs'),
        styles: join(examplesDirectory, exampleDirectory, 'style.css'),
        script: join(examplesDirectory, exampleDirectory, 'script.js'),
    };

    const [mainContent, stylesContent, scriptRawContent] = await Promise.all([
        readTextFile(filePaths.main),
        readTextFile(filePaths.styles),
        readTextFile(filePaths.script),
    ]);

    const scriptContent = scriptRawContent.replace('../../src/vanilla-scroll.js', '@spomsoree/vanilla-scroll');

    return { mainContent, stylesContent, scriptContent };
};

const createExampleDataObject = (exampleDirectory, index, { mainContent, stylesContent, scriptContent }, previousExample) => {
    const encodedHtmlContent = encodeHtmlEntities(mainContent);

    return {
        number:     index + 1,
        html:       encodedHtmlContent,
        styles:     stylesContent,
        script:     scriptContent,
        htmlDiff:   createDiffBetweenExamples(previousExample, { html: encodedHtmlContent }, 'html'),
        stylesDiff: createDiffBetweenExamples(previousExample, { styles: stylesContent }, 'styles'),
        scriptDiff: createDiffBetweenExamples(previousExample, { script: scriptContent }, 'script'),
    };
};

const createTemplateContext = (exampleDirectory, index) => ({
    title:       `VanillaScroll | Example ${index + 1}`,
    styleTag:    `<link rel="stylesheet" href="/example${index + 1}/style.css">`,
    scriptTag:   `<script defer type="module" src="/example${index + 1}/script.js"></script>`,
    exampleName: exampleDirectory,
});

const renderAndWriteExampleFile = async (exampleDirectory, index, mainContent, outputDirectory) => {
    const template        = Handlebars.compile(`{{#> content}}${mainContent}{{/content}}`);
    const templateContext = createTemplateContext(exampleDirectory, index);
    const htmlContent     = template(templateContext);

    const outputPath = join(outputDirectory, `example${index + 1}`);
    await ensureDirectoryExists(outputPath);
    await writeFile(join(outputPath, 'index.html'), htmlContent);

    return join(outputPath, 'index.html');
};

const processExampleDirectory = async (exampleDirectory, index, examplesDataArray, outputDirectory, examplesDirectory) => {
    const files           = await readAllExampleFiles(examplesDirectory, exampleDirectory);
    const previousExample = examplesDataArray[index - 1];
    const exampleData     = createExampleDataObject(exampleDirectory, index, files, previousExample);

    examplesDataArray.push(exampleData);

    const outputPath = await renderAndWriteExampleFile(exampleDirectory, index, files.mainContent, outputDirectory);

    return { exampleDirectory, outputPath };
};

const getAllExampleDirectories = async (examplesDirectory) => {
    const entries = await readdir(examplesDirectory, { withFileTypes: true });
    return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();
};

const initializeTemplateSystem = async (examplesDirectory) => {
    const baseTemplateContent = await readTextFile(join(examplesDirectory, 'base.hbs'));
    Handlebars.registerPartial('content', baseTemplateContent);

    return baseTemplateContent;
};

const renderIndexFile = async (indexTemplateContent, examplesDataArray, outputDirectory) => {
    const template    = Handlebars.compile(indexTemplateContent);
    const htmlContent = template({ examples: examplesDataArray });

    await writeFile(join(outputDirectory, 'index.html'), htmlContent);
};

const renderAllExamples = async () => {
    const paths = {
        examples: join(process.cwd(), './examples'),
        output:   join(process.cwd(), './dist/public'),
    };

    const indexTemplateContent = await readTextFile(join(paths.examples, 'index.hbs'));

    const exampleDirectories = await getAllExampleDirectories(paths.examples);

    await initializeTemplateSystem(paths.examples);
    await ensureDirectoryExists(paths.output);

    const examplesDataArray = [];

    for (const [index, directory] of exampleDirectories.entries()) {
        await processExampleDirectory(directory, index, examplesDataArray, paths.output, paths.examples);
    }

    await renderIndexFile(indexTemplateContent, examplesDataArray, paths.output);
};

await renderAllExamples();

await Bun.build({
    entrypoints: [
        './src/debug.css',
    ],
    outdir:      './dist/public',
    minify:      true,
    sourcemap:   'external',
});

const styleCssFiles = await glob('./examples/**/style.css');
const scriptJsFiles = await glob('./examples/**/script.js');

await Bun.build({
    entrypoints: [
        './examples/base.css',
        './examples/index.css',
        ...styleCssFiles,
    ],
    outdir:      './dist/public',
    root:        './examples',
});

await Bun.build({
    entrypoints: [
        ...scriptJsFiles,
    ],
    outdir:      './dist/public',
});

console.log('Examples build completed successfully!');
