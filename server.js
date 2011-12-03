var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , th = require('thoonk').createClient('localhost')

var sortedfeed = th.sortedFeed('didyoudraw');

app.listen(8000);

function handler (req, res) {
	fs.readFile(__dirname + '/index.html',
	function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
}


var conns = {};
io.sockets.on('connection', function (socket) {
	items = sortedfeed.getAll(function(err, reply) {
		if (reply.length > 0) {
			Object.keys(reply).forEach(function(key) {
 				socket.send(reply[key].item);
			});
		}
	});
	conns[socket.id] = socket;
	socket.on('disconnect', function(){
		delete conns[socket.id];
	});
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
//				console.log(reply[key]);
				});
			});
		});
	});
});
