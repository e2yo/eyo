var dictSafe,
    dictNotSafe,
    punc = '[{}()[\\]|<>=\\_"\'«»„“#$^%&*+-:;.,?!]',
    re = new RegExp('([А-ЯЁ]|[а-яё])[а-яё]{2,}(?!\\.\\s+([а-яё]|[А-ЯЁ]{2}|' + punc + ')|\\.' + punc + ')', 'g'),
    tableSafe = {},
    tableNotSafe = {},
    isInited = false;

function prepareDictionary(dict, table) {
    dict.forEach(function(word) {
        var e = word
            .replace(/ё/g, 'е')
            .replace(/Ё/g, 'Е');

        if(word.search(/^[А-ЯЁ]/) === -1) {
            table[capitalize(e)] = capitalize(word);
        }

        table[e] = word;
    });
}

function capitalize(text) {
    return text.substr(0, 1).toUpperCase() + text.substr(1);
}

function isSkip(text) {
    return text.search(/[ЕЁеё]/) === -1;
}

function restore(text) {
    var replacement = {safe: [], notSafe: []};
    if(!text) {
        return {text: '', replacement: replacement};
    }

    if(isSkip(text)) {
        return {text: text, replacement: replacement};
    }

    if(!isInited) {
        dictSafe = require('./eyo_safe.json');
        dictNotSafe = require('./eyo_not_safe.json');
        prepareDictionary(dictSafe, tableSafe);
        prepareDictionary(dictNotSafe, tableNotSafe);
        isInited = true;
    }

    text = text.replace(re, function($) {
        var e = $.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
        if(tableSafe[e] && tableSafe[e] !== $) {
            replacement.safe.push([$, tableSafe[e]]);
            return tableSafe[e];
        }

        if(tableNotSafe[e] && tableNotSafe[e] !== $) {
            replacement.notSafe.push([$, tableNotSafe[e]]);
        }

        return $;
    });

    return {text: text, replacement: replacement};
}

module.exports = {
    /**
     * Поиск вариантов безопасной и небезопасной замены «ё».
     *
     * @param {string} text
     *
     * @return {Object}
     */
    lint: function(text) {
        return restore(text).replacement;
    },
    /**
     * Восстановление «ё» в тексте.
     *
     * @param {string} text
     *
     * @return {string}
     */
    restore: function(text) {
        return restore(text).text;
    }
};
