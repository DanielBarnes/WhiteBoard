module.exports.init = function(){
    var socket;
    var canvas = getElementById('mainCanvas');
    var context = canvas.getContext('2d');
    
    function update(clientC, clientC){
        canvas.drawImage(clientC, 0,0);
        socket.emit('data', {type: 'shape', shape: clientC});
        clientC.clearRect(0,0,clientC.width, clientC.height);
    }
    
    function draw(data){
        canvas.drawImage(data.shape, 0,0);
    }
    
    function passSocket(sock){
        socket = sock;
    }

    function clear(){
        canvas.clearRect(0,0,canvas.width, canvas.height);
    }
};
