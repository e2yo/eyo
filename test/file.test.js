'use strict';

const assert = require('chai').assert;
const { processFile } = require('../lib/utils');
const exitCodes = require('../lib/exit-codes');

describe('processFile', function() {
    this.timeout(15000);

    const program = require('commander');
    const oldExitCode = process.exitCode;
    const oldLint = program.lint;

    beforeEach(function() {
        program.lint = true;
        process.exitCode = oldExitCode;
    });

    afterEach(function() {
        program.lint = oldLint;
        process.exitCode = oldExitCode;
    });

    it('should set exit code NO_SUCH_FILE', done => {
        processFile('unknown.txt').then(() => {
            assert.equal(process.exitCode, exitCodes.NO_SUCH_FILE);
            done();
        });
    });

    it('should set exit code NOT_UTF8', done => {
        processFile('test/texts/win1251.txt').then(() => {
            assert.equal(process.exitCode, exitCodes.NOT_UTF8);
            done();
        });
    });

    it('should set exit code HAS_REPLACEMENT', done => {
        processFile('test/texts/example_with_yo.txt').then(() => {
            assert.equal(process.exitCode, exitCodes.HAS_REPLACEMENT);
            done();
        });
    });

    it('should not set exit code', done => {
        processFile('test/texts/example_without_yo.txt').then(() => {
            assert.equal(process.exitCode, oldExitCode);
            done();
        });
    });
});

