var models = require('./models');

module.exports.cookieAuth = function(req, res, next){
    if(req.session && req.session.user) {
        models.User.findOne({ email: req.session.user.email }, function(err, user) {
            if(user) {
                req.user = user; // set the user object
                req.session.user = req.user; // refresh the user session
                res.locals.user = req.user; // use the users information in the view
                delete req.user.password; // remove password from session
            }
            next();
        });
    }
    else {
        next();
    }
};