
document.getElementById('register').onclick = function () {

    var password = document.getElementsByName("password")[0].value;
    var confirmPassword = document.getElementsByName("confirmpassword")[0].value;
    var email = document.getElementsByName("email")[0].value;
    var username = document.getElementsByName("username")[0].value;
    var error = '';

    if(password !== confirmPassword){
        error += "password doesn't match. </br>";
    }

    if(!email.match(/\S+@\S+\.\S+/)){
        error += "Email is not valid. </br>";
    }

    if(username.length < 2 || username.length > 16){
        error += "Username must be between 2 and 16 characters long.  </br>";
    }
    if(username && !username.match(/^[a-zA-Z0-9-_]+$/i)){
        error += "Username can only contain letters, numbers, underscore and hyphen.  </br>";
    }

    if(error != ''){
        document.getElementById("register_error").innerHTML = error;
        return false
    }
}