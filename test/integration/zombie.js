const Browser = require('zombie');
var assert = require('assert');

Browser.localhost('localhost', 8080);

describe('Signup page', function() {

    var browser;

    beforeEach(function() {
        browser = new Browser();
        return browser.visit('/register');
    });

    describe('Testing register form', function() {
    
        it('register new user', function(done) {
            browser
                .fill('username', 'bert')
                .fill('email',    'bert@mail.com')
                .fill('password', 'password')
                .fill('confirmpassword', 'password')
                .pressButton('register').then(function() {
                     browser.assert.text('title', 'Lobby');
                 }).then(done);
        });
    
        it('test register new user with existing username', function(done) {
            browser
                .fill('username', 'bert')
                .fill('email',    'dead-bert@mail.com')
                .fill('password', 'password')
                .fill('confirmpassword', 'password')
                .pressButton('register').then(function() {
                    browser.assert.text('#register_error', 'Sorry but bert already exist');
                    browser.assert.text('title', 'Register');
                }).then(done);
        });
    
        it('test register new user with existing email', function(done) {
            browser
                .fill('username', 'dead-bert')
                .fill('email',    'bert@mail.com')
                .fill('password', 'password')
                .fill('confirmpassword', 'password')
                .pressButton('register').then(function() {
                    browser.assert.text('#register_error', 'Sorry but bert@mail.com already exist');
                    browser.assert.text('title', 'Register');
                }).then(done);
        });
    
        it('test register new user with invalid characters in username', function(done) {
            browser
                .fill('username', 'bert*^')
                .fill('email',    'dead-bert@mail.com')
                .fill('password', 'password')
                .fill('confirmpassword', 'password')
                .pressButton('register').then(function() {
                    browser.assert.text('#register_error', "Something wrong happened! Try again!"); // Another error prompts when js activated
                    browser.assert.text('title', 'Register');
            }).then(done);
        });
    
        it('test register new user with non valid email', function(done) {
            browser
                .fill('username', 'bert')
                .fill('email',    'dead-bert')
                .fill('password', 'password')
                .fill('confirmpassword', 'password')
                .pressButton('register').then(function() {
                    browser.assert.text('#register_error', "Something wrong happened! Try again!"); // Another error prompts when js activated
                    browser.assert.text('title', 'Register');
            }).then(done);
        });
    
        it('test register new user without password', function(done) {
            browser
                .fill('username', 'bert')
                .fill('email',    'dead-bert')
                .fill('password', '')
                .fill('confirmpassword', '')
                .pressButton('register').then(function() {
                    browser.assert.text('#register_error', "Something wrong happened! Try again!"); // Another error prompts when js activated
                    browser.assert.text('title', 'Register');
            }).then(done);
        });
    });

});

describe('Login page', function() {

    var browser;

    beforeEach(function() {
        browser = new Browser();
        return browser.visit('/login');
    });

    describe('Testing login form', function() {

        it('Login and check users profile', function(done) {
            browser
                .fill('email', 'bert@mail.com')
                .fill('password', 'password')
                .pressButton('login').then(function() {
                    browser.clickLink('bert', function() {
                        browser.assert.text('title', 'Profile');
                        done();
                    });
                 });
        });

        it('Login and logout', function(done) {
            browser
                .fill('email', 'bert@mail.com')
                .fill('password', 'password')
                .pressButton('login').then(function() {
                browser.clickLink('Logout', function() {
                    browser.assert.text('title', 'Home');
                    done();
                });
            });
        });

        it('Test to login with wrong password', function(done) {
            browser
                .fill('email', 'bert@mail.com')
                .fill('password', 'wrongPassword')
                .pressButton('login').then(function() {
                    browser.assert.text('#register_error', "Invalid email or password"); // Another error prompts when js activated
                    browser.assert.text('title', 'Login');
                }).then(done);
        });

        it('Test to login with non existing email', function(done) {
            browser
                .fill('email', 'wrongBert@mail.com')
                .fill('password', 'wrongPassword')
                .pressButton('login').then(function() {
                browser.assert.text('#register_error', "The email dosent exist"); // Another error prompts when js activated
                browser.assert.text('title', 'Login');
            }).then(done);
        });

    });

    
});
// describe('Login tests', function() {
//
//     const browser = new Browser();
//
//     before(function() {
//         return browser.visit('/login');
//     });
//
//     describe('Test login form', function() {
//
//         it('login form', function(done) {
//             browser
//                 .fill('email', 'sara@mail.com')
//                 .fill('password', 'password')
//                 .pressButton('login', done);
//         });
//
//         it('should see lobby page', function() {
//             browser.assert.text('title', 'Lobby');
//         });
//     });
//
// });
//
// describe('Lobby tests', function() {
//
//     var browser1;
//     var browser2;
//     var browser3;
//
//
//     function login(client, email, done) {
//         return client.visit('/login', function () {
//             client
//                 .fill('email', email)
//                 .fill('password', 'password')
//                 .pressButton('login').then(function() {
//                 client.assert.text('title', 'Lobby');
//             }).then(done);
//         });
//     }
//
//     function createRoom() {
//         browser1
//             .fill('#new_room_name', 'newroom')
//             .pressButton('#new_room_btn').then(function() {
//             setTimeout(function(){
//                 browser1.assert.text('title', 'Game');
//             }, 500);
//
//         });
//     }
//
//     describe('Test to create room', function() {
//
//         before(function(done) {
//             browser1 = new Browser();
//             browser2 = new Browser();
//             browser3 = new Browser();
//
//             login(browser1, 'sara@mail.com')
//             login(browser2, 'david@mail.com');
//             login(browser3, 'simon@mail.com', done);
//         });
//
//
//         it('create new room', function(done) {
//             browser1
//                 .fill('#new_room_name', 'testroom')
//                 .pressButton('#new_room_btn').then(function() {
//                 setTimeout(function(){
//                     browser1.assert.text('title', 'Game');
//                 }, 500);
//
//             }).then(done);
//
//         });
//
//         it('test to create room with existing name', function(done) {
//             browser2
//                 .fill('#new_room_name', 'testroom')
//                 .pressButton('#new_room_btn').then(function() {
//                     browser2.assert.className('p', 'flash_message');
//                 }).then(done);
//         });
//
//         it('join room', function(done) {
//
//             setTimeout(function(){
//
//                 browser2.clickLink('Join', function(){
//                     done();
//                 });
//             }, 100);
//         });
//
//         it('chat', function(done) {
//
//
//             browser2
//                 .fill('#message', 'hello')
//                 .pressButton('#send').then(function() {
//                     setTimeout(function(){
//                         browser2.assert.text('.server-message', 'Welcome david');
//                         browser2.assert.text('.myMessage', 'david: hello');
//
//                         done();
//                     }, 100);
//
//                 });
//
//
//         });
//
//      });
//
// });