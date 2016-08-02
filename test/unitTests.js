
var chai = require('chai');
var expect = require('chai').expect;
var bcrypt = require('bcryptjs');
var models = require('../models');
var app = require('../app');
var config = require('../config.json');

var request = require('supertest');
var server = request.agent('http://localhost:8080');

function createUser(username, email) {
    var hashedPassword = bcrypt.hashSync('password', bcrypt.genSaltSync(10));
    var user = new models.User({
        username: username,
        email: email,
        password: hashedPassword,
    });

    user.save(function(err){
        if (err)
            
        return;
    })
}

/**
 * Empty database and add som new users
 */
before(function(done) {
    models.User.remove({}, function() {});
    createUser('david','david@mail.com')
    createUser('simon','simon@mail.com')
    createUser('sara','sara@mail.com')
    done()
})

describe("Register test", function(){

    function register(username, email, password, done, fail) {
        var hashedPassword = bcrypt.hashSync('password', bcrypt.genSaltSync(10));
        var user = new models.User({
            username: username,
            email: email,
            password: hashedPassword,
        });

        user.save(function(err){
            if(err) {
                if(fail) // if test is negativ test
                    done()
                else
                    return err
            }
            else{
                if(fail){
                    return err
                }
                done();
            }

        })
    }


    it("register new user", function(done){
        register('johnDoe','johnDoe@mail.com', 'password', done, false)
    });

    it("test register with existing username", function(done){
        register('johnDoe','johnDoe2@mail.com', 'password', done, true)
    });

    it("test register with existing email", function(done){
        register('johnDoe2','johnDoe@mail.com', 'password', done, true)
    });

    it("test all valid char types for username", function(done){
        register('aA-zZ_','valid@mail.com', 'password', done, false)
    });

    it("test forbidden characters in username", function(done){
        register('johnDoe$','johnDoe3@mail.com', 'password', done, true)
    });

    it("test only one character in username", function(done){
        register('j','johnDoe4@mail.com', 'password', done, true)
    });

    it("register with non valid email", function(done){
        register('johnDoe4','johnDoe@mail.', 'password', done, true)
    });

    it("check if registered users stores in DB", function(done){
        models.User.findOne({email:'valid@mail.com'}, function(err, user){
            expect(user.email).to.equal('valid@mail.com');
            done();
        });
    });

});

describe("Login test", function(){
    it("login user with correct credentials", function(done){
        models.User.findOne({email:'sara@mail.com'}, function(err, user){
            if(!user) {
                return err
            } else{
                if(bcrypt.compareSync('password', user.password)) {
                    done();
                } else {
                    return err
                }
            }
        })
    });

    it("login with wrong email", function(done){
        models.User.findOne({email:'wrong@hotmail.com'}, function(err, user){
            if(!user) {
                done();
            } else{
                return err
            }
        })
    });

    it("login with wrong password", function(done){
        models.User.findOne({email:'sara@mail.com'}, function(err, user){
            if(!user) {
                done();
            } else{
                if(bcrypt.compareSync('wrongPassword', user.password)) {
                    return err
                } else {
                    done();
                }
            }
        })
    });

});


describe("check pages status", function(){

    it("check status code for index page", function(done){
        server
            .get('/')
            .expect(200)
            .expect(/<title>Home/, done)
    });

    it("check status code for register page", function(done){
        server
            .get('/register')
            .expect(200)
            .expect(/<title>Register/, done)
    });

    it("check status code for login page", function(done){
        server
            .get('/login')
            .expect(200)
            .expect(/<title>Login/, done)
    });

    it("check status code for lobby page", function(done){
        server
            .get('/lobby')
            .expect(200)
            .expect(/<title>Lobby/, done)
    });

    it("check status code for game page", function(done){
        server
            .get('/game')
            .expect(200)
            .expect(/<title>Game/, done)
    });

    it("test redirect on profile page when not logged in", function(done){
        server
            .get('/profile')
            .expect(302)
            .expect('Location', '/login')
            .end(done);
    });
});

// var cheerio = require('cheerio')
// function extractCsrfToken (res) {
//     var $ = cheerio.load(res.text);
//     return $('[name=_csrf]').val();
// }