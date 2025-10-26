import fs from 'node:fs';

import chalk from 'chalk';
import { glob } from 'glob';
import isutf8 from 'isutf8';
import { program } from 'commander';
import { Eyo, notSafeDictionary, safeDictionary } from 'eyo-kernel';

import exitCodes from './exit-codes.mjs';
import {
    diffColor,
    okSymbol,
    errorSymbol,
    warningSymbol,
} from './symbols.mjs';

const safeEyo = new Eyo();
safeEyo.dictionary.set(safeDictionary)

const notSafeEyo = new Eyo();
notSafeEyo.dictionary.set(notSafeDictionary);

export function printItem(item, i, isError) {
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

    if (Array.isArray(item.position) && item.position.length > 1) {
        info.push('count: ' + item.position.length);
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

export function printErrorItem(item, i) {
    printItem(item, i, true);
}

export function printWarningItem(item, i) {
    printItem(item, i, false);
}

/**
 * Это ссылка?
 *
 * @param {string} path
 * @returns {boolean}
 */
export function isUrl(path) {
    return path.search(/^https?:/) > -1;
}

/**
 * Развернуть glob-аргументы.
 *
 * @param {string[]} args
 * @returns {string[]}
 */
export function expandGlobArgs(args) {
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
export function processText(text, resource) {
    const opts = program.opts();
    if (opts.lint) {
        lintText(text, resource);
    } else {
        if (opts.inPlace) {
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
export function lintText(text, resource) {
    const opts = program.opts();
    const safeReplacement = safeEyo.lint(text, opts.sort);
    let notSafeReplacement = [];

    if (!opts.onlySafe) {
        notSafeReplacement = notSafeEyo.lint(text, opts.sort);
    }

    if (safeReplacement.length) {
        console.error(chalk.red(errorSymbol) + ' ' + resource);
    } else if (notSafeReplacement.length) {
        console.warn(chalk.yellow(warningSymbol) + ' ' + resource);
    } else if (!opts.onlySafe) {
        console.log(chalk.green(okSymbol) + ' ' + resource);
    }

    if (safeReplacement.length) {
        console.error(chalk.red(`Safe replacements: ${safeReplacement.length}`));
        safeReplacement.forEach(printErrorItem);
        console.error(chalk.red('---'));

        if (!process.exitCode) {
            process.exitCode = exitCodes.HAS_REPLACEMENT;
        }
    }

    if (notSafeReplacement.length) {
        console.warn(chalk.yellow(`Not safe replacements: ${notSafeReplacement.length}`));
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
export function processFile(file) {
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
export function isFile(file) {
    return fs.existsSync(file) && fs.statSync(file).isFile();
}

/**
 * Ёфицировать страницу.
 *
 * @param {string} url
 */
export async function processUrl(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (response.status !== 200) {
            console.log(chalk.red(`${url}: returns status code is ${response.status}.`));
            process.exitCode = exitCodes.ERROR_LOADING;

            return;
        }

        if (isutf8(buffer)) {
            processText(buffer.toString('utf8'), url);
        } else {
            console.error('Erroor: is unknown charset.');
            process.exitCode = exitCodes.UNKNOWN_CHARSET;
        }
    } catch(error) {
        console.log(chalk.red(error));
        process.exitCode = exitCodes.ERROR_LOADING;
    }
}
