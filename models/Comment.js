var mongodb=require("./db");
function Comment(name,day,title,comment){
    this.name=name;
    this.day=day;
    this.title=title;
    this.comment=comment;
}
Comment.prototype.save=function(callback){
    var name=this.name,
        day=this.day,
        title=this.title,
        comment=this.comment;
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
                    collection.update({
                        "name":name,
                        "time.day":day,
                        "title":title
                    },{
                        $push:{"comments":comment}
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
module.exports=Comment;