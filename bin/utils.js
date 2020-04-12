'use strict';

const chalk = require('chalk');
const charset = require('charset');
const glob = require('glob');
const fs = require('fs');
const iconv = require('iconv-lite');
const isutf8 = require('isutf8');
const program = require('commander');
const fetch = require('node-fetch');
const Eyo = require('eyo-kernel');

const exitCodes = require('./exit-codes');
const {
    diffColor,
    okSymbol,
    errorSymbol,
    warningSymbol,
} = require('./symbols');

const safeEyo = new Eyo();
safeEyo.dictionary.loadSafeSync();

const notSafeEyo = new Eyo();
notSafeEyo.dictionary.loadNotSafeSync();

function printItem(item, i, isError) {
    const before = item.before;
    const after = item.after;
    const newBefore = [];
    const newAfter = [];
    const info = [];
    const pos = Array.isArray(item.position) ? item.position[0] : item.position;

    // Diff by letters
    for (let n = 0; n < before.length; n++) {
        if (before[n] !== after[n]) {
            newBefore[n] = diffColor(before[n]);
            newAfter[n] = diffColor(after[n]);
        } else {
            newBefore[n] = before[n];
            newAfter[n] = after[n];
        }
    }

    info.push(pos.line + ':' + pos.column);

    if (item.count > 1) {
        info.push('count: ' + item.count);
    }

    const text =
        (i + 1) + '. ' +
        newBefore.join('') + ' → ' +
        newAfter.join('') +
        (info.length ? ' (' + info.join(', ') + ')' : '');

    if (isError) {
        console.error(text);
    } else {
        console.warn(text);
    }
}

function printErrorItem(item, i) {
    printItem(item, i, true);
}

function printWarningItem(item, i) {
    printItem(item, i, false);
}

/**
 * Это ссылка?
 *
 * @param {string} path
 * @returns {boolean}
 */
function isUrl(path) {
    return path.search(/^https?:/) > -1;
}

/**
 * Развернуть glob-аргументы.
 *
 * @param {string[]} args
 * @returns {string[]}
 */
function expandGlobArgs(args) {
    let result = [];

    for (const value of args) {
        if (isUrl(value)) {
            result.push(value);
        } else {
            const files = glob.sync(value);
            if (files) {
                result = result.concat(files);
            }
        }
    }

    return result;
}

/**
 * Ёфицировать текст и вывести в консоль.
 *
 * @param {string} text
 * @param {string} resource
 */
function processText(text, resource) {
    if (program.lint) {
        lintText(text, resource);
    } else {
        if (program.inPlace) {
            try {
                const result = safeEyo.restore(text);
                fs.writeFileSync(resource, result);
            } catch(e) {
                process.exitCode = exitCodes.CANT_WRITE;
                console.error(e);
            }
        } else {
            process.stdout.write(safeEyo.restore(text));
        }
    }
}

/**
 * Проверка текста.
 *
 * @param {string} text
 * @param {string} resource
 */
function lintText(text, resource) {
    const safeReplacement = safeEyo.lint(text, program.sort);
    let notSafeReplacement = [];

    if (!program.onlySafe) {
        notSafeReplacement = notSafeEyo.lint(text, program.sort);
    }

    if (safeReplacement.length) {
        console.error(chalk.red(errorSymbol) + ' ' + resource);
    } else if (notSafeReplacement.length) {
        console.warn(chalk.yellow(warningSymbol) + ' ' + resource);
    } else if (!program.onlySafe) {
        console.log(chalk.green(okSymbol) + ' ' + resource);
    }

    if (safeReplacement.length) {
        console.error(chalk.red('Safe replacements:'));
        safeReplacement.forEach(printErrorItem);
        console.error(chalk.red('---'));

        if (!process.exitCode) {
            process.exitCode = exitCodes.HAS_REPLACEMENT;
        }
    }

    if (notSafeReplacement.length) {
        console.warn(chalk.yellow('Not safe replacements:'));
        notSafeReplacement.forEach(printWarningItem);
        console.warn(chalk.yellow('---'));
    }
}

/**
 * Ёфицировать файл.
 *
 * @param {string} file
 *
 * @returns {Promise}
 */
function processFile(file) {
    return new Promise((resolve, reject) => {
        if (isFile(file)) {
            fs.readFile(file, (error, buffer) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (isutf8(buffer)) {
                    processText(buffer.toString('utf8'), file);
                } else {
                    console.error(chalk.red(file + ': is not UTF-8.'));
                    process.exitCode = exitCodes.NOT_UTF8;
                }

                resolve();
            });
        } else {
            console.error(chalk.red(file + ': no such file.'));
            process.exitCode = exitCodes.NO_SUCH_FILE;

            resolve();
        }
    });
}

/**
 * Это файл?
 *
 * @param {string} file
 * @returns {boolean}
 */
function isFile(file) {
    return fs.existsSync(file) && fs.statSync(file).isFile();
}

/**
 * Ёфицировать страницу.
 *
 * @param {string} url
 */
async function processUrl(url) {
    try {
        const response = await fetch(url);
        const buffer = await response.buffer();

        if (response.status !== 200) {
            console.log(chalk.red(`${url}: returns status code is ${response.status}.`));
            process.exitCode = exitCodes.ERROR_LOADING;

            return;
        }

        if (isutf8(buffer)) {
            processText(buffer.toString('utf8'), url);
        } else {
            const encoding = charset(response.headers.get('content-type'), buffer);
            if (iconv.encodingExists(encoding)) {
                processText(iconv.decode(buffer, encoding), url);
            } else {
                console.error(encoding + ': is unknown charset.');
                process.exitCode = exitCodes.UNKNOWN_CHARSET;
            }
        }
    } catch(error) {
        console.log(chalk.red(error));
        process.exitCode = exitCodes.ERROR_LOADING;
    }
}

module.exports = {
    expandGlobArgs,
    isUrl,
    processFile,
    processText,
    processUrl,
};
