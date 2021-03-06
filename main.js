const path = require('path');
const fs = require('fs');
var CronJob = require('cron').CronJob;
var JSSoup = require('jssoup').default;
var WPAPI = require('wpapi/superagent');
const axios = require("axios");
const url = "https://api.telegram.org/bot156097778:";
const apiToken = "AAGUkHpuAY-RihvCVHA7g_E1vHfEnb45pF4";
const directoryPath = path.join(__dirname, 'dataspin');
let dataSpin;
wordsArr = [];
const properWordList = ['việt nam', 'trung quốc', 'hồ chí minh']

// Get dataspin by directory
// async function getDataSpin() {
//     return new Promise(() => {
//         const files = fs.readdirSync(directoryPath)
//         for (file of files){
//             dataSpin += fs.readFileSync(`./dataspin/${file}`,'utf-8');
//         }
//     }) 
// }

async function getDataSpin() {
    dataSpin = fs.readFileSync('./dataspin/17-DATA-CHUNG.txt', 'utf-8');
}
getDataSpin();


function buildWordMap() {
    let lines = dataSpin.split("\n");

    let arr = [];
    let res = {}
    for (let i = 0; i < lines.length; i++) {
        line = lines[i];

        // remove first and last character '{' '}'
        words = line.substring(1, line.length - 2).split("|");
        arr.push(words);

        // add to hash
        for (let j = 0; j < words.length; j++) {
            word = words[j]

            _l = countWord(word)

            if (!res[_l]) {
                res[_l] = {}
            }

            res[_l][word] = i
        }
    }
    return [res, arr]
}

function countWord(s) {
    return s.split(" ").length
}


res = buildWordMap();
wordsMap = res[0];
wordsArr = res[1];


var wp = new WPAPI({
    endpoint: 'http://wp-dev.eorder.vn/wp-json',
    username: 'test',
    password: 'truong123'
});

async function getDataWP(id) {
    let res = await wp.posts().id(id).get();
    return res
}

function findSynonymWordsByWord(word) {
    numberOfWords = countWord(word);
    idx = wordsMap[numberOfWords][word];
    return findSynonymWordsByIdx(idx);
}

function findSynonymWordsByIdx(idx) {
    return wordsArr[idx];
}

function travelHTML(data) {
    var stack = [data];
    while (stack.length > 0) {
        var cur = stack.pop();

        if (cur.hasOwnProperty('contents')) {
            contents = cur.contents
            for (let i = 0; i < contents.length; i++) {
                stack.push(contents[i]);
            }
        }
        else {
            words = cur._text.split(/[ ,.():\n]/g); // cac tu trong 1 the p can so sanh bo dau cau dinh' voi' tu`
            words = words.filter(word => word != '');
            console.log('*******', words);
            for (let number_word = 5; number_word >= 1; number_word--) {
                if (words.length >= number_word) {
                    for (let flag = 0; flag < words.length; flag++) {
                        var temp = words;
                        word = temp.slice(flag, flag + number_word);
                        if (word.length < number_word)
                            break;
                        keyword = word.join(' ');
                        lowerKeyword = keyword.toLowerCase();
                        let values = Object.keys(wordsMap[number_word]); // danh sach tu so sanh
                        for (var i = 0; i < values.length; i++) { // so sanh words voi tung tu can map trong danh sach
                            if (values[i] == '')
                                break;
                            if (properWordList.some(properWord => properWord == values[i])) {
                                words.splice(flag, number_word);
                                break;
                            }
                            if (lowerKeyword == values[i]) {
                                console.log('Tu cu: ', keyword);
                                let wordsMapResultByFunc = [];
                                wordsMapResultByFunc = findSynonymWordsByWord(lowerKeyword);
                                wordsMapResultByFunc = wordsMapResultByFunc.filter(word => word != lowerKeyword);
                                console.log('Danh sach tu map: ', wordsMapResultByFunc);
                                let wordReplace = wordsMapResultByFunc[getRandomArbitrary(0, wordsMapResultByFunc.length - 1)];
                                if (wordsMapResultByFunc.length > 0) {
                                    cur._text = cur._text.replace(keyword, wordReplace);
                                    words.splice(flag, number_word);
                                }
                                console.log('Tu moi: ', wordReplace);
                                console.log('-----------------------');
                                break;
                            }
                        }
                    }
                }
            }
            cur._text = fixUperCase(cur._text);
        }
    }

    let result = data.prettify()
    result = result.substring(result.indexOf('<div>') + 5, result.lastIndexOf('</div>'));
    return result;
}

function fixUperCase(data) {
    sentences = data.split('.');
    for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].charAt(0) == ' ')
            sentences[i] = ' ' + sentences[i].charAt(1).toUpperCase() + sentences[i].slice(2);
        sentences[i] = sentences[i].charAt(0).toUpperCase() + sentences[i].slice(1);
    }
    return sentences.join('.');
}

function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function spinDataByIdPost(idPost){
    getDataWP(idPost).then(data => {
        // data.rendered: content before update
        htmlExtended = `<div>${data.content.rendered}</div>`;
        var soupData = new JSSoup(htmlExtended);
        htmlExtended = travelHTML(soupData);
        wp.posts().id(idPost).update({
            title: data.title.rendered + " edit",
            content: htmlExtended,
            status: 'draft'
        }).then(function (response) {
            console.log(response);
        })
        // axios.post(`${url}${apiToken}/sendMessage`, {
        //     chat_id: -422497443,
        //     text: "Spin: " + data.title.rendered,
        // })
        //     .then(function (response) {
        //         console.log(response);
        //     })
        //     .catch(function (error) {
        //         console.log(error);
        //     });
    })
}

spinDataByIdPost(2);


// var job = new CronJob('* * * * * *', function () {
//     getContent(3).then(data => {
//         // data.rendered: content before update
//         getTitle(3).then(title => {
//             htmlExtended = `<div>${data.rendered}</div>`;
//             var soupData = new JSSoup(htmlExtended);
//             htmlExtended = travelHTML(soupData);
//             wp.posts().id(3).update({
//                 title: title + '(spin)',
//                 content: htmlExtended,
//                 status: 'publish'
//             }).then(function (response) {
//                 console.log(response);
//             })
//             axios.post(`${url}${apiToken}/sendMessage`, {
//                 chat_id: -422497443,
//                 text: "Spin: " + title,
//             })
//                 .then(function (response) {
//                     console.log(response);
//                 })
//                 .catch(function (error) {
//                     console.log(error);
//                 });
//         })
//     })
// }, null, true, 'America/Los_Angeles');
// job.start();


