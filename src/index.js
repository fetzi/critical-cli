#!/usr/bin/env node

require('yargs')
    .commandDir('commands')
    .demandCommand()
    .config()
    .help()
    .argv;