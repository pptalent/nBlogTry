var mongodb=require('./db'),
    markdown=require('markdown').markdown;

function Post(name,head, title, post,tags) {
    this.name = name;
    this.title = title;
    this.post = post;
    this.tags=tags;
    this.head=head;
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
        head:this.head,
        comments:[],
        reprint_info:{},
        pv:0
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
                        if(err){
                            mongodb.close();
                            return callback(err);
                        }
                        if(doc){
                            collection.update({
                                'name':name,
                                'time.day':date,
                                'title':title
                            },{
                                $inc:{'pv':1}
                            },function(err){
                                mongodb.close();
                                if(err){
                                    return callback(err);
                                }
                                else{
                                    return callback(null,doc);
                                }
                            })
                        }
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
                    //如果有 reprint_from，即该文章是转载来的，先保存下来 reprint_from
                    var reprint_from = "";
                    if (doc.reprint_info.reprint_from) {
                        reprint_from = doc.reprint_info.reprint_from;
                    }
                    if (reprint_from != "") {
                        //更新原文章所在文档的 reprint_to
                        collection.update({
                            "name": reprint_from.name,
                            "time.day": reprint_from.day,
                            "title": reprint_from.title
                        }, {
                            $pull: {
                                "reprint_info.reprint_to": {
                                    "name": name,
                                    "day": day,
                                    "title": title
                                }}
                        }, function (err) {
                            if (err) {
                                mongodb.close();
                                return callback(err);
                            }
                        });
                    }
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
                   collection.distinct("tags",function(err,tags){
                       mongodb.close();
                       if(err){
                           return callback(err);
                       }
                       else{
                           return callback(null,tags);
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
Post.search=function(keyword,callback){
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
                    var pattern=new RegExp("^.*"+keyword+".*$","i");
                    collection.find({
                        "title":pattern
                    },{
                        name:1,
                        title:1,
                        time:1
                    }).sort({
                        time:-1
                    }).toArray(function(err,docs){
                        if(err){
                            mongodb.close();
                            return callback(err);
                        }
                        else{
                            mongodb.close();
                            return callback(null,docs);
                        }
                    })
                }
            })
        }

    })
}
Post.reprint=function(reprint_from,reprint_to,callback){
    mongodb.open(function(err,db){
        if(err){
            callback(err);
        }
        else{
            db.collection('posts',function(err,collection){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                else{
                   collection.findOne({
                       "name":reprint_from.name,
                       "time.day":reprint_from.day,
                       "title":reprint.title
                   },function(err,doc){
                       if(err){
                           mondb.close();
                           callback(err);
                       }
                       else{
                           var date = new Date();
                           var time = {
                               date: date,
                               year : date.getFullYear(),
                               month : date.getFullYear() + "-" + (date.getMonth() + 1),
                               day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
                               minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                                   date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
                           };
                           delete doc.id;
                           doc.name=reprint_to.name;
                           doc.head=reprint_to.head;
                           doc.time=time;
                           doc.title=(doc.title.search(/[转载]/)>-1)?doc.title:"[转载]"+doc.title;
                           doc.comments=[];
                           doc.reprint_info={"reprint_from":reprint_from};
                           doc.pv=0;

                           collection.update({
                               "name":reprint_from.name,
                               "time.day":reprint_from.day,
                               "title":reprint.title
                           },{
                               $push:{
                                   "reprint_info.reprint_to":{
                                       "name":doc.name,
                                       "day":time.day,
                                       "title":doc.title
                                   }
                               }
                           },function(err){
                               if(err){
                                   mongodb.close();
                                   callback(err);
                               }
                           });
                           collection.inset(doc,{
                               safe:true
                           },function(err,post){
                                mongodb.close();
                               if(err){
                                   callback(err);
                               }
                               else{
                                   callback(null,post);
                               }
                           })
                       }
                   })
                }
            })
        }
    })
}