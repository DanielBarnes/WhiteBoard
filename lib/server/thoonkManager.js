var thoonk = require('thoonk').createClient(),
    userModel = require('../../models/userModel');

var userFeed = exports.userFeed = thoonk.feed('users');

exports.thoonk = thoonk;

exports.addUser = function (attrs, callback) {
    if (!attrs.username || !attrs.password) {
        callback(new Error('missing username or password'), null);
    }
    var user = new userModel.NewUser(attrs);
    var userJSON = user.toJSON();
    userFeed.publish(JSON.stringify(userJSON), userJSON.username, function (err, id) {
        callback(err, id);
    });
};

exports.getUsers = function (callback) {
    userFeed.getIds(function (err, reply) {
        callback(err, reply);
    });
};

exports.getUserByID = function (id, callback) {
    userFeed.getItem(id, function (err, reply) {
        if (reply) {
            callback(null, JSON.parse(reply));
        } else {
            callback(new Error('id not found'), null);
        }
    });
};

exports.userExists = function (user, callback) {
    userFeed.getItem(user, function (err, reply) {
        callback(reply !== null);
    });
};

