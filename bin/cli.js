#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const exit = require('exit');
const program = require('commander');
const {
    expandGlobArgs,
    isUrl,
    processUrl,
    processFile,
    processText,
} = require('./utils');

program
    .version(require('../package.json').version)
    .usage('[options] <file-or-url...>\n\n  Restoring the letter “ё” (yo) in russian texts.')
    .option('-l, --lint', 'Search of safe and unsafe replacements')
    .option('-i, --in-place', 'Write files in place.')
    .option('-s, --sort', 'Sort results')
    .option('--only-safe', 'Output only safe replacements')
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
        .on('readable', () => {
            const chunk = process.stdin.read();
            if (chunk !== null) {
                text += chunk;
            }
        })
        .on('end', () => {
            processText(text, program.stdinFilename || 'stdin');
            exit(process.exitCode);
        });
} else {
    Promise.all(expandGlobArgs(program.args).map(resource =>
        isUrl(resource) ?
            processUrl(resource) :
            processFile(resource)
    )).then(() => {
        exit(process.exitCode);
    }).catch((e) => {
        console.error(chalk.red(e));
        exit(process.exitCode);
    });
}
