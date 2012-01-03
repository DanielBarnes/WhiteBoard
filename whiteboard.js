function whiteboard(){
	var canvas;
	var context;
	var canvaso;
	var contexto;
	canvaso = document.getElementById('imageView');
	contexto = canvaso.getContext('2d');
	var container = canvaso.parentNode;
	canvas = document.createElement('canvas');
	canvas.id = 'imageTemp';
	canvas.width = canvaso.width;
	canvas.height = canvaso.height;
	container.appendChild(canvas);
	context = canvas.getContext('2d');
	var socket = io.connect('http://ec2-50-112-39-160.us-west-2.compute.amazonaws.com:8000');
	var toolSelect = document.getElementById('tools');
	context.fillStyle = 'black';
	lineTool();
	toolSelect.onchange = function(e){
		switch (toolSelect.value){
			case 'line':
				lineTool();
				break;
			case 'pencil':
				pencilTool();
				break;
			case 'rectangle':
				rectangleTool();
				break;
			case 'text':
				textTool();
				break;
			default:
				alert('You need to pick a tool! :)');
		};
	};

	function lineTool(){
		var tempx;
		var tempy;
		var lineOBJ;
		var started;
		started = false;
                
		canvas.onmousedown = function(e){
			started = true;
			tempx = e.clientX;
			tempy = e.clientY;
			canvas.onmousemove = function(e){
				if(!started){
					return;
				}
				context.clearRect(0,0,canvas.width,canvas.height);
				context.beginPath();
				context.moveTo(tempx,tempy);
				context.lineTo(e.clientX,e.clientY);
				context.stroke();
				context.closePath();
			};
		};
		canvas.onmouseup = function(e){
			if(started){
				started = false;
			}
			img_update();
			lineOBJ = {'startX':tempx, 'startY':tempy, 'endX':e.clientX, 'endY':e.clientY};
			socket.emit('linetool', JSON.stringify(lineOBJ));
		};
	};

	function pencilTool(){
		var started;
		var penOBJ;
		var array = [];
		started = false;
		canvas.onmousedown = function(e){
			context.beginPath();
			context.moveTo(e.clientX,e.clientY);
			penOBJ = {'x':e.clientX, 'y':e.clientY}
			array.push(penOBJ)
			started = true;
			canvas.onmousemove = function(e){
				context.lineTo(e.clientX, e.clientY);
				penOBJ = {'x':e.clientX, 'y':e.clientY}
				context.stroke();
				array.push(penOBJ);
				if(array.lenght > 10){
					socket.emit('penciltool', JSON.stringify(array));
					array = [];
					return;
				}
			};
		};
		canvas.onmouseup = function(e){
			img_update();
			canvas.onmousemove = null;
			if(array.length > 0){
				socket.emit('penciltool', JSON.stringify(array));
				array = [];
				return;
			}
		};
	};

	function rectangleTool(){
		var x,y,w,h;
		var tempx;
		var tempy;
		var rectangleOBJ;
		var started;
		started = false;
		canvas.onmousedown = function(e){
			started = true;
			tempx = e.clientX;
			tempy = e.clientY;
			tempx -= canvas.offsetLeft;
			tempy -= canvas.offsetTop;
			canvas.onmousemove = function(e){
				if(!started){
					return;
				};
				x = Math.min(e.clientX, tempx),
				y = Math.min(e.clientY, tempy),
				w = Math.abs(e.clientX - tempx),
				h = Math.abs(e.clientY - tempy);
				context.clearRect(0,0,canvas.width,canvas.height);
				if(!w || !h){
					return;
				};
				context.strokeRect(x,y,w,h);
			};
		};
		canvas.onmouseup = function(e){
			if(started){
				started = false;
			};
			img_update();
			rectangleOBJ = {'x':x, 'y':y, 'w':w, 'h':h};
			socket.emit('rectangletool', JSON.stringify(rectangleOBJ));
		};
	};

	function textTool(){
		alert('the text tool doesnt work, coming soon :)');
		var x,y;
		var outputStr;
		var started;
		started = false;
		canvas.onmousedown = function(e){
			x = e.clientX;
			y = e.clientY;
			started = true;
		};
		if(started){
			$().ready(function() {
				$(document).keypress(function(e) {
					outputStr += String.fromCharCode(e.which);
					context.fillText(outputStr,x,y);
					console.log(outputStr);
				});
			});
		};
	};
           
	function img_update(){
		contexto.drawImage(canvas, -8,-8);
		context.clearRect(0,0,canvas.width,canvas.height);
	};

//	socket.on('message', function(obj){
//	});
	socket.on('clearscreen', function(obj){
		contexto.clearRect(0,0,canvas.width,canvas.height);
	});
	/*		RECTANGLE TOOL		*/
	socket.on('rectangletool', function(objt){
		var obj = JSON.parse(objt);
		context.strokeRect(obj.x,obj.y,obj.w,obj.h);
		img_update();
	});
	/*		LINE TOOL		*/
	socket.on('linetool', function(obj2){
		var obj = JSON.parse(obj2)
		context.beginPath();
		context.moveTo(obj.startX,obj.startY);
		context.lineTo(obj.endX,obj.endY);
		context.stroke();
		context.closePath();
		img_update();
	});
	/*		PENCIL TOOL		*/
	socket.on('penciltool', function(arrayt){
		var array = JSON.parse(arrayt)
		var obj;
		context.beginPath();
		obj = array.pop();
		context.moveTo(obj.x,obj.y);
		for(var i = 0, l = array.length; i < l; i++){
			obj = array.pop();
			context.lineTo(obj.x,obj.y);
			context.stroke();
		}
		context.closePath();
		img_update();
	});

	/*		CLEAR		*/
	var clearbutton = document.getElementById('clearbutton');
	clearbutton.onclick = function(){
		socket.emit('clearscreen',{'clear': 1});
		contexto.clearRect(0,0,canvas.width,canvas.height);
	}
};

whiteboard();
