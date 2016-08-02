var gameInfra = io(location.host + '/game_infra');

gameInfra.on("connect", function(){
    gameInfra.emit("get_rooms", {});
    
    gameInfra.on("rooms_list", function(rooms){
        $('#rooms_list').empty();
        $.each(rooms, function (key, value) {
            if(value.status == 'wating for players' && user != 'guest')
                var status = 'Join';
            else
                var status = 'View';

            var roomDiv = '<div class="room_container"><span class="room_name">'
                + value.name + '</span><span class="room_users">[ '
                + value.players + '/'+ value.startingPlayers +' Users ] '+ value.status +'</span>'
                + '<a id="'+ value.name +'" class="join_room">'+ status + '</a></div>';
            $('#rooms_list').append(roomDiv);
        });
    });

    gameInfra.on("flash_message", function(message){
        $('.flash_message').text(message).fadeIn('normal', function() {
            $(this).delay(2500).fadeOut();
        });
    });

    gameInfra.on("join_created_room", function(roomName){
        redirectRoom(roomName);
    });

});
$(function(){
    $('#new_room_btn').click(function(){
        gameInfra.emit("create_room", $('#new_room_name').val(),  $('#num_of_players').val());
        $('#new_room_name').val('');
        false;
    });

    $('#rooms_list').on("click", ".join_room", function(e){
        redirectRoom(e.target.id);
        false;
    });
});

function redirectRoom(roomName) {
    window.open("/game?room=" + roomName, "_blank", "width=818,height=559");
}