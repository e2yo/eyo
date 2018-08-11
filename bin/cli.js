#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const exit = require('exit');
const program = require('commander');
const utils = require('./utils');

program
    .version(require('../package.json').version)
    .usage('[options] <file-or-url...>\n\n  Restoring the letter “ё” (yo) in russian texts.')
    .option('-l, --lint', 'Search of safe and unsafe replacements')
    .option('--only-safe', 'Output only safe replacements')
    .option('-s, --sort', 'Sort results')
    .option('--no-colors', 'Clean output without colors')
    .option('--stdin', 'Process text provided on <STDIN>')
    .option('--stdin-filename <file>', 'Specify filename to process STDIN as')
    .parse(process.argv);

chalk.enabled = program.colors;

if (!program.stdin && !program.args.length) {
    program.help();
}

if (program.stdin) {
    let text = '';

    process.stdin
        .setEncoding('utf8')
        .on('readable', function() {
            const chunk = process.stdin.read();
            if (chunk !== null) {
                text += chunk;
            }
        })
        .on('end', function() {
            utils._processText(text, program.stdinFilename || 'stdin');
            exit(process.exitCode);
        });
} else {
    Promise.all(program.args.map(resource => {
        return new Promise(resolve => {
            if (resource.search(/^https?:/) !== -1) {
                utils._processUrl(resource, resolve);
            } else {
                utils._processFile(resource, resolve);
            }
        });
    })).then(() => {
        exit(process.exitCode);
    });
}
