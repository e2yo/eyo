// jshint maxlen:1024

var assert = require('chai').assert,
    eyo = require('../lib/eyo');

var tests = [
    [
        'Корабль',
        'Корабль'
    ],
    [
        null,
        ''
    ],
    [
        'Ежик',
        'Ёжик'
    ],
    [
        'Ежик\nЕжик\nежик',
        'Ёжик\nЁжик\nёжик'
    ],
    [
        'Емко, остроумно и убедительно.',
        'Ёмко, остроумно и убедительно.'
    ],
    [
        '«Петр I»',
        '«Пётр I»'
    ],
    [
        'ПЕТР',
        'ПЕТР'
    ],
    [
        '«Лед тронулся, господа присяжные заседатели!»',
        '«Лёд тронулся, господа присяжные заседатели!»'
    ],
    [
        'Мед. образование',
        'Мед. образование'
    ],
    [
        'Бёрёза, бёреза',
        'Берёза, берёза'
    ],
    [
        'Елочка!',
        'Ёлочка!'
    ],
    [
        'Всем, всем, всем!',
        'Всем, всем, всем!'
    ]
];

describe('restore', function() {
    this.timeout(15000);

    tests.forEach(function(test) {
        it(test[1], function() {
            assert.equal(eyo.restore(test[0]), test[1]);
        });
    });
});

describe('lint', function() {
    this.timeout(15000);

    it('should return replacement', function() {
        var replacements = eyo.lint('«Лед тронулся, господа присяжные заседатели!»');
        assert.equal(replacements.safe.length, 1);
        assert.equal(replacements.notSafe.length, 0);
    });

    it('should return sorted results', function() {
        var replacements = eyo.lint('елка, Елка, елки, Елка, Береза, Ежик, ежики', true);

        assert.equal(replacements.safe.length, 6);
        assert.equal(replacements.notSafe.length, 0);

        assert.equal(replacements.safe[0].before, 'Береза');
        assert.equal(replacements.safe[1].before, 'Ежик');
        assert.equal(replacements.safe[2].before, 'Елка');
        assert.equal(replacements.safe[3].before, 'ежики');
        assert.equal(replacements.safe[4].before, 'елка');
        assert.equal(replacements.safe[5].before, 'елки');

    });

    it('should return correct positions', function() {
        var replacements = eyo.lint('В лесу родилась елочка.', true);

        assert.equal(replacements.safe.length, 1);

        assert.equal(replacements.safe[0].position[0].line, 1);
        assert.equal(replacements.safe[0].position[0].column, 17);
    });

    it('should return correct positions with new lines', function() {
        var replacements = eyo.lint('В лесу родилась елочка.\nВ лесу родилась елочка.\n', true);

        assert.equal(replacements.safe.length, 1);

        assert.equal(replacements.safe[0].position[0].line, 1);
        assert.equal(replacements.safe[0].position[0].column, 17);

        assert.equal(replacements.safe[0].position[1].line, 2);
        assert.equal(replacements.safe[0].position[1].column, 17);
    });
});

describe('_processFile', function() {
    this.timeout(15000);

    var program = require('commander'),
        oldExitCode = process.exitCode,
        oldLint = program.lint;

    beforeEach(function() {
        program.lint = true;
        process.exitCode = oldExitCode;
    });

    afterEach(function() {
        program.lint = oldLint;
        process.exitCode = oldExitCode;
    });

    it('should set exit code NO_SUCH_FILE', function(done) {
        eyo._processFile('unknown.txt', function() {
            assert.equal(process.exitCode, eyo.exitCodes.NO_SUCH_FILE);
            done();
        });
    });

    it('should set exit code NOT_UTF8', function(done) {
        eyo._processFile('test/texts/win1251.txt', function() {
            assert.equal(process.exitCode, eyo.exitCodes.NOT_UTF8);
            done();
        });
    });

    it('should set exit code HAS_REPLACEMENT', function(done) {
        eyo._processFile('test/texts/example_with_yo.txt', function() {
            assert.equal(process.exitCode, eyo.exitCodes.HAS_REPLACEMENT);
            done();
        });
    });

    it('should not set exit code', function(done) {
        eyo._processFile('test/texts/example_without_yo.txt', function() {
            assert.equal(process.exitCode, oldExitCode);
            done();
        });
    });
});

describe('_processUrl', function() {
    this.timeout(15000);

    var program = require('commander'),
        oldExitCode = process.exitCode,
        oldLint = program.lint;

    beforeEach(function() {
        program.lint = true;
        process.exitCode = oldExitCode;
    });

    afterEach(function() {
        program.lint = oldLint;
        process.exitCode = oldExitCode;
    });

    it('should set exit code ERROR_LOADING', function(done) {
        eyo._processUrl('https://raw.githubusercontent.com/hcodes/eyo/master/test/texts/unknown.txt', function() {
            assert.equal(process.exitCode, eyo.exitCodes.ERROR_LOADING);
            done();
        });
    });

    it('should set exit code HAS_REPLACEMENT', function(done) {
        eyo._processUrl('https://raw.githubusercontent.com/hcodes/eyo/master/test/texts/example_with_yo.txt', function() {
            assert.equal(process.exitCode, eyo.exitCodes.HAS_REPLACEMENT);
            done();
        });
    });

    it('should not set exit code', function(done) {
        eyo._processUrl('https://raw.githubusercontent.com/hcodes/eyo/master/test/texts/example_without_yo.txt', function() {
            assert.equal(process.exitCode, oldExitCode);
            done();
        });
    });
});
