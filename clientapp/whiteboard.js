var EventEmitter = require('events').EventEmitter
    

var clientBoard = new EventEmitter;
var mainBoard = new EventEmitter;

clientBoard.emit('start');
mainBoard.emit('start');

var ColorSelect = require('./colorselector');

var socket = io.connect(document.URL);
console.log('socket connected to ' + document.URL);

socket.on('data', function(data){
    switch(data.type){
        case 'checkin' :
            console.log('checkin received');
            break;
        case 'shape':
            mainBoard.emit('draw', data);
            break;
        case 'clear':
            mainBoard.emit('clear');
            break;
    }
});


// Main Board
mainBoard.on('start',function(){
    var canvas = getElementById('mainCanvas');
    var context = canvas.getContext('2d');

    mainBoard.on('update', function(dict){
        var clientC = dict.canvas;
        canvas.drawImage(clientC, 0,0);
        socket.emit('data', {type: 'shape', shape: clientC});
        clientC.clearRect(0,0, clientC.width, ClientC.height);
    });
    mainBoard.on('draw', function(data){
        canvas.drawImage(data.shape, 0,0);
    });
    mainBoard.on('clear', function(){
        canvs.clearRect(0,0, canvas.width, canvas. height);
    });
});

//Client Board
clientBoard.on('start', function(){
    //canvas setup
    var canvas = document.getElementById('clientCanvas');
    var context = canvas.getContext('2d');
    context.fillStyle = 'black';

    //toolSelector
    var toolSelect = document.getElementById('tools');
    toolSelect.onchange = function(e){
        $('#textbox').hide();
    }

    //Clear Button
    var clearButton = document.getElementById('clearbutton');
    clearButton.onclick = function(){
        socket.emit('clear', {type: 'clear'});
    }

    //canvas var/reqs
    var isMouseDown = false;
    var tempx, tempy, x, y;
    var started = false;
    var outputStr;

    //canvas Events
    canvas.onmousedown = function(e){
        ismousedown = true;
        context.fillStyle = ColorSelect.color;
        context.strokeStyle = ColorSelect.color;
        switch(toolSelect.value){
            case 'line':
                started = true;
                tempx = getX(e);
                tempy = getY(e);
                break;
            case 'pencil':
                started = true;
                context.beginPath();
                context.moveTo(getX(e), getY(e));
                break;
            case 'rectangle':
                started = true;
                tempx = getX(e);
                tempy = getY(e);
                break;
            case 'text':
                $('#textbox').show();
                if(outputStr != ''){
                    outputStr = '';
                    mainBoard.emit('update', {'canvas': canvas, 'context':context});
                }
                x = getX(e);
                y = getY(e);
                $('#textbox').val('');
                break;
        }
    }
    canvas.onmousemove = function(e){
        context.fillStyle = ColorSelector.color;
        context.strokeStyle = ColorSelector.color;
        switch(toolSelect.value){
            case 'line':
                if(started){
                    context.clearRect(0,0,canvas.width,canvas.height);
                    context.beginPath();
                    context.moveTo(tempx,tempy);
                    context.lineTo(getX(e),getY(e));
                    context.stroke();
                    context.closePath();
                }
                break;
            case 'pencil':
                if(started){
                    context.lineTo(getX(e), getY(e));
                    context.stroke();
                    mainBoard.emit('update', {'canvas': canvas, 'context':context});
                    mainBoard.update(canvas, context);
                }
                break;
            case 'rectangle':
                if(started){
                    x = Math.min(getX(e), tempx);
                    y = Math.min(getY(e), tempy);
                    w = Math.abs(getX(e) - tempx);
                    h = Math.abs(getY(e) - tempy);
                    context.clearRect(0,0,canvas.width, canvas.height);
                    if(!w || !h){
                        return
                    }
                    context.strokeRect(x,y,w,h);
                }
                break;
            case 'text':
                break;
        }
    }
    canvas.onmouseup = function(e){
        ismousedown = false;
        context.fillStyle = ColorSelect.color;
        context.strokeStyle = ColorSelect.color;
        switch(toolSelect.value){
            case 'line':
                if(started){started = false}
                mainBoard.emit('update', {'canvas': canvas, 'context':context});
                break;
            case 'pencil':
                started = false;
                mainBoard.emit('update', {'canvas': canvas, 'context':context});
                break;
            case 'rectangle':
                if(started){started = false}
                mainBoard.emit('update', {'canvas': canvas, 'context':context});
                break;
            case 'text':
                $('#textbox').focus();
                $(document).keyup(function(e){
                    context.clearRect(0,0,canvas.width,canvas.height);
                    context.fillText(outputStr,x,y);
                    if(e.which != 13){
                        if(e.which > 31 && e.which < 127){
                            outputStr = $('#textbox').val();
                            context.clearRect(0,0,canvas.width,canvas.height);
                            context.fillText(outputStr,x,y);
                        }
                        if(e.which == 8){
                            outputStr = $('#textbox').val();
                            context.clearRect(0,0,canvas.width,canvas.height);
                            context.fillText(outputStr,x,y);
                        }
                        context.clearRect(0,0,canvas.width,canvas.height);
                        context.fillText(outputStr,x,y);
                    }else{
                        context.clearRect(0,0,canvas.width,canvas.height);
                        context.fillText(outputStr,x,y);
                        outputStr = '';
                        mainBoard.emit('update', {'canvas': canvas, 'context':context});
                        $(document).unbind("keyup");
                    }
                });
                break;
        }
    };
});
