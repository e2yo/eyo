const chalk = require('chalk');

const isWin = process.platform === 'win32';
const okSymbol = isWin ? '[OK]' : '✓';
const errorSymbol = isWin ? '[ERR]' : '✗';
const warningSymbol = isWin ? '[!]' : '⚠';
const diffColor = isWin ? chalk.underline : chalk.bold;

module.exports = {
    diffColor,
    isWin,
    okSymbol,
    errorSymbol,
    warningSymbol,
};
