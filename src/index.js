#!/usr/bin/env node
require('events').EventEmitter.prototype._maxListeners = 100;

require('yargs')
    .commandDir('commands')
    .demandCommand()
    .config()
    .help()
    .argv;