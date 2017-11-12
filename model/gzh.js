var mongoose = require('mongoose');
var articleSchema = require('../schemas/articles');
module.exports = mongoose.model('Article',articleSchema);