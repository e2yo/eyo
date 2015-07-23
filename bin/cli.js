#!/usr/bin/env node

var async = require('async'),
    chalk = require('chalk'),
    program = require('commander'),
    utils = require('./utils');

program
    .version(require('../package.json').version)
    .usage('[options] <file-or-url...>\n\n  Restoring the letter «ё» (yo) in russian texts.')
    .option('-l, --lint', 'Search of safe and unsafe replacements')
    .option('-s, --sort', 'Sort results')
    .option('--show-position', 'Show the line number and column number for lint mode')
    .option('--no-colors', 'Clean output without colors')
    .parse(process.argv);

chalk.enabled = program.colors;

if(process.stdin.isTTY && !program.args.length) {
    program.help();
}

if(process.stdin.isTTY) {
    var tasks = [];
    program.args.forEach(function(resource) {
        tasks.push(function(callback) {
            if(resource.search(/^https?:/) !== -1) {
                utils._processUrl(resource, callback);
            } else {
                utils._processFile(resource, callback);
            }
        });
    });

    async.series(tasks, function() {
        process.exit();
    });
} else {
    var buf = '';

    process.stdin
        .setEncoding('utf8')
        .on('readable', function() {
            var chunk = process.stdin.read();
            if(chunk !== null) {
                buf += chunk;
            }
        })
        .on('end', function() {
            utils._processText(buf, 'stdin');
            process.exit();
        });
}
