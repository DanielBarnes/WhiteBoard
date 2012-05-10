function whiteboard(){
    /*		Make connect back to server and send id		*/
    var socket = io.connect('http://thebarnacle.info');
    var roomNumber = $("title").text();
    socket.send(roomNumber);
    console.log(roomNumber);
    $('#textbox').hide();
    /*		Set up canvases		*/
    var canvas, context;
    var canvaso, contexto;
    canvaso = document.getElementById('imageView');
    contexto = canvaso.getContext('2d');
    var container = canvaso.parentNode;
    canvas = document.createElement('canvas');
    canvas.id = 'imageTemp';
    canvas.width = canvaso.width;
    canvas.height = canvaso.height;
    container.appendChild(canvas);
    context = canvas.getContext('2d');
    context.fillStyle = 'black';

    /*		Set up tool selector and canvas event flags		*/
    var toolSelect = document.getElementById('tools');
    var textbox = document.getElementById('textbox');
    var ismousedown = false;

    /*		Set up tool variables		*/
    var tempx, tempy, x, y, w, h;
    var lineOBJ, penOBJ, rectangleOBJ, textOBJ;
    var started = false;
    var array = [];
    var outputStr = '';
    var color = 'black';
	
    /*		clear button		*/
    var clearbutton = document.getElementById('clearbutton');
    clearbutton.onclick = function(){
        socket.emit('clearscreen', {'herp':'derp'});
        contexto.clearRect(0,0,canvas.width,canvas.height);
        context.clearRect(0,0,canvas.width,canvas.height);
    }

    toolSelect.onchange = function(e){
        $('#textbox').hide();
    };

	/*		canvas events		*/
    canvas.onmousedown = function(e){
        ismousedown = true;
        context.fillStyle = color; context.strokeStyle = color;
        switch (toolSelect.value){
            case 'line':
                started = true;
                tempx = getX(e);
                tempy = getY(e);
                break;
            case 'pencil':
                started = true;;
                context.beginPath();
                context.moveTo(getX(e), getY(e));
                penOBJ = {'x':getX(e), 'y':getY(e)}
                array.push(penOBJ);
                break;
            case 'rectangle':
                started = true;
                tempx = getX(e);
                tempy = getY(e);
                break;
            case 'text':
                $('#textbox').show();
                if(outputStr != ''){
                    textOBJ = {'type':'text', 'Color': color, 'data':{'string':outputStr, 'x':x, 'y':y}};
                    socket.emit('data', JSON.stringify(textOBJ));
                    outputStr = '';img_update();
                }
                x = getX(e);
                y = getY(e);
                $('#textbox').val('');
                break;
        };

    }

    canvas.onmousemove = function(e){
        context.fillStyle = color; context.strokeStyle = color;
        switch (toolSelect.value){
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
                    penOBJ = {'x':getX(e), 'y':getY(e)}
                    context.stroke();
                    img_update();
                    array.push(penOBJ);
                    if(array.lenght > 10){
                        socket.emit('data', JSON.stringify({'type':'pencil', 'Color':color, 'data':array}));
                        array = [];
                        return;
                    }
						
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
                        return;
                    }
                    context.strokeRect(x,y,w,h);
                }
                break;
            case 'text':
                break;
        };

    }
	
    canvas.onmouseup = function(e){
        ismousedown = false;
        context.fillStyle = color; context.strokeStyle = color;
        switch (toolSelect.value){
            case 'line':
                if(started){started = false;}
                img_update();
                lineOBJ = {'type':'line', 'Color':color, 'data':{'stX':tempx, 'stY':tempy, 'endX':getX(e), 'endY':getY(e)}}
                socket.emit('data', JSON.stringify(lineOBJ));
                break;
            case 'pencil':
                started = false;
                if(array.length > 0){
                    socket.emit('data', JSON.stringify({'type':'pencil', 'Color':color, 'data':array}));
                    array = [];
                    return;
                }
                img_update();
                break;
            case 'rectangle':
                if(started){started = false;}
                img_update();
                rectangleOBJ = {'type':'rectangle', 'Color':color, 'data':{'x':x, 'y':y, 'w':w, 'h':h}};
                socket.emit('data', JSON.stringify(rectangleOBJ));
                break;
            case 'text':
                $('#textbox').focus();
                console.log('focus');
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
                        textOBJ = {'type':'text', 'Color':color, 'data':{'string':outputStr, 'x':x, 'y':y}};
                        socket.emit('data', JSON.stringify(textOBJ));
                        outputStr = '';img_update();
                        $(document).unbind("keyup");
                    }
                });
                break;

        };

    }
	
/*		handle data from server		*/
    socket.on('connectCount', function(count){
        console.log(count);
        console.log('got count');
        $('#conCount').text('Peeps drawing: ' + count);
    });
    socket.on('clearscreen', function(obj){
        contexto.clearRect(0,0,canvas.width,canvas.height);
    });
    socket.on('data', function(msg){
        var obj = JSON.parse(msg);
        switch (obj.type){
            case 'line':
                context.fillStyle = obj.Color; context.strokeStyle = obj.Color;
                context.beginPath();
                context.moveTo(obj.data.stX,obj.data.stY);
                context.lineTo(obj.data.endX, obj.data.endY);
                context.stroke();
                context.closePath();
                img_update();
                break;
            case 'pencil':
                context.fillStyle = obj.Color; context.strokeStyle = obj.Color;
                var temparray = obj.data
                var tempobj;
                context.beginPath();
                tempobj = temparray.pop();
                context.moveTo(tempobj.x,tempobj.y);
                for(var i = 0, l = temparray.length; i < l; i++){
                    tempobj = temparray.pop();
                    context.lineTo(tempobj.x,tempobj.y);
                    context.stroke();
                }
                context.closePath();
                img_update();
                break;
            case 'rectangle':
                context.fillStyle = obj.Color; context.strokeStyle = obj.Color;
                context.strokeRect(obj.data.x,obj.data.y,obj.data.w,obj.data.h);
                img_update();
                break;
            case 'text':
                context.fillStyle = 'white';
                context.fillRect(obj.data.x,obj.data.y,((obj.data.string).length*5),-8)
                context.fillStyle = obj.Color; context.strokeStyle = obj.Color;
                context.fillText(obj.data.string, obj.data.x, obj.data.y);
                img_update();
                break;
        }
    context.fillStyle = color; context.strokeStyle = color;
    });
