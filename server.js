var express = require('express')
    , url = require('url')
	, redis = require('redis')
    , _ = require('underscore')
	, io = require('socket.io');


var app = express()
    , http = require('http')
    , server = http.createServer(app)
	, socket = io.listen(server)
    , port = 3000
	, rooms = '';

socket.configure(function(){
	socket.set('log level', 1);
});
socket.of('/chat').authorization(function (handshakeData, callback) {
//    console.log('/n===========================');
//    console.dir(handshakeData);
//    console.log('===========================/n');
    var referer = url.parse(handshakeData.headers.referer, true);

    if(_.isEmpty(referer) || _.isEmpty(referer.query) || _.isEmpty(referer.query.username) || _.isEmpty(referer.query.sessionid)) {
        callback(null, false);
        return;
    }
    var user = referer.query,
        username = user.username,
        sessionid = user.sessionid;

    rc.sismember('sessionid:' + username, sessionid, function (err, data) {
        if (err) {
            console.log('E :', err);
            callback(null, false);
            return;
        }
        if (data) {
            handshakeData.user = user;
            callback(null, true);
            return;
        }
        callback(null, false);
    });

});

var rc = new redis.createClient(6379, 'localhost', null);

rc.on('ready', function(){
	console.log("redis client reday!");
});

rc.on('err', function(err){
	console.log('redis client err!');
	console.dir(err);	
});

app.engine('html', require('ejs').renderFile);

// Configuration
app.configure(function(){
    app.set('view engine', 'html');
	app.set('views', __dirname + '/views');
	app.set('view options', { layout: false });
	app.use(express.bodyParser());
	app.use(express.favicon());
	app.use(express.logger({ buffer: 5000}));
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/', function (req, res) {
    res.redirect('/index');
});
app.get('/:name?', function (req, res) {
    var name = req.param('name');
    res.render(name);
});

socket.of('/user').on('connection', function(con){
	console.log("user connect : " + con.id);
    require('./bin/user')(con, rc);
	con.on('disconnect', function(){
        console.log("disconnect : " + con.id);
	})
});

socket.of('/chat').on('connection', function(con){
    console.log("chat connect : " + con.id);
    require('./bin/chat')(con, rc, rooms);
});
    
server.listen(port);

console.log("Express server listening on port %d in %s mode", port, app.settings.env);
