var gameInfra = io(location.host + '/game_infra');

/**
 * Regex to parse out the value between room= and & or to the end of the content.
 * This way we can send url to a friend as an invite
 * @type {string}
 */
var roomName = decodeURI((RegExp("room" + '=' + '(.+?)(&|$)').exec(location.search)
|| [, null])[1]);
console.log();
if (roomName) {
    document.title = roomName;
    // Player_ready will be some kind of button but anoying when developing.
    gameInfra.emit("player_ready", {user: user});

    gameInfra.on('player_ready', function () {
        gameInfra.emit('join_room', {'name': roomName});
    });
}

var phase;
var activePlayer;
var playerEnabled = true;
var phase;

gameInfra.on('message', function (msg) {

    switch (msg.type) {
        case "serverMessage":
            $('#messages').append('<div class="server-message">' + msg.message + '</div>');
            break;
        case "phase":
            phase = msg.message;
            $('.phase-message').html('Phase: ' + phase);
            startTimer();
            $("#phase_img").attr("src", "images/phases/" + phase + ".png");
            $("#unit_bar").remove(); // if player didn't fulfill the attack or movement
            drawMap();
            if(phase == 'Everyone deploy'){
                document.getElementById("notify_audio").play(); // Notify game started
            }
            break;
        case "current_player":
            showActivePlayer(msg)
            break;
        case "enable_player": // makes it possible for user to interact with the game
            playerEnabled = msg.bool;
            document.getElementById("notify_audio").play(); // Notify player turn
            break;
        case "update_gold":
            $('.user-gold').html('<span>Gold: </span>' + msg.gold);
            break;
        case "update_gold_income":
            $('.user-goldIncome').html('<span>Income: </span>' + msg.goldIncome);
            break;
        case "game_over":
            $('#messages').append('<div class="server-message">' + msg.message + '</div>');
            break;
        case "disconnect":
            $('#messages').append('<div class="server-message">' + msg.user + ' left the room</div>');
            gameInfra.emit("player_left", msg.id);
            break;
        default:
            console.log('message ERROR');
            break;
    }

});

gameInfra.on("add_player_list", function (playerList) {
    $('#player_list').empty();
    $.each(playerList, function (key, value) {
        var roomDiv = '<li class="player-name">' + value.username + '<span>' + value.points + '</span></li>';
        $('#player_list').append(roomDiv);
    });
});

var countdown
function startTimer() {
    var display = document.querySelector('#countdown');
    var twoMinutes = 120;
    var timer = twoMinutes, minutes, seconds;
    clearInterval(countdown);
    countdown = setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(countdown);
        }
    }, 1000);
}

function showActivePlayer(msg) {
    playerEnabled = msg.bool;
    activePlayer = msg.player;
    var circle = document.getElementById('user_color');
    var text = document.getElementById('username_turn');
    circle.setAttribute('fill', msg.color);
    text.textContent = msg.username;
}

$('g').bind('mouseenter', function () { // change cursor if it is players turn
    if (playerEnabled)
        $(this).css('cursor', 'pointer');
    else
        $(this).css('cursor', 'default');
});

$('g').bind('click', function (e) {
    if (playerEnabled) {
        var country = getCountry(e.target.id);

        switch (phase) {
            case "Everyone deploy":
                gameInfra.emit("everyone_deploy", e.target.id, country.owner);
                break;
            case "Deploy":
                gameInfra.emit("deploy", e.target.id, country.owner);
                break;
            case "Battle":
                battle(e.target.id, $(this));
                break;
            case "Tactical move":
                tacticalMove(e.target.id, $(this));
                break;
            default:
                break;
        }
    }
    return false;
});

function getCountry(country) {
    return circles.find(function (c) {
        return c.country.id == country
    });
}

$(function(){
    $('#next_turn').click(function () {
        gameInfra.emit("next_turn");
        false;
    });
    
    $('#mission').click(function () {
        alert('Sorry. Mission is not implemented yet');
        false;
    });
});
