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
        var replacements = eyo.lint('Елка, Елка, Береза, Ежик', true);

        assert.equal(replacements.safe.length, 3);
        assert.equal(replacements.notSafe.length, 0);
        
        assert.equal(replacements.safe[0].before, 'Береза');
        assert.equal(replacements.safe[1].before, 'Ежик');
        assert.equal(replacements.safe[2].before, 'Елка');
    });
});
