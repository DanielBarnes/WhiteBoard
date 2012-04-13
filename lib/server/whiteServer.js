var io = require('socket.io'),
    EventEmitter = require('events').EventEmitter;



var white = new EventEmitter();
white.on('go',function(app){
    io.listen(app);
    var rooms = [];
    white.on('room', function(roomNum){
        rooms.push(roomNum);
        var connections = {};
        io.of('/' + roomNum).on('connection', function(client){
            connections[client.id] = client;

        });
    });
});

module.exports = new EventEmitter();

module.exports.on('start',function(listenApp){
    white.emit('go', listenApp);
});

module.exports.on('addRoom', function(id){
    white.emit('room', id);
});
