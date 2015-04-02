var isWin = process.platform === 'win32';

module.exports = {
    exitCodes: {
        DONE: 0,
        NOT_UTF8: 21,
        HAS_REPLACEMENT: 22,
        NO_SUCH_FILE: 23,
        UNKNOWN_CHARSET: 24
    },
    okSym: isWin ? '[OK]' : '✓',
    errSym: isWin ? '[ERR]' : '✗'
};
