#!/usr/bin/env node

/**
 * Production deployment script for vanilla-scroll
 * This script prepares the distribution files by:
 * 1. Copying the example HTML and JS files to the dist directory
 * 2. Fixing file references to work correctly in production
 * 3. Adding cache busters to all asset imports in index.html
 * 4. Copying debug.css to the dist directory
 */

import fs                from 'fs';
import path              from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const rootDir    = path.resolve(__dirname, '..');
const distDir    = path.join(rootDir, 'dist');
const exampleDir = path.join(rootDir, 'example');
const srcDir     = path.join(rootDir, 'src');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory not found. Run the build command first.');
    process.exit(1);
}

// Generate timestamp for cache busting
const timestamp = Date.now();

// STEP 1: Copy example files to dist
console.log('Copying example files to dist directory...');

// Copy HTML file
const htmlSourcePath = path.join(exampleDir, 'index.html');
const htmlTargetPath = path.join(distDir, 'index.html');
let htmlContent      = fs.readFileSync(htmlSourcePath, 'utf8');

// Copy JS file
const jsSourcePath = path.join(exampleDir, 'index.example.js');
const jsTargetPath = path.join(distDir, 'example.js');
let jsContent      = fs.readFileSync(jsSourcePath, 'utf8');

// Copy debug.css file
const debugCssSourcePath = path.join(srcDir, 'debug.css');
const debugCssTargetPath = path.join(distDir, 'debug.css');
fs.copyFileSync(debugCssSourcePath, debugCssTargetPath);
console.log('Copied debug.css to dist directory');

// STEP 2: Fix paths in the files
console.log('Fixing paths in the files...');

// Fix import path in JS file and add cache buster
jsContent = jsContent.replace(
    /import\s+(\w+)\s+from\s+['"]\.\.\/dist\/index\.js['"]/g,
    `import $1 from './index.js?v=${timestamp}'`,
);

// STEP 3: Add cache busters to all asset imports in HTML
console.log('Adding cache busters to assets in index.html...');

// Function to add cache buster to a URL
const addCacheBuster = (url) => {
    // Don't add cache buster if URL already has query parameters or is an absolute URL or data URL
    if (url.includes('?') || url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
        return url;
    }
    return `${url}?v=${timestamp}`;
};

// Fix script references in HTML file with cache busters
// First, handle single-line script tags
htmlContent = htmlContent.replace(
    /<script\s+src="([^"]+)"/g,
    (match, p1) => {
        const newPath = p1 === './index.example.js' ? './example.js' : p1;
        return `<script src="${addCacheBuster(newPath)}"`;
    },
);

// Handle multi-line script tags with type="module"
htmlContent = htmlContent.replace(
    /<script\s+(?:[^>]*\s+)?type="module"\s+(?:[^>]*\s+)?src="([^"]+)"/gs,
    (match, p1) => {
        const newPath = p1 === './index.example.js' ? './example.js' : p1;
        return match.replace(`src="${p1}"`, `src="${addCacheBuster(newPath)}"`);
    },
);

// Handle any other multi-line script tags
htmlContent = htmlContent.replace(
    /<script\s+(?:[^>]*\s+)?src="([^"]+)"\s+(?:[^>]*\s+)?/gs,
    (match, p1) => {
        const newPath = p1 === './index.example.js' ? './example.js' : p1;
        return match.replace(`src="${p1}"`, `src="${addCacheBuster(newPath)}"`);
    },
);

// Fix CSS references in HTML file with cache busters
htmlContent = htmlContent.replace(
    /<link\s+[^>]*href="([^"]+)"[^>]*>/g,
    (match, p1) => {
        const newPath = p1 === '../src/debug.css' ? './debug.css' : p1;
        return match.replace(p1, addCacheBuster(newPath));
    },
);

// Fix image sources in HTML file with cache busters (if any)
htmlContent = htmlContent.replace(
    /<img\s+[^>]*src="([^"]+)"[^>]*>/g,
    (match, p1) => match.replace(p1, addCacheBuster(p1)),
);

// STEP 4: Write the modified files
fs.writeFileSync(htmlTargetPath, htmlContent);
fs.writeFileSync(jsTargetPath, jsContent);

console.log('Deployment preparation complete!');
console.log('- HTML file: dist/index.html');
console.log('- Example JS: dist/example.js');
console.log('- Library: dist/index.js');
console.log('- Debug CSS: dist/debug.css');
console.log(`- Cache buster applied: v=${timestamp}`);