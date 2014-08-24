
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


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
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

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

routes(app);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

