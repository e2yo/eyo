#!/usr/bin/env node

'use strict';

const async = require('async');
const chalk = require('chalk');
const exit = require('exit');
const program = require('commander');
const utils = require('./utils');

program
    .version(require('../package.json').version)
    .usage('[options] <file-or-url...>\n\n  Restoring the letter “ё” (yo) in russian texts.')
    .option('-l, --lint', 'Search of safe and unsafe replacements')
    .option('-s, --sort', 'Sort results')
    .option('--no-colors', 'Clean output without colors')
    .parse(process.argv);

chalk.enabled = program.colors;

if (process.stdin.isTTY && !program.args.length) {
    program.help();
}

if (process.stdin.isTTY) {
    const tasks = [];
    program.args.forEach(function(resource) {
        tasks.push(function(callback) {
            if (resource.search(/^https?:/) !== -1) {
                utils._processUrl(resource, callback);
            } else {
                utils._processFile(resource, callback);
            }
        });
    });

    async.series(tasks, function() {
        exit(process.exitCode);
    });
} else {
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
            utils._processText(text, 'stdin');
            exit(process.exitCode);
        });
}
