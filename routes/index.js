
/*
 * GET home page.
 */
var crypto=require('crypto'),
    User=require('../models/User'),
    Post=require('../models/Post'),
    fs=require('fs'),
    Comment=require("../models/Comment");
module.exports = function(app){
    app.get('/',function(req,res){
        var page=req.query.p?parseInt(req.query.p):1;
        Post.getAll(null,page,function(err,docs,total){
            if(err){
                docs=[];
                req.flash("error",err);
            }
            res.render('index',{
               title:"index",
               user:req.session.user,
               posts:docs,
               page:page,
               isFirstPage: (page - 1) === 0,
               isLastPage: ((page - 1) * 5 + docs.length) === total,
               success:req.flash('success').toString() ,
               error:req.flash('error').toString()
            });
        });
    });
    app.get('/search',function(req,res){
        var keyword=req.query.keyword;
        Post.search(keyword,function(err,docs){
            if(err){
                req.flash("error",err);
                return res.redirect("/");
            }
            else{

                req.flash("suceess","search matching");
                res.render("search",{
                    "title":"search",
                    "user":req.session.user,
                    "posts":docs,
                    "success":req.flash("success").toString(),
                    "error":req.flash("error").toString()
                });
            }
        })
    });
    app.get('/archive',function(req,res){
        Post.archive(function(err,docs){
            if(err){
                req.flash("error",err);
                return res.redirect("/");
            }
            else{
                res.render("archive",{
                   title:"archive",
                    posts:docs,
                    user:req.session.user,
                   success:req.flash("success").toString(),
                   error:req.flash("error").toString()
                });
            }
        })
    });
    app.get('/tags',function(req,res){
       Post.getTags(function(err,tags){
           if(err){
               req.flash("error",err);
               return res.redirect("/");
           }
           else{
               res.render("tags",{
                   title: '标签',
                   posts: tags,
                   user: req.session.user,
                   success: req.flash('success').toString(),
                   error: req.flash('error').toString()
               })
           }
       })
    });
    app.get('/links',function(req,res){
        res.render('link',{
            title:"links",
            user:req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.get('/tags/:tag',function(req,res){
       Post.getTag(req.params.tag,function(err,docs){
           if(err){
               req.flash("error",err);
               return res.redirect("/");
           }
           else{
               res.render("tag",{
                   user:req.session.user,
                   title:"tag",
                   posts:docs,
                   success:req.flash("success").toString(),
                    error:req.flash("error").toString()
               })
           }
       })
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
            tags=[req.body.tag1,req.body.tag2,req.body.tag3],
            post=new Post(currentUser.name,req.body.title,req.body.post,tags);
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
        var page = req.query.p ? parseInt(req.query.p) : 1;
        User.get(req.params.name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            else{

                Post.getAll(user.name,page,function(err,docs,total){
                    if(err){
                        req.flash('error',err);
                        return res.redirect('./');
                    }
                    else{
                        res.render('user',{
                           title:user.name,
                           posts:docs,
                           user:req.session.user,
                           page:page,
                           isFirstPage: (page - 1) === 0,
                           isLastPage: ((page - 1) * 5 + docs.length) === total,
                           success:req.flash('success').toString(),
                           error:req.flash('error').toString()
                        });
                    }
                })
            }
        })
    });
    app.get('/u/:name/:date/:title',function(req,res){
       Post.getOne(req.params.name,req.params.date,req.params.title,function(err,doc){
           if(err){
               req.flash('error',err);
               return res.redirect("/");
           }
           else{
               res.render('article',{
                   title:doc.title,
                   user:req.session.user,
                   post:doc,
                   success:req.flash('success').toString(),
                   error:req.flash('error').toString()
               });
           }
       })
    });
    app.post('/u/:name/:date/:title',function(req,res){
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment = {
            name: req.body.name,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        }
        var new_comment=new Comment(req.params.name,req.params.date,req.params.title,comment);
        new_comment.save(function(err){
            if(err){
                req.flash("error",err);
                return res.redirect('back');
            }
            else{
                req.flash("success","comment success");
                res.redirect('back');
            }

        })
    });
    app.get('/remove/:name/:day/:title',function(req,res){
       Post.remove(req.params.name,req.params.day,req.params.title,function(err){
           if(err){
               req.flash("error",err);
               return res.redirect('back');
           }
           else{
               req.flash("success","remove success");
               return res.redirect('/');
           }
       })
    });
    app.get('/edit/:name/:day/:title',checkLogin);
    app.get('/edit/:name/:day/:title',function(req,res){
        var current_user=req.session.user;
        Post.edit(req.params.name,req.params.day,req.params.title,function(err,post){
           if(err){
               req.flash("error",err);
               return res.redirect('back');
           }
           else{
               res.render('edit',{
                   title:"edit",
                   user:req.session.user,
                   post:post,
                   success:req.flash("success").toString(),
                   error:req.flash("error").toString()
               })
           }
        })
    });
    app.post("/edit/:name/:day/:title",function(req,res){
        var name=req.session.user.name;
        Post.update(name,req.params.day,req.params.title,req.body.post,function(err){
            var url="/u/"+name+"/"+req.params.day+"/"+req.params.title;

            if(err){
                req.flash("error",err.toString());
                return res.redirect(url);
            }
            else{
                req.flash("success","modify success!");
                return res.redirect(url);
            }
        })
    });
    app.use(function(req,res){
        res.render("404");
    })
};
function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','please log in first');
        return res.redirect('/login');
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