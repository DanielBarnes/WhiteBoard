var express = require('express'),
    routes = require('./routes')
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var th = require('thoonk').createClient('localhost');
var mixpanel = require('mixpanel');
var metrics = new mixpanel.Client('688a52850aa9652bd7fb452839fb580b');
var redis = require('redis').createClient();
// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
});

/*		Redirect from base		*/
var rooms = {} 
var feeds = {}
app.get('/', function(req,res){
    var roomNumber;
    roomNumber = Date.now();
    res.redirect('/' + roomNumber);
    metrics.track('Homepage',{},function(err){
        if(err) throw err;
    });
});
app.get('/:id', function(req,res){
//    if (typeof(rooms[req.params.id]) === 'undefined'){
        feeds[req.params.id] = th.sortedFeed(req.params.id.toString());
        rooms[req.params.id] = [];
        res.render('index', { id: req.params.id });
//    }else{
//        res.render('index', { id: req.params.id });
//    }
});
app.listen(3000);
/*		Server interaction with client		*/
var connections = {};
var clients = {};
var conCount = {};
io.sockets.on('connection', function(socket){
    connections[socket.id] = socket;
    socket.on('message', function(roomNumber){
        /*		Save Connection		*/
        rooms[roomNumber].push(socket.id);	//array of socket ids in room
        console.log(roomNumber);
        console.log(rooms[roomNumber]);
        clients[socket.id] = roomNumber;	//ids to room numbers
        if(conCount[roomNumber] == null){
            conCount[roomNumber] = 0;
        }
        conCount[roomNumber] += 1;
        updateConnectionCount(clients[socket.id]);
        /*		Handle disconnects		*/
        socket.on('disconnect', function(){
            conCount[roomNumber] -= 1;
            updateConnectionCount(clients[socket.id]);
            rooms[roomNumber].splice(rooms[roomNumber].indexOf(socket.id), 1);
            delete clients[socket.id];
            delete connections[socket.id];
        });
        /*		Server receives data from client		*/
        socket.on('data', function(data){
            emit_all(socket.id, 'data', data);
            var met = JSON.parse(data);
            metrics.track(met.type, {'socketID': socket.id, 'RoomNumber': roomNumber}, function(err){
                if(err) throw err;
            });
        });
        /*		Clear		*/
        socket.on('clearscreen', function(data){
            emit_all(socket.id, 'clearscreen', data);
            metrics.track('ClearScreen',{'socketID': socket.id, 'RoomNumber': roomNumber}, function(err){
                if(err) throw err;
            });
        });
        /*		to load what has already been drawn		*/
        items = feeds[clients[socket.id]].getAll(function(err,reply){
            if(reply.length > 0){
                Object.keys(reply).forEach(function(key){
                    connections[socket.id].emit('data', reply[key].id);
                });
            }
        });
    });
    metrics.track('Connections',{'socketID': socket.id},function(err){
        if(err) throw err;
    });
});

function emit_all(socketId, eventType, data){
    var roomId = clients[socketId];
    if(eventType == 'clearscreen'){
        for(var i = 0, length = rooms[roomId].length; i < length; i++){ 
            connections[rooms[roomId][i]].emit('clearscreen', data);
            items = feeds[roomId].getAll(function(err, reply){
                Object.keys(reply).forEach(function(key){
                    feeds[roomId].retract(reply[key].id, function(){
                    });
                });
            });
        }
    }else{
        feeds[roomId].append(data,data, function(item,id){
            for(var i = 0, length = rooms[roomId].length; i < length; i++){ 
                console.log(length);
                connections[rooms[roomId][i]].emit(eventType, data);
            }
        });
    }
}

/*      import metricsi     x/ 
var MixpanelAPI, mixpanel, req;

MixpanelAPI = require('lib/mixpanel_api');

mixpanel = new MixpanelAPI({
    api_key: 'ABC',
    api_secret: 'XYZ',
    default_valid_for: 60
});

req = {
    event: 'my_button.click',
    name: 'color',
    type: 'general',
    unit: 'hour',
    interval: 100,
    limit: 100
};

mixpanel.request('events/properties', req, function(err, res) {
    if (err) return console.error(err);
    return console.log(res);
});

*/
function updateConnectionCount(roomId){
    for(var i = 0, length = rooms[roomId].length; i < length; i++){ 
        console.log(rooms[roomId]);
        connections[rooms[roomId][i]].emit('connectCount', conCount[roomId]);
        console.log('sent to: ' + connections[rooms[roomId]]);
    }
//    rooms[roomNumber].forEach(function(clientID){
//        connections[clientID].emit('connectCount', conCount[roomNumber]);
//        console.log(clientID);
///    });
}


console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
