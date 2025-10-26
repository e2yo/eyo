import { jest, describe, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { program } from 'commander';
import { processFile } from '../lib/utils.mjs';
import exitCodes from '../lib/exit-codes.mjs';

jest.setTimeout(15000);

describe('processFile', function() {
    const oldExitCode = process.exitCode;

    const spy = jest.spyOn(program, 'opts').mockImplementation(() => ({ lint: true }));

    afterAll(() => {
        spy.mockRestore();
    });

    beforeEach(function() {
        process.exitCode = oldExitCode;
    });

    afterEach(function() {
        process.exitCode = oldExitCode;
    });

    it('should set exit code NO_SUCH_FILE', done => {
        processFile('unknown.txt').then(() => {
            expect(process.exitCode).toEqual(exitCodes.NO_SUCH_FILE);
            done();
        });
    });

    it('should set exit code NOT_UTF8', done => {
        processFile('test/texts/win1251.txt').then(() => {
            expect(process.exitCode).toEqual(exitCodes.NOT_UTF8);
            done();
        });
    });

    it('should set exit code HAS_REPLACEMENT', done => {
        processFile('test/texts/example_with_yo.txt').then(() => {
            expect(process.exitCode).toEqual(exitCodes.HAS_REPLACEMENT);
            done();
        });
    });

    it('should not set exit code', done => {
        processFile('test/texts/example_without_yo.txt').then(() => {
            expect(process.exitCode).toEqual(oldExitCode);
            done();
        });
    });
});

