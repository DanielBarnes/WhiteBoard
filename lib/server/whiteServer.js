var io = require('socket.io'),
    EventEmitter = require('events').EventEmitter
    db = require('redis').createClient();



var white = new EventEmitter();
white.on('go',function(app){
    io.listen(app);
    var rooms = {};
    white.on('room', function(roomNum){
        //if the room hasn't been made
        //then make it otherwise keep going
        if(rooms[roomNum].exist != true){
            rooms[roomNum] = {
                clientCount : 0,
                exist : true,
                connections : {}
                dbname : 'whiteServer.contents.room.' + roomNum;
            };
        }
        io.of('/' + roomNum).on('connection', function(client){
            rooms[roomNum].connections[client.id] = client;
            rooms[roomNum].clientCount += 1;
            
            //if the database exits
            db.exists(function(){
                //then get all the contents
                db.lrange(rooms[roomNum].dbname, 0, -1, function(err, array){
                    console.log('agrs from lrange Callback: ' + arguments)
                    array.forEach(function(data){
                        console.log('stored data: ' + data);
                        //then send data to the client so their board is the up to date
                    });
                });
            });

            client.on('data', function(data){
                if(data.type === 'clear'){
                    //cleared the contents of the board so,
                    //wipe out the database!
                    db.del(rooms[roomNum].dbname);
                } else {
                    //add to DB and re-emit the data!
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

module.exports = new EventEmitter();

module.exports.on('start',function(listenApp){
    white.emit('go', listenApp);
});

module.exports.on('addRoom', function(id){
    white.emit('room', id);
});
