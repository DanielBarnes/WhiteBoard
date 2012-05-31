var socket = io.connect(document.URL);
console.log('socket connected to ' + document.URL);

socket.on('data', function(data){
    console.log(data);
});

function send(){
    socket.emit('data', {type: 'shape', shape: 'derp'});
}
