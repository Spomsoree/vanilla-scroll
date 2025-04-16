import { glob }                                from 'glob';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync }                          from 'node:fs';
import { join }                                from 'path';
import Handlebars                              from 'handlebars';
import * as diff                               from 'diff';

const ensureDirectoryExists = async directory => !existsSync(directory) && await mkdir(directory, { recursive: true });
const readTextFile          = path => readFile(path, 'utf8');
const encodeHtmlEntities    = html => html.replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#039;' }[match]));

const createDiffBetweenExamples = (previous, current, field) => {
    let html        = '';
    const prevField = previous ? previous[field] : '';

    diff.diffLines(prevField, current[field]).forEach(part => {
        if (part.added) {
            html += `<ins>${part.value}</ins>`;
        } else if (part.removed) {
            html += `<del>${part.value}</del>`;
        } else {
            html += part.value;
        }
    });

    return html;
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

const createExampleDataObject = (name, group, description, exampleDirectory, { mainContent, stylesContent, scriptContent }, previousExample) => {
    const encodedHtmlContent = encodeHtmlEntities(mainContent);

    return {
        name,
        group,
        description,
        exampleDirectory,
        html:       encodedHtmlContent,
        styles:     stylesContent,
        script:     scriptContent,
        htmlDiff:   createDiffBetweenExamples(previousExample, { html: encodedHtmlContent }, 'html'),
        stylesDiff: createDiffBetweenExamples(previousExample, { styles: stylesContent }, 'styles'),
        scriptDiff: createDiffBetweenExamples(previousExample, { script: scriptContent }, 'script'),
    };
};

const createTemplateContext = (name, group) => ({
    name,
    styleTag:  `<link rel="stylesheet" href="/${group}/${name}/style.css">`,
    scriptTag: `<script defer type="module" src="/${group}/${name}/script.js"></script>`,
});

const outputFile = async (outputPath, name, content) => {
    await ensureDirectoryExists(outputPath);
    await writeFile(join(outputPath, name), content);
};

const renderAndWriteExampleFile = async (exampleDirectory, group, mainContent, outputDirectory) => {
    const template        = Handlebars.compile(`{{#> content}}${mainContent}{{/content}}`);
    const templateContext = createTemplateContext(exampleDirectory, group);
    const htmlContent     = template(templateContext);
    const outputPath      = join(outputDirectory, exampleDirectory);

    await outputFile(outputPath, 'index.html', htmlContent);
};

const processExampleDirectory = async (name, group, description, exampleDirectory, previousExample, outputDirectory, examplesDirectory) => {
    const files       = await readAllExampleFiles(examplesDirectory, exampleDirectory);
    const exampleData = createExampleDataObject(name, group, description, exampleDirectory, files, previousExample);

    await renderAndWriteExampleFile(exampleDirectory, group, files.mainContent, outputDirectory);

    return exampleData;
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

    const indexTemplateContent = await readTextFile(join(paths.examples, 'index.hbs'));
    const exampleGroups        = await getAllExampleDirectories(paths.examples);
    const groups               = [];

    for (const group of exampleGroups) {
        let lastExample            = null;
        const groupDirectory       = join(paths.examples, group);
        const exampleContent       = Bun.TOML.parse(await readTextFile(join(groupDirectory, 'content.toml')));
        const groupName            = exampleContent.name;
        const examplesData         = {};
        const groupOutputDirectory = join(paths.output, group);
        const groupData            = {
            title: groupName,
        };

        for (const [exampleDirectory, content] of Object.entries(exampleContent.order)) {
            const { name, description }    = content;
            const previousExample          = lastExample ? examplesData[lastExample] : { html: '', script: '', styles: '' };
            examplesData[exampleDirectory] = await processExampleDirectory(name, group, description, exampleDirectory, previousExample, groupOutputDirectory, groupDirectory);
            lastExample                    = exampleDirectory;
        }

        groupData.examples = examplesData;
        const template     = Handlebars.compile(`{{#> text}}${exampleContent.description}{{/text}}`);
        const htmlContent  = template(groupData);

        await renderIndexFile(htmlContent, groupData, groupOutputDirectory);

        groups.push({
            name:  groupName,
            lower: group,
        });
    }

    await renderIndexFile(indexTemplateContent, { groups: groups }, paths.output);
};

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
    minify:      true,
    outdir:      './dist/public',
    root:        './examples',
});

await Bun.build({
    entrypoints: [
        ...scriptJsFiles,
    ],
    minify:      true,
    outdir:      './dist/public',
    root:        './examples',
});

await renderAllExamples();

console.log('Examples build completed successfully!');
