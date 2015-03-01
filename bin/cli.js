#!/usr/bin/env node

var fs = require('fs'),
    eyo = require('../lib/eyo'),
    isutf8 = require('isutf8'),
    program = require('commander');

program
    .version(require('../package.json').version)
    .usage('[options] <file>')
    .option('-l, --lint', 'in case some fixes needed returns an error')
    .parse(process.argv);

function execute(text) {
    if(program.lint) {
        var replacement = eyo.lint(text);
        if(replacement.length) {
            console.log('Found replacement:');
            replacement.forEach(function(item, i) {
                console.log((i + 1) + '. ' + item[0] + ' => ' + item[1]);
            });
            process.exit(2);
        }
    } else {
        process.stdout.write(eyo.restore(text));
    }

    process.exit(0);
}

if(process.stdin.isTTY && !program.args.length) {
    program.help();
}

var file = program.args[0],
    buf = '';

if(process.stdin.isTTY) {
    if(fs.existsSync(file) && fs.statSync(file).isFile()) {
        buf = fs.readFileSync(file);
        if(isutf8(buf)) {
            execute(buf.toString('utf8'));
        } else {
            console.error(file + ': is not utf-8');
            process.exit(1);
        }
    } else {
        console.error(file + ': no such file');
        process.exit(1);
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
