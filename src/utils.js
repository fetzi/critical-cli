const logSymbols = require('log-symbols');
const chalk = require('chalk');

let verbose = false;

exports.setDebug = (debug) => {
    verbose = debug;
}

exports.info = (message) => {
    if (!verbose) return;

    process.stdout.write(logSymbols.info + ' ' + message + '\n');
}

exports.success = (message) => {
    process.stdout.write(logSymbols.success + ' ' + chalk.green(message) + '\n\n');
}

exports.error = (message) => {
    process.stderr.write(logSymbols.error + ' ' + chalk.red(message) + '\n\n');
}

exports.promisifyStream = (stream, event) => {
    return new Promise((resolve, reject) => {
        stream
            .on(event, () => {
                resolve();
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}