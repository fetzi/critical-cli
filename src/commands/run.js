const fs = require('fs');
const puppeteer = require('puppeteer');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const util = require('util');

const utils = require('../utils');

let browser;

let options = {};
let criticalImage, normalImage;

exports.command = 'run';
exports.desc = 'run critical CSS test against url';
exports.builder = {
    url: {
        array: true,
        demandOption: true,
        describe: 'URL(s) to check',
    },
    output: {
        default: './screenshots',
        describe: 'output path for page screenshots',
    },
    width: {
        default: 1024,
        describe: 'viewport width used for critical comparison',
    },
    height: {
        default: 768,
        describe: 'viewport height used for critical comparison',
    },
    timeout: {
        default: 1000,
        describe: 'timeout for loading stylesheets',
    },
    cleanup: {
        default: false,
        describe: 'flag to cleanup output folder before run'
    }
};

exports.handler = (argv) => {
    options = argv;

    if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output);
    }

    if (options.cleanup) {
        cleanup();
    }

    return;

    (async () => {
        browser = await puppeteer.launch();

        const urls = options.url;

        for (url of urls) {
            options.currentUrl = url;
            await checkPage(url);
        }

        await browser.close();
    })();
}

async function checkPage(url) {
    utils.info(`Checking critical CSS for ${url}`);

    let stylesheets = [];
    let intercept = true;

    options.filename = encodeURIComponent(url.substring(url.indexOf('//') + 2).replace('/', '.'));

    const page = await browser.newPage();
    await page.setViewport({ width: options.width, height: options.height});

    await page.setRequestInterception(true);
    page.on('request', (request) => {
            if (intercept && request.resourceType() === 'stylesheet') {
                stylesheets.push(request['_url']);
                request.abort();
                return;
            }

            request.continue();
        });

    await page.setCacheEnabled(false);
    await page.goto(url);

    await page.screenshot({path: `${options.output}/${options.filename}-a.png`})
    intercept = false;
    stylesheets.forEach(stylesheet => page.addStyleTag({ url : stylesheet }));

    await page.waitFor(options.timeout);

    await page.screenshot({path: `${options.output}/${options.filename}-b.png`});

    criticalImage = fs.createReadStream(`${options.output}/${options.filename}-a.png`).pipe(new PNG());
    normalImage = fs.createReadStream(`${options.output}/${options.filename}-b.png`).pipe(new PNG());

    await Promise.all([
        utils.promisifyStream(criticalImage, 'parsed'),
        utils.promisifyStream(normalImage, 'parsed'),
    ]);
    await compareImages();
}

async function compareImages() {
    var diff = new PNG({
        width: criticalImage.width,
        height: criticalImage.height,
    });

    const totalPixels = options.width * options.height;
    const invalidPixels = pixelmatch(
        criticalImage.data,
        normalImage.data,
        diff.data,
        criticalImage.width,
        criticalImage.height,
        {
            threshold: 0.1,
        }
    );

    const difference = (invalidPixels * 100 / totalPixels).toFixed(2);

    await utils.promisifyStream(
        diff.pack().pipe(fs.createWriteStream(`${options.output}/${options.filename}-diff.png`)),
        'finish'
    );

    if (invalidPixels > 0) {
        utils.error(`Critical CSS for URL ${options.currentUrl} is invalid. Difference ${difference}%`);
        process.exit(1);
    }

    utils.success(`Critical CSS for URL ${options.currentUrl} is valid.`);
}

function cleanup() {
    fs.readdirSync(options.output).forEach(file => fs.unlinkSync(`${options.output}/${file}`));
}