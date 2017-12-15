//引入集合操作方法
var User = require('../model/User');
//引入一个加密插件
var crypto = require('crypto');

//未登录的时候
function checkLogin(req,res,next) {
    if(!req.session.user){
        req.flash('error','未登录,请先登录');
        return res.redirect('/login');
    }
    next();
}
// 已登录的情况下
function checkNotLogin(req,res,next) {
    if(req.session.user){
        req.flash('error','已登录');
        return res.redirect('back');
    }
    next();
}
module.exports = function (app) {
    app.get('/',function (req,res) {
        var page = parseInt(req.query.page) || 1;
        User.getAll(null,page,function(err,docs,total){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('index',{
                title:'首页',
                page:page,
                user:req.session.user,
                isFirstPage: page - 1 == 0,
                isLastPage: (page - 1)* 10 + docs.length == total,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                docs:docs
            })
        })

    })
    //登录页面
    app.get('/login',function (req,res) {
        res.render('login',{
            title:'登录页面',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //登录行为
    app.post('/login',function (req,res) {
        // 1.对密码进行加密
        var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');
        User.get(req.body.username,function (err,user) {
            if(err){
                req.flash('error',err);
                return res.redirect('/login');
            }
            //2.判断用户名是否存在
            if(!user){
                req.flash('error','用户名不存在');
                return res.redirect('/login');
            }
            // 3.判断密码是否正确
            if(user.password != password){
                req.flash('error','密码错误');
                return res.redirect('/login');
            }
            // 4.把用户登陆的信息保存在session中 并给出提示 跳转到首页
            req.session.user = user;
            req.flash('success','登录成功');
            return res.redirect('/');

        })
    })
    // 注册页面
    app.get('/reg',function (req,res) {
        res.render('reg',{
            title:'注册页面',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    function formatDate(num){
        return num < 10 ? '0' + num : num
    }
    //注册行为
    app.post('/reg',function(req,res){
        //要把数据存放到数据库里面去
        //1.收集数据
        var date = new Date();
        var now = date.getFullYear() + '-' + formatDate(date.getMonth() + 1) + '-' + formatDate(date.getDate()) + ' ' + formatDate(date.getHours()) + ':' + formatDate(date.getMinutes()) + ':' + formatDate(date.getSeconds());
        var time = now;
        var username = req.body.username;
        var password = req.body.password;
        var name = req.body.name;
        var phone = req.body.phone;

        var password_repeat = req.body['password_repeat'];
        //2.判断两次密码输入是否一致
        if(password != password_repeat){
            //给出用户提示
            req.flash('error','两次密码输入不正确');
            // console.log(req.flash('error').toString());
            return res.redirect('/reg');
        }
        //3.对密码进行加密
        var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            username:username,
            password:password,
            email:req.body.email,
            name:name,
            phone:phone,
            time:time
        })
        //4.判断用户名是否存在
        User.get(newUser.username,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/reg');
            }
            if(user){
                req.flash('error','用户名已存在');
                return res.redirect('/reg');
            }
            //5.将用户信息存入数据库，并且跳转到首页
            newUser.save(function(err,user){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                req.session.user = newUser;
                req.flash('success','注册成功');
                return res.redirect('/');
            })
        })
    })
    //编辑的路由
    app.get('/edit/:time',checkLogin,function(req,res){
        User.edit(req.params.time,function(err,doc){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            return res.render('edit',{
                title:'编辑页面',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                doc:doc
            })
        })
    })
    //修改行为
    app.post('/edit/:time',function(req,res){
        User.update(req.params.time,req.body.name,req.body.phone,req.body.email,function(err,doc){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            req.flash('success','修改成功');
            return res.redirect('/');
        })
    })
    // 删除的路由
    app.get('/remove/:time',checkLogin,function(req,res){
        User.remove(req.params.time,function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            req.flash('success','删除成功');
            return res.redirect('/');
        })
    })
    //退出
    app.get('/logout',checkLogin,function (req,res) {
        //将session里面的信息清除 并给出提示信息 跳转到首页
        req.session.user = null;
        req.flash('success','成功退出');
        return res.redirect('/');
    })

}
