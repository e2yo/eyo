#!/usr/bin/env node

import chalk from'chalk';
import fs from 'node:fs';
import { program } from 'commander';
import {
    expandGlobArgs,
    isUrl,
    processUrl,
    processFile,
    processText,
} from '../lib/utils.mjs';

const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;

program.configureHelp({
  styleTitle: (str) => chalk.bold(str),
  styleCommandText: (str) => chalk.cyan(str),
  styleCommandDescription: (str) => chalk.magenta(str),
  styleDescriptionText: (str) => chalk.italic(str),
  styleOptionText: (str) => chalk.green(str),
  styleArgumentText: (str) => chalk.yellow(str),
  styleSubcommandText: (str) => chalk.blue(str),
});

program
    .name('eyo')
    .version(version, '-V, --version', 'output the version number')
    .usage('[options] <file-or-url...>\n\n  Restoring the letter “ё” (yo) in russian texts.')
    .argument('[file-or-url...]', 'files or URLs to process')
    .option('-l, --lint', 'Search of safe and unsafe replacements')
    .option('-i, --in-place', 'Write files in place.')
    .option('-s, --sort', 'Sorting results by words with grouping')
    .option('--only-safe', 'Output only safe replacements')
    .option('--no-colors', 'Clean output without colors')
    .option('--stdin', 'Process text provided on <STDIN>')
    .option('--stdin-filename <file>', 'Specify filename to process STDIN as')
    .action((files, options) => {
        chalk.enabled = options.colors;

        if (!options.stdin && !process.argv.slice(2).length) {
            program.help();
        }

        if (options.stdin) {
            let text = '';

            process.stdin
                .setEncoding('utf8')
                .on('readable', () => {
                    const chunk = process.stdin.read();
                    if (chunk !== null) {
                        text += chunk;
                    }
                })
                .on('end', () => {
                    processText(text, options.stdinFilename || 'stdin');
                    process.exit(process.exitCode);
                });
        } else {
            Promise.all(expandGlobArgs(program.args).map(resource =>
                isUrl(resource) ?
                    processUrl(resource) :
                    processFile(resource)
            )).then(() => {
                process.exit(process.exitCode);
            }).catch((e) => {
                console.error(chalk.red(e));
                process.exit(process.exitCode);
            });
        }
    })
    .parse(process.argv);
