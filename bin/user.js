var _ = require('underscore');

module.exports = function(con, rc) {
    con.on('join', function(user, callback) {
        console.log('join : ', user);
        if (_.isEmpty(user) || _.isEmpty(user.username) || _.isEmpty(user.password) || user.password < 3) {
            callback({msg: '이름 / 비밀번호가 올바르지 않습니다.'});
            return;
        }
        var multi = rc.multi(),
            username = user.username,
            password = user.password;
        rc.hexists('user:' + username, 'username', function(err, data) {
            if(err) {
                console.log(err);
                callback({msg: 'Redis err'});
                return;
            }
            if(data === 0) {
                multi.hset('user:' + username, 'username', username);
                multi.hset('user:' + username, password, 'password');
                multi.sadd('sessionid:' + username, con.id);
                multi.sadd('username:' + con.id, username);
                multi.exec(function (err, replies) {
                    if(err) {
                        console.log(err);
                        callback({msg: 'Redis err'});
                        return;
                    }
                    callback(null, username);
                });
                return;
            }
            callback({msg: '중복'});
        })
    });

    con.on('check', function(username, callback) {
        rc.hexists('user:' + username, 'username', function(err, data) {
            if(err) {
                console.log(err);
                callback({msg: 'Redis err'});
                return;
            }
            if(data) {
                callback({msg: '중복'});
                return;
            }
            callback(null, 'ok');
        });
    });

    con.on('login', function(user, callback) {
        console.log('user: ', user);
        if (_.isEmpty(user) || _.isEmpty(user.username) || _.isEmpty(user.password) || user.password < 3) {
            callback({msg: '이름 / 비밀번호가 올바르지 않습니다.'});
            return;
        }
        var username = user.username,
            password = user.password;
        rc.hexists('user:' + username, password, function(err, data) {
            if(err) {
                console.log(err);
                callback({msg: 'Redis err'});
                return;
            }
            if(data) {
                rc.sadd('sessionid:' + username, con.id, function(err, data) {
                    if(err) {
                        console.log(err);
                        callback({msg: 'Redis err'});
                        return;
                    }
                    callback(null, username);
                });
                return;
            }
            callback({msg: '이름 / 비밀번호가 올바르지 않습니다.'});
        });
    });
}