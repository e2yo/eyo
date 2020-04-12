'use strict';

const assert = require('chai').assert;
const { processUrl } = require('../lib/utils');
const exitCodes = require('../lib/exit-codes');

describe('processUrl', function() {
    this.timeout(15000);

    const program = require('commander');
    const oldExitCode = process.exitCode;
    const oldLint = program.lint;

    beforeEach(() => {
        program.lint = true;
        process.exitCode = oldExitCode;
    });

    afterEach(() => {
        program.lint = oldLint;
        process.exitCode = oldExitCode;
    });

    it('should set exit code ERROR_LOADING', done => {
        processUrl('https://raw.githubusercontent.com/hcodes/utils/master/test/texts/unknown.txt').then(() => {
            assert.equal(process.exitCode, exitCodes.ERROR_LOADING);
            done();
        });
    });

    it('should set exit code HAS_REPLACEMENT', done => {
        processUrl('https://raw.githubusercontent.com/hcodes/eyo/master/test/texts/example_with_yo.txt').then(() => {
            assert.equal(process.exitCode, exitCodes.HAS_REPLACEMENT);
            done();
        });
    });

    it('should not set exit code', done => {
        processUrl('https://raw.githubusercontent.com/hcodes/eyo/master/test/texts/example_without_yo.txt').then(() => {
            assert.equal(process.exitCode, oldExitCode);
            done();
        });
    });
});
