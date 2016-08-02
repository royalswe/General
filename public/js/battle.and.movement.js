/**
 * Battle
 */
var attackFrom;
function battle(latestClickedCountry, thisCountry) {

    var country = getCountry(latestClickedCountry);

    if (attackFrom && country.owner != activePlayer) {

        var attackersCountry = getCountry(attackFrom);

        // Check that countries are neighbours and more than one unit
        if(country.country.neighbour.indexOf(attackersCountry.country.id) > -1 && attackersCountry.country.units > 1){
            showUnitBar(attackersCountry.country.units);
            thisCountry.find("circle").css({"stroke-width": "2.5", "stroke": "lime"}); // Highlight clicked circle
        }
        else { drawMap(); } // Remove highlights

        attackFrom = null; // makes it possible to make a new country choise

        $('#send_units').mousedown(function () {
            gameInfra.emit('battle',
                parseInt(attackersCountry.country.id),
                parseInt(latestClickedCountry),
                parseInt(country.owner),
                parseInt($('#unit_output').val())); // number of attacking units

            $("#unit_bar").remove();
            return false;
        });
    }

    if (country.owner == activePlayer)  {
        drawMap(); // Remove current highlight from circle
        $("#unit_bar").remove();
        thisCountry.find("circle").css({"stroke-width": "2.5"}); // Highlight clicked circle
        attackFrom = latestClickedCountry;
    }

}

/**
 * Tactical movement
 */
var countryFrom;
function tacticalMove(latestClickedCountry, thisCountry) {

    var country = getCountry(latestClickedCountry);

    if (country.owner == activePlayer && countryFrom == null)  {
        drawMap(); // Remove current highlight from circle
        $("#unit_bar").remove();
        thisCountry.find("circle").css({"stroke-width": "2.5"}); // Highlight clicked circle
        countryFrom = latestClickedCountry;
    }

    if (countryFrom && country.owner == activePlayer && latestClickedCountry != countryFrom) {

        var fromCountry = getCountry(countryFrom);

        //Check that countries are neighbours and more than one unit
        if(country.country.neighbour.indexOf(fromCountry.country.id) > -1 && fromCountry.country.units > 1){
            showUnitBar(fromCountry.country.units);
            thisCountry.find("circle").css({"stroke-width": "2.5", "stroke": "lime"}); // Highlight clicked circle
        }
        else { drawMap(); } // Remove highlights

        countryFrom = null; // makes it possible to make a new country choise

        $('#send_units').mousedown(function () {
            gameInfra.emit('tactical_move',
                parseInt(fromCountry.country.id),
                parseInt(latestClickedCountry),
                parseInt(country.owner),
                parseInt($('#unit_output').val())); // number of moving units

            $("#unit_bar").remove();
            return false;
        });
    }

}

function showUnitBar(units) {
    units = units - 1
    $("#unit_bar").remove();
    $('.svg-container').append('<div id="unit_bar">'
        + '<input type="range" id="unit_input" value="1" min="1" max="' + units + '"  oninput="unit_output.value = unit_input.value">'
        + '<output id="unit_output">1</output>'
        + '<input type="button" value="Send Units" id="send_units">'
        + '</div>');

    var rangeWidth =  units * 3;
    $('#unit_bar input[type="range"]').css('width', rangeWidth + '%');
    
    // This is a solution for Edge because it dosen't get the value from oninput
    $('#unit_input').on('input', function() {
        $('#unit_output').html(this.value);
    });
}


// if(country.country.neighbour.some(c => c == attackersCountry.country.id) && attackersCountry.country.units > 1){


// /**
//  * Battle and tactical move have same game logic but different if statements
//  * Harder to read but less code
//  */
// var countryFrom;
// function battleOrMove(clickedCircle, thisCircle) {
//
//     var country = getCountry(clickedCircle);
//
//     if (country.owner == activePlayer && (
//         (phase == 'battle') ||
//         (phase == 'tacticalMove' && countryFrom == null)))  {
//
//         drawMap(); // Remove current highlight from circle
//         $("#unit_bar").remove();
//         thisCircle.find("circle").css({"stroke-width": "2.5"}); // Highlight clicked circle
//         countryFrom = clickedCircle;
//     }
//
//     if (countryFrom && (
//         (phase == 'battle' && country.owner != activePlayer) ||
//         (phase == 'tacticalMove' && country.owner == activePlayer && clickedCircle != countryFrom))) {
//
//         var fromCountry = getCountry(countryFrom);
//
//         // Check that countries are neighbours and more than one unit
//         if(country.country.neighbour.includes(fromCountry.country.id) && fromCountry.country.units > 1){
//             showUnitBar(fromCountry.country.units);
//             thisCircle.find("circle").css({"stroke-width": "2.5"}); // Highlight clicked circle
//         }
//         else { drawMap(); } // Remove highlights
//
//         countryFrom = null; // makes it possible to make a new country choise
//
//         $('#sendUnits').mousedown(function () {
//             var unitsSend = parseInt($('#unitOutput').val());
//             gameInfra.emit('battle_or_move',
//                 parseInt(fromCountry.country.id),
//                 parseInt(clickedCircle),
//                 parseInt(country.owner),
//                 unitsSend);
//
//             $("#unit_bar").remove();
//             return false;
//         });
//     }
//
// }