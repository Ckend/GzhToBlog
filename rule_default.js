var utils      = require("./util"),
    bodyParser = require("body-parser"),
    path       = require("path"),
    fs         = require("fs"),
    Promise    = require("promise");

var isRootCAFileExists = require("./certMgr.js").isRootCAFileExists(),
    interceptFlag      = false;

let mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/blog');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('连接成功!');
});

//e.g. [ { keyword: 'aaa', local: '/Users/Stella/061739.pdf' } ]
var mapConfig = [],
    configFile = "mapConfig.json";
function saveMapConfig(content,cb){
    new Promise(function(resolve,reject){
        var anyproxyHome = utils.getAnyProxyHome(),
            mapCfgPath   = path.join(anyproxyHome,configFile);

        if(typeof content == "object"){
            content = JSON.stringify(content);
        }
        resolve({
            path    :mapCfgPath,
            content :content
        });
    })
    .then(function(config){
        return new Promise(function(resolve,reject){
            fs.writeFile(config.path, config.content, function(e){
                if(e){
                    reject(e);
                }else{
                    resolve();
                }
            });
        });
    })
    .catch(function(e){
        cb && cb(e);
    })
    .done(function(){
        cb && cb();
    });
}
function getMapConfig(cb){
    var read = Promise.denodeify(fs.readFile);

    new Promise(function(resolve,reject){
        var anyproxyHome = utils.getAnyProxyHome(),
            mapCfgPath   = path.join(anyproxyHome,configFile);

        resolve(mapCfgPath);
    })
    .then(read)
    .then(function(content){
        return JSON.parse(content);
    })
    .catch(function(e){
        cb && cb(e);
    })
    .done(function(obj){
        cb && cb(null,obj);
    });
}

setTimeout(function(){
    //load saved config file
    getMapConfig(function(err,result){
        if(result){
            mapConfig = result;
        }
    });
},1000);


