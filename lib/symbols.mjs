import chalk from 'chalk';

export const isWin = process.platform === 'win32';
export const okSymbol = isWin ? '[OK]' : '✓';
export const errorSymbol = isWin ? '[ERR]' : '✗';
export const warningSymbol = isWin ? '[!]' : '⚠';
export const diffColor = isWin ? chalk.underline : chalk.bold;
