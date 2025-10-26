import { jest, describe, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { program } from 'commander';
import { processUrl } from '../lib/utils.mjs';
import exitCodes from '../lib/exit-codes.mjs';

jest.setTimeout(15000);

describe('processUrl', function() {
    const oldExitCode = process.exitCode;

    const spy = jest.spyOn(program, 'opts').mockImplementation(() => ({ lint: true }));

    afterAll(() => {
        spy.mockRestore();
    });

    beforeEach(() => {
        process.exitCode = oldExitCode;
    });

    afterEach(() => {
        process.exitCode = oldExitCode;
    });

    it('should set exit code ERROR_LOADING', done => {
        processUrl('https://raw.githubusercontent.com/hcodes/utils/master/test/texts/unknown.txt').then(() => {
            expect(process.exitCode).toEqual(exitCodes.ERROR_LOADING);
            done();
        });
    });

    it('should set exit code HAS_REPLACEMENT', done => {
        processUrl('https://raw.githubusercontent.com/hcodes/eyo/master/test/texts/example_with_yo.txt').then(() => {
            expect(process.exitCode).toEqual(exitCodes.HAS_REPLACEMENT);
            done();
        });
    });

    it('should not set exit code', done => {
        processUrl('https://raw.githubusercontent.com/hcodes/eyo/master/test/texts/example_without_yo.txt').then(() => {
            expect(process.exitCode).toEqual(oldExitCode);
            done();
        });
    });
});
