var express = require('express');

var router = express.Router();

router.get('/', function (req, res) {
    res.render('index.jade');
});

router.get('/game', function (req, res) {
    res.render('game.jade');
});

router.get('/lobby', function (req, res) {
    res.render('lobby.jade');
});

router.get('/profile', requireLogin, function (req, res) {
    res.render('profile.jade');
});

/**
 * Redirect to login page if not logged in
 */
function requireLogin(req, res, next) {
    if(!req.user) {
        res.redirect('/login');
    }
    else {
        next();
    }
}

module.exports = router;