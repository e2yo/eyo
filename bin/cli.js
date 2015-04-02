#!/usr/bin/env node

var eyo = require('../lib/eyo'),
    chalk = require('chalk'),
    isutf8 = require('isutf8'),
    program = require('commander'),
    EXIT_CODE = {
        DONE: 0,
        NOT_UTF8: 1,
        HAS_REPLACEMENT: 2,
        NO_SUCH_FILE: 3,
        UNKNOWN_CHARSET: 4
    };

program
    .version(require('../package.json').version)
    .usage('[options] <file-or-url>\n\n  Restoring the letter «ё» (yo) in russian texts.')
    .option('-l, --lint', 'Search of safe and unsafe replacements')
    .option('--no-colors', 'Clean output without colors')
    .parse(process.argv);

function printItem(color, item, i) {
    var before = item.before,
        after = item.after,
        newBefore = [],
        newAfter = [];
    
    for(var n = 0; n < before.length; n++) {
        if(before[n] !== after[n]) {
            newBefore[n] = chalk.bold(before[n]);
            newAfter[n] = chalk.bold(after[n]);
        } else {
            newBefore[n] = before[n];
            newAfter[n] = after[n];
        }
    }

    console.log((i + 1) + '. ' +
        newBefore.join('') + ' → ' +
        newAfter.join('') +
        (item.count > 1 ? ' (' + item.count + ')' : ''));
}

function execute(text, resource) {
    var exitCode = EXIT_CODE.DONE;
    if(program.lint) {
        var replacement = eyo.lint(text);
        if(replacement.safe.length) {
            console.log(chalk.red('[×] ') + resource);
        } else {
            console.log(chalk.green('[OK] ') + resource);
        }
        
        if(replacement.safe.length) {
            console.log(chalk.red('\nReplacements:'));
            replacement.safe.forEach(printItem.bind(this, 'red'));

            exitCode = EXIT_CODE.HAS_REPLACEMENT;
        }

        if(replacement.notSafe.length) {
            console.log(chalk.yellow('\nControversial replacements:'));
            replacement.notSafe.forEach(printItem.bind(this, 'yellow'));
        }
    } else {
        process.stdout.write(eyo.restore(text));
    }

    process.exit(exitCode);
}

function processFile(file) {
    var fs = require('fs');

    if(fs.existsSync(file) && fs.statSync(file).isFile()) {
        var buf = fs.readFileSync(file);
        if(isutf8(buf)) {
            execute(buf.toString('utf8'), file);
        } else {
            console.error(chalk.red(file + ': is not UTF-8'));
            process.exit(EXIT_CODE.NOT_UTF8);
        }
    } else {
        console.error(chalk.red(file + ': no such file'));
        process.exit(EXIT_CODE.NO_SUCH_FILE);
    }
}

function processUrl(url) {
    var request = require('request'),
        iconv = require('iconv-lite'),
        charset = require('charset');

    request.get({url: url, gzip: true, encoding: null},
        function(error, res, buf) {
            if(error || res.statusCode !== 200) {
                console.log(chalk.red(url + ': returns status code is ' + res.statusCode));
                process.exit(EXIT_CODE.ERROR_LOADING);
            }

            if(isutf8(buf)) {
                execute(buf.toString('utf8'), url);
            } else {
                var enc = charset(res.headers['content-type'], buf);
                if(iconv.encodingExists(enc)) {
                    execute(iconv.decode(buf, enc), url);
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
