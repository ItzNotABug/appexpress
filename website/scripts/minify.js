import fs from 'fs';
import path from 'path';
import CleanCSS from 'clean-css';
import { PurgeCSS } from 'purgecss';
import { minify as minifyHtmlContent } from 'html-minifier-terser';

const CONTENT_DIR = '.vitepress/dist/';
const ASSETS_DIR = '.vitepress/dist/assets/';
const bytesToKb = (size) => (size / 1024).toFixed(2);

async function readAndProcessCSS(cssFilePath) {
    const originalCSS = fs.readFileSync(cssFilePath, 'utf8');
    console.log('\nprocessing HTML & CSS...');

    const purgedCSS = await purgeUnusedCSS(originalCSS);
    minifyCSS(purgedCSS, cssFilePath);
    await minifyHtml();
}

async function purgeUnusedCSS(cssContent) {
    const originalSize = bytesToKb(Buffer.byteLength(cssContent));

    const purgeCSSResult = await new PurgeCSS().purge({
        content: [`${CONTENT_DIR}**/*.html`],
        css: [{ raw: cssContent }],
        safelist: {
            standard: ['vpi-social-copied'],
            greedy: [
                // nav
                /VPNavBar/,
                /VPNavScreen/,
                /container/,

                // not found
                /NotFound/,
                /image/,
                /title/,
                /divider/,
                /quote/,
                /action/,
                /link/,
            ],
        },
    });

    const purgedCSS = purgeCSSResult[0].css || cssContent;
    const purgedSize = bytesToKb(Buffer.byteLength(purgedCSS));

    console.log(`  └── PurgeCSS: ${originalSize} KB > ${purgedSize} KB`);

    return purgedCSS;
}

function minifyCSS(cssContent, cssFilePath) {
    const output = new CleanCSS({
        level: 2,
        compatibility: '*',
    }).minify(cssContent);

    const originalSizeKB = bytesToKb(output.stats.originalSize);
    const minifiedSizeKB = bytesToKb(output.stats.minifiedSize);

    console.log(`  └── MinifyCSS: ${originalSizeKB} KB > ${minifiedSizeKB} KB`);

    if (minifiedSizeKB < originalSizeKB) {
        fs.writeFileSync(cssFilePath, output.styles, 'utf8');
    }
}

async function minifyHtml() {
    let totalOriginalSize = 0;
    let totalMinifiedSize = 0;

    const htmlFiles = getFiles(CONTENT_DIR, 'html');

    await Promise.all(
        htmlFiles.map(async (file) => {
            const htmlContent = fs.readFileSync(file, 'utf8');
            totalOriginalSize += Buffer.byteLength(htmlContent, 'utf8');

            // doesn't make too much of a difference but meh.
            const minifiedHtml = await minifyHtmlContent(htmlContent, {
                minifyJS: true,
                minifyCSS: true,
                removeComments: false,
                collapseWhitespace: true,
                removeAttributeQuotes: true,
            });

            totalMinifiedSize += Buffer.byteLength(minifiedHtml, 'utf8');
            fs.writeFileSync(file, minifiedHtml, 'utf8');
        }),
    );

    const originalSizeKB = bytesToKb(totalOriginalSize);
    const minifiedSizeKB = bytesToKb(totalMinifiedSize);

    console.log(
        `  └── MinifyHTML: ${originalSizeKB} KB > ${minifiedSizeKB} KB`,
    );
}

function getFiles(dir, ext) {
    let filesList = [];

    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            filesList = filesList.concat(getFiles(filePath, ext));
        } else if (file.endsWith(`.${ext}`)) {
            filesList.push(filePath);
        }
    });

    return filesList;
}

function processCSS() {
    const cssFiles = fs
        .readdirSync(ASSETS_DIR)
        .filter((file) => /^style\..*?\.css$/.test(file));

    if (cssFiles.length === 0) {
        console.error('no CSS files found to process.');
        return;
    }

    cssFiles.forEach((cssFile) =>
        readAndProcessCSS(path.join(ASSETS_DIR, cssFile)),
    );
}

processCSS();
