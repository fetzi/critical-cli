const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const utils = require('../utils');

module.exports = class Comparator {
    constructor(url, critical, normal, diff) {
        this.url = url;
        this.critical = critical;
        this.normal = normal;
        this.diff = diff;
    }

    async compare() {
        const criticalImage = fs.createReadStream(this.critical).pipe(new PNG());
        const normalImage = fs.createReadStream(this.normal).pipe(new PNG());

        await Promise.all([
            utils.promisifyStream(criticalImage, 'parsed'),
            utils.promisifyStream(normalImage, 'parsed'),
        ]);

        var diff = new PNG({
            width: criticalImage.width,
            height: criticalImage.height,
        });

        const totalPixels = criticalImage.width * criticalImage.height;
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
            diff.pack().pipe(fs.createWriteStream(this.diff)),
            'finish'
        );

        return {
            url: this.url,
            criticalImage: this.critical,
            normalImage: this.normal,
            diffImage: this.diff,
            difference: difference,
            isValid: invalidPixels === 0,
        };
    }
}