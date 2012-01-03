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
var textFeed = th.sortedFeed('textfeed');

app.listen(8000);
function handler(request, response){
	console.log('request starting...');
	var filePath = '.' + request.url;
	if (filePath == './')
		filePath = './index.html';
	var extname = path.extname(filePath);
	var contentType = 'text/html';
	switch (extname){
		case '.js':
			contentType = 'text/javascript';
			break;
		case '.css':
			contentType = 'text/css';
			break;
	}
	path.exists(filePath, function(exists){
		if (exists){
			fs.readFile(filePath, function(error, content){
				if (error){
					response.writeHead(500);
					response.end();
				}
				else{
					response.writeHead(200, { 'Content-Type': contentType });
					response.end(content, 'utf-8');
				}
			});
		}
		else{
			response.writeHead(404);
			response.end();
		}
	});
};

var connections = {};
io.sockets.on('connection', function(socket){
	connections[socket.id] = socket;
	socket.on('disconnect', function(){
		delete connections[socket.id]
	});
	/*		CHECK IF FEEDS ARE EMPTY		 */
    items = lineFeed.getAll(function(err, reply) {
        if (reply.length > 0) {
            Object.keys(reply).forEach(function(key) {
                socket.emit('linetool',reply[key].item);
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
	items = textFeed.getAll(function(err, reply) {
		if (reply.length > 0) {
			Object.keys(reply).forEach(function(key) {
				socket.emit('texttool',reply[key].item);
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

	socket.on('texttool', function(obj){
		textFeed.append(obj, obj, function(item , id){
			socket.broadcast.emit('texttool',obj);
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
		items = textFeed.getAll(function(err, reply) {
			Object.keys(reply).forEach(function(key) {
				textFeed.retract(reply[key].id, function(){
				});
			});
		});
	});
});
