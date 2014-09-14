var mongodb=require('./db'),
    markdown=require('markdown').markdown;

function Post(name, title, post,tags) {
    this.name = name;
    this.title = title;
    this.post = post;
    this.tags=tags
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
    var date = new Date();
    //存储各种时间格式，方便以后扩展
    var time = {
        date: date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth() + 1),
        day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    //要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        post: this.post,
        tags:this.tags,
        comments:[]
    };
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //将文档插入 posts 集合
            collection.insert(post, {
                safe: true
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null);//返回 err 为 null
            });
        });
    });
};

//读取文章及其相关信息
//第一个参数是null，则返回所有的文章，如果名字传入，返回该用户的所有文章
Post.getAll = function(name,page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            //根据 query 对象查询文章
            //使用count返回特定查询的文档数 total
            collection.count(query,function(err,total){
                collection.find(query,{
                    skip:(page-1)*5,
                    limit:5
                }).sort({
                    time:-1
                }).toArray(function(err,docs){
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }
                    else{
                        return callback(null,docs,total);
                    }
                })
            })

        });
    });
};
Post.getOne=function(name,date,title,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        else{
            db.collection('posts',function(err,collection){
                if(err){
                    //因为这个时候已经打开了数据库，只是在collection的时候发生error
                    mongodb.close();
                    return callback(err);
                }
                else{
                    collection.findOne({
                        "name":name,
                        "time.day":date,
                        'title':title
                    },function(err,doc){
                       mongodb.close();
                        if(err){
                            return callback(err);
                        }

                        return callback(null,doc);
                    });
                }
            })
        }
    })
};
Post.edit=function(name,day,title,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        else{
            db.collection('posts',function(err,collection){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                else{
                    collection.findOne({
                        "name":name,
                        "time.day":day,
                        "title":title
                    },function(err,doc){
                        mongodb.close();
                        if(err){
                          return  callback(err);
                        }
                        callback(null,doc);
                    })
                }
            })
        }
    })
}
Post.update=function(name,day,title,post,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        else{
            db.collection("posts",function(err,collection){

                if(err){
                    mongodb.close();
                    return callback(err);
                }
                else{
                    collection.update({
                        "name":name,
                        "time.day":day,
                        "title":title
                    },{
                        $set:{post:post}
                    },function(err){
                        mongodb.close();
                        if(err){
                            return callback(err);
                        }
                        else{
                            callback(null);
                        }
                    })
                }
            })
        }
    })
}
Post.remove=function(name,day,title,callback){
    mongodb.open(function(err,db){
        if(err){
            callback(err);
        }
        else{
            db.collection("posts",function(err,collection){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                else{
                    collection.remove({
                        "name":name,
                        "time.day":day,
                        "title":title
                    },{
                        w:1
                    },function(err){
                        mongodb.close();
                        if(err){
                            return callback(err);
                        }
                        else{
                            return callback(null);
                        }
                    })
                }
            })
        }
    })
}
Post.archive=function(callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        else{
            db.collection("posts",function(err,collection){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                else{
                    //返回只包含 name、time、title 属性的文档组成的存档数组
                    collection.find({},{
                        "name":1,
                        "time":1,
                        "title":1
                    }).sort({
                        time:-1
                    }).toArray(function(err,docs){
                        mongodb.close();
                        if(err){
                           return callback(err);
                        }
                        else{
                            return callback(null,docs);
                        }
                    })
                }
            })
        }
    })
}
Post.getTags=function(callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        else{
            db.collection("posts",function(err,collection){
               if(err){
                   mongodb.close();
                   return callback(err);
               }
                else{
                   //使用distinct来返回给定键的所有不同值,因为有些文章的tag是一样的，distinct就相当于去重
                   collection.distinct("tags",function(err,docs){
                       mongodb.close();
                       if(err){
                           return callback(err);
                       }
                       else{
                           return callback(null,docs);
                       }
                   })
               }
            });
        }
    })
}
Post.getTag=function(tag,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        else{
            db.collection("posts",function(err,collection){
                if(err){
                    return callback(err);
                }
                else{
                    collection.find({"tags":tag},{
                        name:1,
                        time:1,
                        title:1
                    }).sort({
                        time:-1
                    }).toArray(function(err,docs){
                        mongodb.close();
                        if(err){
                            return callback(err);
                        }
                        else{
                            return callback(null,docs);
                        }
                    })
                }
            })
        }
    })
}