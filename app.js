'use strict';

/**
 * Import all dependencies
 */
var http = require('http');
var csrf = require('csurf');
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var sessions = require('client-sessions');
var models = require('./models');
var middleware = require('./middleware');
var config = require('./config.json');

var app = express();
/**
 * Connect to mongoDB
 */
mongoose.connect(config.DEV_DB);

/**
 * Tell express that we are using jade as view templates
 */
app.set('view engine', 'jade');

/**
 * If true the html will not be minified.
 * only uses when developing
 */
app.locals.pretty = true;

/**
 * Listen to port 8080 if no default is set
 * @type {*|number}
 */
var port = process.env.PORT || 8080;
var server = http.createServer(app).listen(port);

/**
 * Makes it possible to get static files from view
 */
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended: true}));

/**
 * Create new user session for auth
 */
module.exports.createUserSession = function(req, res, user){
    var setSessionInfo = {
        username: user.username,
        email: user.email
    };
    req.session.user = setSessionInfo;
    req.user = setSessionInfo;
    res.locals.user = setSessionInfo;
};

/**
 * Session rules
 */
app.use(sessions({
    cookieName: 'session',
    secret: 'someRandomString',// Random string as secret
    httpOnly: true, // not letting javascript access cookies
    // ephemeral: true, // delete cookies when the browser is closed
    secure: true, // only use cookies over https
    // duration: 60 * 60 * 1000, // cookie expires in 60 min
    // activeDuration: 10 * 60 * 1000, // cookie expire after 10 min if user is not active
}));

app.use(csrf());

/**
 * Middleware, Refresh session on page loads
 */
app.use(middleware.cookieAuth);

/**
 * Routes
 */
app.use(require('./routes/auth'));
app.use(require('./routes/main'));

/**
 * Import sockets, here starts all the magic
 */
require('./sockets.js').initialize(server);







