#!/usr/bin/env node

/**
 * Production deployment script for vanilla-scroll
 * This script prepares the distribution files by:
 * 1. Copying the example HTML and JS files to the dist directory
 * 2. Fixing file references to work correctly in production
 * 3. Copying debug.css to the dist directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const exampleDir = path.join(rootDir, 'example');
const srcDir = path.join(rootDir, 'src');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory not found. Run the build command first.');
    process.exit(1);
}

// STEP 1: Copy example files to dist
console.log('Copying example files to dist directory...');

// Copy HTML file
const htmlSourcePath = path.join(exampleDir, 'index.html');
const htmlTargetPath = path.join(distDir, 'index.html');
let htmlContent = fs.readFileSync(htmlSourcePath, 'utf8');

// Copy JS file
const jsSourcePath = path.join(exampleDir, 'index.example.js');
const jsTargetPath = path.join(distDir, 'example.js');
let jsContent = fs.readFileSync(jsSourcePath, 'utf8');

// Copy debug.css file
const debugCssSourcePath = path.join(srcDir, 'debug.css');
const debugCssTargetPath = path.join(distDir, 'debug.css');
fs.copyFileSync(debugCssSourcePath, debugCssTargetPath);
console.log('Copied debug.css to dist directory');

// STEP 2: Fix paths in the files
console.log('Fixing paths in the files...');

// Fix import path in JS file
jsContent = jsContent.replace('../dist/index.js', './index.js');

// Fix script reference in HTML file
htmlContent = htmlContent.replace('./index.example.js', './example.js');

// Fix debug.css reference in HTML file
htmlContent = htmlContent.replace('../src/debug.css', './debug.css');

// STEP 3: Write the modified files
fs.writeFileSync(htmlTargetPath, htmlContent);
fs.writeFileSync(jsTargetPath, jsContent);

console.log('Deployment preparation complete!');
console.log('- HTML file: dist/index.html');
console.log('- Example JS: dist/example.js');
console.log('- Library: dist/index.js');
console.log('- Debug CSS: dist/debug.css'); 