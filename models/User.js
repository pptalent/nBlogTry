var mongodb=require('./db');

function User(user){
    this.name=user.name;
    this.password=user.password;
    this.email=user.email;
}

module.exports=User;

User.prototype.save=function(callback){
    //要存入数据库的用户文档
    var user={
        name:this.name,
        password:this.password,
        email:this.email
    }
    //open database
    mongodb.open(function(err,db){
       if(err){
           return callback(err);
       }
       //读取 users集合
       db.collection('users',function(err,collection){
           if(err){
               mongodb.close();
               return callback(err);
           }
           //将数据插入users集合
           collection.insert(user,{safe:true},function(err,user){
               mongodb.close();
               if(err){
                   return callback(err);
               }
               callback(null,user[0]);//成功，err为null，返回插入的user对象
           });
       });
    });
};

User.get=function(name,callback){
  mongodb.open(function(err,db){
      if(err){
          return callback(err)
      }
      db.collection('users',function(err,collection){
         if(err){
             mongodb.close();
             return callback(err);
         }
         collection.findOne({
             name:name
         },function(err,user){
             mongodb.close();
             if(err){
                 return callback(err);
             }
             callback(null,user)//返回查询的用户信息
         })
      });
  })
};