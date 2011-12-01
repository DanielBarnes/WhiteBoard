var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
var util = require('util');

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
   conns[socket.id] = socket;
   socket.on('disconnect', function(){
      delete conns[socket.id];
   });
   socket.on('message', function(msg) {
     socket.send(msg);
     socket.broadcast.emit('message', msg);
   });
});
