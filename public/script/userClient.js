var conn = io.connect('http://210.114.61.85:3000/user');

function setDisabled(modalName, value) {
    $(modalName + ' .btn').attr('disabled', value);
    $(modalName + ' .input').attr('disabled', value);
}

function emitEvent(modalName, eventName){
    var username = $(modalName + ' .username').val(),
        password = $(modalName + ' .password').val(),
        targetArea = modalName + ' .alert-area';

    setDisabled(modalName, true);
    var msg = {'username': username, 'password': password};
    conn.emit(eventName, msg, function(err, username) {
        if(err) {
            showAlert(targetArea, 'alert-error', err.msg);
            setDisabled(modalName, false);
            return;
        }
//        $('#loginModal').modal('hide');
        window.location.href = '/chat?username=' + username + '&sessionid=' + conn.socket.sessionid;
    });
}

function showAlert(target, classType, errMsg) {
    classType = 'alert ' + classType;
    $(target)
        .html('<div class="' +  classType + '">'
        + '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">x</button>'
        + errMsg
        + '</div>');
}

function resetAlert(targetArea) {
    $(targetArea).html('<p></p>');
}

$('#joinModal .submit').live('click', function(event){
    var modalName = '#joinModal',
        eventName = 'join';
    emitEvent(modalName, eventName);
});

$('#loginModal .submit').live('click', function(event){
    var modalName = '#loginModal',
        eventName = 'login';
    emitEvent(modalName, eventName);
});

$('#joinModal .username').live('keyup', function(){
    var targetArea = '#joinModal .alert-area';
    if (this.value) {
        conn.emit('check', this.value, function(err, data) {
            if (err) {
                showAlert(targetArea, 'alert-error', err.msg);
                return;
            }
            showAlert(targetArea, 'alert-info', data);
        })
        return;
    }
    resetAlert(targetArea);
});

$('#joinModal .password').live('keyup', function(){
    var targetArea = '#joinModal .alert-area';
    if (this.value) {
        if (this.value.length < 3) {
            showAlert(targetArea, 'alert-error', '3자리 이상이어야 합니다.');
            return;
        }
        showAlert(targetArea, 'alert-info', 'ok');
        return;
    }
    resetAlert(targetArea);
});

