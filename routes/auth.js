var express = require('express');
var bcrypt = require('bcryptjs');
var models = require('../models');
var app = require('../app');

var router = express.Router();

router.get('/register', function (req, res) {
    res.render('register.jade', { csrfToken: req.csrfToken() });
});

router.post('/register', function (req, res) {
    var hashedPassword = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    var user = new models.User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
    });
    user.save(function(err){
        if(err) {
            var error = 'Something wrong happened! Try again!';
            if(err.code === 11000) { // error 11000 means duplicate key error
                var errorfield = err.message.split('dup key: { : "')[1];
                errorfield = errorfield.slice(0, -3);
                error = 'Sorry but ' + errorfield + ' already exist';
            }
            res.render('register.jade', { csrfToken: req.csrfToken(), error: error });
        }
        else{
            app.createUserSession(req, res, user);
            res.redirect('/lobby');
        }
    })
});

router.get('/login', function (req, res) {
    res.render('login.jade', { csrfToken: req.csrfToken() });
});

router.post('/login', function (req, res) {
    models.User.findOne({ email: req.body.email }, function(err, user) {
        if(!user) {
            res.render('login.jade', { csrfToken: req.csrfToken(), error: 'The email dosent exist'});
        } else{
            if(bcrypt.compareSync(req.body.password, user.password)) {
                app.createUserSession(req, res, user);
                res.redirect('/lobby');
            } else {
                res.render('login.jade', { csrfToken: req.csrfToken(), error: 'Invalid email or password'});
            }
        }
    })
});

router.get('/logout', function (req, res) {
    req.session.reset(); // destroy session
    res.redirect('/');
});

module.exports = router;