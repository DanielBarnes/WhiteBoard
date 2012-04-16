module.exports.init = function(){
    var canvas  = document.getElementById('roomCanvas');
    var context = canvas.getContext('2d');
    context.fillStyle = 'black';

    function draw(data){
        switch(data.shape.type){
            case 'line':
                context.fillStyle = data.shape.color;
                context.strokeStyle = data.shape.color;
                context.beginPath();
                context.moveTo(data.shape.startX, data.shape.startY);
                context.lineTo(data.shape.endX, data.shape.endY);
                context.stroke();
                context.closePath();
                mainBoard.update(canvas);
                clear();
                break;

            case 'pencil':
                context.fillStyle = data.shape.color;
                context.strokeStyle = data.shape.color;
                var tempA = data.shape.array;
                context.beginPath();
                var tempData = tempA.pop();
                context.moveTo(tempData.x, tempData.y);
                for(var i = 0, l = tempA.length; i<l; i++){
                    tempData = tempA.pop();
                    context.lineTo(tempData.x,tempData.y);
                    context.stoke();
                }
                context.closePath()
                mainBoard.update(canvas);
                clear();
                break;
            case '':

        }
    }

    function clear(){
        context.clearRect(0,0,canvas.width,canvas.height)
    }
};
