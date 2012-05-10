var io = require('socket.io'),
    EventEmitter = require('events').EventEmitter
    db = require('redis').createClient(),
    util = require('util');



var white = new EventEmitter();
white.on('go',function(app){
    var sockets = io.listen(app);
    console.log('listening to the app');
    var rooms = {};
    white.on('room', function(roomNum){
        //if the room hasn't been made
        //then make it otherwise keep going
        if(rooms[roomNum] === undefined){
            rooms[roomNum] = {
                clientCount : 0,
                exist : true,
                connections : {},
                dbname : 'whiteServer.contents.roomNumber.' + roomNum
            };
        }
        console.log('made the room');
        sockets.of('/' + roomNum).on('connection', function(client){
            console.log('got a connection');

            rooms[roomNum].connections[client.id] = client;
            rooms[roomNum].clientCount += 1;
            
            //if the database exits
            db.exists(rooms[roomNum].dbname, function(err){
                //then get all the contents
                if(!err){
                    db.lrange(rooms[roomNum].dbname, 0, -1, function(err, array){
                        console.log('agrs from lrange Callback: ' + arguments)
                        array.forEach(function(data){
                            console.log('stored data: ' + data);
                            //then send data to the client so their board is the up to date
                        });
                    });
                }
            });

            client.broadcast('data', {
                type : 'checkin',
                clientCount : rooms[roomNum].clientCount
            });

            client.on('data', function(data){
                if(data.type === 'clear'){
                    //cleared the contents of the board so,
                    //wipe out the database!
                    client.broadcast('data', data);
                    db.del(rooms[roomNum].dbname);
                } else if(data.type === 'checkin'){
                    //do checkin like things
                    console.log('a client did a checkin');
                } else {
                    //add to DB and re-emit the data!
                    client.broadcast('data', data);
                    db.rpush(rooms[roomNum].dbname, data);
                }
            });

            client.on('disconnect', function(){
                //delete the clients socket, he disconnected...
                delete rooms[roomNum].connections[client.id];
                //if there aren't any client in the room
                //do i need to delete stuff?? deconstruct?
                if(rooms[roomNum].clientCount === 0){
                    //there are 86400 seconds in a day
                    db.expire(rooms[roomNum].dbname, 86400 * 15)
                    console.log('delete lots of shit???');
                }
            });
        });
    });
});

module.exports = white;
/*
module.exports.on('start',function(listenApp){
    white.emit('go', listenApp);
});

module.exports.on('addRoom', function(id){
    white.emit('room', id);
});
*/
