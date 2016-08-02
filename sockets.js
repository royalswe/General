'use strict';


var GameBoard = require('./game/GameBoard');

var io = require('socket.io');

var lobbyRooms = [];
var joinedPlayers = [];

exports.initialize = (server) => {
    io = io.listen(server);

    var self = this;

    this.gameInfra = io.of('/game_infra');
    this.gameInfra.on('connection', (socket) => {

        socket.on('player_ready', (data) => {
            socket.username = (data.user == 'guest') ? 'guest' : data.user.username;
            socket.points = data.user.points;
            socket.emit('player_ready');
            socket.send({
                type: 'serverMessage',
                message: 'Welcome ' + socket.username
            });
        })
        socket.on('join_room', (room) => {
            // Cant join room twice
            if (hasPlayerJoined(room.name, socket.username)) {

                socket.join(room.name); // player joins choosen room
                /**
                 * Guests can't play only chat and inspect the game, same for logged in users if game is full
                 */
                var roomStatus = lobbyRooms.find(x=> x.name === room.name).status;
                if (socket.username != 'guest' && roomStatus === 'wating for players') {
                    joinedPlayers.push({room: room.name, player: socket, username: socket.username, points: socket.points});

                    var playerList = updatePlayerListInRoom(room.name)
                    self.gameInfra.to(room.name).emit('add_player_list', playerList);

                    var numOfStartingPlayers = lobbyRooms.find(x=> x.name === room.name).startingPlayers;
                }
                var waitingPlayers = updateLobby(room.name);
                /**
                 * Join the chat in chat_com namespace
                 */
                var comSocket = self.chatCom.connected[socket.id];
                comSocket.join(room.name);
                comSocket.room = room.name;

                self.gameInfra.emit("rooms_list", lobbyRooms); // update rooms in lobby
                socket.broadcast.to(room.name).send({type: 'serverMessage', message: socket.username + ' has joined the room.'});

                if (waitingPlayers == numOfStartingPlayers) {
                    /**
                     * Store joinedPlayers socket from choosen room and start new game
                     */
                    var socketsArr = [];
                    for (var i in joinedPlayers) {
                        if (joinedPlayers[i].room == room.name) {
                            socketsArr.push(joinedPlayers[i].player);
                        }
                    }
                    new GameBoard.GameBoard(socketsArr, io, room.name);
                }
            }

        });

        socket.on("get_rooms", () => {
            socket.emit("rooms_list", lobbyRooms);
        });

        socket.on("create_room", (roomName, numOfPlayers) => {
            // TODO:: Temporary validation until how to creaste room is decided
            roomName = roomName.replace(/\s/g, '-') // Convert blank spaces to '-'
            if(roomName == '')
                return socket.emit("flash_message", "Room name can't be empty");
            if(numOfPlayers == null)
                return socket.emit("flash_message", "Please select number of players to start with");
            if(lobbyRooms.find(x=> x.name === roomName))
                return socket.emit('flash_message', 'Room already exist, choose another name for your game');
            if(!roomName.match(/^[a-zA-ZåäöÅÄÖ0-9-_!.]+$/i))
                return socket.emit('flash_message', 'Room name contain invalid characterss');

            lobbyRooms.push({name: roomName, players: 0, startingPlayers: numOfPlayers ,status: 'wating for players'});
            self.gameInfra.emit("rooms_list", lobbyRooms);

            socket.emit('join_created_room', roomName);
        });

        /**
         * Runs when user leaves or drop connection
         */
        socket.onclose = () => {
            if (socket.rooms[1]) { // if user disconnect from a joined room
                /**
                 * Tell the players in room that player has left
                 */
                socket.broadcast.to(socket.rooms[1]).send({type: 'disconnect', user: socket.username, id: socket.id});
                socket.leave(socket.rooms[1]);

                /**
                 * Remove player from showing in lobby and remove the room from lobby if it is the last user leaving.
                 * Allso remove player from game room if user disconnects
                 */
                for (var i = 0; i < joinedPlayers.length; i++) {
                    // Get the correct room and username to remove
                    if (joinedPlayers[i].room == socket.rooms[1] && joinedPlayers[i].player.username == socket.username) {
                        joinedPlayers.splice(i, 1);

                        for (var i in lobbyRooms) {
                            if (lobbyRooms[i].name == socket.rooms[1]) {
                                lobbyRooms[i].players = lobbyRooms[i].players - 1; // update the room player count in lobby
                                if (lobbyRooms[i].players == 0) { // remove room from lobby if empty
                                    lobbyRooms.splice(i, 1);
                                }
                                break; // stop the loop we are done
                            }
                        }
                        break; // stop the loop we are done
                    }
                }
                var playerList = updatePlayerListInRoom(socket.rooms[1])
                socket.broadcast.to(socket.rooms[1]).emit('add_player_list', playerList);

                self.gameInfra.emit("rooms_list", lobbyRooms); // update lobby
            }


        }
        
    });
    /**
     * The chat
     */
    this.chatCom = io.of('/chat_com');
    this.chatCom.on('connection', (socket) => {
        socket.on('message', (message) => {
            message = JSON.parse(message);
            if (message.type === 'userMessage') {
                message.username = self.gameInfra.connected[socket.id].username;
                socket.in(socket.room).broadcast.send(JSON.stringify(message));
                message.type = 'myMessage';
                socket.send(JSON.stringify(message));
            }
        });
    });

}
function updatePlayerListInRoom(roomName) {
    var players = [];
    for (var i in joinedPlayers) {
        if (joinedPlayers[i].room == roomName) {
            players.push({
                username: joinedPlayers[i].username,
                points: joinedPlayers[i].points
            });
        }
    }
    return players;
}

function updateLobby(value) {
    //var playersInRoom = Object.keys(io.nsps['/game_infra'].adapter.rooms[value]).length
    
    var playersInRoom = joinedPlayers.filter((x) => {
        return x.room === value
    }).length
    for (var i in lobbyRooms) {
        if (lobbyRooms[i].name == value) {
            lobbyRooms[i].players = playersInRoom;
            if (playersInRoom == lobbyRooms[i].startingPlayers) {
                lobbyRooms[i].status = 'game in progress';
            }
            break;
        }
    }
    return playersInRoom;
}

function hasPlayerJoined(room, username) {
    if(lobbyRooms.find(x=> x.name === room)){
        for (var i in joinedPlayers) {
            if (joinedPlayers[i].room == room && joinedPlayers[i].player.username == username) {
                return false;  // Player already joined
            }
        }
        return true;
    }
    return false; // room don't exist
}

