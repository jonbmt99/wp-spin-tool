const axios = require("axios");
const url = "https://api.telegram.org/bot156097778:";
const apiToken = "AAGUkHpuAY-RihvCVHA7g_E1vHfEnb45pF4";

var CronJob = require("cron").CronJob;
var wp = new WPAPI({
    endpoint: 'https://eorder.vn/wp-json',
    username: 'etopadmin',
    password: 'iTyLm3Nmy7A9*NJvb$j7Wrsd'
});

async function getListPostByCategory(categoryId, page) {
    let postList = [];
    let resp = await axios.get(`https://eorder.vn/wp-json/wp/v2/posts?categories=${categoryId}&per_page=100&page=${page}`)
    for (let item of resp.data) {
        if (!postList.includes(item.id))
            postList.push(item.id);
    }
    return postList;
}

async function publicPostByPostId(postId) {
    wp.posts().id(idPost).update({
        title: `${data.title.rendered} (edited)`,
        content: htmlExtended,
        status: 'private'
    }).then(function () {
        console.log('Succes: ' + idPost);
    }, function (error) {
        console.log(error);
    })
}

async function getTitlePostWP(id) {
    let res = await wp.posts().id(id).get();
    return res.title.rendered;
}

var job = new CronJob(
    "*/30 * * * *",
    function () {
        getTitlePostWP(idPost).then(data => {
            publicPostByPostId()
            axios.post(`${url}${apiToken}/sendMessage`, {
                chat_id: -422497443,
                text: `Đã public: ${data}-${idPost}`,
            })
                .then(function (response) {
                    console.log(response);
                })
                .catch(function (error) {
                    console.log(error);
                });
        })
    },
    null,
    true,
    "America/Los_Angeles"
);
job.start();
