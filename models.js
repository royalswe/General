var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/**
 * User model
 */
module.exports.User = mongoose.model('User', new Schema({
    id: ObjectId,
    username: {type: String, unique: true, match: /^[a-z0-9_-]{2,16}$/i},
    email: {type: String, unique: true, set: toLower, match: /\S+@\S+\.\S+/},
    password: { type: String },
    points: { type: Number, default: 50 }
}));

function toLower (str) {
    return str.toLowerCase();
}