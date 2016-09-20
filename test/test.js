'use strict';

const assert = require('chai').assert;
const utils = require('../bin/utils');

describe('_processFile', function() {
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

    it('should set exit code NO_SUCH_FILE', function(done) {
        utils._processFile('unknown.txt', function() {
            assert.equal(process.exitCode, utils.exitCodes.NO_SUCH_FILE);
            done();
        });
    });

    it('should set exit code NOT_UTF8', function(done) {
        utils._processFile('test/texts/win1251.txt', function() {
            assert.equal(process.exitCode, utils.exitCodes.NOT_UTF8);
            done();
        });
    });

    it('should set exit code HAS_REPLACEMENT', function(done) {
        utils._processFile('test/texts/example_with_yo.txt', function() {
            assert.equal(process.exitCode, utils.exitCodes.HAS_REPLACEMENT);
            done();
        });
    });

    it('should not set exit code', function(done) {
        utils._processFile('test/texts/example_without_yo.txt', function() {
            assert.equal(process.exitCode, oldExitCode);
            done();
        });
    });
});

describe('_processUrl', function() {
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

    it('should set exit code ERROR_LOADING', function(done) {
        utils._processUrl('https://raw.githubusercontent.com/hcodes/utils/master/test/texts/unknown.txt', function() {
            assert.equal(process.exitCode, utils.exitCodes.ERROR_LOADING);
            done();
        });
    });

    it('should set exit code HAS_REPLACEMENT', function(done) {
        utils._processUrl('https://raw.githubusercontent.com/hcodes/eyo/master/test/texts/example_with_yo.txt', function() {
            assert.equal(process.exitCode, utils.exitCodes.HAS_REPLACEMENT);
            done();
        });
    });
    
    it('should not set exit code', function(done) {
        utils._processUrl('https://raw.githubusercontent.com/hcodes/eyo/master/test/texts/example_without_yo.txt', function() {
            assert.equal(process.exitCode, oldExitCode);
            done();
        });
    });
});
