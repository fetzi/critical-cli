const utils = require('../utils');

module.exports = class Crawler {
    constructor(browser, url, viewportWidth, viewportHeight, outputDirectory, timeout) {
        this.browser = browser;
        this.url = url;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.outputDirectory = outputDirectory;
        this.timeout = timeout;
    }

    async run() {
        utils.info(`START: Fetching data for ${this.url}`);

        let stylesheets = [];
        let intercept = true;

        this.filename = encodeURIComponent(this.url.substring(this.url.indexOf('//') + 2).replace('/', '.'));

        const criticalImage = `${this.outputDirectory}/${this.filename}-a.png`;
        const normalImage = `${this.outputDirectory}/${this.filename}-b.png`;

        const page = await this.browser.newPage();
        await page.setViewport({ width: this.viewportWidth, height: this.viewportHeight});

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
        await page.goto(this.url);

        await page.screenshot({path: criticalImage})
        intercept = false;
        stylesheets.forEach(stylesheet => page.addStyleTag({ url : stylesheet }));

        await page.waitFor(this.timeout);

        await page.screenshot({path: normalImage});

        utils.info(`COMPLETE: Fetching data for ${this.url}`);

        return {
            filename: this.filename,
            critical: criticalImage,
            normal: normalImage,
        };
    }
}