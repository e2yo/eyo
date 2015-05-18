#!/usr/bin/env node

var async = require('async'),
    program = require('commander'),
    chalk = require('chalk'),
    utils = require('../lib/utils');

program
    .version(require('../package.json').version)
    .usage('[options] <file-or-url...>\n\n  Restoring the letter «ё» (yo) in russian texts.')
    .option('-l, --lint', 'Search of safe and unsafe replacements.')
    .option('-s, --sort', 'Sort results.')
    .option('--no-colors', 'Clean output without colors.')
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
                utils.processUrl(resource, callback);
            } else {
                utils.processFile(resource, callback);
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
            utils.processText(buf);
            process.exit();
        });
}
