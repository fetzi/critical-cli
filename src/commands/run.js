const fs = require('fs');
const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

const Crawler = require('../classes/crawler');
const Comparator = require('../classes/comparator');
const ReportRenderer = require('../classes/report-renderer');

const utils = require('../utils');

let exitCode = 0;

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
    generateReport: {
        default: true,
        describe: 'flag to generate html report with test output'
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
    },
    stopOnFailure: {
        default: true,
        describe: 'flag to define if execution of checks should stop after first error'
    },
    verbose: {
        default: false,
        describe: 'flag to define verbose output'
    }
};

exports.handler = (argv) => {
    const options = argv;

    if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output);
    }

    if (options.cleanup) {
        cleanup(options.output);
    }

    if (options.verbose) {
        utils.setDebug(true);
    }

    (async () => {
        performance.mark('start');
        const browser = await puppeteer.launch();
        const urls = options.url;

        const executedTests = [];

        const promises = urls.map(url => {
            const crawler = new Crawler(browser, url, options.width, options.height, options.output, options.timeout);

            return crawler.run().then(async result => {
                const diff = `${options.output}/${result.filename}-diff.png`;
                const comparator = new Comparator(url, result.critical, result.normal, diff);
                const comparisonResult = await comparator.compare();

                if (comparisonResult.isValid) {
                    utils.success(`${url} is valid.`);
                } else {
                    utils.error(`${url} is invalid.`);
                    handleExitCode(options.stopOnFailure, comparisonResult.isValid);
                }

                executedTests.push(comparisonResult);
            });
        });

        await Promise.all(promises);
        await browser.close();

        performance.mark('end');

        performance.measure('execution-time', 'start', 'end');
        const executionTime = (performance.getEntriesByName('execution-time')[0].duration / 1000).toFixed(1);

        if (options.generateReport) {
            (new ReportRenderer(options.output)).render(executedTests, executionTime);
        }

        process.exit(exitCode);
    })();
}


function cleanup(outputDirectory) {
    fs.readdirSync(outputDirectory).forEach(file => fs.unlinkSync(`${outputDirectory}/${file}`));
}

function handleExitCode(stopOnFailure, isValid) {
    if (stopOnFailure && !isValid) {
        process.exit(1);
    }

    exitCode = Math.max(exitCode, (isValid) ? 0 : 1);
}