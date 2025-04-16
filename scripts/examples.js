import { glob }                                from 'glob';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync }                          from 'node:fs';
import { join }                                from 'path';
import Handlebars                              from 'handlebars';
import * as diff                               from 'diff';

const firstUpper            = (string) => string[0].toUpperCase() + string.slice(1);
const ensureDirectoryExists = async directory => !existsSync(directory) && await mkdir(directory, { recursive: true });
const readTextFile          = path => readFile(path, 'utf8');
const encodeHtmlEntities    = html => html.replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#039;' }[match]));

const createDiffBetweenExamples = (previous, current, field) => {
    let previousField = '';

    if (previous) {
        previousField = previous[field];
    }

    let htmlOutput = '';
    const lineDiff = diff.diffLines(previousField, current[field]);

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

    const scriptContent = scriptRawContent.replace('../../../src/vanilla-scroll.js', '@spomsoree/vanilla-scroll');

    return { mainContent, stylesContent, scriptContent };
};

const createExampleDataObject = (exampleDirectory, group, index, { mainContent, stylesContent, scriptContent }, previousExample) => {
    const encodedHtmlContent = encodeHtmlEntities(mainContent);

    return {
        group,
        number:     index + 1,
        html:       encodedHtmlContent,
        styles:     stylesContent,
        script:     scriptContent,
        htmlDiff:   createDiffBetweenExamples(previousExample, { html: encodedHtmlContent }, 'html'),
        stylesDiff: createDiffBetweenExamples(previousExample, { styles: stylesContent }, 'styles'),
        scriptDiff: createDiffBetweenExamples(previousExample, { script: scriptContent }, 'script'),
    };
};

const createTemplateContext = (exampleDirectory, group, index) => ({
    title:       `VanillaScroll | Example ${index + 1}`,
    styleTag:    `<link rel="stylesheet" href="/${group}/example${index + 1}/style.css">`,
    scriptTag:   `<script defer type="module" src="/${group}/example${index + 1}/script.js"></script>`,
    exampleName: exampleDirectory,
});

const outputFile = async (outputPath, name, content) => {
    await ensureDirectoryExists(outputPath);
    await writeFile(join(outputPath,name), content);
}

const renderAndWriteExampleFile = async (exampleDirectory, group, index, mainContent, outputDirectory) => {
    const template        = Handlebars.compile(`{{#> content}}${mainContent}{{/content}}`);
    const templateContext = createTemplateContext(exampleDirectory, group, index);
    const htmlContent     = template(templateContext);
    const outputPath      = join(outputDirectory, `example${index + 1}`);

    await outputFile(outputPath, 'index.html', htmlContent);
};

const processExampleDirectory = async (name, group, index, examplesDataArray, outputDirectory, examplesDirectory) => {
    const files           = await readAllExampleFiles(examplesDirectory, name);
    const previousExample = examplesDataArray[index - 1];
    const exampleData     = createExampleDataObject(name, group, index, files, previousExample);

    examplesDataArray.push(exampleData);

    await renderAndWriteExampleFile(name, group, index, files.mainContent, outputDirectory);
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

    const baseExampleTemplateContent = await readTextFile(join(examplesDirectory, 'index_example.hbs'));
    Handlebars.registerPartial('text', baseExampleTemplateContent);
};

const renderIndexFile = async (indexTemplateContent, data, outputDirectory) => {
    const template    = Handlebars.compile(indexTemplateContent);
    const htmlContent = template(data);

    await outputFile(outputDirectory, 'index.html', htmlContent);
};

const renderAllExamples = async () => {
    const paths = {
        examples: join(process.cwd(), './examples'),
        output:   join(process.cwd(), './dist/public'),
    };

    await initializeTemplateSystem(paths.examples);

    const indexTemplateContent        = await readTextFile(join(paths.examples, 'index.hbs'));
    const exampleGroups               = await getAllExampleDirectories(paths.examples);
    const groups                      = [];

    for (const group of exampleGroups) {
        const groupUpper                = firstUpper(group);
        const examplesDataArray         = [];
        const groupDirectory            = join(paths.examples, group);
        const groupOutputDirectory      = join(paths.output, group);
        const exampleDirectories        = await getAllExampleDirectories(groupDirectory);
        const indexGroupTemplateContent = await readTextFile(join(groupDirectory, 'index.hbs'));
        const groupData                 = {
            title:    groupUpper,
            examples: examplesDataArray,
        };

        for (const [index, name] of exampleDirectories.entries()) {
            await processExampleDirectory(name, group, index, examplesDataArray, groupOutputDirectory, groupDirectory);
        }

        const template    = Handlebars.compile(`{{#> text}}${indexGroupTemplateContent}{{/text}}`);
        const htmlContent = template(groupData);

        await renderIndexFile(htmlContent, groupData, groupOutputDirectory);

        groups.push({
            name:  groupUpper,
            lower: group,
        });
    }

    await renderIndexFile(indexTemplateContent, { groups: groups }, paths.output);
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
    root:        './examples',
});

console.log('Examples build completed successfully!');
