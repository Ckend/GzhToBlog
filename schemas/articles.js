var mongoose = require('mongoose');
var articleSchema = new mongoose.Schema({
    fakeid: String,
    // fakeid
    title:String,
    digest:String,
    // 摘要
    fileid:Number,
    content_url:String,
    source_url:String,
    cover:String,
    // 封面图片
    is_multi:Number,
    author:String
});
module.exports = articleSchema;