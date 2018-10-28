'use strict';

const chalk = require('chalk');
const charset = require('charset');
const glob = require('glob');
const exitCodes = require('./exit-codes');

const Eyo = require('eyo-kernel');

const safeEyo = new Eyo();
safeEyo.dictionary.loadSafeSync();

const notSafeEyo = new Eyo();
notSafeEyo.dictionary.loadNotSafeSync();

const fs = require('fs');
const iconv = require('iconv-lite');
const isutf8 = require('isutf8');
const program = require('commander');
const request = require('request');

const isWin = process.platform === 'win32';
const okSym = isWin ? '[OK]' : '✓';
const errSym = isWin ? '[ERR]' : '✗';
const chalkDiff = isWin ? chalk.underline : chalk.bold;

let isFirst = true;

function printItem(color, item, i) {
    const before = item.before;
    const after = item.after;
    const newBefore = [];
    const newAfter = [];
    const info = [];
    const pos = Array.isArray(item.position) ? item.position[0] : item.position;

    // Diff by letters
    for (let n = 0; n < before.length; n++) {
        if (before[n] !== after[n]) {
            newBefore[n] = chalkDiff(before[n]);
            newAfter[n] = chalkDiff(after[n]);
        } else {
            newBefore[n] = before[n];
            newAfter[n] = after[n];
        }
    }

    info.push(pos.line + ':' + pos.column);

    if (item.count > 1) {
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
     * Это ссылка?
     *
     * @param {string} path
     * @returns {boolean}
     */
    isUrl(path) {
        return path.search(/^https?:/) > -1;
    },

    /**
     * Развернуть glob-аргументы.
     *
     * @param {string[]} args
     * @returns {string[]}
     */
    expandGlobArgs(args) {
        let result = [];

        for (const value of args) {
            if (this.isUrl(value)) {
                result.push(value);
            } else {
                const files = glob.sync(value);
                if (files) {
                    result = result.concat(files);
                }
            }
        }

        return result;
    },
    /**
     * Ёфицировать текст и вывести в консоль.
     *
     * @param {string} text
     * @param {string} resource
     */
    _processText(text, resource) {
        if (program.lint) {
            this._lintText(text, resource);
        } else {
            if (program.inPlace) {
                try {
                    const result = safeEyo.restore(text);
                    fs.writeFileSync(resource, result);
                } catch(e) {
                    process.exitCode = exitCodes.CANT_WRITE;
                    console.error(chalk.red(e));
                }
            } else {
                process.stdout.write(safeEyo.restore(text));
            }
        }
    },
    /**
     * Проверка текста.
     *
     * @param {string} text
     * @param {string} resource
     */
    _lintText(text, resource) {
        const n = isFirst ? '' : '\n';
        const safeReplacement = safeEyo.lint(text, program.sort);
        if (safeReplacement.length) {
            console.log(n + chalk.red(errSym) + ' ' + resource);
        } else {
            console.log(n + chalk.green(okSym) + ' ' + resource);
        }

        if (safeReplacement.length) {
            console.log(chalk.yellow('Safe replacements:'));
            safeReplacement.forEach(printItem.bind(this, 'red'));

            if (!process.exitCode) {
                process.exitCode = exitCodes.HAS_REPLACEMENT;
            }
        }

        if (!program.onlySafe) {
            const notSafeReplacement = notSafeEyo.lint(text, program.sort);
            if (notSafeReplacement.length) {
                console.log(chalk.red((notSafeReplacement.length ? '\n' : '') + 'Not safe replacements:'));
                notSafeReplacement.forEach(printItem.bind(this, 'yellow'));
            }
        }

        isFirst = false;
    },
    /**
     * Ёфицировать файл.
     *
     * @param {string} file
     * @param {Function} callback
     */
    _processFile(file, callback) {
        if (this.isFile(file)) {
            const buf = fs.readFileSync(file);
            if (isutf8(buf)) {
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
     * Это файл?
     *
     * @param {string} file
     * @returns {boolean}
     */
    isFile(file) {
        return fs.existsSync(file) && fs.statSync(file).isFile();
    },

    /**
     * Ёфицировать страницу.
     *
     * @param {string} url
     * @param {Function} callback
     */
    _processUrl(url, callback) {
        request.get(
            {url, gzip: true, encoding: null},
            (error, res, buf) => {
                if (error) {
                    console.log(chalk.red(error));
                    process.exitCode = exitCodes.ERROR_LOADING;
                }

                if (res && res.statusCode !== 200) {
                    console.log(chalk.red(`${url}: returns status code is ${res.statusCode}.`));
                    process.exitCode = exitCodes.ERROR_LOADING;
                    callback();

                    return;
                }

                if (isutf8(buf)) {
                    this._processText(buf.toString('utf8'), url);
                } else {
                    const enc = charset(res.headers['content-type'], buf);
                    if (iconv.encodingExists(enc)) {
                        this._processText(iconv.decode(buf, enc), url);
                    } else {
                        console.error(enc + ': is unknown charset.');
                        process.exitCode = exitCodes.UNKNOWN_CHARSET;
                    }
                }

                callback();
            });
    }
};
