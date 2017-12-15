//连接数据库的实例
var mongodb = require('./db');
//创建一个构造函数，命令为User,里面的username,password,email分别
//存储用户名、密码和邮箱.
function User(user){
    this.username = user.username;
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
    this.phone = user.phone;
    this.time = user.time
}
function formatDate(num){
    return num < 10 ? '0' + num : num
}
User.prototype.save = function(callback){
    var date = new Date();
    var now = date.getFullYear() + '-' + formatDate(date.getMonth() + 1) + '-' + formatDate(date.getDate()) + ' ' + formatDate(date.getHours()) + ':' + formatDate(date.getMinutes()) + ':' + formatDate(date.getSeconds());

    //收集即将存入数据库的数据
    var user = {
        username:this.username,
        password:this.password,
        email:this.email,
        phone:this.phone,
        name:this.name,
        time:now
    }
    //打开数据库
    mongodb.open(function(err,db){
        //如果在打开数据库的时候发生错误，将错误结果返回给回调.
        if(err){
            return callback(err);
        }
        //读取users集合
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //将数据插入到users集合里面去
            collection.insert(user,{safe:true},function(err,user){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,user);//User是一个注册成功后的返回对象，里面包含了查询的相关信息。
            })
        })
    })
}
User.get = function(username,callback){
    //1.打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取users集合
        db.collection('users',function(err,collection){

            if(err){
                mongodb.close();
                return callback(err);
            }


            //查询出name为指定用户名的用户信息，将结果返回
            collection.findOne({username:username},function(err,user){
                mongodb.close();//关掉数据库
                if(err){
                    return callback(err);
                }
                return callback(null,user);
            })

        })
    })
}
User.getAll = function(name,page,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {}
            if(name){
                query.name = name;
            }
            collection.count(query,function(err,total){
                collection.find(query,{
                    skip: (page - 1)*10,
                        limit: 10
                }).sort({time:-1}).toArray(function(err,docs){
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }
                    //将每篇文章在读取的时候以markdown的格式进行解析
                    // docs.forEach(function(doc){
                    //     doc.content = markdown.toHTML(doc.content);
                    // })
                    return callback(null,docs,total);
                })
            })
        })
    })
}
User.edit = function(time,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                time:time
            },function(err,doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null,doc);
            })
        })
    })
}
User.update = function(username,name,phone,email,callback){

    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                username:username

            },{
                $set:{
                    name:name,
                    phone:phone,
                    email:email
                }
            },function(err,doc){

                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null,doc);
            })
        })
    })
}
//删除
User.remove = function(time,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                time:time
            },{
                w:1
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null);
            })
        })
    })
}



module.exports = User;
