'use strict';
let mongoose = require('mongoose');
let http = require('http');
let request = require('request');
let fs = require('fs');
let cheerio = require('cheerio');
let crypto = require('crypto');
mongoose.connect('mongodb://localhost:27017/blog');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('连接成功!');
});
let Content = require('../models/Content');
let Article = require('../models/gzh.js');
Article.find({},function (err, results) {
    if (err){
        console.log("Wrong \n");
    }
    for (let x in results){
        let digest = results[x].digest.replace(/ /g,'');
        let cover = results[x].cover.replace(/(\\\/)/g,'/');
        getContent(digest,cover,results[x].content_url.toString().replace("\\/\\/","//").replace("\\/","/"));
    }
});
function md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}
function getContent(digest,cover,link) {
    let html = "";
    http.get(link, function(res) {
        res.on('data', function (data) {
            html += data;
        }).on('end', function () {
            let $ = cheerio.load(html);
            let str = "";
            let length = $('#js_content').children().length + $('#js_content blockquote').children().length;
            let time = $('#post-date').text();
            let title = $('#activity-name').text().replace(/ /g,'');

            //输入新文章
            Content.findOne({
                title:title,
            }).then(function (content) {
                if (content){
                    console.log('已经存在这篇文章了！');
                    return;
                }
                console.log(length);
                let coverImg = cover.replace('https', 'http');
                let coverPosition = '../upload/cover/'+md5(title);
                request(coverImg)
                    .pipe(fs.createWriteStream(coverPosition));
                cover = coverPosition;
                console.log(cover);

                let img;
                for (let i = 0;i < length; ++i) {
                    if ($('#js_content p').eq(i).children('img').attr('data-src')) {
                        // 如果是图片的话
                        img = $('#js_content p').eq(i).children('img').attr('data-src').replace(/wx_fmt=(.*)/g, 'wx_fmt=png').replace('https', 'http');
                        let position = '../upload/img/'+md5(title+i)+'.png';
                        console.log(position);
                        request(img)
                            .pipe(fs.createWriteStream(position));
                        let imgStr = '<img src='+position+'></img>';
                        str += imgStr + '\n';
                    } else {
                        str += "<p>" + $('#js_content p').eq(i).text() + "</p>";
                        console.log(str);
                    }
                }
                let c = new Content({
                    title: title,
                    content: str,
                    description: digest,
                    addTime:time,
                    cover:cover
                });
                return c.save();
            }).catch(function (err) {
                if(err){
                    console.log(err);
                }else{
                    console.log('保存成功');
                }
            });
        });
    })
}
