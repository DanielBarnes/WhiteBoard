function whiteboard(){
	/*		Make connect back to server and send id		*/
	var socket = io.connect('http://ec2-50-112-39-160.us-west-2.compute.amazonaws.com:3000');
	var roomNumber = $("title").text();
	socket.send(roomNumber);
	console.log(roomNumber);

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
	
	/*		clear button		*/
	var clearbutton = document.getElementById('clearbutton');
	clearbutton.onclick = function(){
		socket.emit('clearscreen', {'herp':'derp'});
		contexto.clearRect(0,0,canvas.width,canvas.height);
		context.clearRect(0,0,canvas.width,canvas.height);
	}

	/*		canvas events		*/
	canvas.onmousedown = function(e){
		ismousedown = true;
		switch (toolSelect.value){
			case 'line':
					started = true;
					tempx = getX(e);
					tempy = getY(e);
				break;
			case 'pencil':
					started = true;
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
			case 'text'://Backspace doesnt work at all, and the e.preventDefault still makes chrome go back to there last page
					started = true;
					$(document).unbind("keypress");
					if(outputStr != ''){
						textOBJ = {'type':'text', 'data':{'string':outputStr, 'x':x, 'y':y}};
						socket.emit('data', JSON.stringify(textOBJ));
					}
					outputStr = '';
					x = getX(e);
					y = getY(e);
					function(){
						$().ready(function(){
							$(document).keypress(function(e){
								e.preventDefault();
								if(e.which != 13){
									if(e.which > 31 && e.which < 127)
										outputStr += String.fromCharCode(e.which)
									if(e.which == 8 && outputStr.lenght > 0){
										outputStr = outputStr.substring(0,outputStr.lenght-1);
										context.fillStyle = 'white';
										context.fillRect(x,y,(outputStr.length*5),-8);
										context.fillStyle = 'black';
										context.fillText(outputStr,x,y);
										img_update();
									}
									context.fillStyle = 'white';
									context.fillRect(x,y,(outputStr.length*5),-8);
									context.fillStyle = 'black';
									context.fillText(outputStr,x,y);
									img_update();
								}else{
									textOBJ = {'type':'text', 'data':{'string':outputStr, 'x':x, 'y':y}};
									outputStr = '';
									$(document).unbind("keypress");
									socket.emit('data', JSON.stringify(textOBJ));
								}
							});
						});
					};
				break;
		};

	}

	canvas.onmousemove = function(e){
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
							socket.emit('data', JSON.stringify({'type':'pencil', 'data':array}));
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
		switch (toolSelect.value){
			case 'line':
					if(started){
						started = false;
					}
					img_update();
					lineOBJ = {'type':'line', 'data':{'stX':tempx, 'stY':tempy, 'endX':getX(e), 'endY':getY(e)}}
					socket.emit('data', JSON.stringify(lineOBJ));
				break;
			case 'pencil':
					started = false;
					if(array.length > 0){
						socket.emit('data', JSON.stringify({'type':'pencil', 'data':array}));
						array = [];
						return;
					}
					img_update();
				break;
			case 'rectangle':
					if(started){
						started = false;
					}
					img_update();
					rectangleOBJ = {'type':'rectangle', 'data':{'x':x, 'y':y, 'w':w, 'h':h}};
					socket.emit('data', JSON.stringify(rectangleOBJ));
				break;
			case 'text':

				break;
		};

	}
	
	/*		handle data from server		*/
	socket.on('clearscreen', function(obj){
		contexto.clearRect(0,0,canvas.width,canvas.height);
	});
	socket.on('data', function(msg){
		var obj = JSON.parse(msg);
		switch (obj.type){
			case 'line':
				context.beginPath();
				context.moveTo(obj.data.stX,obj.data.stY);
				context.lineTo(obj.data.endX, obj.data.endY);
				context.stroke();
				context.closePath();
				img_update();
				break;
			case 'pencil':
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
				context.strokeRect(obj.data.x,obj.data.y,obj.data.w,obj.data.h);
				img_update();
				break;
			case 'text':
				context.fillStyle = 'white';
				context.fillRect(obj.data.x,obj.data.y,((obj.data.string).length*5),-8)
				context.fillStyle = 'black';
				context.fillText(obj.data.string, obj.data.x, obj.data.y);
				img_update();
				break;
		}
	});

	/*		HELPERS		*/
	function img_update(){
		contexto.drawImage(canvas, 0,0);
		context.clearRect(0,0,canvas.width,canvas.height);
	}

	function getX(e){
		return (e.clientX - canvas.offsetLeft);
	}
	function getY(e){
		return (e.clientY - canvas.offsetTop);
	}
}

whiteboard();

