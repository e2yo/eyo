module.exports = {
    /**
     * Удалить дубликаты в найденных словах.
     *
     * @param {Array} data
     * return {Array}
     */
    delDuplicates: function(data) {
        var count = {},
            position = {},
            result = [];
        data.forEach(function(el) {
            if(!count[el.before]) {
                count[el.before] = 1;
            } else {
                count[el.before]++;
            }

            if(!position[el.before]) {
                position[el.before] = [];
            }

            position[el.before].push(el.position);
        });

        var added = {};
        data.forEach(function(el) {
            var before = el.before;
            if(!added[before]) {
                el.count = count[before];
                el.position = position[before];

                result.push(el);

                added[before] = true;
            }
        });

        return result;
    },
    /**
     * Подготовить словарь для эффективного поиска.
     *
     * @param {Array} dictionary
     * @param {Object} table
     */
    prepareDictionary: function(dictionary, table) {
        function capitalize(text) {
            return text.substr(0, 1).toUpperCase() + text.substr(1);
        }

        dictionary.forEach(function(word) {
            var e = word
                .replace(/ё/g, 'е')
                .replace(/Ё/g, 'Е');

            if(word.search(/^[А-ЯЁ]/) === -1) {
                table[capitalize(e)] = capitalize(word);
            }

            table[e] = word;
        });
    },
    /**
     * Получить позицию (номер строки и номер столбца) в тексте.
     *
     * @param {string} text
     * @param {number} index
     * return {Object}
     */
    getPosition: function(text, index) {
        var buffer = text.substr(0, index).split(/\r\n|\n|\r/);

        return {
            line: buffer.length,
            column: buffer[buffer.length - 1].length + 1
        };
    },
    /**
     * Является ли текст ссылкой?
     *
     * @param {string} text
     * return {boolean}
     */
    isUrl: function(text) {
        return text.search(/^https?:/) !== -1;
    }
};