module.exports = {
    token: Date.now(),
    summary:function(){
        var tip = "the default rule for AnyProxy.";
        if(!isRootCAFileExists){
            tip += "\nRoot CA does not exist, will not intercept any https requests.";
        }
        return tip;
    },

    shouldUseLocalResponse : function(req,reqBody){
        //intercept all options request
        var simpleUrl = (req.headers.host || "") + (req.url || "");
        mapConfig.map(function(item){
            var key = item.keyword;
            if(simpleUrl.indexOf(key) >= 0){
                req.anyproxy_map_local = item.local;
                return false;
            }
        });


        return !!req.anyproxy_map_local;
    },

    dealLocalResponse : function(req,reqBody,callback){
        if(req.anyproxy_map_local){
            fs.readFile(req.anyproxy_map_local,function(err,buffer){
                if(err){
                    callback(200, {}, "[AnyProxy failed to load local file] " + err);
                }else{
                    var header = {
                        'Content-Type': utils.contentType(req.anyproxy_map_local)
                    };
                    callback(200, header, buffer);
                }
            });
        }
    },

    replaceRequestProtocol:function(req,protocol){
    },

    replaceRequestOption : function(req,option){
    },

    replaceRequestData: function(req,data){
    },

    replaceResponseStatusCode: function(req,res,statusCode){
    },

    replaceResponseHeader: function(req,res,header){
    },

    // Deprecated
    // replaceServerResData: function(req,res,serverResData){
    //     return serverResData;
    // },

    replaceServerResDataAsync: function(req,res,serverResData,callback){
      if(/mp\/getmasssendmsg/i.test(req.url)){
        //当链接地址为公众号历史消息页面时(第一种页面形式)
        //可能会302到/mp/profile_ext?action=home
          if(serverResData.toString() !== ""){
              try {//防止报错退出程序
                  getToMongodb(serverResData);
                  callback(serverResData);
              }catch(e){//如果上面的正则没有匹配到，那么这个页面内容可能是公众号历史消息页面向下翻动的第二页，因为历史消息第一页是html格式的，第二页就是json格式的。
                   try {
                      var json = JSON.parse(serverResData.toString());
                      var json = JSON.parse(ret[1]);

                      if (json.general_msg_list != []) {
                      }
                   }catch(e){
                     console.log(e);//错误捕捉
                   }
                  callback(serverResData);//直接返回第二页json内容
              }
          }
      }else if(/mp\/profile_ext\?action=home/i.test(req.url)){//当链接地址为公众号历史消息页面时(第二种页面形式)
          try {
              // getToMongodb(serverResData);
              var reg = /var msgList = \'(.*?)\';/;//定义历史消息正则匹配规则（和第一种页面形式的正则不同）
              var ret = reg.exec(serverResData.toString());//转换变量为string
              ret[1] = JSON.parse(ret[1].toString().replace(/&quot;/g, '\"'));
              let Article = require('/usr/local/lib/node_modules/anyproxy/lib/model/gzh.js');

              for(let i in ret[1].list){
                  Article.findOne({
                      fileid:ret[1].list[i].app_msg_ext_info['fileid']
                  }).then(function (articleInfo) {
                      if(articleInfo){
                          console.log("已经有这一篇文章了");
                          return;
                      }
                      let article = new Article({
                          fakeid:ret[1].list[i].comm_msg_info.fakeid,
                          title:ret[1].list[i].app_msg_ext_info.title,
                          digest:ret[1].list[i].app_msg_ext_info.digest,
                          fileid:ret[1].list[i].app_msg_ext_info.fileid,
                          content_url:ret[1].list[i].app_msg_ext_info.content_url,
                          source_url:ret[1].list[i].app_msg_ext_info.source_url,
                          cover:ret[1].list[i].app_msg_ext_info.cover,
                          is_multi:ret[1].list[i].app_msg_ext_info.is_multi,
                          author:ret[1].list[i].app_msg_ext_info.author
                      });
                      return article.save();
                  }).catch(function (err) {
                      console.log(err);
                  })
              }
              callback(serverResData);//将返回
              // 的代码插入到历史消息页面中，并返回显示出来
          }catch(e){
              console.log(e);
              callback(serverResData);
          }
      }else if(/mp\/profile_ext\?action=getmsg/i.test(req.url)){//第二种页面表现形式的向下翻页后的json
          try {
              getToMongodb(serverResData);
              if (json.general_msg_list != []) {
              }
          }catch(e){
              console.log(e);
          }
          callback(serverResData);
      }else if(/mp\/getappmsgext/i.test(req.url)){//当链接地址为公众号文章阅读量和点赞量时
          try {
              getToMongodb(serverResData);
          }catch(e){

          }
          callback(serverResData);
      }else if(/s\?__biz/i.test(req.url) || /mp\/rumor/i.test(req.url)){//当链接地址为公众号文章时（rumor这个地址是公众号文章被辟谣了）
          try {
          }catch(e){
              callback(serverResData);
          }
      }else{
          callback(serverResData);
      }
      callback(serverResData);//将返回的代码插入到历史消息页面中，并返回显示出来
    },

    pauseBeforeSendingResponse: function(req,res){
    },

    shouldInterceptHttpsReq:function(req){
        return interceptFlag;
    },

    //[beta]
    //fetch entire traffic data
    fetchTrafficData: function(id,info){},

    setInterceptFlag: function(flag){
        interceptFlag = flag && isRootCAFileExists;
    },

    _plugIntoWebinterface: function(app,cb){

        app.get("/filetree",function(req,res){
            try{
                var root = req.query.root || utils.getUserHome() || "/";
                utils.filewalker(root,function(err, info){
                    res.json(info);
                });
            }catch(e){
                res.end(e);
            }
        });

        app.use(bodyParser.json());
        app.get("/getMapConfig",function(req,res){
            res.json(mapConfig);
        });
        app.post("/setMapConfig",function(req,res){
            mapConfig = req.body;
            res.json(mapConfig);

            saveMapConfig(mapConfig);
        });

        cb();
    },

    _getCustomMenu : function(){
        return [
            // {
            //     name:"test",
            //     icon:"uk-icon-lemon-o",
            //     url :"http://anyproxy.io"
            // }
        ];
    }
};
function getToMongodb(serverResData) {
    let json = JSON.parse(serverResData.toString());
    let json_2 = JSON.parse(json.general_msg_list);
    let Article = require('/usr/local/lib/node_modules/anyproxy/lib/model/gzh.js');

    for(let i in json_2.list){
        Article.findOne({
            fileid:json_2.list[i].app_msg_ext_info['fileid']
        }).then(function (articleInfo) {
            if(articleInfo){
                console.log("已经有这一篇文章了");
                return;
            }
            let article = new Article({
                fakeid:json_2.list[i].comm_msg_info.fakeid,
                title:json_2.list[i].app_msg_ext_info.title,
                digest:json_2.list[i].app_msg_ext_info.digest,
                fileid:json_2.list[i].app_msg_ext_info.fileid,
                content_url:json_2.list[i].app_msg_ext_info.content_url,
                source_url:json_2.list[i].app_msg_ext_info.source_url,
                cover:json_2.list[i].app_msg_ext_info.cover,
                is_multi:json_2.list[i].app_msg_ext_info.is_multi,
                author:json_2.list[i].app_msg_ext_info.author
            });
            return article.save();
        }).catch(function (err) {
            console.log(err);
        })
    }
}
