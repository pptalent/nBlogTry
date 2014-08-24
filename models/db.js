var setting=require('../setting'),
    mongodb=require('mongodb');
var Db=mongodb.Db,
    Connection=mongodb.Connection,
    Server=mongodb.Server;
module.exports=new Db(
                        setting.db,
                        new Server(setting.host,Connection.DEFAULT_PORT),
                        {safe:true}
                    );