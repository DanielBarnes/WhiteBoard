var express = require('express'),
    routes = require('./routes'),
    stitch = require('stitch'),
    tm = require('./lib/server/thoonkManager'),
    User = require('./models/userModel').User,
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    RedisStore = require('connect-redis')(express),
//    config = require('./lib/help/config'),
    repl = require('repl'),
    fs = require('fs'),
    async = require('async');

var app = module.exports = express.createServer();

// Authentication
passport.use(new LocalStrategy(
    function (username, password, done) {
        tm.getUserByID(username, function (err, user) {
            if (err) return done(null, false);
            var userObj = new User(user);
            if (!userObj.authenticate(password)) return done(null, false);
            return done(null, userObj);
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.toJSON().username);
});

passport.deserializeUser(function (id, done) {
    tm.getUserByID(id, function (err, user) {
        var userObj = new User(user);
        done(null, userObj);
    });
});

// Configuration
app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
//    app.use(express.cookieParser());
//    app.use(express.session({ secret: "secret", store: new RedisStore }));
//    app.use(passport.initialize());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});
/*
app.dynamicHelpers({
    session: function (req, res) {
        return req.session;
    },
    version: function (req, res) {
        return config.version;
    },
    user: function (req, res) {
        return req.user;
    }
});
*/
app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function () {
    app.use(express.errorHandler()); 
});

// Authentication middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { 
        return next(); 
    }
    res.redirect('/');
}

//SOCKETS!!!
var util = require('util');
var whiteServer = require('./lib/server/whiteServer');
whiteServer.emit('go', app);
// Rutes
app.get('/whiteboard/:id', function(req,res){
    console.log("added room: " + req.params.id);
    whiteServer.emit('room' ,req.params.id);
    res.render('whiteboard.jade', {layout: false, title: 'derp'});
});

var bundle = require('browserify')(__dirname + "/clientapp/whiteboard.js");
app.use(bundle);

//main routes!
app.get('/', routes.index);
//app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/' }));
//app.get('/logout', ensureAuthenticated,routes.logout);
//app.get(/\/requests\/(.*)/, ensureAuthenticated, routes.requests);

app.listen(3000);
console.log("Express server listening on port %d in %s mode",  app.settings.env);

var replServer = repl.start();
replServer.context.tm = tm;
replServer.context.express = express;
replServer.context.app = app;
