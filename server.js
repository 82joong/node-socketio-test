var express = require('express')
	, redis = require('redis')
	, io = require('socket.io');


var app = express.createServer()
	, socket = io.listen(app)
	, server_map = {}
	, tservers = {}
	, nservers = {}
	, tserver_idx = {};

socket.configure(function(){
	socket.set('log level', 1);
});

var rc = new redis.createClient(8080, '211.113.17.102', null);

rc.on('ready', function(){
	console.log("redis client reday!");
});

rc.on('err', function(err){
	console.log('redis client err!');
	console.dir(err);	
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
		var result = {};
		
		rc.smembers("node", function(err, nodes){
			if(err) console.log(err);
			else{
				console.log("-> nodes : ");
				console.dir(nodes);
				nodes.forEach(function(reply, i){
					console.log("-->node: " + nodes[i]);
					rc.hgetall(nodes[i], function(err, replies){
						if(err) console.log(err);
						else{
							console.log("--> replies: " + nodes[i] + " : ");
							console.dir(replies);
							result[nodes[i]] = replies;
							console.log("->result : ");		
							console.dir(result);
						}
					});
				});
			}
		});
		
		
		
		fn(server_map);
		
	});
	
	con.on('getTserverByRR', function(key, fn){
		console.log('con getTserverByRR -> ');
		console.dir(key);
		
		fn(getTserverByRR(key, con.nserverName));
		
	});
	
	con.on('getTserverListByRR', function(fn){
		console.log('con getTserverListByRR -> ');
		var i = 0;
		var result = [];
		for(key in tservers){
			result.push(getTserverByRR(key, con.nserverName));
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
		
		for(key in msg){
			rc.sadd( "service:" + key, JSON.stringify(msg[key]), function(err){
				if(err) console.log(err);
			});
			
			rc.sadd( "thrift:" + msg[key].serverName, key + ":" + msg[key].port, function(err){
				if(err) console.log(err);
			});
			
			rc.sadd( "thrift", "thrift:" + msg[key].serverName, function(err){
				if(err) console.log(err);
			});
		}
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
		
		for(key in msg){
			rc.hset( "node:" + key, "service:" + msg[key].serviceName, null, function(err){
				if(err) console.log(err);
			});
			
			rc.sadd( "node", "node:" + key, function(err){
				if(err) console.log(err);
			});
		}
	});
	
	con.on('disconnect', function(){
		if(con.tserverName){
			rc.smembers("thrift:"+con.tserverName, function(err, replies){
				if(err) console.log(err);
				else{
					console.log("-> replies");
					console.dir(replies);
					replies.forEach(function(reply, i){
						var r = reply.split(":");
						var value = {serverName: con.tserverName, port: r[1]};
						
						rc.srem("service:" + r[0], JSON.stringify(value));						
						rc.srem("thrift:" + con.tserverName, reply);
						rc.srem("thrift", con.tserverName);
					});
				}
			});
			
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
			
			con.broadcast.emit('announcement', {server: con.tserverName, action: "disconnected"});
		}else if(con.nserverName){
			delete nservers[con.nserverName];
			delete server_map[con.nserverName];
			
			rc.hgetall("node:"+con.nserverName, function(err, replies){
				replies.forEach(function(reply, i){
					rc.hdel("node:" + con.nserverName, reply);	
				});
				
			});
			
			rc.srem("node", "node" + con.nserverName);
		}
	})
});

function getTserverByRR(key, nserverName){
	var i = 0;
	var name = {};
	
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
	
	rc.incr("thrift:idx:"+key, function(err, idx){
		console.log("->reply : " + idx);
		rc.scard("service:" + key, function(err, max){
			if(err) console.log(err);
			else if( idx > max ){
				idx = 1;
				rc.set("thrift:idx:" + key, idx, function(err, reply){
					if(err) console.log(err);
					else console.log("--> reply : " + reply );
				});
			}
			rc.smembers("service:" + key, function(err, replies){
				if(err) console.log(err);
				else{
					console.log("-> replies[idx] : " + idx);
					console.dir(replies[idx-1]);
					rc.hset("node:" + nserverName, "service:" + key, replies[idx-1], function(err, reply){
						if(err) console.log(err);
						else console.log("--->reply : " + reply);
					});
				}
			});			
		});
	});

	
	if(tservers[key]) {
		console.dir(tservers[key][i]);
		tserver_idx[key] = i + 1;
		console.log('idx -> ');
		console.dir(tserver_idx);
		
		name = tservers[key][i];
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

	return name;
}
    
app.listen(8001);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
