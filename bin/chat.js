var _ = require('underscore');

module.exports = function(con, rc, rooms) {
    rooms = _.keys(con.manager.rooms).slice(2);


    con.on('create', function(newRoom, callback) {
        var user = con.handshake.user,
            username = user.username,
            oldRoom = user.room,
            msg = username + " 님이 입장!!\n",
            multi = rc.multi(),
            idx = 1;
        if (oldRoom) {
            multi.srem('room:' + oldRoom, username);
            multi.smembers('room:' + oldRoom);
            idx = 3;
        }
        multi.sadd('room:' + newRoom, username);
        multi.smembers('room:' + newRoom);
        multi.exec(function(err, replies) {
            console.log('old: %s, new: %s, members: %s', oldRoom, newRoom, replies);
            var result = {
                members: replies[idx],
                msg: msg
            };
            callback(null, result);
            if (oldRoom) {
                con.leave(oldRoom);
                con.broadcast.to(oldRoom).send(username + ' 님이 퇴장..ㅠㅠ\n');
                con.broadcast.to(oldRoom).emit('members', replies[1]);
            }
            con.join(newRoom);
            con.broadcast.to(newRoom).emit('members', replies[idx]);
            con.broadcast.to(newRoom).send(msg);
            user.room = newRoom;
            rooms = _.keys(con.manager.rooms).slice(2);
        })
    });

    con.on('message', function(msgObj, callback) {
        var roomTitle = msgObj.roomTitle,
            msg = con.handshake.user.username + ' : ' + msgObj.msg + '\n';

        con.broadcast.to(roomTitle).send(msg);
        callback(null, msg);
    });

    con.on('getChatList', function(callback) {
        console.log('\n rooms : ', rooms);
        callback(null, rooms);
    });

    con.on('disconnect', function() {
        console.log('username: ', con.handshake.user);
        var user = con.handshake.user,
            username = user.username,
            oldRoom = user.room;

        if (oldRoom) {
            var multi = rc.multi(),
                msg = username + ' 님이 퇴장..ㅠㅠ\n';

            multi.srem('room:' + oldRoom, username);
            multi.smembers('room:' + oldRoom);
            multi.exec(function(err, replies) {
                console.log('old: %s, members: %s', oldRoom, replies[1]);
                con.broadcast.to(oldRoom).send(msg);
                con.broadcast.to(oldRoom).emit('members', replies[1]);
                user.room = '';
                console.log('members : ', replies[1])
            })
            return;
        }
    });
}