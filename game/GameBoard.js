'use strict';
var countryHandler = require('./countryHandler');
var models = require('../models');

var GameBoard = function (sockets, io, room) {

    var PlayerList = {};
    var colors = ['red', 'blue', 'orange', 'green']
    var countries = countryHandler.countries();
    var continents = countryHandler.continents();
    var ap; //ap stands for active player and decides whos turn it is
    var phase; // will store the current game phase
    var nextPhase;
    var timer;
    var gameOver = false;

    function Game() {
        this.gameInfra = io.of('/game_infra'); // The namespace
        nextPhase = Game.Phase.everyoneDeploy;
        this.initGame();
        this.renderGame();
        this.leaveGame();
        this.nextTurn();
    }

    Game.Phase = {
        everyoneDeploy: "Everyone deploy",
        deploy: "Deploy",
        battle: "Battle",
        tacticalMove: "Tactical move",
        gameOver: "Game over"
    };

    Game.prototype.initGame = function () {
        // Add all players in new PlayerList objects
        for (var i in sockets) {
            sockets[i].id = i;

            var player = this.Player(i);
            PlayerList[i] = player;
        }

        // Randomise starting countries to players
        var c = 0;
        for (var i = 0; i < countries.length; i++) {

            PlayerList[c].countries.push(countries[i]);
            c += 1;
            if (Object.keys(PlayerList).length == c) {
                c = 0;
            }
        }

    }
    /**
     * Will change the game phase
     */
    Game.prototype.nextTurn = function () {
        phase = nextPhase;
        this.gameInfra.in(room).send({type: 'phase', message: phase})

        var self = this;
        // Player have 2 min before next phase start automatically
        clearTimeout(timer);
        timer = setTimeout(function () {
            clearTimeout(timer); // Not necessary because setTimeout runs once, only precaution
            self.nextTurn();
        }, 122000);

        switch (phase) {
            case Game.Phase.everyoneDeploy:
                nextPhase = Game.Phase.deploy;
                this.everyoneDeploy();
                break;
            case Game.Phase.deploy:
                nextPhase = Game.Phase.battle;
                this.nextPlayer();
                this.determineVictor();
                this.nextTurnButton();
                this.collectGoldIncome();
                this.playerTurn();
                this.updateGold(ap);
                this.deploy();
                break;
            case Game.Phase.battle:
                nextPhase = Game.Phase.tacticalMove;
                this.determineVictor();
                this.battle();
                break;
            case Game.Phase.tacticalMove:
                nextPhase = Game.Phase.deploy;
                this.tacticalMove();
                break;
            case Game.Phase.gameOver:
                clearTimeout(timer);
                break;
            default:
                console.log("ERROR: Invalid game phase.");
                break;
        }
    }

    Game.prototype.nextTurnButton = function () {
        sockets[ap].on('next_turn', () => {
            this.nextTurn();
        });
    }

    Game.prototype.renderGame = function () {
        this.gameInfra.in(room).emit('render_map', PlayerList)
    }

    Game.prototype.updateGold = function (id) {
        sockets[id].send({type: 'update_gold', gold: PlayerList[id].gold})
    }

    Game.prototype.collectGoldIncome = function () {
        var gold = refreshGoldIncome(ap);
        PlayerList[ap].gold += gold;
    }

    Game.prototype.refreshGoldIncome = function () {
        sockets.forEach((socket, index) => {
            var gold = refreshGoldIncome(index);
            socket.send({type: 'update_gold_income', goldIncome: gold})
        });
    }
    
    /**
     * Tell the players whos turn it is and enable the player to interact
     */
    Game.prototype.playerTurn = function () {
        this.gameInfra.in(room).send({
            type: 'current_player',
            bool: false,
            player: ap,
            username: PlayerList[ap].username,
            color: PlayerList[ap].color
        })
        sockets[ap].send({type: 'enable_player', bool: true})
    }

    Game.prototype.nextPlayer = function () {
        if (ap == null) { // Randomise starting player first time
            ap = Math.floor(Math.random() * Object.keys(PlayerList).length);
        }
        // If there is any event listeners then remove them
        sockets[ap].removeAllListeners('deploy');
        sockets[ap].removeAllListeners('next_turn');
        sockets[ap].removeAllListeners('battle');
        sockets[ap].removeAllListeners('tactical_move');
        //sockets[ap].removeAllListeners('everyone_deploy');

        ap = ap >= Object.keys(PlayerList).length - 1 ? 0 : ap + 1; // change active player
        if (PlayerList[ap].lost) {
            this.nextPlayer();
        }
    }

    Game.prototype.deploy = function () {
        sockets[ap].on('deploy', (country, owner) => {
            this.buyUnit(ap, country, owner);
            if(PlayerList[ap].gold < 3) {// If player cant deploy automaticly redirekt to next phase
                this.nextTurn();
            }
        });
    }

    /**
     * Only runs the first turn when all players deploy their units
     */
    Game.prototype.everyoneDeploy = function () {
        var self = this;
        var playersReady = [];
        this.refreshGoldIncome();
        sockets.forEach((socket, index) => {
            this.updateGold(index);

            socket.send({ // Let all players start same time first turn.
                type: 'current_player',
                bool: true,
                player: index,
                username: PlayerList[index].username,
                color: PlayerList[index].color
            })

            socket.on('everyone_deploy', (country, owner) => {
                self.buyUnit(index, country, owner);
                // When all players deployed their units go to next phase
                if (PlayerList[index].gold < 3 && playersReady.indexOf(index) == -1) {
                    playersReady.push(index);
                    if (playersReady.length == Object.keys(PlayerList).length) {
                        self.nextTurn();
                    }
                }
            });
        });
    }

    Game.prototype.buyUnit = function (id, country, owner) {
        if (owner == id && PlayerList[id].gold >= 3) {
            PlayerList[id].gold -= 3; // unit cost 3 gold
            PlayerList[id].countries.find(x=> x.id == country).units += 1; // increment units by one
            this.renderGame();
            this.gameInfra.in(room).emit('bounce_country', country) // give deployed unit bounce effect
            this.updateGold(id);
        }
    }

    Game.prototype.tacticalMove = function () {
        var self = this;
        sockets[ap].on('tactical_move', (moveFromCountry, moveToCountry, owner, units) => {
            if (checkIfNeighbour(moveFromCountry, moveToCountry)) {
                // Remove units from leaving country
                var moveFromCountryUnits = getCountryUnits(ap, moveFromCountry);
                setCountryUnits(ap, moveFromCountry, moveFromCountryUnits - units);
                // Add units to arrival country
                var moveToCountryUnits = getCountryUnits(ap, moveToCountry);
                setCountryUnits(ap, moveToCountry, units + moveToCountryUnits);

                self.renderGame();
                this.gameInfra.in(room).emit('bounce_country', moveToCountry) // give moved units bounce effect
                self.determineVictor();
                return self.nextTurn();
            }
        });
    }

    Game.prototype.battle = function () {
        var self = this;
        sockets[ap].on('battle', (attackCountry, defendCountry, defender, unitsSent) => {

            if (checkIfNeighbour(attackCountry, defendCountry)) {
                // Remove sent units from attackCountry
                var unitsInAttackCountry = getCountryUnits(ap, attackCountry);
                setCountryUnits(ap, attackCountry, unitsInAttackCountry - unitsSent);

                var defenderUnits = getCountryUnits(defender, defendCountry);

                // Fight until one of the players army is defeated
                while (unitsSent > 0 && defenderUnits > 0) {
                    var defendDie = Math.floor((Math.random() * 6) + 1);
                    var attackDie = Math.floor((Math.random() * 6) + 1);

                    if (defendDie >= attackDie) {
                        unitsSent -= 1;
                    }
                    else {
                        defenderUnits -= 1;
                    }
                }

                if (defenderUnits == 0) { // successful attack if 0
                    conquerCountry(defender, defendCountry, ap, unitsSent)
                }
                else {
                    setCountryUnits(defender, defendCountry, defenderUnits);
                }
                self.renderGame();
                self.gameInfra.in(room).emit('nuke_country', defendCountry) // give attacked country nuke effect
                self.refreshGoldIncome();

                if (PlayerList[defender].countries.length <= 0) { // Check if player has any countries left
                    PlayerList[defender].lost = true;
                }

                self.determineVictor();
            }
        });
    }

    Game.prototype.determineVictor = function () {
        // Check if player is the only one left
        var winner = false;
        for (var p in PlayerList) {
            if (PlayerList[p].lost == false) {
                if (!winner) {
                    winner = PlayerList[p].username;
                }
                else {
                    winner = false;
                    break;
                }
            }
        }

        if (winner) {
            return this.victory(winner);
        }
        if (phase == Game.Phase.everyoneDeploy) {
            return; // Only way to win on first phase is if everyone leaves where the loop above checks
        }
        if (PlayerList[ap].countries.length == countries.length) { // Check if player own all countries
            return this.victory(PlayerList[ap].username);
        }
    }
    // TODO:: temporay function. winners points will be calculated by other players and other players should withdraw points
    Game.prototype.victory = function (winner) {
        if (gameOver === false) { // prevent this function runs more than once
            gameOver = true
            this.gameInfra.in(room).send({type: 'game_over', message: winner + ' won the game!'})

            // Winner claims the price of 15 points
            models.User.update({username: winner}, {$inc: {points: 15}}, function (err, data) {});

            nextPhase = Game.Phase.gameOver;
            return this.nextTurn();
        }
    }

    Game.prototype.Player = function (id) {
        var self = {
            id: id,
            countries: [],
            gold: 5,
            color: colors[id],
            lost: false,
            phase: Game.Phase.deploy,
            username: sockets[id].username
        }
        return self;
    }

    Game.prototype.leaveGame = function () {
        sockets.forEach((socket, index) => {
            socket.on('player_left', (id) => {
                if (id < 10 && phase !== Game.Phase.gameOver ) { // Don't want guests to run this code OR if the game is over
                    PlayerList[id].lost = true

                    if (ap == id) { // If active player leaving then end his round
                        nextPhase = Game.Phase.deploy;
                        this.nextTurn();
                    }
                    this.determineVictor();
                }
            });
        });
    }

    function checkIfNeighbour(fromCountry, toCountry) {
        var neighbours = PlayerList[ap].countries.find(x=> x.id == fromCountry).neighbour;
        if (neighbours.indexOf(toCountry) > -1) {
            return true;
        }
        return false;
    }

    function getCountryUnits(id, country) {
        return PlayerList[id].countries.find(x=> x.id == country).units;
    }

    function setCountryUnits(id, country, units) {
        return PlayerList[id].countries.find(x=> x.id == country).units = units;
    }

    function conquerCountry(id, country, newID, units) {
        // Remove the country from defender
        for (var i = 0; i < PlayerList[id].countries.length; i += 1) {
            if (PlayerList[id].countries[i].id == country) {
                var gold = PlayerList[id].countries[i].gold;
                var neighbour = PlayerList[id].countries[i].neighbour;
                PlayerList[id].countries.splice(i, 1);
                break;
            }
        }
        // add the country to attacker
        PlayerList[newID].countries.push({id: country, gold: gold, units: units, neighbour: neighbour});
    }
    
    function refreshGoldIncome(id) {
        var playersCountries = [];
        var gold = 0;

        // collect gold from countries
        for (var i = 0; i < PlayerList[id].countries.length; i += 1) {
            gold += PlayerList[id].countries[i].gold;
            playersCountries.push(PlayerList[id].countries[i].id);
        }
        // collect gold from continents
        for (var i = 0; i < continents.length; i += 1) {
            if (compareCountriesWithContinent(continents[i].countries, playersCountries)) {
                gold += continents[i].gold;
            }
        }
        return gold;
    }

    function compareCountriesWithContinent(continent, playersCountries) {
        var filteredCountries = playersCountries.filter(function (a) {
            return ~this.indexOf(a);
        }, continent);

        if (continent.sort().join(',') === filteredCountries.sort().join(',')) {
            return true;
        }
        return false;
    }

    new Game();
}

module.exports.GameBoard = GameBoard;