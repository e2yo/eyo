#!/usr/bin/env node

var fs = require('fs'),
    chalk = require('chalk'),
    charset = require('charset'),
    eyo = require('../lib/eyo'),
    isutf8 = require('isutf8'),
    iconv = require('iconv-lite'),
    program = require('commander'),
    request = require('request'),
    EXIT_CODE = {
        DONE: 0,
        NOT_UTF8: 1,
        HAS_REPLACEMENT: 2,
        NO_SUCH_FILE: 3,
        UNKNOWN_CHARSET: 4
    };

program
    .version(require('../package.json').version)
    .usage('[options] <file-or-url>')
    .option('-l, --lint', 'in case some fixes needed returns an error')
    .parse(process.argv);

function execute(text) {
    console.time('a');

    var exitCode = EXIT_CODE.DONE;
    if(program.lint) {
        var replacement = eyo.lint(text);
        if(replacement.safe.length) {
            console.log('Safe replacements:');
            replacement.safe.forEach(function(item, i) {
                console.log((i + 1) + '. ' + item[0] + ' => ' + item[1]);
            });

            if(replacement.notSafe.length) {
                console.log('');
            }

            exitCode = EXIT_CODE.HAS_REPLACEMENT;
        }

        if(replacement.notSafe.length) {
            console.log('Not safe replacements:');
            replacement.notSafe.forEach(function(item, i) {
                console.log((i + 1) + '. ' + item[0] + ' => ' + item[1]);
            });
        }
    } else {
        process.stdout.write(eyo.restore(text));
    }
    console.timeEnd('a');

    process.exit(exitCode);
}

function processFile(file) {
    if(fs.existsSync(file) && fs.statSync(file).isFile()) {
        buf = fs.readFileSync(file);
        if(isutf8(buf)) {
            execute(buf.toString('utf8'));
        } else {
            console.error(file + ': is not utf-8');
            process.exit(EXIT_CODE.NOT_UTF8);
        }
    } else {
        console.error(file + ': no such file');
        process.exit(EXIT_CODE.NO_SUCH_FILE);
    }
}

function processUrl(url) {
    request.get({
            url: url,
            encoding: null,
        },
        function(error, res, buf) {
            if(error || res.statusCode !== 200) {
                callback(true, Error(url + ': returns status code is ' + res.statusCode));
                process.exit(EXIT_CODE.ERROR_LOADING);
            }

            if(isutf8(buf)) {
                execute(buf.toString('utf8'));
            } else {
                var enc = charset(res.headers['content-type'], buf);
                if(iconv.encodingExists(enc)) {
                    execute(iconv.decode(buf, enc));
                } else {
                    console.error(enc + ': is unknow charset');
                    process.exit(EXIT_CODE.UNKNOWN_CHARSET);
                }
            }
        });
}

if(process.stdin.isTTY && !program.args.length) {
    program.help();
}

var resource = program.args[0],
    buf = '';

if(process.stdin.isTTY) {
    if(resource.search(/https?:/) !== -1) {
        processUrl(resource);
    } else {
        processFile(resource);
    }
} else {
    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if(chunk !== null) {
            buf += chunk;
        }
    });

    process.stdin.on('end', function() {
        execute(buf);
    });
}
