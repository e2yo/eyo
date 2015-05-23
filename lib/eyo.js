var dictSafe = [],
    dictNotSafe = [],
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

function sortFunc(a, b) {
    var aBefore = a.before,
        bBefore = b.before,
        aBeforeLower = aBefore.toLowerCase(),
        bBeforeLower = bBefore.toLowerCase();

    if(aBefore[0] !== bBefore[0] && aBeforeLower[0] === bBeforeLower[0]) {
        if(aBefore > bBefore) {
            return 1;
        } else if(aBefore < bBefore) {
            return -1;
        } else {
            return 0;
        }
    } else {
        if(aBeforeLower > bBeforeLower) {
            return 1;
        } else if(aBeforeLower < bBeforeLower) {
            return -1;
        } else {
            return 0;
        }
    }
}

function restore(text, sort) {
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
            replacement.safe.push({before: $, after: tableSafe[e], count: 1});
            return tableSafe[e];
        }

        if(tableNotSafe[e] && tableNotSafe[e] !== $) {
            replacement.notSafe.push({before: $, after: tableNotSafe[e], count: 1});
        }

        return $;
    });

    if(sort) {
        replacement.safe.sort(sortFunc);
        replacement.notSafe.sort(sortFunc);
    }

    return {text: text, replacement: replacement};
}

function delDuplicates(data) {
    var count = {},
        result = [];
    data.forEach(function(el) {
        if(!count[el.before]) {
            count[el.before] = 1;
        } else {
            count[el.before]++;
        }
    });

    var added = {};
    data.forEach(function(el) {
        var before = el.before;
        if(!added[before]) {
            el.count = count[before];
            result.push(el);

            added[before] = true;
        }
    });

    return result;
}

module.exports = {
    /**
     * Поиск вариантов безопасной и небезопасной замены «ё».
     *
     * @param {string} text
     * @param {boolean} needSort
     *
     * @return {Object}
     */
    lint: function(text, needSort) {
        var rep = restore(text, needSort).replacement;
        rep.safe = delDuplicates(rep.safe);
        rep.notSafe = delDuplicates(rep.notSafe);

        return rep;
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
