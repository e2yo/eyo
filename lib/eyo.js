// jshint maxlen:1024
var fs = require('fs'),
    chalk = require('chalk'),
    isutf8 = require('isutf8'),
    program = require('commander'),
    request = require('request'),
    iconv = require('iconv-lite'),
    charset = require('charset'),
    utils = require('./utils'),
    isWin = process.platform === 'win32',
    okSym = isWin ? '[OK]' : '✓',
    errSym = isWin ? '[ERR]' : '✗',
    exitCodes = {
        NOT_UTF8: 21,
        HAS_REPLACEMENT: 22,
        NO_SUCH_FILE: 23,
        UNKNOWN_CHARSET: 24
    },
    dictSafe = [],
    dictNotSafe = [],
    punctuation = '[{}()[\\]|<>=\\_"\'«»„“#$^%&*+-:;.,?!]',
    re = new RegExp('([А-ЯЁ]|[а-яё])[а-яё]{2,}(?!\\.\\s+([а-яё]|[А-ЯЁ]{2}|' + punctuation + ')|\\.' + punctuation + ')', 'g'),
    tableSafe = {},
    tableNotSafe = {},
    isFirst = true,
    isInited = false;

function isSkip(text) {
    return text.search(/[ЕЁеё]/) === -1;
}

function sortFunc(a, b) {
    var aBefore = a.before,
        bBefore = b.before,
        aBeforeLower = aBefore.toLowerCase(),
        bBeforeLower = bBefore.toLowerCase();

    if(aBefore[0] !== bBefore[0] && aBeforeLower[0] === bBeforeLower[0]) {
        if(aBefore > bBefore) {
            return 1;
        } else if(aBefore < bBefore) {
            return -1;
        } else {
            return 0;
        }
    } else {
        if(aBeforeLower > bBeforeLower) {
            return 1;
        } else if(aBeforeLower < bBeforeLower) {
            return -1;
        } else {
            return 0;
        }
    }
}

function restore(text, sort) {
    var replacement = {safe: [], notSafe: []};
    if(!text) {
        return {text: '', replacement: replacement};
    }

    if(isSkip(text)) {
        return {text: text, replacement: replacement};
    }

    if(!isInited) {
        dictSafe = require('./eyo_safe.json');
        dictNotSafe = require('./eyo_not_safe.json');

        utils.prepareDictionary(dictSafe, tableSafe);
        utils.prepareDictionary(dictNotSafe, tableNotSafe);

        isInited = true;
    }

    text = text.replace(re, function($) {
        var e = $.replace(/Ё/g, 'Е').replace(/ё/g, 'е'),
            pos = arguments[arguments.length - 2];
        if(tableSafe[e] && tableSafe[e] !== $) {
            replacement.safe.push({
                before: $,
                after: tableSafe[e],
                count: 1,
                position: utils.getPosition(text, pos)
            });
            return tableSafe[e];
        }

        if(tableNotSafe[e] && tableNotSafe[e] !== $) {
            replacement.notSafe.push({
                before: $,
                after: tableNotSafe[e],
                count: 1,
                position: utils.getPosition(text, pos)
            });
        }

        return $;
    });

    if(sort) {
        replacement.safe.sort(sortFunc);
        replacement.notSafe.sort(sortFunc);
    }

    return {
        text: text,
        replacement: replacement
    };
}

function printItem(color, item, i) {
    var before = item.before,
        after = item.after,
        newBefore = [],
        newAfter = [],
        info = [];

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

    if(program.showPosition) {
        info.push('line: ' + item.position[0].line);
        info.push('col: ' + item.position[0].column);
    }

    if(item.count > 1) {
        info.push('count: ' + item.count);
    }

    console.log(
        (i + 1) + '. ' +
        newBefore.join('') + ' → ' +
        newAfter.join('') +
        (info.length ? ' (' + info.join(', ') + ')' : '')
    );
}

module.exports = {
    /**
     * Поиск вариантов безопасной и небезопасной замены «ё».
     *
     * @param {string} text
     * @param {boolean} needSort
     *
     * @return {Object}
     */
    lint: function(text, needSort) {
        var rep = restore(text, needSort).replacement;
        rep.safe = utils.delDuplicates(rep.safe);
        rep.notSafe = utils.delDuplicates(rep.notSafe);

        return rep;
    },
    /**
     * Восстановление «ё» в тексте.
     *
     * @param {string} text
     *
     * @return {string}
     */
    restore: function(text) {
        return restore(text).text;
    },
    /**
     * Ёфицировать текст.
     *
     * @param {string} text
     * @param {string} resource
     */
    _processText: function(text, resource) {
        var n = isFirst ? '' : '\n';

        if(program.lint) {
            var replacement = this.lint(text, program.sort);
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
            process.stdout.write(this.restore(text));
        }

        isFirst = false;
    },
    /**
     * Ёфицировать файл.
     *
     * @param {string} file
     * @param {Function} callback
     */
    _processFile: function(file, callback) {
        if(fs.existsSync(file) && fs.statSync(file).isFile()) {
            var buf = fs.readFileSync(file);
            if(isutf8(buf)) {
                this._processText(buf.toString('utf8'), file);
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
    _processUrl: function(url, callback) {
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
                    callback();

                    return;
                }

                if(isutf8(buf)) {
                    that._processText(buf.toString('utf8'), url);
                } else {
                    var enc = charset(res.headers['content-type'], buf);
                    if(iconv.encodingExists(enc)) {
                        that._processText(iconv.decode(buf, enc), url);
                    } else {
                        console.error(enc + ': is unknown charset.');
                        process.exitCode = exitCodes.UNKNOWN_CHARSET;
                    }
                }

                callback();
            });
    },
    exitCodes: exitCodes
};
