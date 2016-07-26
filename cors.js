var cors = require('cors');

var whitelist = [
];
var corsOptions = {
    origin: function (origin, callback) {
        var originIsWhitelisted = whitelist.indexOf(origin) !== -1 || whitelist.length === 0;
        callback(null, originIsWhitelisted);
    },
    credentials: true
};

module.exports = cors(corsOptions);