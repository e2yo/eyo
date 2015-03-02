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
    ]
];

describe('restore', function() {
    tests.forEach(function(test) {
        it(test[1], function() {
            assert.equal(eyo.restore(test[0]), test[1]);
        });
    });
});

describe('lint', function() {
    it('should return replacement', function() {
        assert.equal(eyo.lint('«Лед тронулся, господа присяжные заседатели!»').length, 1);
    });
});
