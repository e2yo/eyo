var dict = require('./eyo.json'),
    punc = '[{}()[\\]|<>=\\_"\'«»„“#$^%&*+-:;.,?!]',
    re = new RegExp('([А-ЯЁ]|[а-яё])[а-яё]{2,}(?!\\.\\s+([а-яё]|[А-ЯЁ]{2}|' + punc + ')|\\.' + punc + ')', 'g'),
    table = {};

dict.forEach(function(word) {
    var e = word
        .replace(/ё/g, 'е')
        .replace(/Ё/g, 'Е');

    if(word.search(/^[А-ЯЁ]/) === -1) {
        table[capitalize(e)] = capitalize(word);
    }

    table[e] = word;
});

function capitalize(text) {
    return text.substr(0, 1).toUpperCase() + text.substr(1);
}

function isSkip(text) {
    return text.search(/[ЕЁеё]/) === -1;
}

function restore(text) {
    var replacement = [];
    if(!text) {
        return {text: '', replacement: []};
    }

    if(isSkip(text)) {
        return {text: text, replacement: []};
    }

    text = text.replace(re, function($) {
        var e = $.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
        if(table[e]) {
            replacement.push([$, table[e]]);
            return table[e];
        }

        return $;
    });

    return {text: text, replacement: replacement};
}

module.exports = {
    lint: function(text) {
        return restore(text).replacement;
    },
    restore: function(text) {
        return restore(text).text;
    }
};
