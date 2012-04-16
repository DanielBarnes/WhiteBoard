var socket = io.connect(document.URL);
console.log('socket connected to ' + document.URL);

var clientBoard = require('./clientBoard').init(socket),
    roomBoard = require('./roomBoard').init(),
    mainBoard = require('./mainBoard').init(),
    EventEmitter = require('./EventEmitter');

socket.on('data',function(data){
    switch(data.type){
        case 'checkin' :
            console.log('checkin received');
            break;
        case 'shape':
            roomBoard.draw(data);
            break;
        case 'clear':
            roomBoard.clear();
            mainBoard.clear();
            break;
    }
});
