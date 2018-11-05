const hbs = require('handlebars');
const fs = require('fs');

module.exports = class ReportRenderer {
    constructor(path) {
        this.path = path;

        const templateFile = fs.readFileSync(`${__dirname}/../templates/report.hbs`, 'utf-8');
        this.template = hbs.compile(templateFile);
    }

    render(executedTests, executionTime) {
        executedTests = executedTests.map(test => {
            test.criticalImage = test.criticalImage.replace(this.path, '.');
            test.normalImage = test.normalImage.replace(this.path, '.');
            test.diffImage = test.diffImage.replace(this.path, '.');

            return test;
        });

        const html = this.template({tests: executedTests, urlCount: executedTests.length, executionTime});

        fs.writeFileSync(`${this.path}/report.html`, html);
    }
}