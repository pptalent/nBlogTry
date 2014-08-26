
/*
 * GET home page.
 */
var crypto=require('crypto'),
    User=require('../models/User'),
    Post=require('../models/Post'),
    fs=require('fs');
module.exports = function(app){
    app.get('/',function(req,res){
        Post.getAll(null,function(err,docs){
            if(err){
                docs=[];
                req.flash("error",err);
            }
            res.render('index',{
               title:"index",
               user:req.session.user,
               posts:docs,
               success:req.flash('success').toString() ,
               error:req.flash('error').toString()
            });
        });
    });
    app.get('/login',checkNotLogin);
    app.get('/login',function(req,res){
        res.render('login',{
            title:'login',
            user:req.session.user,
            success:req.flash('success').toString() ,
            error:req.flash('error').toString()
        });
    });
    app.post('/login',checkNotLogin);
    app.post('/login',function(req,res){
        var md5=crypto.createHash('md5'),
            password=md5.update(req.body.password).digest('hex');
        User.get(req.body.name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/login');
            }
            if(user){
                if(user.password!==password){
                    req.flash('error','wrong password');
                    return res.redirect('/login');
                }
                else{
                    req.session.user=user;
                    req.flash('success',"login success");
                    return res.redirect('/');
                }
            }
            else{
                req.flash('error','user inexistence');
                return res.redirect('/login');
            }
        });
    });
    app.get('/logout',checkLogin);
    app.get('/logout',function(req,res){
        res.render('logout',{
            title:"logout",
            user: req.session.user,
            success:req.flash('success').toString() ,
            error:req.flash('error').toString()
        });
    });
    app.post('/logout',checkLogin);
    app.post('/logout',function(req,res){
        req.session.user=null;
        req.flash('success','logout success');

        return res.redirect('/');
    });
    app.get('/reg',checkNotLogin);
    app.get('/reg',function(req,res){
        res.render('registration',{
            title:'registration',
            user:req.session.user,
            success:req.flash('success').toString() ,
            error:req.flash('error').toString()
        });
    });
    app.post('/reg',checkNotLogin);
    app.post('/reg',function(req,res){
        var name=req.body.name,
            password=req.body.password,
            password_confirm=req.body.password_confirm,
            email=req.body.email;
        if(password!==password_confirm){
            req.flash('error',"you should input same password twice");
            return res.redirect('/reg');
        }
        //生成密码 M5 值
        var md5=crypto.createHash('md5'),
            password=md5.update(req.body.password).digest('hex');
        var newUser=new User({
            name:name,
            password:password,
            email:email
        });
        //check whether the user existed
        User.get(newUser.name,function(err,user){
            if(user){
                req.flash('error','already existence');
                return res.redirect('/reg');
            }
            else{
                newUser.save(function(err,user){
                    if(err){
                        req.flash('error',err);
                        return res.redirect('/reg');
                    }
                    else{
                        req.session.user=user;//用户信息存入session,以后就可以通过req.seesion.user来读取用户信息
                        req.flash('success','registrate success');
                        return res.redirect('/');
                    }
                });
            }
        })
    });
    app.get('/post',checkLogin);
    app.get('/post',function(req,res){
        res.render('post',{
            title:"post",
            user: req.session.user,
            success:req.flash('success').toString() ,
            error:req.flash('error').toString()
        });
    });
    app.post('/post',function(req,res){
        var currentUser=req.session.user,
            post=new Post(currentUser.name,req.body.title,req.body.post);
        post.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('/post');
            }
            else{
                req.flash('success','post success');
                return res.redirect('/');
            }
        });

    });
    app.get('/upload',checkLogin);
    app.get('/upload',function(req,res){
       res.render('upload',{
           title:"upload",
           user:req.session.user,
           success:req.flash('success').toString(),
           error:req.flash('error').toString()
       });
    });
    app.post('/upload',function(req,res){
        //the file in the req.files
       for(var i in req.files){
           //因为在app.js中设置了上传路径,所以这些文件都会先上传到那个目录
           //但是上传的文件，名字并不是原文件的名字，系统处理过的乱七八糟的名字，因此要重命名
           console.log(req.files[i].path);
           console.log(req.files[i].name);
           if(req.files[i].size===0){
               //使用同步的方式删除一个文件
               fs.unlinkSync(req.files[i].path);
               console.log('successly remove an empty file');
           }
           else{
               var target_path='./public/images/'+req.files[i].name;
               //使用同步的方式重命名
               fs.renameSync(req.files[i].path,target_path);
               console.log('rename');
           }
       }
        req.flash('success','upload successfully');
        res.redirect('/upload');
    });
    app.get('/u/:name',function(req,res){
        //检查用户是否存在
        User.get(req.params.name,function(err,user){
            if(!user){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('user',{
               title:user.name
            });
        })
    });
};
function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','please log in first');
        return res.redirect('/login');_
    }
    else{
        next();
    }
}
function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error',"Login already");
        return res.redirect('back');
    }
    else{
        next();
    }
}