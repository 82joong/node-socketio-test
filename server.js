var express = require('express')
	, io = require('socket.io');


var app = express.createServer()
	, socket = io.listen(app)
	, server_map = {}
	, tservers = {}
	, tserver_idx = {};

socket.configure(function(){
	socket.set('log level', 4);
});

// Configuration
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
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
    res.render('client');
});


socket.on('connection', function(con){
	console.log("connection : " + con.id);
	
	con.on('getServerMap', function(fn){
		console.log('con getServerMap -> ');
		console.dir(server_map);
		
		fn(server_map);
		
	});
	
	con.on('getTserverByRR', function(key, fn){
		console.log('con getTserverByRR -> ');
		console.dir(key);
		
		fn(getTserverByRR(key, con.nserver));
		
	});
	
	con.on('getTserverListByRR', function(fn){
		console.log('con getTserverListByRR -> ');
		var i = 0;
		var result = [];
		for(key in tservers){
			result.push(getTserverByRR(key, con.nserver));
		}
		console.log('result -> ');
		console.dir(result);
				
		fn(result);
	});
	
	con.on('tjoin', function(msg){
		console.log('new tjoin ->');
		console.dir(msg);
		for(key in msg){
			if(tservers[key]){
				tservers[key].push(msg[key]);
			}else{
				tservers[key] = [];
				tservers[key].push(msg[key]);
			}
			console.log('length : ' + tservers[key].length);
			//server_idx[key] = tservers[key].length;
			con.tserverName = msg[key].serverName;
		}
		console.log('tservers - >');
		console.dir(tservers);
//		console.log('tserver_idx - >');
//		console.dir(tserver_idx);
		console.log('connect - > ' + con.tserverName);
	});
	
	con.on('njoin', function(msg){
		console.log('new njoin ->');
		console.dir(msg);
		for(key in msg){
			if(nservers[key]){
				nservers[key].push(msg[key]);
			}else{
				nservers[key] = [];
				nservers[key].push(msg[key]);
			}
			console.log('length : ' + nservers[key].length);
			//server_idx[key] = tservers[key].length;
			con.nserverName = key;
		}
		console.log('nservers - >');
		console.dir(nservers);
//		console.log('nserver_idx - >');
//		console.dir(nserver_idx);
		console.log('connect - > ' + con.nserverName);
	});
	
	con.on('disconnect', function(){
		if(!con.tserverName) return;
		
		for(key in tservers){
			for(var i=0; i < tservers[key].length; i++){
				console.log('-> ' + tservers[key][i].serverName);
				
				if(tservers[key][i].serverName == con.tserverName){
					console.log('del -> ' + tservers[key][i]);
					tservers[key].splice(i, 1);
//					tserver_idx[key] = tservers[key].length;
				}
			}
		}
		
		console.log('tservers - >');
		console.dir(tservers);
//		console.log('server_idx - >');
//		console.dir(server_idx);
		console.log("disconnect : " + con.tserverName);
		
		con.broadcast.emit('announcement', {tserver: con.tserverName, action: "disconnected"});
	})
});

function getTserverByRR(key, nserverName){
	var i = 0;
	var name = {};
<<<<<<< HEAD
	
	if(tserver_idx[key]){
		console.log('-> ' + tserver_idx[key]);
		i = tserver_idx[key];
		if(i >= tservers[key].length){
			i = 0;
		}
	} else {
		console.log('-> ' + tserver_idx[key]);
		tserver_idx[key] = 0;
		i=0;
	}
	
	if(servers[key]) {
		console.dir(tservers[key][i]);
		tserver_idx[key] = i + 1;
		console.log('idx -> ');
		console.dir(tserver_idx);
		
		name = servers[key][i];
		name['service'] = key;
	}
	
	if(server_map[nserverName]){
		server_map[nserverName].push(name);
	}else{
		server_map[nserverName] = [];
		server_map[nserverName].push(name);
	}
	
	console.log('return -> ');
	console.dir(name);
	
=======

	if(server_idx[key]){
		console.log('-> ' + server_idx[key]);
		i = server_idx[key];
		if(i >= servers[key].length){
			i = 0;
		}
	} else {
		console.log('-> ' + server_idx[key]);
		server_idx[key] = 0;
		i=0;
	}

	if(servers[key]) {
        console.dir(servers[key][i]);
        server_idx[key] = i + 1;
        console.log('idx -> ');
        console.dir(server_idx);

        name = servers[key][i];
        name['service'] = key;
	}

    console.log('return -> ');
    console.dir(name);

>>>>>>> 8985c450e0a18795974abbfe8ec4703cd78cfd46
	return name;
}
    
app.listen(8001);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
