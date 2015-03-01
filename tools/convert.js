var fs = require('fs');
var dict = fs.readFileSync('Yoficator.dic.dat').toString('utf8');
var res = [];
var buf = dict.replace(/\r/g, '').split('\n');
var identify = {};
buf.forEach(function(word) {
    word = word.trim();
    if(word.search(/\*|\?|#/) === -1 && word) {
        if(identify[word]) {
            console.log('duplicate: ' + word);
        }

        if(word.search(/[Ёё]/) === -1) {
            console.log('not found the letter "ё": ' + word);
            process.exit(1);
        }

        res.push(word);
        identify[word] = true;
    }
});

res.sort();

console.log('Yoficator.dic.dat, words: ' + buf.length);
console.log('result dict, words: ' + res.length);
fs.writeFileSync('../lib/eyo.json', JSON.stringify(res, null, '  '));
