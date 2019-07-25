# 基于Anyproxy使用"中间人攻击"半自动化爬取公众号推送并上传到数据库中

由于我是公众号和博客双向发送文章的，所以每次都要重复编辑文章有点繁琐，印象笔记的保存功能展现成网页也有排版问题，于是这次参考https://zhuanlan.zhihu.com/p/24302048 ，自己弄了个简单的爬取系统，喜欢请STAR一下，让我有动力继续更新！

关于使用，请见这篇文章：https://huanxiangke.com/view?contentid=5a09b3476ad2ef54925eb2ad

在本地环境下，若你部署的数据库和Collection的名字和我一致，应该能成功地直接保存到MongoDB中。



本库使用方法及环境配置步骤如下:

> 1. 新建一个Node.js项目，新建MongoDB数据库（可先在本地上进行调试），新建一个名为blog的库，名为articles和content的Collection.
>
> 2.  npm install 以下模块
>
>     mongoose, fs, body-parser, request,cherrio（用于爬取页面元素）,crypto(MD5编码).
>
> 3. 运行终端执行下面这个命令安装Anyproxy：
>
>    sudo npm -g install anyproxy
>
>    将库里的rule_default.js代替/usr/local/lib/node_modules/anyproxy/lib/内的rule_default.js（Mac）,
>
>    Windows据说在 APPdata\Roaming，若找不到请搜索一下Windows全局npm安装的位置。
>
>    rule_default.js有个地方要求修改成你的网站存放crawl.js的位置（设个路由指向这个文件即可）
>
> 4. 生成证书，使其支持https
>
>    sudo anyproxy --root
>
> 5. 启动Anyproxy, 运行
>
>    sudo anyproxy -i
>
> 6. 在安卓模拟器中安装证书：
>
>    启动Anyproxy, [localhost:8002/qr_root](http://link.zhihu.com/?target=http%3A//localhost%3A8002/qr_root) 可以获取证书路径的二维码，移动端安装时会比较便捷，使用微信识别二维码即可完成安装。
>
> 7. 设置代理，打开模拟器的WiFi，修改WiFi-使用代理，代理服务器地址就是运行anyproxy的电脑的ip地址。代理服务器默认端口是8001。
>
> 8. 可以打开公众号消息列表开始爬取了，这次爬取是为了得到文章链接，往下拉到最底部，直到没有文章为止。



爬取原理步骤如下：



> 1. 启动Anyproxy, 打开公众号的历史消息列表，在 [localhost:8002](http://link.zhihu.com/?target=http%3A//localhost%3A8002) 观察Anyproxy接收到的信息中哪一个是消息列表的。最后发现带有profile_ext的链接的是消息列表相关的。
> 2. 于是对带有profile_ext的链接的回复（有两种，一种是页面格式，一种是json(第二页以后就是json)）进行植入脚本。将其返回的所有信息存入之前所创建的MongoDB数据库blog里的Collections中（见GitHub里rule_default.js文件的getToMongodb()函数，建议先连接本地的MongoDB，成功后再连接服务器的）。
> 3. 在模拟器上往下拖，保存所有的推送。
> 4. 新建一个js文件，负责通过前面所爬取到的articles里的文章链接爬取文章并保存到数据库中(GitHub里对应crawl.js)。
> 5. 大功告成，接下来就差前端渲染数据展现博客了。