/*		Color Selector		*/
    function getMousePos(canvas, evt){
    // get canvas position
        var obj = canvas;
        var top = 0;
        var left = 0;
        while (obj.tagName != 'BODY') {
            top += obj.offsetTop;
            left += obj.offsetLeft;
            obj = obj.offsetParent;
        }
						 
    // return relative mouse position
        var mouseX = evt.clientX - left + window.pageXOffset;
        var mouseY = evt.clientY - top + window.pageYOffset;
        return {
            x: mouseX,
            y: mouseY
        };
    }
				 
    function drawColorSquare(canvas, color, imageObj){
        var colorSquareSize = 100;
        var padding = 10;
        var context = canvas.getContext("2d");
        context.beginPath();
        context.fillStyle = color;
        var squareX = (canvas.width - colorSquareSize + imageObj.width) / 2;
        var squareY = (canvas.height - colorSquareSize) / 2;
        context.fillRect(squareX, squareY, colorSquareSize, colorSquareSize);
        context.strokeRect(squareX, squareY, colorSquareSize, colorSquareSize);
    }
				 
    function init(imageObj){
        var padding = 10;
        var canvas = document.getElementById("myCanvas");
        var context = canvas.getContext("2d");
        var mouseDown = false;
				 
        context.strokeStyle = "#444";
        context.lineWidth = 2;
		 
        canvas.addEventListener("mousedown", function(evt){
            mouseDown = true;
            getColor(evt);
        }, false);
				 
        canvas.addEventListener("mouseup", function(){
            mouseDown = false;
        }, false);
		 
        canvas.addEventListener("mousemove", function(evt){
            getColor(evt);
/*	var mousePos = getMousePos(canvas, evt);
				if (mouseDown &&
				mousePos !== null &&
				mousePos.x > padding &&
				mousePos.x < padding + imageObj.width &&
				mousePos.y > padding &&
				mousePos.y < padding + imageObj.height) {
					/*
					* color picker image is 256x256 and is offset by 10px
					* from top and bottom
					x/
					var imageData = context.getImageData(padding, padding, imageObj.width, imageObj.width);
					var data = imageData.data;
					var x = mousePos.x - padding;
					var y = mousePos.y - padding;
					var red = data[((imageObj.width * y) + x) * 4];
					var green = data[((imageObj.width * y) + x) * 4 + 1];
					var blue = data[((imageObj.width * y) + x) * 4 + 2];
					color = "rgb(" + red + "," + green + "," + blue + ")";
				}
				 
				if (color) {
					drawColorSquare(canvas, color, imageObj);
				}*/
        }, false);
		 
        context.drawImage(imageObj, padding, padding);
        drawColorSquare(canvas, "white", imageObj);
        function getColor(evt){
            var mousePos = getMousePos(canvas, evt);
            if (mouseDown &&
                mousePos !== null &&
                mousePos.x > padding &&
                mousePos.x < padding + imageObj.width &&
                mousePos.y > padding &&
                mousePos.y < padding + imageObj.height) {
/*
* color picker image is 256x256 and is offset by 10px
* from top and bottom
*/
                var imageData = context.getImageData(padding, padding, imageObj.width, imageObj.width);
                var data = imageData.data;
                var x = mousePos.x - padding;
                var y = mousePos.y - padding;
                var red = data[((imageObj.width * y) + x) * 4];
                var green = data[((imageObj.width * y) + x) * 4 + 1];
                var blue = data[((imageObj.width * y) + x) * 4 + 2];
                color = "rgb(" + red + "," + green + "," + blue + ")";
            }
				 
            if (color) {
                drawColorSquare(canvas, color, imageObj);
            }
        }
    }
		
		
 
    window.onload = function(){
        var imageObj = new Image();
        imageObj.onload = function(){
            init(this);
        };
        imageObj.src = "/images/color_picker.png";
    };

/*
		$(function() {
		var ctx = document.getElementById('canvas').getContext('2d');
		var img = new Image();
		img.src = 'media/show/280';
		img.onload = function(){
		ctx.drawImage(img,0,0);
		}
		$('canvas').bind('mousemove', function(event){
		var x = event.pageX - event.currentTarget.offsetLeft
		var y = event.pageY - event.currentTarget.offsetTop;
		var ctx = document.getElementById('canvas').getContext('2d');
		var imgd = ctx.getImageData(x, y, 1, 1);
		var data = imgd.data;
		var out = $('#result');
		var hexString = RGBtoHex(data[0],data[1],data[2]);
		out.html("color is #" + hexString);
		out.attr("style","background-color: #" + hexString + ";");
		});
		});

*/
	/*		HELPERS		*/
    function img_update(){
        contexto.drawImage(canvas, 0,0);
        context.clearRect(0,0,canvas.width,canvas.height);
    }

    function getX(e){return (e.clientX - canvas.offsetLeft);}
    function getY(e){return (e.clientY - canvas.offsetTop);}
}

whiteboard();

