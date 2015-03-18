var fs = require('fs'),
    dict = fs.readFileSync('Yoficator.dic.dat').toString('utf8'),
    buf = dict.split('\n'),
    resSafe = [],
    resNotSafe = [],
    identify = {};

buf.forEach(function(word) {
    word = word.trim();

    if(!word) {
        return;
    }

    if(word.search(/\*|#/) === -1) {
        if(word.search(/\?/) === -1) {
            resSafe.push(word);
        } else {
            resNotSafe.push(word.replace(/\?/g, ''));
        }
    } else {
        return;
    }

    if(identify[word]) {
        console.log('duplicate: ' + word);
        process.exit(1);
    }

    if(word.search(/[Ёё]/) === -1) {
        console.log('not found the letter "ё": ' + word);
        process.exit(1);
    }

    identify[word] = true;
});

resSafe.sort();
resNotSafe.sort();

console.log('Yoficator.dic.dat, words: ' + buf.length);

console.log('result dict, safe words: ' + resSafe.length);
fs.writeFileSync('../lib/eyo_safe.json', JSON.stringify(resSafe, null, '  '));

console.log('result dict, not safe words: ' + resNotSafe.length);
fs.writeFileSync('../lib/eyo_not_safe.json', JSON.stringify(resNotSafe, null, '  '));
