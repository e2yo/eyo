var fs = require('fs'),
    chalk = require('chalk'),
    isutf8 = require('isutf8'),
    program = require('commander'),
    request = require('request'),
    iconv = require('iconv-lite'),
    charset = require('charset'),
    eyo = require('../lib/eyo'),
    isWin = process.platform === 'win32',
    okSym = isWin ? '[OK]' : '✓',
    errSym = isWin ? '[ERR]' : '✗',
    exitCodes = {
        NOT_UTF8: 21,
        HAS_REPLACEMENT: 22,
        NO_SUCH_FILE: 23,
        UNKNOWN_CHARSET: 24
    },
    isFirst = true;

function printItem(color, item, i) {
    var before = item.before,
        after = item.after,
        newBefore = [],
        newAfter = [];

    // Diff by letters
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

module.exports = {
    /**
     * Ёфицировать текст.
     *
     * @param {string} text
     * @param {string} resource
     */
    processText: function(text, resource) {
        var n = isFirst ? '' : '\n';

        if(program.lint) {
            var replacement = eyo.lint(text, program.sort);
            if(replacement.safe.length) {
                console.log(n + chalk.red(errSym) + ' ' + resource);
            } else {
                console.log(n + chalk.green(okSym) + ' ' + resource);
            }

            if(replacement.safe.length) {
                console.log(chalk.yellow('Safe replacements:'));
                replacement.safe.forEach(printItem.bind(this, 'red'));

                if(!process.exitCode) {
                    process.exitCode = exitCodes.HAS_REPLACEMENT;
                }
            }

            if(replacement.notSafe.length) {
                console.log(chalk.red((replacement.safe.length ? '\n' : '') + 'Not safe replacements:'));
                replacement.notSafe.forEach(printItem.bind(this, 'yellow'));
            }
        } else {
            process.stdout.write(eyo.restore(text));
        }

        isFirst = false;
    },
    /**
     * Ёфицировать файл.
     *
     * @param {string} file
     * @param {Function} callback
     */
    processFile: function(file, callback) {
        if(fs.existsSync(file) && fs.statSync(file).isFile()) {
            var buf = fs.readFileSync(file);
            if(isutf8(buf)) {
                this.processText(buf.toString('utf8'), file);
            } else {
                console.error(chalk.red(file + ': is not UTF-8.'));
                process.exitCode = exitCodes.NOT_UTF8;
            }
        } else {
            console.error(chalk.red(file + ': no such file.'));
            process.exitCode = exitCodes.NO_SUCH_FILE;
        }

        callback();
    },
    /**
     * Ёфицировать страницу.
     *
     * @param {string} url
     * @param {Function} callback
     */
    processUrl: function(url, callback) {
        var that = this;
        request.get({url: url, gzip: true, encoding: null},
            function(error, res, buf) {
                if(error) {
                    console.log(chalk.red(error));
                    process.exitCode = exitCodes.ERROR_LOADING;
                }

                if(res && res.statusCode !== 200) {
                    console.log(chalk.red(url + ': returns status code is ' + res.statusCode + '.'));
                    process.exitCode = exitCodes.ERROR_LOADING;
                }

                if(isutf8(buf)) {
                    that.processText(buf.toString('utf8'), url);
                } else {
                    var enc = charset(res.headers['content-type'], buf);
                    if(iconv.encodingExists(enc)) {
                        that.processText(iconv.decode(buf, enc), url);
                    } else {
                        console.error(enc + ': is unknown charset.');
                        process.exitCode = exitCodes.UNKNOWN_CHARSET;
                    }
                }

                callback();
            });
    },
    /**
     * Является ли текст ссылкой?
     *
     * @param {string} text
     * return {boolean}
     */
    isUrl: function(text) {
        return text.search(/^https?:/) !== -1;
    }
};
