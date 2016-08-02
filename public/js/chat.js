var chatCom = io(location.host + '/chat_com');


chatCom.on('message', function (message) {
    var message = JSON.parse(message);
    $('#messages').append('<div class="' +
        message.type + '"><span class="name">' +
        message.username + ':</span> ' +
        message.message + '</div>');

    // Scroll down chatt automaticly
    var height = 0;
    $('#messages div').each(function(){
        height += parseInt($(this).height());
    });
    height += '';

    $('#messages').animate({scrollTop: height});
});

$(function(){
    $('#send').click(function () {
        var message = $('#message').val();
        if(message != ''){ // Prevent sending blank messages
            var data = { message: message, type: 'userMessage' };

            chatCom.send(JSON.stringify(data));
            $('#message').val('');
        }
        false;
    });

    $('#message').on('keypress', function (e) {
        if(e.keyCode === 13){
            $('#send').click();
        }
    });
    // show and hide toggle for chat 
    $(".slide-toggle").click(function(){
        $("#chatroom").animate({
            width: "toggle"
        });
        $('.svg-container').toggleClass("big-map");
    });


});

