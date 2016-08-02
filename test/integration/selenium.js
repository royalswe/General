'use strict';

var chai = require('chai');
var expect = require('chai').expect;

var webdriver = require('selenium-webdriver'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until,
    firefox = require('selenium-webdriver/firefox'),
    test = require('selenium-webdriver/testing');

var site = 'http://localhost:8080';



test.describe('Room handling', function() {

    var driver;
    this.timeout(10000); // max time for tests before it breaks

    test.beforeEach(function() {
        driver = new firefox.Driver();
        driver.manage().window().setSize(0);
        //driver = new webdriver.Builder().forBrowser('chrome').build();
    });

    test.afterEach(function() {
        driver.close();
    });

    function login(email, password, driver) {
        driver.get(site + '/login');
        driver.findElement(By.name('email')).sendKeys(email);
        driver.findElement(By.name('password')).sendKeys(password);
        driver.findElement(By.id('login')).click();
        driver.wait(until.titleIs('Lobby'), 1000);
    }

    function createRoom(room, players) {
        driver.findElement(By.css('#num_of_players>option:nth-child('+players+')')).click();
        driver.findElement(By.id('new_room_name')).sendKeys(room);
        driver.findElement(By.id('new_room_btn')).click();
    }

    function switchWindow() {
        driver.getAllWindowHandles().then(function (handles){
            driver.switchTo().window(handles[1]);
        })
    }

    test.it('Create new game room', function(done) {
        login('sara@mail.com', 'password', driver);

        createRoom('firstRoom', 3);

        // driver.wait(function() {
        //     return driver.findElement(By.className('room_name')).isDisplayed();
        // }, 100);

        switchWindow();

        driver.wait(until.titleIs('firstRoom'), 1000);
        //driver.switchTo().window(parent);

        done();
    });

    test.it('test to create already existing room', function(done) {
        login('sara@mail.com', 'password', driver);

        createRoom('duplicateRoom', 3);
        createRoom('duplicateRoom', 3);

        var flashMessage = driver.findElement(By.className('flash_message'));
        flashMessage.getText().then(function(html) {
            expect(html).to.equal('Room already exist, choose another name for your game');
        });

        switchWindow(); // so it closes after finished test
        done();
    });

    test.it('create and join room and then chat in room', function(done) {
        login('david@mail.com', 'password', driver);
       // var parent = driver.getWindowHandle();

        createRoom('newRoom', 4);
        switchWindow();
        driver.wait(until.titleIs('newRoom'), 1000);


        var newdriver = new firefox.Driver();
        //var newdriver = new webdriver.Builder().forBrowser('chrome').build();
        login('simon@mail.com', 'password', newdriver);

        newdriver.findElement(By.id('newRoom')).click();


        newdriver.getAllWindowHandles().then(function (handles){
            newdriver.switchTo().window(handles[1]);
        })
        newdriver.wait(until.titleIs('newRoom'), 1000);

        newdriver.findElement(By.id('message')).sendKeys('Hello friend');
        newdriver.findElement(By.id('send')).click();

        driver.findElement(By.id('message')).sendKeys('Hello myself');
        driver.findElement(By.id('send')).click();

        var anotherUser = driver.findElement(By.className('userMessage'));
        var myMessage = driver.findElement(By.className('myMessage'));

        anotherUser.getText().then(function(html) {
            expect(html).to.equal('simon: Hello friend');
        });
        myMessage.getText().then(function(html) {
            expect(html).to.equal('david: Hello myself');
        });

        newdriver.close();
        newdriver.quit();

        done();

    });

    test.it('test chat in game room when not logged in', function(done) {
        login('david@mail.com', 'password', driver);

        createRoom('testChatt', 4);
        switchWindow();
        driver.wait(until.titleIs('testChatt'), 1000);

        var newdriver = new firefox.Driver();
        newdriver.get(site + '/lobby');
        newdriver.findElement(By.id('testChatt')).click();

        newdriver.getAllWindowHandles().then(function (handles){
            newdriver.switchTo().window(handles[1]);
        })
        newdriver.wait(until.titleIs('testChatt'), 1000);

        newdriver.findElement(By.id('message')).sendKeys('Hello friend');
        newdriver.findElement(By.id('send')).click();

        driver.findElement(By.id('message')).sendKeys('Hello myself');
        driver.findElement(By.id('send')).click();

        var anotherUser = driver.findElement(By.className('userMessage'));
        var myMessage = driver.findElement(By.className('myMessage'));

        anotherUser.getText().then(function(html) {
            expect(html).to.equal('guest: Hello friend');
        });
        myMessage.getText().then(function(html) {
            expect(html).to.equal('david: Hello myself');
        });

        newdriver.close();
        newdriver.quit();

        done();

    });

    test.after(function() {
        driver.quit();
    });
    // test.it('join room again', function(done) {
    //     driver.get(site + '/login');
    //     driver.findElement(By.name('email')).sendKeys('simon@mail.com');
    //     driver.findElement(By.name('password')).sendKeys('password');
    //     driver.findElement(By.id('login')).click();
    //     driver.wait(until.titleIs('Lobby'), 1000);
    //     driver.findElement(By.linkText('View')).click();
    //
    //
    //
    //      driver.close();
    //      driver.quit();
    //     done();
    //
    // });

});

// require('chai').should();
// var config = require('../config.json');
//
// let webdriver = require('selenium-webdriver');
// let By = webdriver.By;
// let until = webdriver.until;
//
// let driver = new webdriver.Builder()
//     .forBrowser('firefox')
//     .build();
//
// describe('Login', () => {
//     it('should navigate to login', (done) => {
//         driver.get(config.TEST_URL + '/login')
//             .then(() => driver.getTitle())
//             .then(title => title.should.equal('Login'))
//             .then(() =>
//                 driver.findElement(
//                     By.linkText('Register')
//                 ).click()
//             )
//             .then(() => driver.getTitle())
//             .then(title => title.should.equal('Register'))
//             .then(() => driver.quit())
//             .then(() => done())
//             .catch(error => done(error))
//         ;
//         done();
//     });
//
//
// });