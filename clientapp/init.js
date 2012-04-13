var socket = io.connect(document.URL);
console.log('socket connected to ' + document.URL);

var clientBoard = require('./clientBoard'),
    roomBoard = require('./roomBoard'),
    mainBoard = require('./mainBoard'),
//    EventEmitter = require('./EventEmitter');


