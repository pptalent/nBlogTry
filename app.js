
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var MongoStore=require("connect-mongo")(express);
var setting=require('./setting');
var flash=require('connect-flash');
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.logger({stream: accessLog}));
app.use(express.bodyParser({
    keepExtensions:true, //保留文件的后缀名
    uploadDir:'./public/images' //设置上传目录
}));
app.use(express.methodOverride());
app.use(express.cookieParser()); //cookie解析的中间件
app.use(express.session({ //提供回话支持
    secret:setting.cookieSecret, //防止篡改cookie
    key:setting.db, //cookie name
    cookie:{maxAge:1000*60*60*24*30}, //30天有效期
    store:new MongoStore({
        db:setting.db //会话信息存储到数据库中
    })
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (err, req, res, next) {
    var meta = '[' + new Date() + '] ' + req.url + '\n';
    errorLog.write(meta + err.stack + '\n');
    next();
});

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

routes(app);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

