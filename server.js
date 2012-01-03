var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , th = require('thoonk').createClient('localhost')
  , url = require('url')
  , path = require('path')
  , sys = require('sys')

var lineFeed = th.sortedFeed('linefeed');
var pencilFeed = th.sortedFeed('pencilfeed');
var rectangleFeed = th.sortedFeed('rectfeed');

app.listen(8000);

function handler(request, response){
    var uri = url.parse(request.url).pathname;
    var filename = path.join(process.cwd(), uri);
    console.log('tryed file: ' + filename);
    path.exists(filename, function (exists){
        if(!exists){
            response.writeHeader(404, {'Content-Type': 'text/plain'});
            response.end('Are you snooping around?');
        }
        fs.readFile(filename, 'binary', function(err, file){
            if (err){
                console.log(err)
                response.writeHeader(500, {'Content-Type':'text/plain'});
                response.end('You got and Error!!! Gasp what should you do?');
                return;
            }

        response.writeHeader(200);
        response.end(file);
        });
    });
};


//function handler (req, res) {
//	fs.readFile(__dirname + '/index2.html',
//	function (err, data) {
//		if (err) {
//			res.writeHead(500);
//			return res.end('Error loading index.html');
//		}
//		res.writeHead(200);
//		res.end(data);
//	});
//}


var connections = {};
io.sockets.on('connection', function(socket){
	connections[socket.id] = socket;
	socket.on('disconnect', function(){
		delete connections[socket.id]
	});
	/*		CHECK IF FEEDS ARE EMPTY		 */
    items = lineFeed.getAll(function(err, reply) {
        console.log("DEBUG1");
        if (reply.length > 0) {
			console.log("DEBUG2");
            Object.keys(reply).forEach(function(key) {
                socket.emit('linetool',reply[key].item);
				console.log("DEBUG" + reply[key].item);
            });
        }
    });
    items = rectangleFeed.getAll(function(err, reply) {
        if (reply.length > 0) {
            Object.keys(reply).forEach(function(key) {
                socket.emit('rectangletool',reply[key].item);
            });
        }
    });
    items = pencilFeed.getAll(function(err, reply) {
        if (reply.length > 0) {
            Object.keys(reply).forEach(function(key) {
                socket.emit('penciltool',reply[key].item);
            });
        }
    });
	


	
	socket.on('rectangletool', function(obj){
		
        rectangleFeed.append(obj, obj, function(item , id){
            socket.broadcast.emit('rectangletool',obj);
        });
	});
	
	socket.on('linetool', function(obj){
        lineFeed.append(obj, obj, function(item , id){
            socket.broadcast.emit('linetool',obj);
        });
	});

	socket.on('penciltool', function(obj){
        pencilFeed.append(obj, obj, function(item , id){
            socket.broadcast.emit('penciltool',obj);
        });
	});

	socket.on('clearscreen', function(obj){
		socket.broadcast.emit('clearscreen',obj);
        items = rectangleFeed.getAll(function(err, reply) {
            Object.keys(reply).forEach(function(key) {
                rectangleFeed.retract(reply[key].id, function(){
                });
            });
        });
        items = lineFeed.getAll(function(err, reply) {
            Object.keys(reply).forEach(function(key) {
                lineFeed.retract(reply[key].id, function(){
                });
            });
        });
        items = pencilFeed.getAll(function(err, reply) {
            Object.keys(reply).forEach(function(key) {
                pencilFeed.retract(reply[key].id, function(){
                });
            });
        });
	});
});


//var conns = {};
/*
io.sockets.on('connection', function (socket) {
	items = sortedfeed.getAll(function(err, reply) {
		if (reply.length > 0) {
			Object.keys(reply).forEach(function(key) {
 				socket.send(reply[key].item);
			});
		}
	});
//	conns[socket.id] = socket;
//	socket.on('disconnect', function(){
//		delete conns[socket.id];
//	});
	socket.on('message', function(msg) {
		sortedfeed.append(msg, msg, function(item , id){
			socket.broadcast.emit('message',msg);
			socket.send(msg);
		});
	});
	socket.on('clearScreen', function(tmp){
		socket.broadcast.emit('clearScreen',{derp: '1'});
		console.log('emited the clear');
		items = sortedfeed.getAll(function(err, reply) {
			Object.keys(reply).forEach(function(key) {
				sortedfeed.retract(reply[key].id, function(){
				});
			});
		});
	});
});*/
