var socket = io.connect(document.URL);
console.log('socket connected to ' + document.URL);

var clientBoard = require('./clientboard').init(),
    mainBoard = require('./mainboard').init();

mainBoard.passSocket(socket);

socket.on('data', function(data){
    switch(data.type){
        case 'checkin' :
            console.log('checkin received');
            break;
        case 'shape':
            mainBoard.draw(data);
            break;
        case 'clear':
            mainBoard.clear();
            break;
    }
});
