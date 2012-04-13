var bcrypt = require('bcrypt'),
    Backbone = require('backbone');

exports.User = Backbone.Model.extend({
    authenticate: function (pass) {
        return bcrypt.compareSync(pass, this.get('password'));
    }
});

exports.NewUser = exports.User.extend({    
    set: function (attributes, options) {
        if (attributes.password) {
            var salt = bcrypt.genSaltSync(10);
            attributes.password = bcrypt.hashSync(attributes.password, salt);
        }
        Backbone.Model.prototype.set.call(this, attributes, options);
    }
});
