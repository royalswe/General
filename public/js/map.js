var circles = [];

/**
 * Add nuke effect when attack
 */
gameInfra.on('nuke_country', function (id) {
    var circle = document.getElementsByTagName('circle')[id];
    circle.classList.toggle('nuke');
    circle.setAttribute('r', 45);
    setTimeout(function() {
        circle.classList.toggle('nuke');
        circle.setAttribute('r', 20);
    }, 1200);
});

gameInfra.on('bounce_country', function (id) {
    var circle = document.getElementsByTagName('circle')[id];
    circle.classList.toggle('bounce');
    circle.setAttribute('r', 25);
    setTimeout(function() {
        circle.classList.toggle('bounce');
        circle.setAttribute('r', 20);
    }, 300);
});

gameInfra.on('render_map', function (data) {
    circles = [];
    /**
     * update map information to circle array
     */
    for (var category in data) {
        if (data.hasOwnProperty(category)) {

            for (var x = 0, j = data[category].countries.length; x < j; x++) {
                circles.push({
                    country: data[category].countries[x],
                    color: data[category].color,
                    owner: data[category].id,
                });
            }
        }
    }

    drawMap();
});

function drawMap() {
    for (var i = 0; i < circles.length; i++) {
        var circle = document.getElementsByTagName('circle')[circles[i].country.id];
        var text = document.getElementsByTagName('text')[circles[i].country.id];
        circle.setAttribute('fill', circles[i].color);
        circle.style['stroke-width'] = "0.5";
        circle.style.stroke = "white";
        circle.id = circles[i].country.id;
        text.textContent = circles[i].country.units
        text.setAttribute('fill', 'white');
        text.id = circles[i].country.id;
    }
}

function drawGold() {
    for (var i = 0; i < circles.length; i++) {
        var circle = document.getElementsByTagName('circle')[circles[i].country.id];
        var text = document.getElementsByTagName('text')[circles[i].country.id];
        circle.setAttribute('fill', 'gold');
        text.setAttribute('fill', 'black');
        text.textContent = circles[i].country.gold
    }
}
/**
 * Toggle 'Show gold' button
 */
var showGold = false;
$(function(){
    $('#show_gold').click(function () {
        if (!showGold) {
            drawGold();
            $('.phase-message').html('<div class=show-gold>'+
                '<p>Europe: 10 gold </p>' +
                '<p>East europe: 7 gold </p>' +
                '<p>Asia: 5 gold </p>' +
                '<p>Middle east: 2 gold </p>' +
                '<p>Africa: 3 gold </p></div>');
            showGold = true;
        }
        else {
            drawMap();
            $('.phase-message').html('Phase: ' + phase);
            showGold = false;
        }
    });
});