var conn = io.connect('http://210.114.61.85:3000/chat'),
    totalCnt = 0;

function updateUserList(members) {
    $('#userList').html('');
    if (members) {
        members.forEach(function(name) {
            $('<li><a href="#">' + name + '</a></li>').appendTo($('#userList'));
        })
    }
}

function updateChatBox(msg) {
    var box = $('#chatBox');
    box.val(box.val() + msg);
    box.animate({
        scrollTop: (box[0].scrollHeight - box.height())
    }, 10);
}

conn.on('connect', function() {
    var username = $(document).getUrlParam('username');
    $("#header").html('<h1>Hello, ' + username + '</h1>');
    console.log('\n con : ', conn);
});

conn.on('message', function(msg) {
    updateChatBox(msg)
});

conn.on('members', function(members) {
    updateUserList(members);
});

conn.on('connect_failed', function() {
   $("#connect-error").show();
    console.log('fail');
//    window.location.href = '/index';
});

$('#connect-error .close').live("click", function(e) {
    window.location.href = '/index';
});

$('#createModal .submit').live("click", function(e) {
    var roomTitle = $('#title').val(),
        password = $('#password').val(),
        targetArea = '#alert-area';
    if (password) {
        roomTitle = roomTitle + ':' + password;
    }

    conn.emit('create', roomTitle, function(err, data) {
        if(err) {
            showAlert(targetArea, 'alert-error', err.msg);
            setDisabled('#createModal', false);
            return;
        }

        $('#roomTitle').html('<a href="#tab1" data-toggle="tab">' + $('#title').val() + '</a>');

        $('#chatBox').val(data.msg);
        updateUserList(data.members);
    });
    $('#createModal').modal('hide');
});

$('#chatInput').live('keyup', function(e) {
    if(e.which == 13) {
        var msg = $('#chatInput').val(),
            roomTitle = $('#roomTitle').children('h4').text();
//        console.log('roomTitle : ', roomTitle);
        if (typeof msg !== 'undefined' && msg.length > 0 && roomTitle) {
            var msgObj = {
                msg: msg,
                roomTitle: roomTitle
            }
            conn.emit('message', msgObj, function(err, msg) {
                updateChatBox(msg)
                $('#chatInput').val('');
            });
        }
    }
});

$('#chatSubmenu').live('mouseover mouseup', function(e) {
    var that = this;
    conn.emit('getChatList', function(err, data) {
        console.log('chatList: ', data)
        if (data && data.length > 0) {
            var ul = $('<ul class="dropdown-menu" id="chatList"></ul>');
            data.forEach(function(room) {
                room = room.replace('/chat/', '');
                $('<li><a tabindex="-1" href="#">' + room + '</a></li>').appendTo(ul);
            })
            ul.appendTo(that);
            return;
        }
    })
});





